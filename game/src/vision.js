// Vaultbreak — sight lines and vision cones.
// A watcher sees the thief when three things line up: the thief is inside the
// cone's angle, inside its range, and no sight-blocking wall crosses the line
// between them. Low cover only counts when the thief is sneaking behind it.

export function angleDifference(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const rX = bx - ax, rY = by - ay;
  const sX = dx - cx, sY = dy - cy;
  const denom = rX * sY - rY * sX;
  if (denom === 0) return false;
  const t = ((cx - ax) * sY - (cy - ay) * sX) / denom;
  const u = ((cx - ax) * rY - (cy - ay) * rX) / denom;
  return t > 0.001 && t < 0.999 && u > 0.001 && u < 0.999;
}

function segmentHitsRect(x1, y1, x2, y2, rect) {
  // A watcher standing inside its own cover should still see out of it.
  if (x1 > rect.x && x1 < rect.x + rect.w && y1 > rect.y && y1 < rect.y + rect.h) return false;
  return (
    segmentsCross(x1, y1, x2, y2, rect.x, rect.y, rect.x + rect.w, rect.y) ||
    segmentsCross(x1, y1, x2, y2, rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h) ||
    segmentsCross(x1, y1, x2, y2, rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h) ||
    segmentsCross(x1, y1, x2, y2, rect.x, rect.y + rect.h, rect.x, rect.y)
  );
}

const SIGHT_BLOCKERS = new Set(['wall', 'vault', 'door']);
const LOW_COVER = new Set(['case', 'desk', 'plant']);

/** True when nothing that blocks sight crosses the line from watcher to thief. */
export function lineOfSightClear(walls, fromX, fromY, toX, toY, thiefSneaking) {
  for (const w of walls) {
    if (SIGHT_BLOCKERS.has(w.kind) && segmentHitsRect(fromX, fromY, toX, toY, w)) return false;
    if (thiefSneaking && LOW_COVER.has(w.kind)) {
      // Sneaking hides the thief only when the cover is close to the thief.
      const cx = Math.max(w.x, Math.min(toX, w.x + w.w));
      const cy = Math.max(w.y, Math.min(toY, w.y + w.h));
      const nearThief = Math.hypot(cx - toX, cy - toY) < 34;
      if (nearThief && segmentHitsRect(fromX, fromY, toX, toY, w)) return false;
    }
  }
  return true;
}

/**
 * How strongly a watcher sees the thief: 0 when unseen, otherwise 0..1 scaled
 * by distance (1 at point blank). Smoke between them blocks sight completely.
 */
export function visionStrength(watcher, thief, walls, smokes) {
  const dx = thief.x - watcher.x;
  const dy = thief.y - watcher.y;
  const dist = Math.hypot(dx, dy);
  if (dist > watcher.viewRange) return 0;
  if (dist > 26) {
    const facing = Math.atan2(dy, dx);
    if (Math.abs(angleDifference(facing, watcher.angle)) > watcher.viewHalfAngle) return 0;
  }
  for (const s of smokes) {
    if (s.remaining <= 0) continue;
    const midX = (watcher.x + thief.x) / 2;
    const midY = (watcher.y + thief.y) / 2;
    if (Math.hypot(midX - s.x, midY - s.y) < s.radius) return 0;
    if (Math.hypot(thief.x - s.x, thief.y - s.y) < s.radius * 0.8) return 0;
  }
  if (!lineOfSightClear(walls, watcher.x, watcher.y, thief.x, thief.y, thief.sneaking)) return 0;
  const closeness = 1 - dist / watcher.viewRange;
  return 0.25 + 0.75 * closeness;
}

/** Point-in-rect test with a radius, used for movement collision. */
export function circleHitsRect(cx, cy, radius, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  return Math.hypot(cx - nx, cy - ny) < radius;
}

/** Move a circle by (dx, dy), sliding along any wall it would enter. */
export function moveWithCollision(pos, dx, dy, radius, solids) {
  let nx = pos.x + dx;
  for (const s of solids) {
    if (circleHitsRect(nx, pos.y, radius, s)) { nx = pos.x; break; }
  }
  let ny = pos.y + dy;
  for (const s of solids) {
    if (circleHitsRect(nx, ny, radius, s)) { ny = pos.y; break; }
  }
  pos.x = nx;
  pos.y = ny;
}

/** True when the segment crosses the laser beam segment. */
export function segmentCrossesBeam(x1, y1, x2, y2, beam) {
  return segmentsCross(x1, y1, x2, y2, beam.x1, beam.y1, beam.x2, beam.y2);
}
