// Vaultbreak — security cameras and laser silk.
// Cameras sweep a fixed arc from the wall; lasers blink on a rhythm the thief
// can learn. An EMP charge silences both for a few seconds (world.empLeft).
import { CAMERA } from './config.js';

export function createCamera(spec) {
  return {
    x: spec.x,
    y: spec.y,
    angle: spec.baseAngle,
    baseAngle: spec.baseAngle,
    sweepArc: spec.sweepArc,
    viewRange: CAMERA.viewRange,
    viewHalfAngle: CAMERA.viewHalfAngle,
    phase: Math.random() * 6,
  };
}

export function updateCamera(camera, dt, time) {
  camera.angle = camera.baseAngle + Math.sin(time * CAMERA.sweepSpeed + camera.phase) * camera.sweepArc;
}

/** Is this laser beam live right now? Beams rest for 35% of each period. */
export function laserIsLive(laser, time, empLeft) {
  if (empLeft > 0) return false;
  const t = (time + laser.offset) % laser.period;
  return t < laser.period * 0.65;
}

/** How close the beam is to switching back on, 0..1 — used to tint the emitters. */
export function laserCharge(laser, time) {
  const t = (time + laser.offset) % laser.period;
  const rest = laser.period * 0.35;
  const into = t - laser.period * 0.65;
  return into < 0 ? 0 : Math.min(1, into / rest);
}
