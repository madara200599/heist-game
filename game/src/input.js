// Vaultbreak — keyboard and mouse input.
// WASD / arrows move, Shift sneaks (slow, hidden by low cover), Ctrl or C
// sprints (fast, noisy), Space grabs loot, E fires the EMP, Q drops smoke,
// and a mouse click tosses a coin to lure guards. Enter confirms screens.

export const ACT_START = 1;
export const ACT_PAUSE = 2;
export const ACT_EMP = 4;
export const ACT_SMOKE = 8;
export const ACT_GRAB = 16;

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let clickPoint = null;

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    keys.add(e.code);
    if (e.code === 'Enter' || e.code === 'Space') actions |= ACT_START;
    if (e.code === 'Space') actions |= ACT_GRAB;
    if (e.code === 'Escape' || e.code === 'KeyP') actions |= ACT_PAUSE;
    if (e.code === 'KeyE') actions |= ACT_EMP;
    if (e.code === 'KeyQ') actions |= ACT_SMOKE;
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    clickPoint = {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
    actions |= ACT_START;
  });

  return {
    moveVector() {
      let x = 0, y = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
      const len = Math.hypot(x, y);
      return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
    },
    sneaking() { return keys.has('ShiftLeft') || keys.has('ShiftRight'); },
    sprinting() { return keys.has('ControlLeft') || keys.has('ControlRight') || keys.has('KeyC'); },
    grabHeld() { return keys.has('Space'); },
    takeActions() { const a = actions; actions = 0; return a; },
    takeClick() { const c = clickPoint; clickPoint = null; return c; },
  };
}
