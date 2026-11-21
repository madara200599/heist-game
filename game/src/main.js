// Vaultbreak — boot, the game loop and the screens.
// Fixed-step simulation (1/60 s) decoupled from painting, exactly like a heist
// should be: the plan ticks steadily even when the night stutters.
//
// ?shot=cover|play|alarm|getaway stages a screenshot scene instead of playing.
import { STEP } from './config.js';
import {
  createWorld, EVENT_CAUGHT, EVENT_COIN, EVENT_EMP, EVENT_ESCAPED, EVENT_GRAB,
  EVENT_KEYCARD, EVENT_LASER, EVENT_SMOKE, EVENT_SPOTTED, EVENT_TRIPPED,
} from './world.js';
import { ACT_EMP, ACT_GRAB, ACT_PAUSE, ACT_SMOKE, ACT_START, createInput } from './input.js';
import {
  createRenderer, SCREEN_CAUGHT, SCREEN_LEVEL_DONE, SCREEN_PAUSED, SCREEN_PLAY,
  SCREEN_TITLE, SCREEN_VICTORY,
} from './render.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld();
const renderer = createRenderer(canvas);
const audio = createAudio();

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, null);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let summary = null;
  let accumulator = 0;
  let last = performance.now();

  function announce(message) { status.textContent = message; }

  function startRun() {
    world.resetRun();
    summary = null;
    screen = SCREEN_PLAY;
    announce('The heist begins. Floor 1: the Gallery of Echoes.');
  }

  function finishLevel() {
    const bonus = world.escapeBonus();
    world.state.score += bonus;
    const s = world.state;
    if (s.levelIndex + 1 >= world.levelCount) {
      screen = SCREEN_VICTORY;
      summary = [
        `Total haul: $${s.totalLoot.toLocaleString('en-US')}`,
        `Stealth & speed bonuses: $${s.score.toLocaleString('en-US')}`,
        `FINAL SCORE: $${(s.totalLoot + s.score).toLocaleString('en-US')}`,
        s.alarm.tripped ? 'The alarms sang, but you sang louder.' : 'A ghost: no alarm ever tripped tonight.',
        '',
        'Press Enter to run the night again',
      ];
    } else {
      screen = SCREEN_LEVEL_DONE;
      summary = [
        `${s.levelName} — escaped with $${s.lootValue.toLocaleString('en-US')}`,
        `Floor bonus: $${bonus.toLocaleString('en-US')}`,
        s.alarm.tripped ? 'The alarm tripped — the next floor watches harder.' : 'Unseen. A ghost leaves no footprints.',
        '',
        'Press Enter for the next floor',
      ];
    }
    audio.escape();
    announce('Clean getaway.');
  }

  function handleEvents(events) {
    if (events & EVENT_GRAB) audio.grab();
    if (events & EVENT_KEYCARD) audio.keycard();
    if (events & EVENT_COIN) audio.coin();
    if (events & EVENT_EMP) audio.emp();
    if (events & EVENT_SMOKE) audio.smoke();
    if (events & EVENT_LASER) audio.laserZap();
    if (events & EVENT_SPOTTED) audio.spotted();
    if (events & EVENT_TRIPPED) { audio.alarmTrip(); announce('Alarm tripped! Guards are hunting.'); }
    if (events & EVENT_CAUGHT) {
      screen = SCREEN_CAUGHT;
      audio.caught();
      announce('Busted.');
    } else if (events & EVENT_ESCAPED) {
      finishLevel();
    }
  }

  function stepOnce() {
    const actions = input.takeActions();
    if (screen !== SCREEN_PLAY) {
      input.takeClick();
      if (actions & ACT_START) {
        audio.unlock();
        if (screen === SCREEN_TITLE || screen === SCREEN_CAUGHT || screen === SCREEN_VICTORY) startRun();
        else if (screen === SCREEN_LEVEL_DONE) {
          world.loadLevel(world.state.levelIndex + 1);
          screen = SCREEN_PLAY;
        } else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
      } else if (actions & ACT_PAUSE && screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
      }
      return;
    }
    if (actions & ACT_PAUSE) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
      return;
    }
    const control = {
      move: input.moveVector(),
      sneak: input.sneaking(),
      sprint: input.sprinting(),
      grab: input.grabHeld() || (actions & ACT_GRAB) !== 0,
      useEmp: (actions & ACT_EMP) !== 0,
      useSmoke: (actions & ACT_SMOKE) !== 0,
      coinAt: input.takeClick(),
    };
    handleEvents(world.step(STEP, control));
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    let guard = 0;
    while (accumulator >= STEP && guard < 8) {
      stepOnce();
      accumulator -= STEP;
      guard += 1;
      if (screen !== SCREEN_PLAY && screen !== SCREEN_TITLE) { accumulator = 0; break; }
    }
    renderer.draw(world.state, screen, summary);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) screen = SCREEN_PAUSED;
  });

  announce('Vaultbreak. Press Enter to begin the heist.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
