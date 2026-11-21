// Vaultbreak — staged scenes for the screenshots (?shot=cover|play|alarm|getaway).
// Each scene loads a real floor and poses the real actors mid-heist: nothing is
// drawn that the game itself cannot draw, and every frame shows the thief,
// guard cones, a camera, loot and the alarm meter together.
import { SCREEN_PLAY } from './render.js';

function poseGuard(guard, x, y, angle, mode) {
  guard.x = x;
  guard.y = y;
  guard.angle = angle;
  guard.mode = mode;
  guard.pauseLeft = 2;
}

export function stageShot(name, world) {
  const s = world.state;
  if (name === 'play') {
    world.loadLevel(0);
    s.thief.x = 468; s.thief.y = 316; s.thief.angle = -Math.PI / 2;
    s.grabProgress = 0.65;
    poseGuard(s.guards[0], 348, 392, -0.5, 'investigate');
    poseGuard(s.guards[1], 706, 176, 2.5, 'patrol');
    s.cameras[0].angle = 1.15;
    s.cameras[1].angle = -2.3;
    s.alarm.level = 57;
    s.seenNow = 0.5;
    s.message = 'Jeweled Chalice — hold SPACE…';
    s.messageLeft = 99;
    s.levelTime = 74;
    return { screen: SCREEN_PLAY };
  }
  if (name === 'alarm') {
    world.loadLevel(1);
    s.time = 1.0;
    s.mainLootTaken = true;
    s.loots[0].taken = true;
    s.totalLoot = 6000;
    s.lootValue = 6000;
    s.thief.x = 306; s.thief.y = 468; s.thief.angle = 2.6; s.thief.sprinting = true;
    poseGuard(s.guards[0], 428, 428, 2.9, 'chase');
    poseGuard(s.guards[1], 646, 524, -2.4, 'investigate');
    poseGuard(s.guards[2], 800, 200, 2.8, 'patrol');
    s.cameras[0].angle = 1.5;
    s.cameras[1].angle = -0.9;
    s.alarm.level = 100;
    s.alarm.tripped = true;
    s.alarm.huntLeft = 11;
    s.alarm.hunting = true;
    s.seenNow = 0.8;
    s.message = 'ALARM TRIPPED — run for the van!';
    s.messageLeft = 99;
    s.levelTime = 131;
    return { screen: SCREEN_PLAY };
  }
  if (name === 'getaway') {
    world.loadLevel(2);
    s.hasKeycard = true;
    if (s.keycardPos) s.keycardPos.taken = true;
    s.mainLootTaken = true;
    s.loots[0].taken = true;
    s.loots[3].taken = true;
    s.totalLoot = 9800;
    s.lootValue = 9800;
    s.thief.x = 480; s.thief.y = 592; s.thief.angle = Math.PI / 2;
    poseGuard(s.guards[0], 170, 210, 0.7, 'patrol');
    poseGuard(s.guards[1], 800, 210, 2.4, 'patrol');
    poseGuard(s.guards[2], 430, 322, 1.2, 'investigate');
    poseGuard(s.guards[3], 560, 322, 1.9, 'patrol');
    s.cameras[0].angle = 1.0;
    s.cameras[1].angle = 2.1;
    s.cameras[2].angle = -1.2;
    s.alarm.level = 34;
    s.message = 'The Heart is in the sack — the van is waiting!';
    s.messageLeft = 99;
    s.levelTime = 168;
    return { screen: SCREEN_PLAY };
  }
  // cover (default): floor 1, the thief mid-room, everything on show.
  world.loadLevel(0);
  s.thief.x = 405; s.thief.y = 415; s.thief.angle = -0.7;
  poseGuard(s.guards[0], 208, 402, 1.0, 'patrol');
  poseGuard(s.guards[1], 842, 402, 2.65, 'patrol');
  s.cameras[0].angle = 1.25;
  s.cameras[1].angle = -2.25;
  s.alarm.level = 44;
  s.seenNow = 0.35;
  s.message = 'Slip past the cones — the Star Sapphire glitters north.';
  s.messageLeft = 99;
  s.levelTime = 42;
  return { screen: SCREEN_PLAY };
}
