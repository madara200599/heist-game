// Vaultbreak — guard brains.
// A guard walks a waypoint loop, pauses and scans at each corner, investigates
// the last place it glimpsed the thief (or heard a coin land), and gives chase
// while the alarm hunts. It never teleports and never sees through walls: all
// of that lives in vision.js, this file only decides where to walk.
import { GUARD } from './config.js';
import { moveWithCollision } from './vision.js';

export function createGuard(spec) {
  return {
    x: spec.path[0][0],
    y: spec.path[0][1],
    angle: 0,
    viewRange: GUARD.viewRange,
    viewHalfAngle: GUARD.viewHalfAngle,
    path: spec.path,
    speedScale: spec.speed || 1,
    waypoint: 1 % spec.path.length,
    pauseLeft: 0,
    scanPhase: Math.random() * 6,
    mode: 'patrol', // patrol | investigate | chase | return
    target: null,
    memory: 0, // seconds the guard keeps searching after losing sight
    stunLeft: 0,
  };
}

function walkToward(guard, tx, ty, speed, dt, solids) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 3) return true;
  const step = Math.min(dist, speed * dt);
  guard.angle = Math.atan2(dy, dx);
  moveWithCollision(guard, (dx / dist) * step, (dy / dist) * step, GUARD.radius, solids);
  return dist < 8;
}

export function updateGuard(guard, dt, ctx) {
  const { solids, thief, alarmHunting, seesThief } = ctx;
  if (guard.stunLeft > 0) {
    guard.stunLeft -= dt;
    return;
  }
  guard.scanPhase += dt;

  if (seesThief) {
    guard.target = { x: thief.x, y: thief.y };
    guard.memory = 2.6;
    guard.mode = alarmHunting ? 'chase' : 'investigate';
  } else if (guard.memory > 0) {
    guard.memory -= dt;
    if (guard.memory <= 0 && guard.mode !== 'patrol') guard.mode = 'return';
  }

  if (guard.mode === 'chase' && guard.target) {
    walkToward(guard, guard.target.x, guard.target.y, GUARD.chaseSpeed * guard.speedScale, dt, solids);
    return;
  }
  if ((guard.mode === 'investigate' || guard.mode === 'return') && guard.target) {
    const arrived = walkToward(
      guard, guard.target.x, guard.target.y,
      guard.mode === 'investigate' ? GUARD.searchSpeed * guard.speedScale : GUARD.patrolSpeed,
      dt, solids,
    );
    if (arrived) {
      guard.pauseLeft = GUARD.scanSeconds;
      guard.mode = 'patrol';
      guard.target = null;
      // Resume the loop at the nearest waypoint.
      let best = 0, bestDist = Infinity;
      guard.path.forEach((p, i) => {
        const d = Math.hypot(p[0] - guard.x, p[1] - guard.y);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      guard.waypoint = best;
    }
    if (guard.pauseLeft > 0) {
      guard.pauseLeft -= dt;
      guard.angle += Math.sin(guard.scanPhase * 2.2) * dt * 1.4;
    }
    return;
  }

  // Plain patrol: walk the loop, pause and sweep at each waypoint.
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    guard.angle += Math.sin(guard.scanPhase * 1.9) * dt * 1.6;
    return;
  }
  const [tx, ty] = guard.path[guard.waypoint];
  if (walkToward(guard, tx, ty, GUARD.patrolSpeed * guard.speedScale, dt, solids)) {
    guard.waypoint = (guard.waypoint + 1) % guard.path.length;
    guard.pauseLeft = GUARD.waypointPause;
  }
}

/** Send a guard to look at a noise (a tossed coin clinking on marble). */
export function lureGuard(guard, x, y) {
  if (guard.mode === 'chase') return;
  guard.target = { x, y };
  guard.mode = 'investigate';
  guard.memory = 1.2;
}
