// Vaultbreak — the alarm meter, the heart of the tension.
// Being seen pours suspicion in; hiding lets it drain. Cross the hunt line and
// guards start searching in earnest. Fill the meter and the alarm trips:
// guards chase for a while, and one touch ends the night.
import { ALARM } from './config.js';

export function createAlarm() {
  return {
    level: 0, // 0..100
    hunting: false, // past the hunt threshold right now
    tripped: false, // the full alarm has gone off at least once this floor
    huntLeft: 0, // seconds of chase left after a trip
    everHunted: false,
    flash: 0, // cosmetic pulse when the meter jumps (laser hit)
  };
}

export function alarmStateName(alarm) {
  if (alarm.huntLeft > 0) return 'ALARM!';
  if (alarm.level >= ALARM.huntAt) return 'HUNTED';
  if (alarm.level >= ALARM.suspiciousAt) return 'SUSPICIOUS';
  return 'CALM';
}

export function addSuspicion(alarm, amount) {
  const before = alarm.level;
  alarm.level = Math.min(ALARM.max, alarm.level + amount);
  if (amount > 10) alarm.flash = 1;
  if (alarm.level >= ALARM.max && before < ALARM.max) tripAlarm(alarm);
  refreshHunt(alarm);
}

export function tripAlarm(alarm) {
  alarm.tripped = true;
  alarm.huntLeft = ALARM.huntSeconds;
  alarm.level = ALARM.max;
}

function refreshHunt(alarm) {
  alarm.hunting = alarm.huntLeft > 0 || alarm.level >= ALARM.huntAt;
  if (alarm.hunting) alarm.everHunted = true;
}

export function updateAlarm(alarm, dt, seenStrength) {
  if (alarm.flash > 0) alarm.flash = Math.max(0, alarm.flash - dt * 2.4);
  if (alarm.huntLeft > 0) {
    alarm.huntLeft -= dt;
    if (alarm.huntLeft <= 0) alarm.level = 58; // the hunt cools, but nobody forgets
  } else if (seenStrength <= 0) {
    alarm.level = Math.max(0, alarm.level - ALARM.decayPerSecond * dt);
  }
  refreshHunt(alarm);
}
