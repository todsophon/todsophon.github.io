// Small, independent wall objects: each note has a story and a saved position.
const board = document.querySelector('.wall-pinboard');
const notes = [...board.querySelectorAll('.board-note')];
const saveStatus = document.querySelector('#room-save-status');
const KEY = 'todsophon.pinboard.v2';
// Polaroids are 22% × 50% of the board; positions keep them on the cork.
const defaults = { product: { x: 10, y: 8 }, community: { x: 40, y: 22 }, films: { x: 70, y: 34 } };
const positions = structuredClone(defaults);
let pointer = null;
let suppressClickUntil = 0;
const clamp = (value, max) => Math.max(0, Math.min(max, Math.round(value / 2) * 2));
function normalize(value) {
  return { x: clamp(Number(value?.x) || 0, 76), y: clamp(Number(value?.y) || 0, 46) };
}
function render(note) {
  const { x, y } = positions[note.dataset.note];
  note.style.left = `${x}%`;
  note.style.top = `${y}%`;
  board.classList.toggle('has-moved-notes', notes.some(item => {
    const position = positions[item.dataset.note];
    const original = defaults[item.dataset.note];
    return position.x !== original.x || position.y !== original.y;
  }));
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(positions)); saveStatus.textContent = 'Pinboard arrangement saved on this browser'; }
  catch { saveStatus.textContent = 'Notes moved · saving is unavailable here'; }
}
try {
  const stored = JSON.parse(localStorage.getItem(KEY));
  const oldDefaults = { product: { x: 10, y: 12 }, community: { x: 41, y: 32 }, films: { x: 70, y: 58 } };
  const untouched = notes.every(note => {
    const id = note.dataset.note;
    return !stored?.[id] || stored[id].x === oldDefaults[id].x && stored[id].y === oldDefaults[id].y;
  });
  if (!untouched) for (const note of notes) if (stored?.[note.dataset.note]) positions[note.dataset.note] = normalize(stored[note.dataset.note]);
} catch { /* The board remains usable without storage. */ }
notes.forEach(render);
for (const note of notes) {
  note.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary || pointer) return;
    note.focus({ preventScroll: true });
    pointer = { id: event.pointerId, note, x: event.clientX, y: event.clientY, original: { ...positions[note.dataset.note] }, moved: false };
    note.setPointerCapture(event.pointerId);
  });
  note.addEventListener('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId || pointer.note !== note) return;
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
    if (!pointer.moved && Math.hypot(dx, dy) < (event.pointerType === 'touch' ? 10 : 6)) return;
    pointer.moved = true;
    event.preventDefault();
    const rect = board.getBoundingClientRect();
    positions[note.dataset.note] = normalize({ x: pointer.original.x + dx / rect.width * 100, y: pointer.original.y + dy / rect.height * 100 });
    note.classList.add('is-dragging');
    render(note);
  });
  const finish = (event, cancelled = false) => {
    if (!pointer || pointer.id !== event.pointerId || pointer.note !== note) return;
    const moved = pointer.moved;
    const original = pointer.original;
    pointer = null;
    note.classList.remove('is-dragging');
    if (!moved) return;
    suppressClickUntil = performance.now() + 600;
    if (cancelled) positions[note.dataset.note] = original;
    else save();
    render(note);
  };
  note.addEventListener('pointerup', event => finish(event));
  note.addEventListener('pointercancel', event => finish(event, true));
  note.addEventListener('lostpointercapture', event => finish(event, true));
  note.addEventListener('dragstart', event => event.preventDefault());
  note.addEventListener('keydown', event => {
    const direction = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }[event.key];
    if (!direction) return;
    event.preventDefault();
    const current = positions[note.dataset.note];
    positions[note.dataset.note] = normalize({ x: current.x + direction[0], y: current.y + direction[1] });
    render(note); save();
  });
}
// Capture before the room's guided-click handler so a drop never opens a story.
document.addEventListener('click', event => {
  if (event.target.closest?.('.board-note') && performance.now() < suppressClickUntil) {
    event.preventDefault(); event.stopImmediatePropagation();
  }
}, true);
document.addEventListener('room:reset', () => {
  for (const note of notes) { positions[note.dataset.note] = { ...defaults[note.dataset.note] }; render(note); }
  save();
});
window.addEventListener('storage', event => {
  if (event.key !== KEY) return;
  try {
    const stored = JSON.parse(event.newValue);
    for (const note of notes) positions[note.dataset.note] = normalize(stored?.[note.dataset.note] || defaults[note.dataset.note]);
    notes.forEach(render);
  } catch { /* Ignore malformed data from another tab. */ }
});
