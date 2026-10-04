import { GRID_SIZE, STORAGE_KEY, LEGACY_STORAGE_KEY, FURNITURE, DEFAULT_LAYOUT, FLOOR_QUAD, tileToScreen, screenToTile, snapPlacement, snapDraggedPlacement, canPlace, nearbyOpenPlacement, normalizeLayout, serializeLayout, paintOrder } from './room-layout.mjs?v=41';
import { createRoomCompanion } from './fibi.js?v=41';
import { createGuidedTour } from './guided-tour.js?v=41';
import { createFloorKeyboard } from './floor-keyboard.js?v=41';

const stage = document.querySelector('#scene');
const tiles = document.querySelector('#floor-tiles');
const preview = document.querySelector('#placement-preview');
const layer = document.querySelector('#furniture-layer');
const wallPortrait = document.querySelector('.wall-portrait');
const arrangeButton = document.querySelector('#arrange-toggle');
const editor = document.querySelector('#room-editor');
const controls = document.querySelector('#placement-controls');
const status = document.querySelector('#room-save-status');
const feedback = document.querySelector('#placement-feedback');
const placeButton = document.querySelector('#place-furniture');
const undoButton = document.querySelector('#undo-room');
const NS = 'http://www.w3.org/2000/svg';
const clone = value => JSON.parse(JSON.stringify(value));
const WALL_STORAGE_KEY = 'todsophon.wall-portrait.v1';
const DEFAULT_WALL_POSITION = { x: 83, y: 23.5 };
const SCENE_WIDTH = 1000;
const SCENE_HEIGHT = 2000 / 3;
const artWidths = { youtube: 290, oto: 290, bookshelf: 180, plant: 98, chair: 165, tiktok: 60 };
// The projected tile center meets the center of the feet, not the frontmost foot.
const groundAnchors = { youtube: 78, oto: 77, bookshelf: 80, plant: 95, chair: 86, tiktok: 96 };
const groundCenters = { youtube: 51.3, oto: 49.1, bookshelf: 56, plant: 57, chair: 50, tiktok: 50 };
// Match both ground-plane directions to the room's 2:1 projection while keeping
// upright edges vertical. Each source illustration has a different camera angle.
// y' = shear * x + scale * y; the origin stays pinned to the feet during a move.
const artPerspective = {
  youtube: [1, -.138, 0, 1.064, 0, 0],
  oto: [1, .163, 0, .962, 0, 0],
  bookshelf: [1, -.091, 0, 1.136, 0, 0],
};
// Measured atlas windows preserve each object's silhouette without editing the source.
const atlasWindows = {
  youtube: [20, 40, 525, 491], oto: [548, 50, 510, 482], bookshelf: [1070, 50, 435, 455],
  plant: [0, 0, 494, 799], chair: [330, 80, 880, 860], tiktok: [0, 0, 259, 822],
};
// Pieces drawn outside the shared furniture atlas: [image, width, height].
const spriteSources = {
  chair: ['assets/lounge-chair.png', 1536, 1024],
  oto: ['assets/oto-furniture-atlas-v3.png', 1536, 1024],
  plant: ['assets/chart-easel.webp', 494, 799],
  tiktok: ['assets/ring-light.webp', 259, 822],
};
const labels = { youtube: 'YouTube', oto: 'Oto / Frisson Labs', bookshelf: 'Record cabinet', tiktok: 'TikTok', plant: 'Analytics', chair: 'Watch films' };
const accessibleLabel = (item, arranging = false) => arranging ? `Move ${item.label}` : item.action === 'screening' ? 'Watch films from the screening chair' : `Explore ${item.label}`;
const pieces = new Map();
let layout = clone(DEFAULT_LAYOUT);
let editing = false;
let guide;
let tour;
let selectedId = null;
let pending = null;
let pointer = null;
let suppressClick = { id: null, until: 0 };
let wallSuppressClickUntil = 0;
let wallPointer = null;
let wallPosition = { ...DEFAULT_WALL_POSITION };
const history = [];

const snapWall = value => Math.round(value * 2) / 2;
function normalizeWallPosition(value) {
  if (!Number.isFinite(value?.x) || !Number.isFinite(value?.y)) return { ...DEFAULT_WALL_POSITION };
  // The clear strip between the pinboard and the wall's end keeps the portrait visible after a drop.
  const x = snapWall(Math.max(82, Math.min(84.5, value.x)));
  const minY = 12 + (x - 70) * .5;
  const maxY = 26 - (x - 84) * .25;
  return { x, y: snapWall(Math.max(minY, Math.min(maxY, value.y))) };
}
function renderWallPosition(value = wallPosition) {
  wallPortrait.style.left = `${value.x}%`;
  wallPortrait.style.top = `${value.y}%`;
}
function saveWallPosition(message = 'Wall photo saved on this browser') {
  try { localStorage.setItem(WALL_STORAGE_KEY, JSON.stringify(wallPosition)); status.textContent = message; status.classList.remove('unsaved'); }
  catch { status.textContent = 'Photo moved · saving unavailable in this browser'; status.classList.add('unsaved'); }
}
function rememberLayout() {
  history.push({ layout: clone(layout), wall: { ...wallPosition } });
  if (history.length > 30) history.shift();
  undoButton.disabled = false;
}

try {
  const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
  if (saved) layout = normalizeLayout(JSON.parse(saved));
} catch { status.textContent = 'Layout available for this visit'; status.classList.add('unsaved'); }
try {
  const savedWall = JSON.parse(localStorage.getItem(WALL_STORAGE_KEY));
  // Move only the old default; keep visitors' custom wall arrangements.
  wallPosition = savedWall?.x === 84.5 && savedWall?.y === 29
    ? { ...DEFAULT_WALL_POSITION } : normalizeWallPosition(savedWall);
}
catch { wallPosition = { ...DEFAULT_WALL_POSITION }; }
renderWallPosition();

function polygonFor(x, y) {
  return [[x,y],[x+1,y],[x+1,y+1],[x,y+1]].map(([a,b]) => { const p = tileToScreen(a,b); return `${p.x},${p.y}`; }).join(' ');
}
for (let y = 0; y < GRID_SIZE; y++) for (let x = 0; x < GRID_SIZE; x++) {
  const polygon = document.createElementNS(NS, 'polygon');
  polygon.setAttribute('points', polygonFor(x, y));
  polygon.setAttribute('class', `floor-tile${(x + y) % 2 ? ' alternate' : ''}`);
  polygon.dataset.x = x; polygon.dataset.y = y;
  tiles.append(polygon);
}

function positionPiece(item, position) {
  const p = tileToScreen(position.x + item.width / 2, position.y + item.depth / 2);
  const element = pieces.get(item.id);
  element.style.left = `${p.x / SCENE_WIDTH * 100}%`;
  element.style.top = `${p.y / SCENE_HEIGHT * 100}%`;
  element.dataset.x = layout[item.id].x;
  element.dataset.y = layout[item.id].y;
}
// Back-to-front order, spaced so Fibi can slot between any two pieces.
function applyOrder() {
  const positions = { ...layout };
  if (selectedId && pending) positions[selectedId] = pending;
  paintOrder(positions).forEach((id, index) => { pieces.get(id).style.zIndex = String(20 + index * 20); });
}
function render() {
  applyOrder();
  for (const item of FURNITURE) {
    positionPiece(item, selectedId === item.id && pending ? pending : layout[item.id]);
    pieces.get(item.id).classList.toggle('is-selected', item.id === selectedId);
    if (item.id !== selectedId) pieces.get(item.id).classList.remove('is-invalid');
    pieces.get(item.id).querySelector('button').setAttribute('aria-pressed', String(item.id === selectedId));
  }
  undoButton.disabled = history.length === 0;
  guide?.syncLayout();
  drawPreview();
}
function save(message = 'Saved on this browser') {
  try { localStorage.setItem(STORAGE_KEY, serializeLayout(layout)); status.textContent = message; status.classList.remove('unsaved'); }
  catch { status.textContent = 'Moved · saving unavailable in this browser'; status.classList.add('unsaved'); }
}
function announce(message, invalid = false) { feedback.textContent = message; feedback.classList.toggle('invalid', invalid); }
function setEditing(value) {
  if (value) tour?.pause();
  editing = value;
  stage.classList.toggle('is-arranging', value);
  arrangeButton.setAttribute('aria-pressed', String(value));
  arrangeButton.innerHTML = value ? '<span aria-hidden="true">✓</span> Done arranging' : '<span aria-hidden="true">⤧</span> Arrange room';
  editor.hidden = !value;
  guide?.editingChanged();
  if (!value) cancelSelection();
  for (const item of FURNITURE) {
    pieces.get(item.id).querySelector('button').setAttribute('aria-label', accessibleLabel(item, value));
  }
}
function select(id, position = layout[id]) {
  selectedId = id; pending = { ...position };
  document.querySelector('#selected-furniture').textContent = FURNITURE.find(item => item.id === id).label;
  controls.hidden = false;
  render();
}
function cancelSelection() {
  if (pointer) { pointer = null; }
  selectedId = null; pending = null; controls.hidden = true;
  document.querySelector('#selected-furniture').textContent = 'Make it yours';
  for (const element of pieces.values()) element.classList.remove('is-dragging', 'is-invalid');
  announce('Choose a piece to start.'); render();
}
function drawPreview() {
  preview.replaceChildren();
  if (!selectedId || !pending) { placeButton.disabled = true; return; }
  const item = FURNITURE.find(item => item.id === selectedId);
  const valid = canPlace(layout, selectedId, pending.x, pending.y);
  const { x, y } = pending;
  // Match the visible ghost and its floor cells exactly, as in Cozy Corner.
  // Only the selected footprint is revealed; the rest of the room stays clear.
  for (let row = y; row < y + item.depth; row++) {
    for (let col = x; col < x + item.width; col++) {
      const cell = document.createElementNS(NS, 'polygon');
      cell.setAttribute('points', polygonFor(col, row));
      cell.setAttribute('class', `placement-cell${valid ? '' : ' invalid'}`);
      preview.append(cell);
    }
  }
  const corners = [[x,y],[x+item.width,y],[x+item.width,y+item.depth],[x,y+item.depth]];
  const polygon = document.createElementNS(NS, 'polygon');
  polygon.setAttribute('points', corners.map(([a,b]) => { const p = tileToScreen(a,b); return `${p.x},${p.y}`; }).join(' '));
  polygon.setAttribute('class', `placement-tile${valid ? '' : ' invalid'}`);
  preview.append(polygon);
  pieces.get(selectedId).classList.toggle('is-invalid', !valid);
  placeButton.disabled = !valid;
  const message = valid
    ? pointer?.dragging ? 'Release to place. Snapped to the floor.' : 'Ready to place. Drag or use the arrows to move.'
    : 'That spot is occupied. Move to a clear space.';
  // Avoid repeating live-region announcements on every pointermove.
  if (feedback.textContent !== message) announce(message, !valid);
}
function animatePiece(id, className) {
  const element = pieces.get(id);
  element.classList.remove('placed', 'shake');
  // Starting the class on the next frame lets consecutive drops replay the spring.
  requestAnimationFrame(() => element.classList.add(className));
}
function showLanding(item, position) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const { x, y } = position;
  const polygon = document.createElementNS(NS, 'polygon');
  const corners = [[x,y],[x+item.width,y],[x+item.width,y+item.depth],[x,y+item.depth]];
  polygon.setAttribute('points', corners.map(([a,b]) => { const p = tileToScreen(a,b); return `${p.x},${p.y}`; }).join(' '));
  polygon.setAttribute('class', 'placement-confirmation');
  preview.append(polygon);
  polygon.addEventListener('animationend', () => polygon.remove(), { once: true });
}
function commit() {
  if (!selectedId || !pending) return false;
  const id = selectedId;
  if (!canPlace(layout, id, pending.x, pending.y)) { animatePiece(id, 'shake'); return false; }
  const moved = layout[id].x !== pending.x || layout[id].y !== pending.y;
  if (moved) {
    rememberLayout();
    layout[id] = { ...pending }; save();
  }
  pending = null;
  render(); animatePiece(id, 'placed');
  if (moved) showLanding(FURNITURE.find(item => item.id === id), layout[id]);
  if (moved) document.dispatchEvent(new CustomEvent('room:placed', { detail: { id } }));
  announce(moved ? 'A perfect fit. Select another piece, or keep arranging this one.' : 'This piece is already here.');
  return true;
}
function pointInRoom(event) {
  const rect = stage.getBoundingClientRect();
  return { x: (event.clientX - rect.left) / rect.width * SCENE_WIDTH, y: (event.clientY - rect.top) / rect.height * SCENE_HEIGHT };
}
function startPointer(event, item) {
  if (event.button !== 0 || !event.isPrimary) return;
  if (pointer) return;
  event.currentTarget.focus({ preventScroll: true });
  if (selectedId && selectedId !== item.id) cancelSelection();
  const p = pointInRoom(event);
  pointer = { id: item.id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, start: screenToTile(p.x, p.y), original: { ...(selectedId === item.id && pending ? pending : layout[item.id]) }, dragging: false };
  event.currentTarget.setPointerCapture(event.pointerId);
}
function movePointer(event, item) {
  if (!pointer || pointer.pointerId !== event.pointerId || pointer.id !== item.id) return;
  if (!pointer.dragging && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) < (event.pointerType === 'touch' ? 10 : 6)) return;
  event.preventDefault();
  if (!pointer.dragging) {
    pointer.dragging = true; setEditing(true); select(item.id, pointer.original);
    // Opening the editor can reflow the page; measure the original grab against its new bounds.
    const startPoint = pointInRoom({ clientX: pointer.x, clientY: pointer.y });
    pointer.start = screenToTile(startPoint.x, startPoint.y);
    pieces.get(item.id).classList.remove('placed', 'shake');
    pieces.get(item.id).classList.add('is-dragging');
  }
  const p = pointInRoom(event), tile = screenToTile(p.x, p.y);
  const target = snapDraggedPlacement(item.id, pointer.original, pointer.start, tile, pending);
  const snapped = nearbyOpenPlacement(layout, item.id, target) || target;
  if (!snapped || (pending && pending.x === snapped.x && pending.y === snapped.y)) return;
  pending = snapped;
  // The furniture itself travels cell-by-cell, instead of floating between the
  // preview and its final position. Keep the original grab point under the hand.
  positionPiece(item, pending);
  applyOrder();
  drawPreview();
}
function finishPointer(event, item, cancelled = false) {
  if (!pointer || pointer.pointerId !== event.pointerId || pointer.id !== item.id) return;
  const dragged = pointer.dragging;
  pointer = null;
  pieces.get(item.id).classList.remove('is-dragging');
  if (!dragged) return;
  suppressClick = { id: item.id, until: performance.now() + 450 };
  if (cancelled || !commit()) {
    pending = null;
    pieces.get(item.id).classList.remove('is-invalid');
    render(); animatePiece(item.id, 'shake');
    announce(cancelled ? 'Move cancelled. Your arrangement is unchanged.' : 'No room there. Back to its previous spot.', !cancelled);
  }
}
function nudge(dx, dy) {
  if (!selectedId) return;
  const from = pending || layout[selectedId];
  pending = { x: Math.max(-1, Math.min(GRID_SIZE, from.x + dx)), y: Math.max(-1, Math.min(GRID_SIZE, from.y + dy)) };
  render();
}

for (const item of FURNITURE) {
  const piece = document.createElement('div');
  piece.className = 'furniture-piece'; piece.dataset.furniture = item.id;
  if (item.chapter) piece.dataset.chapter = item.chapter;
  if (item.action) piece.dataset.action = item.action;
  piece.style.width = `${artWidths[item.id] / 10}%`;
  piece.style.setProperty('--ground-anchor', `${groundAnchors[item.id]}%`);
  piece.style.setProperty('--ground-center', `${groundCenters[item.id]}%`);
  const [cropX, cropY, cropWidth, cropHeight] = atlasWindows[item.id];
  piece.style.aspectRatio = `${cropWidth} / ${cropHeight}`;
  const hit = document.createElement('button'); hit.type = 'button'; hit.className = 'furniture-hit';
  hit.setAttribute('aria-label', accessibleLabel(item));
  hit.setAttribute('aria-describedby', 'room-instructions');
  hit.setAttribute('aria-pressed', 'false');
  const art = document.createElement('span'); art.className = 'furniture-art'; art.setAttribute('aria-hidden', 'true');
  // Keep perspective on a separate layer so dragging/landing never resets it.
  const sprite = document.createElement('span'); sprite.className = 'furniture-sprite';
  const [source, sourceWidth, sourceHeight] = spriteSources[item.id] || [null, 1536, 1024];
  if (source) sprite.style.backgroundImage = `url('${source}')`;
  if (artPerspective[item.id]) piece.style.setProperty('--furniture-perspective', `matrix(${artPerspective[item.id].join(',')})`);
  sprite.style.backgroundSize = `${sourceWidth / cropWidth * 100}% ${sourceHeight / cropHeight * 100}%`;
  const offset = (start, size, total) => total === size ? 0 : start / (total - size) * 100;
  sprite.style.backgroundPosition = `${offset(cropX, cropWidth, sourceWidth)}% ${offset(cropY, cropHeight, sourceHeight)}%`;
  art.append(sprite);
  const label = document.createElement('span'); label.className = 'furniture-label'; label.textContent = labels[item.id]; label.setAttribute('aria-hidden', 'true');
  hit.append(label); piece.append(hit, art); layer.append(piece); pieces.set(item.id, piece);
  hit.addEventListener('pointerdown', event => startPointer(event, item));
  hit.addEventListener('pointermove', event => movePointer(event, item));
  hit.addEventListener('pointerup', event => finishPointer(event, item));
  hit.addEventListener('pointercancel', event => finishPointer(event, item, true));
  hit.addEventListener('lostpointercapture', event => finishPointer(event, item, true));
  hit.addEventListener('dragstart', event => event.preventDefault());
  hit.addEventListener('click', () => {
    if (suppressClick.id === item.id && performance.now() < suppressClick.until) return;
    if (editing) select(item.id);
    else if (item.action === 'screening') document.dispatchEvent(new CustomEvent('portfolio:request-screening', { detail: { source: hit } }));
    else document.dispatchEvent(new CustomEvent('room:open-chapter', { detail: { chapter: item.chapter } }));
  });
  hit.addEventListener('keydown', event => {
    if (!editing) return;
    const directions = { ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1] };
    if (directions[event.key]) { event.preventDefault(); if (selectedId !== item.id) select(item.id); nudge(...directions[event.key]); }
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); if (selectedId === item.id && pending) commit(); else select(item.id);
    }
    else if (event.key === 'Escape') { event.preventDefault(); cancelSelection(); }
  });
}

wallPortrait.addEventListener('pointerdown', event => {
  if (event.button !== 0 || !event.isPrimary || wallPointer) return;
  wallPortrait.focus({ preventScroll: true });
  wallPointer = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, original: { ...wallPosition }, current: { ...wallPosition }, dragging: false };
  wallPortrait.setPointerCapture(event.pointerId);
});
wallPortrait.addEventListener('pointermove', event => {
  if (!wallPointer || wallPointer.pointerId !== event.pointerId) return;
  const dx = event.clientX - wallPointer.startX, dy = event.clientY - wallPointer.startY;
  if (!wallPointer.dragging && Math.hypot(dx, dy) < (event.pointerType === 'touch' ? 10 : 6)) return;
  event.preventDefault();
  if (!wallPointer.dragging) { wallPointer.dragging = true; wallPortrait.classList.add('is-wall-dragging'); }
  const rect = stage.getBoundingClientRect();
  wallPointer.current = normalizeWallPosition({ x: wallPointer.original.x + dx / rect.width * 100, y: wallPointer.original.y + dy / rect.height * 100 });
  renderWallPosition(wallPointer.current);
});
function finishWallPointer(event, cancelled = false) {
  if (!wallPointer || wallPointer.pointerId !== event.pointerId) return;
  const { original, current, dragging } = wallPointer;
  wallPointer = null;
  wallPortrait.classList.remove('is-wall-dragging');
  if (!dragging) return;
  wallSuppressClickUntil = performance.now() + 500;
  if (cancelled) { renderWallPosition(); return; }
  if (current.x !== original.x || current.y !== original.y) {
    rememberLayout();
    wallPosition = current;
    saveWallPosition();
    announce('Meet Tod photo placed on the wall. You can undo this from Arrange room.');
  }
  renderWallPosition();
}
wallPortrait.addEventListener('pointerup', event => finishWallPointer(event));
wallPortrait.addEventListener('pointercancel', event => finishWallPointer(event, true));
wallPortrait.addEventListener('lostpointercapture', event => finishWallPointer(event, true));
wallPortrait.addEventListener('dragstart', event => event.preventDefault());
wallPortrait.addEventListener('keydown', event => {
  const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const direction = directions[event.key];
  if (!direction) return;
  event.preventDefault();
  const step = event.shiftKey ? 2 : .5;
  const next = normalizeWallPosition({ x: wallPosition.x + direction[0] * step, y: wallPosition.y + direction[1] * step });
  if (next.x === wallPosition.x && next.y === wallPosition.y) return;
  rememberLayout();
  wallPosition = next;
  renderWallPosition();
  saveWallPosition();
});

function placeSelectedOnFloor(event) {
  if (!editing || !selectedId) return;
  const item = FURNITURE.find(item => item.id === selectedId);
  const p = pointInRoom(event), tile = screenToTile(p.x, p.y);
  // Floor taps target the centre of the furniture, not its hidden back corner.
  const target = snapPlacement(selectedId, { x: tile.x - item.width / 2, y: tile.y - item.depth / 2 });
  pending = nearbyOpenPlacement(layout, selectedId, target) || target;
  render(); commit();
}
tiles.addEventListener('click', event => {
  if (event.target.matches('.floor-tile')) placeSelectedOnFloor(event);
});
// The painted floor runs slightly beyond the overlaid tile diamonds at its corners.
stage.addEventListener('click', event => {
  if (event.target !== stage || !editing || !selectedId) return;
  const point = pointInRoom(event);
  const floor = [FLOOR_QUAD.back, FLOOR_QUAD.right, FLOOR_QUAD.front, FLOOR_QUAD.left];
  const crosses = floor.map(([x, y], index) => {
    const [nextX, nextY] = floor[(index + 1) % floor.length];
    return (nextX - x) * (point.y - y) - (nextY - y) * (point.x - x);
  });
  if (crosses.every(value => value >= 0) || crosses.every(value => value <= 0)) placeSelectedOnFloor(event);
});
arrangeButton.addEventListener('click', () => setEditing(!editing));
document.querySelector('#arrange-done')?.addEventListener('click', () => setEditing(false));
placeButton.addEventListener('click', commit);
document.querySelector('#cancel-placement').addEventListener('click', cancelSelection);
document.querySelectorAll('[data-nudge]').forEach(button => button.addEventListener('click', () => nudge(...button.dataset.nudge.split(',').map(Number))));
undoButton.addEventListener('click', () => {
  if (!history.length) return;
  cancelSelection();
  const previous = history.pop();
  layout = previous.layout; wallPosition = previous.wall;
  renderWallPosition(); render(); save('Previous arrangement restored'); saveWallPosition('Previous arrangement restored'); announce('Last change undone.');
});
document.querySelector('#reset-room').addEventListener('click', () => {
  cancelSelection();
  if (JSON.stringify(layout) === JSON.stringify(DEFAULT_LAYOUT) && wallPosition.x === DEFAULT_WALL_POSITION.x && wallPosition.y === DEFAULT_WALL_POSITION.y && !document.querySelector('.wall-pinboard')?.classList.contains('has-moved-notes')) { announce('The room is already in its original arrangement.'); return; }
  rememberLayout(); layout = clone(DEFAULT_LAYOUT); wallPosition = { ...DEFAULT_WALL_POSITION };
  document.dispatchEvent(new CustomEvent('room:reset'));
  renderWallPosition(); render(); save('Original arrangement restored'); saveWallPosition('Original arrangement restored'); announce('Room reset. You can undo this.');
});
document.addEventListener('keydown', event => { if (event.key === 'Escape' && selectedId && !document.querySelector('dialog').open) cancelSelection(); });
document.addEventListener('portfolio:chapter-open', () => { if (editing) setEditing(false); });
document.addEventListener('portfolio:screening', event => { if (event.detail.open && editing) setEditing(false); });
document.addEventListener('portfolio:view', event => { setEditing(false); arrangeButton.hidden = event.detail.showList; });
window.addEventListener('blur', () => { if (pointer) cancelSelection(); if (wallPointer) finishWallPointer({ pointerId: wallPointer.pointerId }, true); });
window.addEventListener('storage', event => {
  if (event.key === WALL_STORAGE_KEY) {
    try { wallPosition = normalizeWallPosition(JSON.parse(event.newValue)); }
    catch { wallPosition = { ...DEFAULT_WALL_POSITION }; }
    renderWallPosition(); history.length = 0; undoButton.disabled = true; status.textContent = 'Wall photo updated from another tab';
    return;
  }
  if (event.key !== STORAGE_KEY) return;
  cancelSelection();
  try { layout = normalizeLayout(event.newValue ? JSON.parse(event.newValue) : null); }
  catch { layout = clone(DEFAULT_LAYOUT); }
  history.length = 0; render(); status.textContent = 'Arrangement updated from another tab';
});
guide = createRoomCompanion({ stage, getLayout: () => layout, isEditing: () => editing });
const keyboard = createFloorKeyboard({ stage, guide });
tour = createGuidedTour({ stage, guide, keyboard });
let deliveringVisitClick = false;
stage.addEventListener('click', event => {
  if (event.target.closest?.('.wall-portrait') && performance.now() < wallSuppressClickUntil) {
    event.preventDefault(); event.stopImmediatePropagation(); return;
  }
  if (deliveringVisitClick || editing || event.defaultPrevented || event.button !== 0) return;
  const target = event.target.closest?.('.furniture-hit, .wall-award, .wall-portrait, .board-note');
  if (!target) return;
  const furnitureId = target.closest('.furniture-piece')?.dataset.furniture || null;
  if (furnitureId && suppressClick.id === furnitureId && performance.now() < suppressClick.until) return;
  if (tour.isAsleep(target)) {
    event.preventDefault();
    event.stopImmediatePropagation();
    guide.visitTarget({ target, furnitureId, quiet: true, onComplete: () => tour.wakeTarget(target) });
    return;
  }
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  tour.leave();
  guide.visitTarget({ target, furnitureId, onComplete: () => {
    tour.markSeen(target);
    deliveringVisitClick = true;
    try { target.click(); } finally { deliveringVisitClick = false; }
  } });
}, true);
render();
