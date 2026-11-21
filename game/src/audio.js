// Vaultbreak — tiny synthesized sounds, no audio files.
// A WebAudio blip for a grab, a low thud for a coin toss, a rising whine while
// the alarm hunts. Everything is guarded: a browser without audio (or one that
// has not heard a user gesture yet) simply plays the game in silence.

export function createAudio() {
  let ctx = null;
  let master = null;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return true;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.16;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function blip(freq, seconds, type, slideTo) {
    if (!ensure()) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + seconds);
    gain.gain.setValueAtTime(0.9, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
    osc.connect(gain).connect(master);
    osc.start();
    osc.stop(ctx.currentTime + seconds);
  }

  return {
    unlock() { ensure(); },
    grab() { blip(880, 0.14, 'triangle', 1320); },
    keycard() { blip(660, 0.1, 'square', 990); setTimeout(() => blip(990, 0.12, 'square'), 70); },
    coin() { blip(1560, 0.07, 'sine', 1180); },
    emp() { blip(220, 0.35, 'sawtooth', 55); },
    smoke() { blip(340, 0.25, 'sine', 120); },
    laserZap() { blip(1400, 0.16, 'sawtooth', 300); },
    spotted() { blip(520, 0.12, 'square', 760); },
    alarmTrip() { blip(392, 0.5, 'square', 784); },
    caught() { blip(196, 0.6, 'sawtooth', 65); },
    escape() { blip(523, 0.16, 'triangle'); setTimeout(() => blip(784, 0.22, 'triangle', 1046), 120); },
  };
}
