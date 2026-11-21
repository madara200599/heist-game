// Vaultbreak — tuning constants for the whole heist.
// One place for sizes, speeds and rates so the balance can be read at a glance.

export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 640;
export const HUD_HEIGHT = 56;
export const STEP = 1 / 60;

export const THIEF = {
  radius: 12,
  walkSpeed: 148,
  sneakSpeed: 82,
  sprintSpeed: 232,
  grabRange: 42,
  grabSeconds: 0.55,
};

export const GUARD = {
  radius: 13,
  patrolSpeed: 62,
  chaseSpeed: 158,
  searchSpeed: 96,
  viewRange: 178,
  viewHalfAngle: 0.62, // radians, ~35.5 degrees each side
  catchRange: 21,
  waypointPause: 1.1,
  scanSeconds: 1.6,
};

export const CAMERA = {
  viewRange: 158,
  viewHalfAngle: 0.5,
  sweepSpeed: 0.55,
};

export const ALARM = {
  max: 100,
  guardRateNear: 46, // per second at point blank
  guardRateFar: 13, // per second at the edge of a cone
  cameraRate: 26,
  laserHit: 34,
  decayPerSecond: 7.5,
  suspiciousAt: 28,
  huntAt: 62,
  tripAt: 100,
  huntSeconds: 16, // how long a tripped alarm keeps guards hunting
};

export const TOOLS = {
  empCharges: 2,
  empSeconds: 6,
  smokeCharges: 2,
  smokeSeconds: 4.2,
  smokeRadius: 74,
  coins: 3,
  coinLureRadius: 165,
  coinLureSeconds: 3.4,
};

export const SCORE = {
  timeBonusPerSecond: 6,
  ghostBonus: 1500, // level finished without ever tripping the alarm
  cleanBonus: 500, // level finished without ever being hunted
};
