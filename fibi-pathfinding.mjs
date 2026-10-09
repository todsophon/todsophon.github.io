import { GRID_SIZE, FURNITURE, RESERVED_AREAS, tileToScreen } from './room-layout.mjs?v=69';

// A small, conservative square around Fibi's feet keeps the sprite off furniture.
export const WALKING_CLEARANCE = 0.35;
const EPSILON = 1e-8;
const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const validPoint = point => point && Number.isFinite(point.x) && Number.isFinite(point.y);
const samePoint = (a, b) => Math.abs(a.x - b.x) < EPSILON && Math.abs(a.y - b.y) < EPSILON;

function obstaclesFor(layout) {
  if (!layout || FURNITURE.some(item => !validPoint(layout[item.id]))) return null;
  return [...RESERVED_AREAS, ...FURNITURE.filter(item => !item.retired).map(item => ({ ...layout[item.id], width: item.width, depth: item.depth }))]
    .map(area => ({
      left: area.x - WALKING_CLEARANCE,
      right: area.x + area.width + WALKING_CLEARANCE,
      top: area.y - WALKING_CLEARANCE,
      bottom: area.y + area.depth + WALKING_CLEARANCE,
    }));
}

function pointIsClear(obstacles, point) {
  return Boolean(obstacles && validPoint(point)
    && point.x >= WALKING_CLEARANCE && point.y >= WALKING_CLEARANCE
    && point.x <= GRID_SIZE - WALKING_CLEARANCE && point.y <= GRID_SIZE - WALKING_CLEARANCE
    && obstacles.every(box => point.x < box.left || point.x > box.right
      || point.y < box.top || point.y > box.bottom));
}

/** Whether Fibi's feet and clearance fit on the floor at a fractional grid position. */
export function isWalkable(layout, point) {
  return pointIsClear(obstaclesFor(layout), point);
}

function screenDistance(a, b) {
  const first = tileToScreen(a.x, a.y);
  const second = tileToScreen(b.x, b.y);
  return Math.hypot(first.x - second.x, first.y - second.y);
}

// Exact segment/rectangle clipping avoids tunneling through furniture between cells.
function intersectsBox(start, end, box) {
  let enter = 0;
  let leave = 1;
  for (const [axis, minimum, maximum] of [['x', box.left, box.right], ['y', box.top, box.bottom]]) {
    const delta = end[axis] - start[axis];
    if (Math.abs(delta) < EPSILON) {
      if (start[axis] < minimum || start[axis] > maximum) return false;
      continue;
    }
    const first = (minimum - start[axis]) / delta;
    const last = (maximum - start[axis]) / delta;
    enter = Math.max(enter, Math.min(first, last));
    leave = Math.min(leave, Math.max(first, last));
    if (enter > leave) return false;
  }
  return true;
}

function segmentIsClear(obstacles, start, end) {
  return pointIsClear(obstacles, start) && pointIsClear(obstacles, end)
    && obstacles.every(box => !intersectsBox(start, end, box));
}

function makeGrid(layout) {
  const obstacles = obstaclesFor(layout);
  const nodes = new Map();
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const point = { x: x + 0.5, y: y + 0.5 };
      if (pointIsClear(obstacles, point)) nodes.set(y * GRID_SIZE + x, point);
    }
  }
  return { obstacles, nodes };
}

function nearestEntry(nodes, point, predicate = () => true) {
  let result = null;
  let minimum = Infinity;
  for (const entry of nodes) {
    const distance = screenDistance(entry[1], point);
    if (distance < minimum - EPSILON && predicate(entry[1])) {
      minimum = distance;
      result = entry;
    }
  }
  return result;
}

/** Closest free cell center in the room, for deliberate recovery after furniture moves. */
export function nearestWalkable(layout, point) {
  if (!validPoint(point)) return null;
  return nearestEntry(makeGrid(layout).nodes, point)?.[1] ?? null;
}

function neighbors(grid, key) {
  const current = grid.nodes.get(key);
  const result = [];
  for (const [dx, dy] of directions) {
    const x = Math.floor(current.x) + dx;
    const y = Math.floor(current.y) + dy;
    if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) continue;
    const nextKey = y * GRID_SIZE + x;
    const next = grid.nodes.get(nextKey);
    if (!next) continue;
    if (dx && dy && (!grid.nodes.has(Math.floor(current.y) * GRID_SIZE + x)
      || !grid.nodes.has(y * GRID_SIZE + Math.floor(current.x)))) continue;
    if (segmentIsClear(grid.obstacles, current, next)) result.push(nextKey);
  }
  return result;
}

function explore(layout, start) {
  const grid = makeGrid(layout);
  if (!pointIsClear(grid.obstacles, start)) return null;
  const initial = nearestEntry(grid.nodes, start, point => segmentIsClear(grid.obstacles, start, point));
  if (!initial) return null;
  const firstKey = initial[0];
  const distances = new Map([[firstKey, 0]]);
  const parents = new Map();
  const pending = new Set([firstKey]);
  while (pending.size) {
    let current;
    for (const key of pending) {
      if (current === undefined || distances.get(key) < distances.get(current)) current = key;
    }
    pending.delete(current);
    for (const next of neighbors(grid, current)) {
      const distance = distances.get(current) + screenDistance(grid.nodes.get(current), grid.nodes.get(next));
      if (distance < (distances.get(next) ?? Infinity) - EPSILON) {
        distances.set(next, distance);
        parents.set(next, current);
        pending.add(next);
      }
    }
  }
  return { ...grid, firstKey, distances, parents };
}

/** All cell centers reachable from a valid position; never crosses a disconnected island. */
export function reachableTiles(layout, start) {
  const explored = explore(layout, start);
  if (!explored) return [];
  return [...explored.distances.keys()].map(key => ({ ...explored.nodes.get(key) }));
}

function simplifyPath(obstacles, points) {
  const result = [points[0]];
  let current = 0;
  while (current < points.length - 1) {
    let next = points.length - 1;
    while (next > current + 1 && !segmentIsClear(obstacles, points[current], points[next])) next--;
    result.push(points[next]);
    current = next;
  }
  return result;
}

/**
 * A continuous, collision-safe route, including start and the destination cell center.
 * Blocked goals resolve to the closest reachable center. Clear but unreachable goals,
 * invalid inputs, and blocked starts return []; call nearestWalkable to recover a start.
 */
export function findPath(layout, start, goal) {
  if (!validPoint(goal)) return [];
  const explored = explore(layout, start);
  if (!explored) return [];
  let target;
  if (pointIsClear(explored.obstacles, goal)) {
    target = nearestEntry(explored.nodes, goal, point => segmentIsClear(explored.obstacles, goal, point));
    if (!target || !explored.distances.has(target[0])) return [];
  } else {
    const reachable = new Map([...explored.distances.keys()].map(key => [key, explored.nodes.get(key)]));
    target = nearestEntry(reachable, goal);
  }
  if (!target) return [];
  const reversed = [];
  for (let key = target[0]; key !== undefined; key = explored.parents.get(key)) {
    reversed.push({ ...explored.nodes.get(key) });
  }
  const points = reversed.reverse();
  if (!samePoint(start, points[0])) points.unshift({ ...start });
  return simplifyPath(explored.obstacles, points);
}
