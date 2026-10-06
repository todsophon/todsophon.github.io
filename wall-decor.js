import { WALL_ITEMS, WALL_STORAGE_KEY, wallMatrix, sceneToWall, wallToScene, wallSpan, slideTo, defaultWallState, normalizeWallState, canHang } from './wall-layout.mjs?v=63';

const SCENE_WIDTH = 1000;
const SCENE_HEIGHT = 2000 / 3;
const DRAG_START = { mouse: 5, touch: 9 };
const TAGS = { silver: '100K', gold: '1M', pinboard: 'Oto projects', portrait: 'Meet Tod' };

/**
 * The awards, the portrait and the pinboard hang on the walls with the walls' own
 * perspective. Each can be dragged (or moved with the arrow keys) along its wall;
 * a short tap still opens its story. Positions are saved in this browser.
 */
export function createWallDecor({ stage, onChange = () => {} }) {
  const elements = new Map();
  const tags = new Map();
  const items = new Map(WALL_ITEMS.map(item => [item.id, item]));
  let state = defaultWallState();
  let pointer = null;
  let suppressClickUntil = 0;
  try { state = normalizeWallState(JSON.parse(localStorage.getItem(WALL_STORAGE_KEY))); } catch { /* Defaults for this visit. */ }

  for (const element of stage.querySelectorAll('[data-wall-item]')) {
    const item = items.get(element.dataset.wallItem);
    if (!item) continue;
    elements.set(item.id, element);
    // A name tag that sits above the piece without taking on the wall's perspective.
    if (TAGS[item.id]) {
      const tag = document.createElement('span');
      tag.className = 'room-tag wall-tag';
      tag.textContent = TAGS[item.id];
      tag.setAttribute('aria-hidden', 'true');
      stage.append(tag);
      tags.set(item.id, tag);
    }
    // The element's own box is its flat texture; the matrix lays it onto the wall.
    element.style.width = `${element.dataset.w}px`;
    element.style.height = `${element.dataset.h}px`;
    const handle = element.matches('button') ? element : element.querySelector('.pinboard-frame');
    handle.addEventListener('pointerdown', event => start(event, item, handle));
    handle.addEventListener('pointermove', event => move(event, item));
    handle.addEventListener('pointerup', event => finish(event, item));
    handle.addEventListener('pointercancel', event => finish(event, item, true));
    handle.addEventListener('lostpointercapture', event => finish(event, item, true));
    handle.addEventListener('dragstart', event => event.preventDefault());
    handle.addEventListener('keydown', event => nudge(event, item));
  }

  function render(id) {
    for (const item of WALL_ITEMS) {
      if (id && item.id !== id) continue;
      const element = elements.get(item.id);
      if (element) element.style.transform = wallMatrix(item, state[item.id], +element.dataset.w, +element.dataset.h);
      const tag = tags.get(item.id);
      if (tag) {
        const { du } = wallSpan(item), top = wallToScene(item.wall, state[item.id].u + du / 2, state[item.id].v);
        tag.style.left = `${top.x / SCENE_WIDTH * 100}%`;
        tag.style.top = `${top.y / SCENE_HEIGHT * 100}%`;
      }
    }
  }
  function syncTags() {
    const asleep = stage.classList.contains('reveal-active');
    for (const [id, tag] of tags) tag.classList.toggle('is-awake', !asleep || elements.get(id).classList.contains('is-painted'));
  }
  document.addEventListener('room:awake-changed', syncTags);
  function save(message = 'Wall arrangement saved on this browser') {
    try { localStorage.setItem(WALL_STORAGE_KEY, JSON.stringify(state)); } catch { message = 'Moved · saving is unavailable in this browser'; }
    onChange(message);
  }
  function wallPoint(event, item) {
    const rect = stage.getBoundingClientRect();
    return sceneToWall(item.wall, (event.clientX - rect.left) / rect.width * SCENE_WIDTH, (event.clientY - rect.top) / rect.height * SCENE_HEIGHT);
  }
  function start(event, item, handle) {
    if (event.button !== 0 || !event.isPrimary || pointer) return;
    const grab = wallPoint(event, item), at = state[item.id];
    pointer = { id: event.pointerId, item, x: event.clientX, y: event.clientY, offset: { u: grab.u - at.u, v: grab.v - at.v }, original: { ...at }, dragging: false };
    try { handle.setPointerCapture(event.pointerId); } catch { /* Synthetic or already-released pointers. */ }
  }
  function move(event, item) {
    if (!pointer || pointer.id !== event.pointerId || pointer.item !== item) return;
    if (!pointer.dragging) {
      if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) < DRAG_START[event.pointerType === 'touch' ? 'touch' : 'mouse']) return;
      pointer.dragging = true;
      elements.get(item.id).classList.add('is-wall-dragging');
      stage.classList.add('is-moving-wall-decor');
    }
    event.preventDefault();
    const at = wallPoint(event, item);
    state[item.id] = slideTo(state, item.id, state[item.id], { u: at.u - pointer.offset.u, v: at.v - pointer.offset.v });
    render(item.id);
  }
  function finish(event, item, cancelled = false) {
    if (!pointer || pointer.id !== event.pointerId || pointer.item !== item) return;
    const { dragging, original } = pointer;
    pointer = null;
    elements.get(item.id).classList.remove('is-wall-dragging');
    stage.classList.remove('is-moving-wall-decor');
    if (!dragging) return;
    suppressClickUntil = performance.now() + 500;
    if (cancelled) { state[item.id] = original; render(item.id); return; }
    const moved = state[item.id].u !== original.u || state[item.id].v !== original.v;
    if (moved) { const after = { ...state[item.id] }; state[item.id] = original; document.dispatchEvent(new CustomEvent('wall:before-change')); state[item.id] = after; save(); }
  }
  function nudge(event, item) {
    const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!direction) return;
    event.preventDefault();
    const step = event.shiftKey ? .05 : .015, from = state[item.id];
    const next = slideTo(state, item.id, from, { u: from.u + direction[0] * step, v: from.v + direction[1] * step });
    if (next.u === from.u && next.v === from.v) return;
    document.dispatchEvent(new CustomEvent('wall:before-change'));
    state[item.id] = next; render(item.id); save();
  }
  // A drop never opens a story. Capture runs before the room's own click handling.
  document.addEventListener('click', event => {
    if (event.target.closest?.('[data-wall-item]') && performance.now() < suppressClickUntil) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  window.addEventListener('storage', event => {
    if (event.key !== WALL_STORAGE_KEY) return;
    try { state = normalizeWallState(JSON.parse(event.newValue)); } catch { state = defaultWallState(); }
    render();
  });
  render();
  syncTags();

  return {
    getState: () => structuredClone(state),
    setState(next) { state = normalizeWallState(next); render(); save('Previous arrangement restored'); },
    reset() { state = defaultWallState(); render(); save('Original arrangement restored'); },
    isDefault: () => JSON.stringify(state) === JSON.stringify(defaultWallState()),
    canHang: (id, position) => canHang(state, id, position),
  };
}
