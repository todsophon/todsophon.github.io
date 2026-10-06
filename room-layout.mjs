/** Positions are the back corner of a furniture footprint on the hidden placement grid. */
// The seventeenth row reaches the visible front and side edges of the floor.
export const GRID_SIZE = 17;
export const LAYOUT_VERSION = 3;
export const STORAGE_KEY = 'todsophon.room-layout.v3';
export const LEGACY_STORAGE_KEY = 'todsophon.room-layout.v2';
export const RESERVED_AREAS = Object.freeze([
  Object.freeze({ x: 0, y: 0, width: 4, depth: 4 }),
]);
// Things laid flat on the floor: furniture cannot cover them, but Fibi walks across.
export const FLOOR_FEATURES = Object.freeze([
  Object.freeze({ id: 'keyboard', x: 6, y: 5, width: 5, depth: 7 }),
]);

export const FURNITURE = Object.freeze([
  { id: 'youtube', label: 'Creator desk', width: 3, depth: 8, default: { x: 0, y: 4 }, chapter: 'youtube', sprite: { col: 0, row: 0 } },
  { id: 'oto', label: 'Oto AI desk', width: 8, depth: 3, default: { x: 6, y: 0 }, chapter: 'oto', sprite: { col: 1, row: 0 } },
  { id: 'bookshelf', label: 'Record cabinet', width: 2, depth: 4, default: { x: 0, y: 12 }, chapter: 'youtube', sprite: { col: 2, row: 0 } },
  { id: 'plant', label: 'Case study easel', width: 2, depth: 2, default: { x: 14, y: 5 }, href: 'frisson-case-study.html', sprite: { col: 0, row: 1 } },
  { id: 'chair', label: 'Screening beanbag', width: 4, depth: 4, default: { x: 2, y: 13 }, action: 'screening', sprite: { col: 1, row: 1 } },
  { id: 'tiktok', label: 'TikTok ring light', width: 2, depth: 2, default: { x: 4, y: 3 }, chapter: 'tiktok', sprite: { col: 2, row: 1 } },
].map(item => Object.freeze({
  ...item,
  default: Object.freeze(item.default),
  sprite: Object.freeze(item.sprite),
})));

export const DEFAULT_LAYOUT = Object.freeze(Object.fromEntries(
  FURNITURE.map(item => [item.id, Object.freeze({ ...item.default })]),
));

// Scene coordinates use a 1000 × 666.6667 canvas matching the illustrated room.
// The painted floor is not a perfect 2:1 diamond: its back corner hides behind the
// bookcase and its front edges fall more steeply than the wall lines. These corners
// were measured along the baseboards and the top of the floor's front edge.
export const FLOOR_QUAD = Object.freeze({
  back: Object.freeze([500, 196]), right: Object.freeze([937.5, 409]),
  front: Object.freeze([485, 649]), left: Object.freeze([62.5, 394.5]),
});
const furnitureById = new Map(FURNITURE.map(item => [item.id, item]));
// Earlier defaults, as changes from the current one.
const PREVIOUS_DEFAULTS = Object.freeze([
  { plant: { x: 14, y: 2 } },
  { plant: { x: 14, y: 2 }, chair: { x: 6, y: 12 }, tiktok: { x: 2, y: 12 } },
  { plant: { x: 14, y: 2 }, chair: { x: 6, y: 12 }, tiktok: { x: 14, y: 6 } },
]);

/** Projective map from the unit square onto a floor quad, so grid lines stay straight. */
function homography({ back, right, front, left }) {
  const [x0, y0] = back, [x1, y1] = right, [x2, y2] = front, [x3, y3] = left;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / det;
  const h = (dx1 * dy3 - dx3 * dy1) / det;
  return { a: x1 - x0 + g * x1, b: x3 - x0 + h * x3, c: x0, d: y1 - y0 + g * y1, e: y3 - y0 + h * y3, f: y0, g, h };
}
const floorMap = homography(FLOOR_QUAD);
const mapFor = quad => quad === FLOOR_QUAD ? floorMap : homography(quad);
const legacyFurniture = [
  { id: 'youtube', width: 2, depth: 3, default: { x: 0, y: 2 } },
  { id: 'oto', width: 3, depth: 2, default: { x: 3, y: 0 } },
  { id: 'bookshelf', width: 1, depth: 2, default: { x: 0, y: 6 } },
  { id: 'plant', width: 1, depth: 1, default: { x: 7, y: 1 } },
  { id: 'chair', width: 2, depth: 2, default: { x: 3, y: 6 } },
  { id: 'tiktok', width: 1, depth: 1, default: { x: 7, y: 3 } },
];
const legacyReserved = [{ x: 0, y: 0, width: 2, depth: 2 }];

/** Convert a tile corner (including fractional positions) to scene coordinates. */
export function tileToScreen(x, y, quad = FLOOR_QUAD) {
  const { a, b, c, d, e, f, g, h } = mapFor(quad);
  const u = x / GRID_SIZE, v = y / GRID_SIZE, w = g * u + h * v + 1;
  return { x: (a * u + b * v + c) / w, y: (d * u + e * v + f) / w };
}

/** Return fractional tile coordinates; snapping is the caller's decision. */
export function screenToTile(x, y, quad = FLOOR_QUAD) {
  const { a, b, c, d, e, f, g, h } = mapFor(quad);
  // Solve (a − gx)u + (b − hx)v = x − c and (d − gy)u + (e − hy)v = y − f.
  const p = a - g * x, q = b - h * x, r = d - g * y, s = e - h * y;
  const det = p * s - q * r;
  const u = ((x - c) * s - q * (y - f)) / det, v = (p * (y - f) - (x - c) * r) / det;
  return { x: u * GRID_SIZE, y: v * GRID_SIZE };
}

function isRecord(value) {
  return value !== null && typeof value === 'object'
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function hasExactKeys(value, expected) {
  return isRecord(value) && Object.keys(value).length === expected.length
    && expected.every(key => Object.hasOwn(value, key));
}

function validPosition(position, item, gridSize = GRID_SIZE) {
  return hasExactKeys(position, ['x', 'y'])
    && Number.isInteger(position.x) && Number.isInteger(position.y)
    && position.x >= 0 && position.y >= 0
    && position.x + item.width <= gridSize
    && position.y + item.depth <= gridSize;
}

function hasValidPositions(layout, furniture = FURNITURE, gridSize = GRID_SIZE) {
  return hasExactKeys(layout, furniture.map(item => item.id))
    && furniture.every(item => validPosition(layout[item.id], item, gridSize));
}

function overlaps(a, aItem, b, bItem) {
  return a.x < b.x + bItem.width && a.x + aItem.width > b.x
    && a.y < b.y + bItem.depth && a.y + aItem.depth > b.y;
}

/** Snap the whole footprint to the floor; collision validity remains canPlace's decision. */
export function snapPlacement(id, desired, previous = null) {
  const item = furnitureById.get(id);
  if (!item || !Number.isFinite(desired?.x) || !Number.isFinite(desired?.y)) return null;

  const maxX = GRID_SIZE - item.width;
  const maxY = GRID_SIZE - item.depth;
  const hasPrevious = Number.isInteger(previous?.x) && Number.isInteger(previous?.y)
    && previous.x >= 0 && previous.x <= maxX && previous.y >= 0 && previous.y <= maxY;
  const snapAxis = (value, limit, prior) => {
    const clamped = Math.max(0, Math.min(limit, value));
    // A small dead band keeps pointer noise near a half-cell boundary from flickering.
    const holdDistance = 0.5 + 0.12;
    if (hasPrevious && clamped >= prior - holdDistance && clamped <= prior + holdDistance) return prior;
    return Math.round(clamped);
  };
  return {
    x: snapAxis(desired.x, maxX, previous?.x),
    y: snapAxis(desired.y, maxY, previous?.y),
  };
}

/** Check the complete footprint, ignoring the dragged item's previous position. */
export function canPlace(layout, id, x, y) {
  const item = furnitureById.get(id);
  const candidate = { x, y };
  if (!item || !validPosition(candidate, item) || !hasValidPositions(layout)) return false;
  if ([...RESERVED_AREAS, ...FLOOR_FEATURES].some(area => overlaps(candidate, item, area, area))) return false;
  return FURNITURE.every(other => other.id === id
    || !overlaps(candidate, item, layout[other.id], other));
}

/** At a floor edge, let the pointer target the piece instead of preserving a distant grab offset. */
export function snapDraggedPlacement(id, original, grabTile, cursorTile, previous = null) {
  const item = furnitureById.get(id);
  if (!item || !original || !grabTile || !cursorTile) return null;
  const dragged = snapPlacement(id, {
    x: original.x + cursorTile.x - grabTile.x,
    y: original.y + cursorTile.y - grabTile.y,
  }, previous);
  const underPointer = snapPlacement(id, {
    x: cursorTile.x - item.width / 2,
    y: cursorTile.y - item.depth / 2,
  }, previous);
  if (!dragged || !underPointer) return null;
  const edgeBand = 1.5;
  if (cursorTile.x >= GRID_SIZE - edgeBand) dragged.x = Math.max(dragged.x, underPointer.x);
  if (cursorTile.x <= edgeBand) dragged.x = Math.min(dragged.x, underPointer.x);
  if (cursorTile.y >= GRID_SIZE - edgeBand) dragged.y = Math.max(dragged.y, underPointer.y);
  if (cursorTile.y <= edgeBand) dragged.y = Math.min(dragged.y, underPointer.y);
  return dragged;
}

/** Find a nearby open landing when the pointer is over another footprint. */
export function nearbyOpenPlacement(layout, id, desired, maxDistance = 2) {
  if (!desired || !Number.isInteger(desired.x) || !Number.isInteger(desired.y)) return null;
  if (canPlace(layout, id, desired.x, desired.y)) return { ...desired };
  const item = furnitureById.get(id);
  if (!item) return null;
  const candidates = [];
  for (let y = Math.max(0, desired.y - maxDistance); y <= Math.min(GRID_SIZE - item.depth, desired.y + maxDistance); y++) {
    for (let x = Math.max(0, desired.x - maxDistance); x <= Math.min(GRID_SIZE - item.width, desired.x + maxDistance); x++) {
      const distance = (x - desired.x) ** 2 + (y - desired.y) ** 2;
      if (distance <= maxDistance ** 2 && canPlace(layout, id, x, y)) candidates.push({ x, y, distance });
    }
  }
  candidates.sort((a, b) => a.distance - b.distance || a.y - b.y || a.x - b.x);
  return candidates.length ? { x: candidates[0].x, y: candidates[0].y } : null;
}

function cloneLayout(layout) {
  return Object.fromEntries(FURNITURE.map(item => [item.id, { ...layout[item.id] }]));
}

/** Fit legacy rooms to the finer grid, preserving each old floor center where possible. */
function migrateLegacy(layout) {
  if (!hasValidPositions(layout, legacyFurniture, 8)
    || legacyFurniture.some(item => legacyReserved.some(area => overlaps(layout[item.id], item, area, area))
      || legacyFurniture.some(other => other.id !== item.id
        && overlaps(layout[item.id], item, layout[other.id], other)))) return null;

  if (legacyFurniture.every(item => layout[item.id].x === item.default.x
    && layout[item.id].y === item.default.y)) return cloneLayout(DEFAULT_LAYOUT);

  const migrated = {};
  for (const item of FURNITURE) {
    const oldItem = legacyFurniture.find(other => other.id === item.id);
    const oldPosition = layout[item.id];
    const desired = {
      x: Math.max(0, Math.min(GRID_SIZE - item.width,
        Math.round((oldPosition.x + oldItem.width / 2) * 2 - item.width / 2))),
      y: Math.max(0, Math.min(GRID_SIZE - item.depth,
        Math.round((oldPosition.y + oldItem.depth / 2) * 2 - item.depth / 2))),
    };
    const candidates = [];
    for (let y = 0; y <= GRID_SIZE - item.depth; y++) {
      for (let x = 0; x <= GRID_SIZE - item.width; x++) candidates.push({ x, y });
    }
    const distance = point => (point.x - desired.x) ** 2 + (point.y - desired.y) ** 2;
    candidates.sort((a, b) => distance(a) - distance(b) || a.y - b.y || a.x - b.x);
    const next = candidates.find(candidate => [...RESERVED_AREAS, ...FLOOR_FEATURES].every(area => !overlaps(candidate, item, area, area))
      && FURNITURE.every(other => !migrated[other.id]
        || !overlaps(candidate, item, migrated[other.id], other)));
    if (!next) return null;
    migrated[item.id] = next;
  }
  return migrated;
}

/** Reject an invalid saved room as a whole, returning a fresh set of defaults. */
export function normalizeLayout(input) {
  if (!hasExactKeys(input, ['version', 'items'])) return cloneLayout(DEFAULT_LAYOUT);
  if (input.version === 2) return migrateLegacy(input.items) || cloneLayout(DEFAULT_LAYOUT);
  if (input.version !== LAYOUT_VERSION
    || !hasValidPositions(input.items)
    || !FURNITURE.every(item => canPlace(input.items, item.id, input.items[item.id].x, input.items[item.id].y))) {
    return cloneLayout(DEFAULT_LAYOUT);
  }
  // A saved room that still matches an earlier default arrangement was never really
  // rearranged, so it follows the current default.
  if (PREVIOUS_DEFAULTS.some(previous => FURNITURE.every(item => {
    const position = { ...item.default, ...previous }[item.id] || item.default;
    return input.items[item.id].x === position.x && input.items[item.id].y === position.y;
  }))) return cloneLayout(DEFAULT_LAYOUT);
  return cloneLayout(input.items);
}

/**
 * Back-to-front drawing order. A piece is behind another when it lies entirely on the
 * far side of it along one floor axis (and not on the near side along the other).
 * Summing corners alone fails for long desks beside small objects.
 */
export function paintOrder(layout, furniture = FURNITURE) {
  const boxes = furniture.filter(item => layout[item.id]).map(item => ({ id: item.id, x: layout[item.id].x, y: layout[item.id].y, w: item.width, d: item.depth }));
  const behind = (a, b) => {
    const xBehind = a.x + a.w <= b.x, yBehind = a.y + a.d <= b.y;
    const xFront = b.x + b.w <= a.x, yFront = b.y + b.d <= a.y;
    return (xBehind && !yFront) || (yBehind && !xFront);
  };
  const depth = box => box.x + box.w / 2 + box.y + box.d / 2;
  const before = new Map(boxes.map(box => [box.id, new Set()]));
  for (const a of boxes) for (const b of boxes) if (a !== b && behind(a, b)) before.get(b.id).add(a.id);
  const order = [];
  const placed = new Set();
  while (order.length < boxes.length) {
    // Draw the farthest piece whose dependencies are all drawn; break any cycle by depth.
    const ready = boxes.filter(box => !placed.has(box.id) && [...before.get(box.id)].every(id => placed.has(id)));
    const pool = ready.length ? ready : boxes.filter(box => !placed.has(box.id));
    const next = pool.reduce((best, box) => depth(box) < depth(best) ? box : best);
    order.push(next.id); placed.add(next.id);
  }
  return order;
}

/** Serialize only validated positions in the versioned browser-storage format. */
export function serializeLayout(layout) {
  return JSON.stringify({ version: LAYOUT_VERSION, items: normalizeLayout({ version: LAYOUT_VERSION, items: layout }) });
}
