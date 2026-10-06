/** Wall decor placement: each wall is the quad of its painted inner face, and decor is
 * placed in wall coordinates (u along the wall, v down from the top, both 0–1). The
 * page maps every piece through the wall's own perspective, so it sits flat on the
 * wall anywhere along it. */

// Inner wall faces in scene coordinates (1000 × 666.67), measured on the room art:
// top-left, top-right, bottom-right, bottom-left. `length` and `height` are the
// face's true size in art pixels, used to give decor real proportions.
export const WALLS = Object.freeze({
  cream: Object.freeze({ quad: [[69.66, 161.46], [434.9, 7.81], [434.9, 225.26], [69.66, 391.28]], length: 627, height: 343 }),
  teal: Object.freeze({ quad: [[594.4, 27.34], [927.1, 160.16], [927.1, 403.65], [594.4, 239.58]], length: 571, height: 350 }),
});

// True size in art pixels, and where each piece hangs by default (its top-left corner).
export const WALL_ITEMS = Object.freeze([
  { id: 'silver', wall: 'cream', width: 92, height: 122, default: { u: .07, v: .04 } },
  { id: 'gold', wall: 'cream', width: 92, height: 122, default: { u: .23, v: .04 } },
  { id: 'pinboard', wall: 'teal', width: 236, height: 128, default: { u: .05, v: .1 } },
  { id: 'portrait', wall: 'teal', width: 96, height: 110, default: { u: .63, v: .1 } },
].map(item => Object.freeze({ ...item, default: Object.freeze(item.default) })));
export const WALL_STORAGE_KEY = 'todsophon.wall-decor.v3';

// Keep decor off the wall ends and above the baseboard and desk tops.
const MARGIN = Object.freeze({ side: .02, top: .03, bottom: .3 });
const GAP = .012;
const itemsById = new Map(WALL_ITEMS.map(item => [item.id, item]));

/** Size of a piece as a fraction of its wall. */
export function wallSpan(item) {
  const wall = WALLS[item.wall];
  return { du: item.width / wall.length, dv: item.height / wall.height };
}

function homography([[x0, y0], [x1, y1], [x2, y2], [x3, y3]]) {
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / det, h = (dx1 * dy3 - dx3 * dy1) / det;
  return { a: x1 - x0 + g * x1, b: x3 - x0 + h * x3, c: x0, d: y1 - y0 + g * y1, e: y3 - y0 + h * y3, f: y0, g, h };
}
const maps = Object.fromEntries(Object.entries(WALLS).map(([id, wall]) => [id, homography(wall.quad)]));

/** Wall coordinates to scene coordinates. */
export function wallToScene(wallId, u, v) {
  const { a, b, c, d, e, f, g, h } = maps[wallId], w = g * u + h * v + 1;
  return { x: (a * u + b * v + c) / w, y: (d * u + e * v + f) / w };
}

/** Scene coordinates to wall coordinates (may fall outside 0–1). */
export function sceneToWall(wallId, x, y) {
  const { a, b, c, d, e, f, g, h } = maps[wallId];
  const p = a - g * x, q = b - h * x, r = d - g * y, s = e - h * y, det = p * s - q * r;
  return { u: ((x - c) * s - q * (y - f)) / det, v: (p * (y - f) - (x - c) * r) / det };
}

/** CSS matrix3d placing a w × h element on the wall at (u, v) with the wall's perspective. */
export function wallMatrix(item, position, w, h) {
  const { du, dv } = wallSpan(item);
  const { u, v } = position;
  const quad = [[u, v], [u + du, v], [u + du, v + dv], [u, v + dv]].map(([pu, pv]) => {
    const point = wallToScene(item.wall, pu, pv);
    return [point.x, point.y];
  });
  const m = homography(quad);
  return `matrix3d(${[m.a / w, m.d / w, 0, m.g / w, m.b / h, m.e / h, 0, m.h / h, 0, 0, 1, 0, m.c, m.f, 0, 1].map(n => +n.toFixed(6)).join(',')})`;
}

/** Keep a piece on its wall, clear of the ends, the top and the baseboard. */
export function clampToWall(item, position) {
  const { du, dv } = wallSpan(item);
  const finite = value => Number.isFinite(value) ? value : 0;
  return {
    u: Math.max(MARGIN.side, Math.min(1 - MARGIN.side - du, finite(position?.u))),
    v: Math.max(MARGIN.top, Math.min(1 - MARGIN.bottom - dv, finite(position?.v))),
  };
}

function overlaps(item, position, other, otherPosition) {
  if (item.wall !== other.wall) return false;
  const a = wallSpan(item), b = wallSpan(other);
  return position.u < otherPosition.u + b.du + GAP && position.u + a.du + GAP > otherPosition.u
    && position.v < otherPosition.v + b.dv + GAP && position.v + a.dv + GAP > otherPosition.v;
}

/** Whether a piece may hang at a position without overlapping its neighbours. */
export function canHang(state, id, position) {
  const item = itemsById.get(id);
  if (!item) return false;
  const clamped = clampToWall(item, position);
  if (Math.abs(clamped.u - position.u) > 1e-9 || Math.abs(clamped.v - position.v) > 1e-9) return false;
  return WALL_ITEMS.every(other => other.id === id || !state[other.id] || !overlaps(item, position, other, state[other.id]));
}

/**
 * Where a dragged piece lands: the wanted spot when free, otherwise as far as it can
 * slide along either axis from where it was, so it glides along its neighbours.
 */
export function slideTo(state, id, from, wanted) {
  const item = itemsById.get(id);
  const target = clampToWall(item, wanted);
  if (canHang(state, id, target)) return target;
  for (const candidate of [{ u: target.u, v: from.v }, { u: from.u, v: target.v }]) {
    if (canHang(state, id, candidate)) return candidate;
  }
  return { ...from };
}

export function defaultWallState() {
  return Object.fromEntries(WALL_ITEMS.map(item => [item.id, { ...item.default }]));
}

/** Validate a saved arrangement as a whole; anything off falls back to the defaults. */
export function normalizeWallState(input) {
  const state = defaultWallState();
  if (!input || typeof input !== 'object') return state;
  for (const item of WALL_ITEMS) {
    const saved = input[item.id];
    if (Number.isFinite(saved?.u) && Number.isFinite(saved?.v)) state[item.id] = clampToWall(item, saved);
  }
  return WALL_ITEMS.every(item => canHang(state, item.id, state[item.id])) ? state : defaultWallState();
}
