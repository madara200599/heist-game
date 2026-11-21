// Vaultbreak — all drawing. A midnight-marble look: deep blue floors, brass
// and teal accents, amber vision cones that flush red, gold loot that glows.
// Safe cover reads green-teal, danger reads amber/red, loot reads gold — the
// whole room can be read at a glance, which is the point of a heist game.
import { ALARM, HUD_HEIGHT, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { alarmStateName } from './alarm.js';
import { laserCharge, laserIsLive } from './cameras.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_LEVEL_DONE = 'level-done';
export const SCREEN_VICTORY = 'victory';

const SIGHT_BLOCKERS = new Set(['wall', 'vault', 'door']);

/** Distance a sight ray travels before a wall stops it (for cone shapes). */
function rayRange(walls, x, y, angle, maxRange) {
  const step = 7;
  for (let d = step; d < maxRange; d += step) {
    const px = x + Math.cos(angle) * d;
    const py = y + Math.sin(angle) * d;
    for (const w of walls) {
      if (SIGHT_BLOCKERS.has(w.kind) && px >= w.x && px <= w.x + w.w && py >= w.y && py <= w.y + w.h) return d;
    }
  }
  return maxRange;
}

function drawCone(ctx, walls, watcher, fillStyle) {
  const rays = 13;
  ctx.beginPath();
  ctx.moveTo(watcher.x, watcher.y);
  for (let i = 0; i < rays; i++) {
    const a = watcher.angle - watcher.viewHalfAngle + (2 * watcher.viewHalfAngle * i) / (rays - 1);
    const r = rayRange(walls, watcher.x, watcher.y, a, watcher.viewRange);
    ctx.lineTo(watcher.x + Math.cos(a) * r, watcher.y + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function drawFloor(ctx, state) {
  ctx.fillStyle = '#131a2e';
  ctx.fillRect(0, HUD_HEIGHT, VIEW_WIDTH, VIEW_HEIGHT - HUD_HEIGHT);
  // Marble checker, kept faint so actors stay readable.
  const tile = 48;
  for (let y = HUD_HEIGHT; y < VIEW_HEIGHT; y += tile) {
    for (let x = 0; x < VIEW_WIDTH; x += tile) {
      if (((x / tile) + (y / tile)) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.028)';
        ctx.fillRect(x, y, tile, tile);
      }
    }
  }
  // A crimson runner carpet down the middle — the bold route.
  ctx.fillStyle = 'rgba(122,32,48,0.35)';
  ctx.fillRect(452, HUD_HEIGHT, 56, VIEW_HEIGHT - HUD_HEIGHT);
}

function drawExit(ctx, state) {
  const ex = state.exitRect;
  const ready = state.mainLootTaken;
  ctx.fillStyle = ready ? '#14532d' : '#1e293b';
  ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
  ctx.strokeStyle = ready ? '#4ade80' : '#475569';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(ex.x + 2, ex.y + 2, ex.w - 4, ex.h - 4);
  ctx.setLineDash([]);
  // The getaway van.
  ctx.fillStyle = ready ? '#22c55e' : '#64748b';
  ctx.fillRect(ex.x + 14, ex.y + 12, ex.w - 28, 22);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(ex.x + 20, ex.y + 16, 16, 10);
  ctx.fillRect(ex.x + ex.w - 36, ex.y + 16, 12, 10);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(ready ? 'GETAWAY — GO!' : 'GETAWAY VAN', ex.x + ex.w / 2, ex.y + ex.h - 5);
}

function drawWallsAndCover(ctx, state) {
  for (const w of state.walls) {
    if (w.kind === 'wall') {
      ctx.fillStyle = '#2b3654';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = '#46588a';
      ctx.fillRect(w.x, w.y, w.w, 3);
    } else if (w.kind === 'vault') {
      ctx.fillStyle = '#3f3a26';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      ctx.strokeRect(w.x + 5, w.y + 5, w.w - 10, w.h - 10);
      ctx.beginPath();
      ctx.arc(w.x + w.w / 2, w.y + w.h / 2, 15, 0, Math.PI * 2);
      ctx.strokeStyle = '#f5d76e';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = '#f5d76e';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VAULT', w.x + w.w / 2, w.y + 13);
    } else if (w.kind === 'door') {
      const open = state.hasKeycard;
      ctx.fillStyle = open ? '#14532d' : '#7f1d1d';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = '#fecaca';
      ctx.font = 'bold 8px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(open ? 'OPEN' : 'LOCKED', w.x + w.w / 2, w.y + w.h / 2 + 3);
    } else if (w.kind === 'case') {
      ctx.fillStyle = '#173f3a';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = 'rgba(148,233,255,0.20)';
      ctx.fillRect(w.x + 4, w.y + 4, w.w - 8, w.h - 8);
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w.x + 4, w.y + 4, w.w - 8, w.h - 8);
    } else if (w.kind === 'desk') {
      ctx.fillStyle = '#4a3220';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = '#6d4c2f';
      ctx.fillRect(w.x + 3, w.y + 3, w.w - 6, 5);
    } else if (w.kind === 'plant') {
      ctx.fillStyle = '#3f2d20';
      ctx.fillRect(w.x + 14, w.y + 14, w.w - 28, w.h - 28);
      ctx.fillStyle = '#1d5c38';
      ctx.beginPath();
      ctx.arc(w.x + w.w / 2, w.y + w.h / 2, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2f9e5f';
      ctx.beginPath();
      ctx.arc(w.x + w.w / 2 - 7, w.y + w.h / 2 - 6, 13, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawLasers(ctx, state) {
  for (const beam of state.lasers) {
    const live = laserIsLive(beam, state.time, state.empLeft);
    const charge = laserCharge(beam, state.time);
    ctx.fillStyle = '#111827';
    for (const [ex, ey] of [[beam.x1, beam.y1], [beam.x2, beam.y2]]) {
      ctx.beginPath();
      ctx.arc(ex, ey, 5, 0, Math.PI * 2);
      ctx.fillStyle = live ? '#ef4444' : charge > 0.66 ? '#f59e0b' : '#374151';
      ctx.fill();
    }
    if (live) {
      ctx.strokeStyle = 'rgba(239,68,68,0.28)';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(beam.x1, beam.y1); ctx.lineTo(beam.x2, beam.y2); ctx.stroke();
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(beam.x1, beam.y1); ctx.lineTo(beam.x2, beam.y2); ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(148,163,184,0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 6]);
      ctx.beginPath(); ctx.moveTo(beam.x1, beam.y1); ctx.lineTo(beam.x2, beam.y2); ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function drawLoot(ctx, state) {
  for (const l of state.loots) {
    if (l.taken) continue;
    const pulse = l.main ? 3 + Math.sin(state.time * 4) * 1.6 : 0;
    ctx.beginPath();
    ctx.arc(l.x, l.y, (l.main ? 17 : 12) + pulse, 0, Math.PI * 2);
    ctx.fillStyle = l.main ? 'rgba(245,215,110,0.30)' : 'rgba(245,215,110,0.16)';
    ctx.fill();
    // A cut gem: rotated square with a bright core.
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.rotate(Math.PI / 4);
    const s = l.main ? 11 : 8;
    ctx.fillStyle = l.main ? '#ffd94d' : '#f5d76e';
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.fillStyle = '#fff7cc';
    ctx.fillRect(-s / 4, -s / 4, s / 2, s / 2);
    ctx.restore();
    if (l.main) {
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ ' + l.label + ' ★', l.x, l.y - 24);
    }
  }
  if (state.keycardPos && !state.keycardPos.taken) {
    const k = state.keycardPos;
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(k.x - 10, k.y - 7, 20, 14);
    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(k.x - 10, k.y - 3, 20, 4);
    ctx.fillStyle = '#bae6fd';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KEYCARD', k.x, k.y - 12);
  }
}

function drawSmokes(ctx, state) {
  for (const s of state.smokes) {
    const alpha = Math.min(0.55, s.remaining);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + state.time * 0.7;
      const r = s.radius * (0.35 + (i % 3) * 0.2);
      ctx.beginPath();
      ctx.arc(s.x + Math.cos(a) * s.radius * 0.35, s.y + Math.sin(a) * s.radius * 0.35, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(203,213,225,${alpha * 0.35})`;
      ctx.fill();
    }
  }
}

function drawCameras(ctx, state) {
  const dark = state.empLeft > 0;
  for (const c of state.cameras) {
    if (!dark) drawCone(ctx, state.walls, c, 'rgba(96,165,250,0.20)');
    ctx.fillStyle = '#0b1120';
    ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = dark ? '#475569' : '#60a5fa';
    ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = dark ? '#475569' : '#f87171';
    ctx.beginPath();
    ctx.arc(c.x + Math.cos(c.angle) * 5, c.y + Math.sin(c.angle) * 5, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#93c5fd';
    ctx.font = 'bold 8px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CAM', c.x, c.y - 11);
  }
}

function drawGuards(ctx, state) {
  for (const g of state.guards) {
    const seesMe = state.seenNow > 0 && (g.mode === 'investigate' || g.mode === 'chase');
    // Body: navy uniform, brass badge, cap brim toward facing.
    ctx.fillStyle = '#1e3a5f';
    ctx.beginPath(); ctx.arc(g.x, g.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(g.x - 4, g.y + 3, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0f2440';
    ctx.beginPath(); ctx.arc(g.x, g.y, 8.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0f2440'; ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 13, g.y + Math.sin(g.angle) * 13);
    ctx.stroke();
    if (g.mode === 'chase') {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 17px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 19);
    } else if (g.mode === 'investigate' || seesMe) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - 19);
    }
  }
}

function drawThief(ctx, state) {
  const t = state.thief;
  ctx.fillStyle = t.sneaking ? '#0d4f45' : '#14b8a6';
  ctx.beginPath(); ctx.arc(t.x, t.y, t.sneaking ? 10.5 : 12, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#99f6e4'; ctx.lineWidth = 1.8; ctx.stroke();
  // Hood and mask band, facing the way the thief moves.
  ctx.fillStyle = '#083f3a';
  ctx.beginPath(); ctx.arc(t.x, t.y, 7, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#083f3a'; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(t.x, t.y);
  ctx.lineTo(t.x + Math.cos(t.angle) * 11, t.y + Math.sin(t.angle) * 11);
  ctx.stroke();
  // Loot sack grows with the haul.
  const sack = 4 + Math.min(6, state.lootValue / 900);
  ctx.fillStyle = '#a16207';
  ctx.beginPath();
  ctx.arc(t.x - Math.cos(t.angle) * 11, t.y - Math.sin(t.angle) * 11, sack, 0, Math.PI * 2);
  ctx.fill();
  if (state.grabProgress > 0) {
    ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 17, -Math.PI / 2, -Math.PI / 2 + state.grabProgress * Math.PI * 2);
    ctx.stroke();
  }
  if (state.noise) {
    ctx.strokeStyle = 'rgba(251,191,36,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(t.x, t.y, 22 + Math.sin(state.time * 10) * 3, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawAlarmMeter(ctx, state) {
  const alarm = state.alarm;
  const x = 330, y = 14, w = 300, h = 20;
  ctx.fillStyle = '#0b1120';
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(x, y, w, h);
  const frac = alarm.level / ALARM.max;
  const grad = ctx.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, '#22c55e');
  grad.addColorStop(0.55, '#eab308');
  grad.addColorStop(0.8, '#f97316');
  grad.addColorStop(1, '#ef4444');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w * frac, h);
  // Threshold ticks: suspicious and hunted.
  ctx.fillStyle = '#e5e7eb';
  for (const at of [ALARM.suspiciousAt, ALARM.huntAt]) {
    ctx.fillRect(x + (w * at) / 100 - 1, y - 2, 2, h + 4);
  }
  if (alarm.flash > 0) {
    ctx.fillStyle = `rgba(239,68,68,${alarm.flash * 0.35})`;
    ctx.fillRect(x, y, w, h);
  }
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('ALARM', x - 8, y + 15);
  ctx.textAlign = 'center';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(alarmStateName(alarm), x + w / 2, y + 15);
}

function drawHud(ctx, state) {
  ctx.fillStyle = '#0a0f1f';
  ctx.fillRect(0, 0, VIEW_WIDTH, HUD_HEIGHT);
  ctx.fillStyle = '#f5d76e';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('VAULTBREAK', 12, 24);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(state.levelName, 12, 42);

  drawAlarmMeter(ctx, state);

  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('$' + state.totalLoot.toLocaleString('en-US'), VIEW_WIDTH - 14, 22);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px system-ui, sans-serif';
  const mm = Math.floor(state.levelTime / 60);
  const ss = String(Math.floor(state.levelTime % 60)).padStart(2, '0');
  ctx.fillText(`time ${mm}:${ss}`, VIEW_WIDTH - 14, 40);

  // Tool belt, right of the alarm meter: charges left, greyed when spent,
  // with the EMP countdown riding on its own row while the burst lasts.
  const empNote = state.empLeft > 0 ? ` ${state.empLeft.toFixed(0)}s!` : '';
  const tools = [
    [`EMP [E]${empNote}`, state.tools.emp, '#facc15'],
    ['SMOKE [Q]', state.tools.smoke, '#cbd5e1'],
    ['COIN [click]', state.tools.coins, '#fbbf24'],
  ];
  ctx.font = 'bold 10px system-ui, sans-serif';
  tools.forEach(([label, count, color], i) => {
    ctx.fillStyle = count > 0 ? color : '#475569';
    ctx.textAlign = 'left';
    ctx.fillText(`${label} ×${count}`, 650, 18 + i * 14);
  });
  // The eye: you are being watched.
  if (state.seenNow > 0) {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👁 SEEN', 480, 50);
  }
}

function banner(ctx, text) {
  ctx.fillStyle = 'rgba(2,6,23,0.82)';
  const w = ctx.measureText(text).width + 28;
  ctx.fillRect((VIEW_WIDTH - w) / 2, VIEW_HEIGHT - 40, w, 26);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, VIEW_WIDTH / 2, VIEW_HEIGHT - 22);
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(2,6,23,0.78)';
  ctx.fillRect(0, HUD_HEIGHT, VIEW_WIDTH, VIEW_HEIGHT - HUD_HEIGHT);
  ctx.fillStyle = accent || '#f5d76e';
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW_WIDTH / 2, 240);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '16px system-ui, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_WIDTH / 2, 286 + i * 26));
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  function draw(state, screen, summary) {
    drawFloor(ctx, state);
    drawExit(ctx, state);
    drawWallsAndCover(ctx, state);
    drawLasers(ctx, state);
    drawLoot(ctx, state);
    // Cones above the floor but below the actors.
    const hunting = state.alarm.hunting;
    for (const g of state.guards) {
      const sees = g.mode === 'investigate' || g.mode === 'chase';
      drawCone(ctx, state.walls, g, hunting ? 'rgba(239,68,68,0.30)' : sees ? 'rgba(249,115,22,0.34)' : 'rgba(250,204,21,0.26)');
    }
    drawCameras(ctx, state);
    drawSmokes(ctx, state);
    drawGuards(ctx, state);
    drawThief(ctx, state);
    drawHud(ctx, state);

    if (state.messageLeft > 0 && screen === SCREEN_PLAY) {
      ctx.font = '13px system-ui, sans-serif';
      banner(ctx, state.message);
    }
    if (screen === SCREEN_TITLE) {
      overlay(ctx, 'VAULTBREAK', [
        'The Meridian Exchange sleeps. Its treasures should not.',
        '',
        'WASD move · Shift sneak behind cover · Ctrl sprint (loud!)',
        'Space hold to grab loot · E = EMP · Q = smoke · Click = toss a coin',
        'Fill the ALARM meter and the hunt begins. One touch while hunted ends it.',
        '',
        'Press Enter or click to begin the heist',
      ]);
    } else if (screen === SCREEN_PAUSED) {
      overlay(ctx, 'PAUSED', ['The guards hold their breath too.', 'Press Esc or Enter to slip back in.'], '#93c5fd');
    } else if (screen === SCREEN_CAUGHT) {
      overlay(ctx, 'BUSTED!', [
        'A guard laid a hand on you while the building screamed.',
        `Loot kept in the sack: $${state.totalLoot.toLocaleString('en-US')}`,
        '',
        'Press Enter to try the night again',
      ], '#ef4444');
    } else if (screen === SCREEN_LEVEL_DONE && summary) {
      overlay(ctx, 'CLEAN GETAWAY', summary, '#4ade80');
    } else if (screen === SCREEN_VICTORY && summary) {
      overlay(ctx, 'THE NIGHT IS YOURS', summary, '#f5d76e');
    }
  }
  return { draw };
}
