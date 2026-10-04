import { GRID_SIZE, FURNITURE, tileToScreen, screenToTile } from './room-layout.mjs';
import { isWalkable, nearestWalkable, findPath, reachableTiles } from './fibi-pathfinding.mjs';

const WIDTH = 1000;
const HEIGHT = 2000 / 3;
const SPEED = 74;

/** A floor-anchored companion. Furniture remains the source of navigation geometry. */
export function createRoomCompanion({ stage, getLayout, isEditing }) {
  const character = document.querySelector('#character');
  const sprite = document.querySelector('#character-image');
  const button = document.querySelector('#fibi-button');
  const dialog = document.querySelector('#project-dialog');
  const marker = document.querySelector('#fibi-destination');
  const feedback = document.querySelector('#fibi-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const config = window.PORTFOLIO.character;
  const idle = config.animations?.idle || { pages: [{ image: config.image, frames: config.frames || 1 }], fps: 12 };
  const walk = config.animations?.walk || idle;
  const hello = config.animations?.hello || idle;
  const celebrate = config.animations?.celebrate || hello;
  const animations = { idle, walk, hello, celebrate };
  const images = new Map();
  // Start in the open center aisle, clear of the screening chair's artwork.
  let position = nearestWalkable(getLayout(), { x: 6.5, y: 10.5 });
  let path = [];
  let layoutKey = '';
  let animation = 'idle';
  let animationTime = 0;
  let displayedFrame = '';
  let nextWander = 1.6;
  let elapsed = 0;
  let lastTime = null;
  let frameRequest = 0;
  let inView = true;
  let listView = stage.hidden;
  let screeningOpen = false;
  let manualTrip = false;
  let visit = null;
  let greetingUntil = 0;
  let reactionUntil = 0;
  let reactionName = 'hello';
  let pointerStart = null;
  let tourMode = false;

  for (const sequence of Object.values(animations)) {
    for (const page of sequence.pages) {
      if (images.has(page.image)) continue;
      const image = new Image();
      images.set(page.image, image);
      image.fetchPriority = sequence === walk || page === idle.pages[0] ? 'high' : 'low';
      image.decoding = 'async';
      image.src = page.image;
      image.addEventListener('load', () => { displayedFrame = ''; schedule(); });
    }
  }

  function canAnimate() {
    return !!position && !document.hidden && inView && !listView && !dialog.open && !screeningOpen && !isEditing();
  }
  function canWander() { return !tourMode && !visit && !reducedMotion.matches && elapsed >= greetingUntil; }
  function setTourMode(active) {
    tourMode = active;
    if (active && !visit) stop();
    if (!active) nextWander = elapsed + 2;
    schedule();
  }
  function playReaction(name = 'hello', duration = 1.55) {
    if (!animations[name]) return;
    reactionName = name;
    reactionUntil = elapsed + duration;
    nextWander = Math.max(nextWander, reactionUntil + .7);
    setAnimation(name);
    schedule();
  }
  function setAnimation(next) {
    if (next === animation) return;
    animation = next; animationTime = 0; displayedFrame = '';
    character.dataset.motion = next;
    character.classList.toggle('is-walking', next === 'walk');
    character.classList.toggle('is-celebrating', next === 'celebrate');
  }
  function drawSprite() {
    const sequence = animations[animation];
    const count = sequence.pages.reduce((total, page) => total + page.frames, 0);
    let frame = reducedMotion.matches ? 0 : Math.floor(animationTime * (sequence.fps || 12)) % count;
    let pageIndex = 0;
    while (frame >= sequence.pages[pageIndex].frames) frame -= sequence.pages[pageIndex++].frames;
    const page = sequence.pages[pageIndex];
    const image = images.get(page.image);
    if (!image?.complete || !image.naturalWidth) return;
    const key = `${animation}:${pageIndex}:${frame}`;
    if (key === displayedFrame) return;
    displayedFrame = key;
    const columns = page.columns || page.frames;
    sprite.style.backgroundImage = `url("${page.image.replace(/["\\\n\r]/g, '')}")`;
    sprite.style.backgroundSize = `${columns * 100}% ${sequence.heightScale || 100}%`;
    sprite.style.backgroundPosition = `${columns <= 1 ? 0 : frame / (columns - 1) * 100}% ${sequence.yPosition || 0}%`;
    character.style.setProperty('--fibi-ground', `${sequence.ground ?? 89}%`);
    character.dataset.frame = String(frame);
    character.dataset.spritePage = String(pageIndex);
  }
  function drawPosition() {
    if (!position) { character.hidden = true; return; }
    character.hidden = false;
    const point = tileToScreen(position.x, position.y);
    const roomWidth = stage.clientWidth || WIDTH;
    const characterWidth = character.offsetWidth;
    character.style.left = `${point.x / WIDTH * 100}%`;
    character.style.top = `${point.y / HEIGHT * 100}%`;
    stage.style.setProperty('--fibi-x', `${point.x / WIDTH * 100}%`);
    stage.style.setProperty('--fibi-y', `${point.y / HEIGHT * 100}%`);
    // Keep the bubble inside the room while its tail continues to point at Fibi.
    const fibiX = point.x / WIDTH * roomWidth;
    const bubbleHalf = Math.min(130, Math.max(0, (roomWidth - 24) / 2));
    const bubbleX = Math.max(bubbleHalf + 8, Math.min(roomWidth - bubbleHalf - 8, fibiX));
    stage.style.setProperty('--speech-x', `${bubbleX}px`);
    stage.style.setProperty('--speech-tail-offset', `${fibiX - bubbleX}px`);
    stage.style.setProperty('--speech-head-offset', `${Math.round(characterWidth * .72 + 9)}px`);
    // Long desks need an explicit front/behind relation: their far front corner
    // alone would hide Fibi even when she walks just in front of their near end.
    let lower = 0, upper = 1000;
    for (const item of FURNITURE) {
      const placed = getLayout()[item.id];
      const center = tileToScreen(placed.x + item.width / 2, placed.y + item.depth / 2);
      const halfWidth = (item.width + item.depth) * 12.5;
      if (Math.abs(center.x - point.x) > halfWidth + 22) continue;
      const depth = (placed.x + placed.y + item.width + item.depth) * 10;
      if (position.x > placed.x + item.width || position.y > placed.y + item.depth) lower = Math.max(lower, depth + 1);
      else if (position.x < placed.x || position.y < placed.y) upper = Math.min(upper, depth - 1);
    }
    character.style.zIndex = String(Math.max(lower, Math.min(upper, Math.round((position.x + position.y + .7) * 10))));
    character.dataset.floorX = position.x.toFixed(3);
    character.dataset.floorY = position.y.toFixed(3);
  }
  function clearDestination() { marker.hidden = true; }
  function cancelVisit() {
    if (!visit) return;
    visit.targetElement.classList.remove('is-awaiting-fibi');
    visit = null;
    character.classList.remove('is-interacting');
    stop();
  }
  function finishVisit() {
    if (!visit) return;
    const { onComplete, targetElement } = visit;
    targetElement.classList.remove('is-awaiting-fibi');
    visit = null;
    character.classList.remove('is-interacting');
    feedback.textContent = `${config.name} made it!`;
    onComplete();
  }
  function beginInteraction() {
    if (!visit || visit.interactUntil !== null) return;
    stop();
    const here = tileToScreen(position.x, position.y);
    sprite.style.setProperty('--fibi-facing', visit.target.x < here.x ? '1' : '-1');
    character.style.setProperty('--impact-x', visit.target.x < here.x ? '18%' : '82%');
    character.classList.add('is-interacting');
    playReaction('hello', .9);
    visit.interactUntil = elapsed + .9;
    feedback.textContent = `${config.name} is opening it.`;
    schedule();
  }
  function visitTarget({ target, furnitureId = null, onComplete }) {
    cancelVisit();
    if (reducedMotion.matches || !canAnimate()) { onComplete(); return; }
    const rect = target.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    let sceneTarget = { x: (rect.left + rect.width / 2 - stageRect.left) / stageRect.width * WIDTH, y: (rect.top + rect.height / 2 - stageRect.top) / stageRect.height * HEIGHT };
    let item, placed;
    if (furnitureId) {
      item = FURNITURE.find(piece => piece.id === furnitureId);
      placed = getLayout()[furnitureId];
      if (item && placed) sceneTarget = tileToScreen(placed.x + item.width / 2, placed.y + item.depth / 2);
    }
    const candidates = reachableTiles(getLayout(), position);
    const destination = candidates.reduce((best, point) => {
      const screen = tileToScreen(point.x, point.y);
      const front = !item || !placed || point.x >= placed.x + item.width || point.y >= placed.y + item.depth;
      const score = Math.hypot(screen.x - sceneTarget.x, screen.y - sceneTarget.y) + (front ? 0 : 45);
      return !best || score < best.score ? { point, score } : best;
    }, null)?.point;
    if (!destination) { onComplete(); return; }
    const route = findPath(getLayout(), position, destination);
    if (!route.length) { onComplete(); return; }
    let distance = 0;
    for (let i = 1; i < route.length; i++) {
      const from = tileToScreen(route[i - 1].x, route[i - 1].y);
      const to = tileToScreen(route[i].x, route[i].y);
      distance += Math.hypot(to.x - from.x, to.y - from.y);
    }
    visit = { onComplete, targetElement: target, target: sceneTarget, interactUntil: null, speed: Math.min(460, Math.max(220, distance / 1.55)) };
    target.classList.add('is-awaiting-fibi');
    path = route.slice(1);
    manualTrip = false;
    clearDestination();
    feedback.textContent = `${config.name} is on the way to open this.`;
    document.dispatchEvent(new CustomEvent('fibi:say', { detail: { text: 'On my way! ✦', holdMs: 1900 } }));
    if (path.length) { setAnimation('walk'); schedule(); }
    else beginInteraction();
  }
  function stop() {
    path = []; manualTrip = false; clearDestination();
    setAnimation('idle'); drawSprite(); nextWander = elapsed + 2 + Math.random() * 3;
  }
  function startTrip(destination, manual = false) {
    const route = findPath(getLayout(), position, destination);
    if (route.length < 2) {
      if (manual) feedback.textContent = route.length ? 'Fibi is already there.' : 'Fibi cannot reach that spot. Try an open part of the floor.';
      return false;
    }
    path = route.slice(1); manualTrip = manual;
    if (manual) {
      const target = tileToScreen(path.at(-1).x, path.at(-1).y);
      marker.style.left = `${target.x / WIDTH * 100}%`;
      marker.style.top = `${target.y / HEIGHT * 100}%`;
      marker.hidden = false;
      feedback.textContent = `${config.name} is on the way.`;
    }
    if (reducedMotion.matches) {
      position = { ...path.at(-1) }; stop(); drawPosition();
      feedback.textContent = `${config.name} is here.`;
    }
    schedule();
    return true;
  }
  function wander() {
    const from = tileToScreen(position.x, position.y);
    const choices = reachableTiles(getLayout(), position).filter(point => {
      const to = tileToScreen(point.x, point.y);
      const distance = Math.hypot(from.x - to.x, from.y - to.y);
      return distance >= 75 && distance <= 230;
    });
    if (!choices.length || !startTrip(choices[Math.floor(Math.random() * choices.length)])) nextWander = elapsed + 4;
  }
  function advance(seconds) {
    let budget = (visit?.speed || SPEED) * seconds;
    while (path.length && budget > 0) {
      const next = path[0];
      const from = tileToScreen(position.x, position.y);
      const to = tileToScreen(next.x, next.y);
      const distance = Math.hypot(to.x - from.x, to.y - from.y);
      if (Math.abs(to.x - from.x) > .1) sprite.style.setProperty('--fibi-facing', to.x < from.x ? '1' : '-1');
      if (distance <= budget) { position = { ...next }; path.shift(); budget -= distance; }
      else {
        const fraction = budget / distance;
        position = { x: position.x + (next.x - position.x) * fraction, y: position.y + (next.y - position.y) * fraction };
        budget = 0;
      }
    }
    drawPosition();
    if (!path.length) {
      if (visit) { beginInteraction(); return; }
      const arrived = manualTrip;
      stop();
      if (arrived) { feedback.textContent = `${config.name} is here.`; nextWander = elapsed + 5; }
    }
  }
  function tick(now) {
    frameRequest = 0;
    if (!canAnimate()) { lastTime = null; return; }
    const seconds = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, .5);
    lastTime = now; elapsed += seconds;
    if (!path.length && canWander() && elapsed >= nextWander) wander();
    const walkReady = walk.pages.every(page => images.get(page.image)?.complete && images.get(page.image).naturalWidth);
    if (path.length && walkReady) { setAnimation('walk'); advance(seconds); }
    else if (elapsed < reactionUntil) setAnimation(reactionName);
    else setAnimation('idle');
    if (visit && visit.interactUntil !== null && elapsed >= visit.interactUntil) finishVisit();
    if (!reducedMotion.matches) animationTime += seconds;
    drawSprite();
    if (!reducedMotion.matches) frameRequest = requestAnimationFrame(tick);
    else lastTime = null;
  }
  function schedule() {
    if (!frameRequest && canAnimate()) { lastTime = null; frameRequest = requestAnimationFrame(tick); }
  }
  function pause() {
    cancelAnimationFrame(frameRequest); frameRequest = 0; lastTime = null;
    setAnimation('idle'); drawSprite();
  }
  function syncLayout() {
    const nextKey = JSON.stringify(getLayout());
    if (nextKey === layoutKey) return;
    cancelVisit();
    layoutKey = nextKey;
    const destination = path.at(-1);
    const wasManual = manualTrip;
    if (!position || !isWalkable(getLayout(), position)) position = nearestWalkable(getLayout(), position || { x: 9.5, y: 9.5 });
    stop(); drawPosition();
    if (position && destination && !isEditing()) startTrip(destination, wasManual);
    schedule();
  }
  function editingChanged() {
    document.querySelector('#room-hint').textContent = isEditing() ? 'Arranging room · Fibi will wait' : `Drag furniture · tap the floor to guide ${config.name}`;
    if (isEditing()) { cancelVisit(); stop(); pause(); }
    else { syncLayout(); nextWander = elapsed + 1.2; schedule(); }
  }
  function pointFor(event) {
    const rect = stage.getBoundingClientRect();
    return screenToTile((event.clientX - rect.left) / rect.width * WIDTH, (event.clientY - rect.top) / rect.height * HEIGHT);
  }
  stage.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary || isEditing() || !event.target.closest('.floor-tile')) return;
    pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  stage.addEventListener('pointerup', event => {
    const start = pointerStart; pointerStart = null;
    if (!start || start.id !== event.pointerId || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 7 || !canAnimate()) return;
    const point = pointFor(event);
    if (point.x >= 0 && point.x <= GRID_SIZE && point.y >= 0 && point.y <= GRID_SIZE) { cancelVisit(); startTrip(point, true); }
  });
  stage.addEventListener('pointercancel', () => { pointerStart = null; });
  button.addEventListener('click', () => {
    cancelVisit(); stop(); greetingUntil = elapsed + 2; nextWander = elapsed + 3.5; playReaction('hello', 2.1);
    document.dispatchEvent(new CustomEvent('fibi:say', { detail: { text: 'Hi! Pick something in the room and I’ll show you around. ✦', holdMs: 4400 } }));
  });
  button.addEventListener('keydown', event => {
    if (!canAnimate()) return;
    const directions = { ArrowLeft: [-1, 1], ArrowRight: [1, -1], ArrowUp: [-1, -1], ArrowDown: [1, 1] };
    if (!directions[event.key]) return;
    event.preventDefault();
    const [x, y] = directions[event.key];
    const from = path.at(-1) || position;
    startTrip({ x: from.x + x * 2, y: from.y + y * 2 }, true);
  });
  document.addEventListener('portfolio:chapter-open', pause);
  document.addEventListener('portfolio:screening', event => { screeningOpen = event.detail.open; if (screeningOpen) pause(); else schedule(); });
  dialog.addEventListener('close', schedule);
  document.addEventListener('portfolio:view', event => { listView = event.detail.showList; if (listView) { cancelVisit(); pause(); } else schedule(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { finishVisit(); pause(); } else schedule(); });
  reducedMotion.addEventListener('change', () => { finishVisit(); stop(); pause(); schedule(); });
  const observer = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (inView) schedule(); else { finishVisit(); pause(); }
  }, { threshold: .1 });
  observer.observe(stage);
  syncLayout(); drawSprite(); schedule();
  return { syncLayout, editingChanged, visitTarget, setTourMode, cancelVisit, greet: () => playReaction('hello', 2.5), celebrate: () => playReaction('celebrate', 2.7) };
}
