// Vaultbreak — the simulation: thief, guards, cameras, lasers, loot, tools.
// No drawing and no DOM here. step() advances one fixed tick and returns event
// flags so main.js can play sounds and change screens without the world
// knowing about either.
import { ALARM, GUARD, SCORE, THIEF, TOOLS } from './config.js';
import { LEVELS } from './levels.js';
import { createGuard, lureGuard, updateGuard } from './guards.js';
import { createCamera, laserIsLive, updateCamera } from './cameras.js';
import { createAlarm, addSuspicion, updateAlarm } from './alarm.js';
import { circleHitsRect, moveWithCollision, visionStrength } from './vision.js';

export const EVENT_GRAB = 1;
export const EVENT_KEYCARD = 2;
export const EVENT_COIN = 4;
export const EVENT_EMP = 8;
export const EVENT_SMOKE = 16;
export const EVENT_LASER = 32;
export const EVENT_TRIPPED = 64;
export const EVENT_CAUGHT = 128;
export const EVENT_ESCAPED = 256;
export const EVENT_SPOTTED = 512;

// One stable object for "the thing being grabbed is the keycard", so the
// grab-progress identity check in step() can recognise it across ticks.
const KEYCARD_TARGET = { keycard: true };

export function createWorld() {
  const state = {
    levelIndex: 0,
    time: 0,
    levelTime: 0,
    thief: { x: 0, y: 0, angle: -Math.PI / 2, sneaking: false, sprinting: false, moving: false },
    guards: [],
    cameras: [],
    walls: [],
    loots: [],
    lasers: [],
    smokes: [],
    alarm: createAlarm(),
    tools: { emp: TOOLS.empCharges, smoke: TOOLS.smokeCharges, coins: TOOLS.coins },
    empLeft: 0,
    lootValue: 0,
    totalLoot: 0,
    mainLootTaken: false,
    hasKeycard: false,
    grabTarget: null,
    grabProgress: 0,
    laserCooldown: 0,
    seenNow: 0, // strongest vision on the thief this tick (for the eye indicator)
    noise: 0, // 1 while sprinting near a guard
    score: 0,
    message: '',
    messageLeft: 0,
    exitRect: null,
    keycardPos: null,
    doorRect: null,
    levelName: '',
    levelBrief: '',
  };

  function solids() {
    // The vault door is solid only until the keycard opens it.
    return state.walls.filter((w) => w.kind !== 'door' || !state.hasKeycard);
  }

  function loadLevel(index) {
    const def = LEVELS[index];
    state.levelIndex = index;
    state.levelName = def.name;
    state.levelBrief = def.brief;
    state.levelTime = 0;
    state.thief.x = def.start.x;
    state.thief.y = def.start.y;
    state.thief.angle = -Math.PI / 2;
    state.walls = def.walls.map((w) => ({ ...w }));
    if (def.door) {
      state.doorRect = { ...def.door, kind: 'door' };
      state.walls.push(state.doorRect);
    } else state.doorRect = null;
    state.loots = def.loots.map((l) => ({ ...l, taken: false }));
    state.guards = def.guards.map(createGuard);
    state.cameras = def.cameras.map(createCamera);
    state.lasers = def.lasers.map((l) => ({ ...l }));
    state.smokes = [];
    state.alarm = createAlarm();
    state.tools = { emp: TOOLS.empCharges, smoke: TOOLS.smokeCharges, coins: TOOLS.coins };
    state.empLeft = 0;
    state.lootValue = 0;
    state.mainLootTaken = false;
    state.hasKeycard = false;
    state.keycardPos = def.keycard ? { ...def.keycard, taken: false } : null;
    state.exitRect = def.exit;
    state.grabTarget = null;
    state.grabProgress = 0;
    state.message = def.brief;
    state.messageLeft = 5;
    state.seenNow = 0;
  }

  function resetRun() {
    state.time = 0;
    state.totalLoot = 0;
    state.score = 0;
    loadLevel(0);
  }

  function nearestLoot() {
    let best = null, bestDist = THIEF.grabRange;
    for (const l of state.loots) {
      if (l.taken) continue;
      const d = Math.hypot(l.x - state.thief.x, l.y - state.thief.y);
      if (d < bestDist) { bestDist = d; best = l; }
    }
    if (state.keycardPos && !state.keycardPos.taken) {
      const d = Math.hypot(state.keycardPos.x - state.thief.x, state.keycardPos.y - state.thief.y);
      if (d < bestDist) return KEYCARD_TARGET;
    }
    return best;
  }

  function step(dt, control) {
    let events = 0;
    state.time += dt;
    state.levelTime += dt;
    if (state.messageLeft > 0) state.messageLeft -= dt;
    if (state.empLeft > 0) state.empLeft -= dt;
    if (state.laserCooldown > 0) state.laserCooldown -= dt;
    const wasTripped = state.alarm.tripped;
    const wasSeen = state.seenNow > 0;

    // --- the thief -------------------------------------------------------
    const t = state.thief;
    t.sneaking = control.sneak;
    t.sprinting = control.sprint && !control.sneak;
    const speed = t.sneaking ? THIEF.sneakSpeed : t.sprinting ? THIEF.sprintSpeed : THIEF.walkSpeed;
    t.moving = control.move.x !== 0 || control.move.y !== 0;
    if (t.moving) {
      t.angle = Math.atan2(control.move.y, control.move.x);
      moveWithCollision(t, control.move.x * speed * dt, control.move.y * speed * dt, THIEF.radius, solids());
    }

    // --- tools ------------------------------------------------------------
    if (control.useEmp && state.tools.emp > 0 && state.empLeft <= 0) {
      state.tools.emp -= 1;
      state.empLeft = TOOLS.empSeconds;
      events |= EVENT_EMP;
      state.message = 'EMP burst — cameras and lasers are dark!';
      state.messageLeft = 2.4;
    }
    if (control.useSmoke && state.tools.smoke > 0) {
      state.tools.smoke -= 1;
      state.smokes.push({ x: t.x, y: t.y, radius: TOOLS.smokeRadius, remaining: TOOLS.smokeSeconds });
      events |= EVENT_SMOKE;
    }
    if (control.coinAt && state.tools.coins > 0) {
      const d = Math.hypot(control.coinAt.x - t.x, control.coinAt.y - t.y);
      if (d < 320) {
        state.tools.coins -= 1;
        events |= EVENT_COIN;
        for (const g of state.guards) {
          if (Math.hypot(g.x - control.coinAt.x, g.y - control.coinAt.y) < TOOLS.coinLureRadius) {
            lureGuard(g, control.coinAt.x, control.coinAt.y);
          }
        }
        state.message = 'Coin tossed — guards turn to look.';
        state.messageLeft = 2;
      }
    }
    for (const s of state.smokes) s.remaining -= dt;
    state.smokes = state.smokes.filter((s) => s.remaining > 0);

    // Sprinting on marble is loud: a nearby guard hears it and comes to look.
    state.noise = 0;
    if (t.sprinting && t.moving) {
      for (const g of state.guards) {
        if (Math.hypot(g.x - t.x, g.y - t.y) < 120) {
          state.noise = 1;
          if (g.mode === 'patrol') lureGuard(g, t.x, t.y);
        }
      }
    }

    // --- grabbing ----------------------------------------------------------
    const target = nearestLoot();
    if (control.grab && target) {
      if (state.grabTarget !== target) { state.grabTarget = target; state.grabProgress = 0; }
      state.grabProgress += dt / THIEF.grabSeconds;
      if (state.grabProgress >= 1) {
        if (target.keycard) {
          state.keycardPos.taken = true;
          state.hasKeycard = true;
          events |= EVENT_KEYCARD;
          state.message = 'Keycard lifted — the vault door will open.';
          state.messageLeft = 3;
        } else {
          target.taken = true;
          state.lootValue += target.value;
          state.totalLoot += target.value;
          if (target.main) state.mainLootTaken = true;
          events |= EVENT_GRAB;
          state.message = target.main
            ? `${target.label} secured! Get to the van.`
            : `${target.label} +$${target.value.toLocaleString('en-US')}`;
          state.messageLeft = 2.6;
        }
        state.grabTarget = null;
        state.grabProgress = 0;
      }
    } else {
      state.grabTarget = null;
      state.grabProgress = 0;
    }

    // --- lasers -------------------------------------------------------------
    if (state.laserCooldown <= 0) {
      for (const beam of state.lasers) {
        if (!laserIsLive(beam, state.time, state.empLeft)) continue;
        // Crossing check: is the thief standing on the beam line segment?
        const abx = beam.x2 - beam.x1, aby = beam.y2 - beam.y1;
        const tt = Math.max(0, Math.min(1, ((t.x - beam.x1) * abx + (t.y - beam.y1) * aby) / (abx * abx + aby * aby || 1)));
        const px = beam.x1 + abx * tt, py = beam.y1 + aby * tt;
        if (Math.hypot(t.x - px, t.y - py) < THIEF.radius + 3) {
          addSuspicion(state.alarm, ALARM.laserHit);
          state.laserCooldown = 1.4;
          events |= EVENT_LASER;
          state.message = 'Laser silk tripped!';
          state.messageLeft = 2;
          break;
        }
      }
    }

    // --- eyes on the thief ---------------------------------------------------
    let seen = 0;
    let suspicionRate = 0;
    const guardSees = state.guards.map((g) => {
      const s = visionStrength(g, t, state.walls, state.smokes);
      if (s > 0) {
        const rate = ALARM.guardRateFar + (ALARM.guardRateNear - ALARM.guardRateFar) * s;
        suspicionRate += rate * (t.sneaking ? 0.55 : 1);
      }
      if (s > seen) seen = s;
      return s;
    });
    if (state.empLeft <= 0) {
      for (const c of state.cameras) {
        updateCamera(c, dt, state.time);
        const s = visionStrength(c, t, state.walls, state.smokes);
        if (s > 0) {
          suspicionRate += ALARM.cameraRate * s;
          if (s > seen) seen = s;
        }
      }
    }
    state.seenNow = seen;
    if (seen > 0 && !wasSeen) events |= EVENT_SPOTTED;
    if (suspicionRate > 0) addSuspicion(state.alarm, suspicionRate * dt);
    updateAlarm(state.alarm, dt, seen);
    if (state.alarm.tripped && !wasTripped) events |= EVENT_TRIPPED;

    // --- guards ---------------------------------------------------------------
    const hunting = state.alarm.hunting;
    state.guards.forEach((g, i) => {
      updateGuard(g, dt, {
        solids: solids(),
        thief: t,
        alarmHunting: hunting,
        seesThief: guardSees[i] > 0.15,
      });
      // A catch must be earned: the guard has to actually reach the thief
      // while it can see the thief, while hunting, or by walking into them.
      const dist = Math.hypot(g.x - t.x, g.y - t.y);
      if (dist < GUARD.catchRange && (guardSees[i] > 0 || hunting || dist < 9)) {
        events |= EVENT_CAUGHT;
      }
    });

    // --- the getaway ------------------------------------------------------------
    const ex = state.exitRect;
    if (state.mainLootTaken && t.x > ex.x && t.x < ex.x + ex.w && t.y > ex.y && t.y < ex.y + ex.h) {
      events |= EVENT_ESCAPED;
    }
    return events;
  }

  /** Score banked when a floor is escaped: loot + time + stealth bonuses. */
  function escapeBonus() {
    let bonus = Math.max(0, 900 - Math.floor(state.levelTime) * SCORE.timeBonusPerSecond);
    if (!state.alarm.tripped) bonus += SCORE.ghostBonus;
    else if (!state.alarm.everHunted) bonus += SCORE.cleanBonus;
    return bonus;
  }

  resetRun();
  return { state, step, loadLevel, resetRun, escapeBonus, levelCount: LEVELS.length };
}
