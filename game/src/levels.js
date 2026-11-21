// Vaultbreak — the three floors of the Meridian Exchange.
// Every floor is one big room with several ways through: a bold route straight
// across the open floor, a quiet route behind the display cases, and a service
// route along the walls. Coordinates live in the 960x640 view, below the HUD.
//
// Wall kinds: "wall" and "vault" and a locked "door" block sight and movement.
// "case", "desk" and "plant" are low cover: they block movement, and they hide
// a sneaking thief (hold Shift) from vision cones, but not a standing one.

function wall(x, y, w, h, kind) {
  return { x, y, w, h, kind: kind || 'wall' };
}
function loot(x, y, value, label, main) {
  return { x, y, value, label, main: !!main, taken: false };
}
function guard(path, speed) {
  return { path, speed: speed || 1 };
}
function camera(x, y, baseAngle, sweepArc) {
  return { x, y, baseAngle, sweepArc };
}
function laser(x1, y1, x2, y2, period, offset) {
  return { x1, y1, x2, y2, period, offset: offset || 0 };
}

export const LEVELS = [
  {
    name: 'Floor 1 — Gallery of Echoes',
    brief: 'Lift the Star Sapphire. Side glass pays extra — if you dare.',
    start: { x: 84, y: 566 },
    exit: { x: 836, y: 576, w: 96, h: 52 },
    walls: [
      wall(0, 56, 960, 10), wall(0, 630, 960, 10), wall(0, 56, 10, 584), wall(950, 56, 10, 584),
      wall(300, 56, 14, 168), wall(300, 330, 14, 150),
      wall(620, 150, 14, 190), wall(620, 440, 14, 200),
      wall(120, 250, 120, 46, 'case'), wall(420, 250, 130, 46, 'case'),
      wall(700, 250, 130, 46, 'case'), wall(200, 470, 130, 44, 'desk'),
      wall(520, 500, 120, 44, 'desk'), wall(120, 120, 54, 54, 'plant'),
      wall(790, 110, 54, 54, 'plant'), wall(430, 110, 100, 60, 'vault'),
    ],
    loots: [
      loot(480, 92, 4000, 'STAR SAPPHIRE', true),
      loot(180, 273, 900, 'Gilded Mask'),
      loot(485, 273, 1200, 'Jeweled Chalice'),
      loot(765, 273, 900, 'Ivory Falcon'),
      loot(580, 522, 700, 'Coin Hoard'),
    ],
    guards: [
      guard([[180, 400], [180, 180], [520, 180], [520, 400]]),
      guard([[880, 420], [700, 420], [700, 180], [880, 180]], 1.1),
    ],
    cameras: [camera(330, 76, 1.35, 0.9), camera(880, 470, -1.9, 0.8)],
    lasers: [],
    keycard: null,
    door: null,
  },
  {
    name: 'Floor 2 — The Laser Archive',
    brief: 'The Aurelian Crown sits behind timed laser silk. Watch the rhythm.',
    start: { x: 70, y: 120 },
    exit: { x: 28, y: 540, w: 92, h: 56 },
    walls: [
      wall(0, 56, 960, 10), wall(0, 630, 960, 10), wall(0, 56, 10, 584), wall(950, 56, 10, 584),
      wall(240, 56, 14, 200), wall(240, 360, 14, 130),
      wall(480, 150, 14, 220), wall(480, 470, 14, 170),
      wall(720, 56, 14, 180), wall(720, 330, 14, 160),
      wall(90, 300, 110, 44, 'case'), wall(330, 520, 120, 44, 'case'),
      wall(580, 250, 120, 44, 'desk'), wall(790, 500, 110, 44, 'desk'),
      wall(560, 90, 54, 54, 'plant'), wall(120, 520, 54, 54, 'plant'),
      wall(820, 96, 110, 64, 'vault'),
    ],
    loots: [
      loot(872, 196, 6000, 'AURELIAN CROWN', true),
      loot(145, 322, 1100, 'Sealed Ledger'),
      loot(390, 542, 1000, 'Silver Archive Box'),
      loot(640, 272, 1300, 'Opal Telescope'),
    ],
    guards: [
      guard([[140, 200], [420, 200], [420, 560], [140, 560]]),
      guard([[880, 560], [560, 560], [560, 340], [880, 340]], 1.05),
      guard([[640, 120], [640, 260], [860, 260], [860, 120]], 0.9),
    ],
    cameras: [camera(262, 76, 1.2, 1.0), camera(700, 620, -0.6, 0.9)],
    lasers: [
      laser(254, 300, 480, 300, 3.6, 0),
      laser(494, 420, 720, 420, 3.6, 1.8),
      laser(734, 270, 946, 270, 4.4, 0.7),
    ],
    keycard: null,
    door: null,
  },
  {
    name: 'Floor 3 — The Meridian Vault',
    brief: 'Steal the keycard from the office, crack the vault, take the Heart.',
    start: { x: 480, y: 592 },
    exit: { x: 432, y: 576, w: 96, h: 52 },
    walls: [
      wall(0, 56, 960, 10), wall(0, 630, 960, 10), wall(0, 56, 10, 584), wall(950, 56, 10, 584),
      wall(330, 56, 14, 150), wall(616, 56, 14, 150),
      wall(180, 300, 14, 180), wall(766, 300, 14, 180),
      wall(330, 420, 300, 14),
      wall(90, 180, 120, 44, 'case'), wall(750, 180, 120, 44, 'case'),
      wall(240, 520, 120, 42, 'desk'), wall(600, 520, 120, 42, 'desk'),
      wall(60, 420, 54, 54, 'plant'), wall(846, 420, 54, 54, 'plant'),
      // The vault is a small room: brass top, plain walls, keycard door south.
      wall(395, 66, 170, 12, 'vault'),
      wall(395, 66, 12, 96), wall(553, 66, 12, 96),
      wall(395, 150, 57, 12), wall(508, 150, 57, 12),
    ],
    loots: [
      loot(480, 108, 9000, 'HEART OF MERIDIAN', true),
      loot(150, 202, 1400, 'Sun Dial'),
      loot(810, 202, 1400, 'Moon Dial'),
      loot(300, 541, 800, 'Guard Pay Chest'),
      loot(660, 541, 800, 'Evidence Locker'),
    ],
    guards: [
      guard([[120, 120], [300, 120], [300, 260], [120, 260]]),
      guard([[840, 120], [660, 120], [660, 260], [840, 260]], 1.05),
      guard([[480, 300], [240, 300], [240, 380], [480, 380]], 0.95),
      guard([[480, 300], [720, 300], [720, 380], [480, 380]], 1.1),
    ],
    cameras: [camera(70, 76, 0.9, 0.8), camera(890, 76, 2.2, 0.8), camera(480, 622, -1.57, 1.1)],
    lasers: [
      laser(344, 250, 616, 250, 4.0, 0),
      laser(194, 340, 330, 340, 3.2, 1.1),
      laser(630, 340, 766, 340, 3.2, 2.2),
    ],
    keycard: { x: 880, y: 560 },
    door: { x: 452, y: 150, w: 56, h: 12 },
  },
];
