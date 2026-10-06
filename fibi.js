import { GRID_SIZE, FURNITURE, tileToScreen, screenToTile } from './room-layout.mjs?v=69';
import { isWalkable, nearestWalkable, findPath, reachableTiles } from './fibi-pathfinding.mjs?v=69';

const WIDTH = 1000;
const HEIGHT = 2000 / 3;
const SPEED = 74;
// Fibi dozes off when nobody has touched the page for a while.
const SLEEP_AFTER = 45;
// Arrival spot: the middle of the room, at the front corner of the floor keyboard.
const HOME = { x: 10, y: 10 };
// Oto's physics (PhysicsEngine.kt), scaled from phone pixels to room units (about 0.4).
const PHONE_TO_ROOM = .4;
const GRAVITY = 1800 * PHONE_TO_ROOM;
const BOUNCE_DAMPING = .55;
const REST_SPEED = 90 * PHONE_TO_ROOM;
const FLAIL_SPEED = 420 * PHONE_TO_ROOM;
// How far above the floor she hangs while held, in room units.
const HOLD_LIFT = 34;

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
  const animations = { ...config.animations, idle, walk, hello, celebrate };
  const images = new Map();
  let position = nearestWalkable(getLayout(), HOME);
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
  let lastActivity = 0;
  let sleeping = false;
  let pressTimer = 0;
  let petted = false;
  // Which way she is walking on screen: side, toward the viewer, or away.
  let heading = 'side';
  // Picking her up: the pointer, where it grabbed her, and whether a drag started.
  let held = null;
  let droppedAt = 0;
  // Height above the floor (room units, up is positive) and falling speed (down is positive).
  let lift = 0;
  let air = null;

  // Idle and walking load first; every other animation loads the first time it plays.
  function preload(names) {
    for (const name of names) {
      for (const page of animations[name]?.pages || []) {
        if (images.has(page.image)) continue;
        const image = new Image();
        images.set(page.image, image);
        image.fetchPriority = name === 'walk' || page === idle.pages[0] ? 'high' : 'low';
        image.decoding = 'async';
        image.src = page.image;
        image.addEventListener('load', () => { displayedFrame = ''; schedule(); });
      }
    }
  }
  preload(['idle', 'walk', 'hello']);
  setTimeout(() => preload(['walkToward', 'walkAway', 'held', 'falling']), 2500);
  const ready = name => (animations[name]?.pages || []).every(page => images.get(page.image)?.complete && images.get(page.image).naturalWidth);

  function canAnimate() {
    return !!position && !document.hidden && inView && !listView && !dialog.open && !screeningOpen && !isEditing();
  }
  function canWander() { return !tourMode && !visit && !sleeping && !reducedMotion.matches && elapsed >= greetingUntil; }
  function setTourMode(active) {
    tourMode = active;
    if (active && !visit) stop();
    if (!active) { reactionUntil = Math.min(reactionUntil, elapsed); nextWander = elapsed + 2; }
    schedule();
  }
  function playReaction(name = 'hello', duration = 1.55) {
    if (!animations[name]) return;
    preload([name]);
    reactionName = name;
    reactionUntil = elapsed + duration;
    nextWander = Math.max(nextWander, reactionUntil + .7);
    setAnimation(name);
    schedule();
  }
  // Hold an animation until something else plays (tour stops, sitting, sleeping).
  const hold = name => playReaction(name, Infinity);
  function wake() {
    lastActivity = elapsed;
    if (!sleeping) return;
    sleeping = false;
    character.classList.remove('is-sleeping');
    playReaction('hello', 1.6);
  }
  function setAnimation(next) {
    if (next === animation) return;
    animation = next; animationTime = 0; displayedFrame = '';
    character.dataset.motion = next;
    character.classList.toggle('is-walking', next.startsWith('walk'));
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
    // Strips are one row; grid sheets wrap frames into `rows` rows of `columns`.
    const columns = page.columns || page.frames;
    const rows = page.rows || 1;
    const column = frame % columns, row = Math.floor(frame / columns);
    sprite.style.backgroundImage = `url("${page.image.replace(/["\\\n\r]/g, '')}")`;
    sprite.style.backgroundSize = `${columns * 100}% ${rows > 1 ? rows * 100 : sequence.heightScale || 100}%`;
    sprite.style.backgroundPosition = `${columns <= 1 ? 0 : column / (columns - 1) * 100}% ${rows > 1 ? row / (rows - 1) * 100 : sequence.yPosition || 0}%`;
    character.style.setProperty('--fibi-ground', `${sequence.ground ?? 89}%`);
    character.dataset.frame = String(frame);
    character.dataset.spritePage = String(pageIndex);
  }
  function drawPosition() {
    if (!position) { character.hidden = true; return; }
    character.hidden = false;
    character.style.setProperty('--fibi-lift', lift.toFixed(2));
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
    // Slot Fibi between the pieces she stands in front of and those in front of her,
    // using the furniture's own drawing order (the same rule paintOrder uses).
    let lower = 10, upper = Infinity;
    for (const item of FURNITURE) {
      const placed = getLayout()[item.id];
      const center = tileToScreen(placed.x + item.width / 2, placed.y + item.depth / 2);
      const halfWidth = (item.width + item.depth) * 12.5;
      if (Math.abs(center.x - point.x) > halfWidth + 22) continue;
      const z = Number(stage.querySelector(`[data-furniture="${item.id}"]`)?.style.zIndex) || 0;
      const right = placed.x + item.width, front = placed.y + item.depth;
      const inFront = (position.x >= right && position.y > placed.y) || (position.y >= front && position.x > placed.x);
      const behind = (position.x <= placed.x && position.y < front) || (position.y <= placed.y && position.x < right);
      if (inFront) lower = Math.max(lower, z);
      else if (behind) upper = Math.min(upper, z);
    }
    character.style.zIndex = String(Math.round(lower + 10 < upper ? lower + 10 : (lower + Math.min(upper, lower + 20)) / 2));
    character.dataset.floorX = position.x.toFixed(3);
    character.dataset.floorY = position.y.toFixed(3);
    document.dispatchEvent(new CustomEvent('fibi:moved', { detail: { x: position.x, y: position.y, walking: path.length > 0 } }));
  }
  function clearDestination() { marker.hidden = true; }
  function cancelVisit() {
    if (!visit) return;
    visit.targetElement?.classList.remove('is-awaiting-fibi');
    visit = null;
    character.classList.remove('is-interacting');
    stop();
  }
  function finishVisit() {
    if (!visit) return;
    const { onComplete, targetElement } = visit;
    targetElement?.classList.remove('is-awaiting-fibi');
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
    if (visit.targetElement) {
      character.style.setProperty('--impact-x', visit.target.x < here.x ? '18%' : '82%');
      character.classList.add('is-interacting');
    }
    playReaction(visit.reaction, visit.reactionTime);
    visit.interactUntil = elapsed + visit.reactionTime;
    feedback.textContent = visit.targetElement ? `${config.name} is opening it.` : `${config.name} is here.`;
    schedule();
  }
  function routeLength(route) {
    let distance = 0;
    for (let i = 1; i < route.length; i++) {
      const from = tileToScreen(route[i - 1].x, route[i - 1].y);
      const to = tileToScreen(route[i].x, route[i].y);
      distance += Math.hypot(to.x - from.x, to.y - from.y);
    }
    return distance;
  }
  function beginVisit(route, details) {
    visit = { interactUntil: null, speed: Math.min(460, Math.max(220, routeLength(route) / 1.55)), reaction: 'hello', reactionTime: .9, ...details };
    visit.targetElement?.classList.add('is-awaiting-fibi');
    path = route.slice(1);
    manualTrip = false;
    clearDestination();
    if (path.length) { setAnimation('walk'); schedule(); }
    else beginInteraction();
  }
  /** Walk up to an object in the room, play `reaction`, then call onComplete. */
  function visitTarget({ target, furnitureId = null, onComplete, reaction = 'hello', reactionTime = .9, quiet = false }) {
    cancelVisit(); wake();
    if (reducedMotion.matches || !canAnimate()) { if (reaction !== 'hello') hold(reaction); onComplete(); return; }
    preload([reaction]);
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
    feedback.textContent = `${config.name} is on the way to open this.`;
    if (!quiet) document.dispatchEvent(new CustomEvent('fibi:say', { detail: { text: 'On my way! ✦', holdMs: 1900 } }));
    beginVisit(route, { onComplete, targetElement: target, target: sceneTarget, reaction, reactionTime });
  }
  /** Walk to a floor position (tile coordinates), play `reaction`, then call onComplete. */
  function walkTo(point, { onComplete = () => {}, reaction = 'idle', reactionTime = .1 } = {}) {
    cancelVisit(); wake();
    const goal = nearestWalkable(getLayout(), point);
    const route = goal && findPath(getLayout(), position, goal);
    if (reducedMotion.matches || !canAnimate() || !route?.length) {
      if (goal && reducedMotion.matches) { position = { ...goal }; drawPosition(); }
      if (reaction !== 'idle') hold(reaction);
      onComplete(); return;
    }
    preload([reaction]);
    beginVisit(route, { onComplete, target: tileToScreen(goal.x, goal.y), reaction, reactionTime });
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
      const dx = to.x - from.x, dy = to.y - from.y;
      if (Math.hypot(dx, dy) > .5) heading = Math.abs(dy) > Math.abs(dx) * .9 ? (dy > 0 ? 'toward' : 'away') : 'side';
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
    if (!sleeping && !tourMode && !visit && !path.length && !reducedMotion.matches && elapsed - lastActivity > SLEEP_AFTER) {
      sleeping = true; character.classList.add('is-sleeping'); hold('sleep');
      document.dispatchEvent(new CustomEvent('fibi:say', { detail: { text: 'Zzz… tap me to wake me up.', holdMs: 5000 } }));
    }
    if (air) {
      // Small fixed steps keep the bounce the same however slowly frames arrive.
      for (let left = seconds; left > 0 && air; left -= 1 / 240) stepAir(Math.min(left, 1 / 240));
      const flailing = air && air.vz > FLAIL_SPEED && ready('falling');
      if (air) setAnimation(flailing ? 'falling' : ready('held') ? 'held' : 'idle');
    }
    else if (held?.dragging) { setAnimation(ready('held') ? 'held' : 'idle'); }
    else {
    if (!path.length && canWander() && elapsed >= nextWander) wander();
    const walkCycle = heading === 'toward' && ready('walkToward') ? 'walkToward' : heading === 'away' && ready('walkAway') ? 'walkAway' : 'walk';
    if (path.length && ready('walk')) { setAnimation(walkCycle); advance(seconds); }
    else if (elapsed < reactionUntil && ready(reactionName)) setAnimation(reactionName);
    else if (elapsed >= reactionUntil) setAnimation('idle');
    if (visit && visit.interactUntil !== null && elapsed >= visit.interactUntil) finishVisit();
    }
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
  // Pick her up: drag past a few pixels and she dangles from the pointer; let go and she
  // lands on the nearest open spot of floor.
  function scenePoint(event) {
    const rect = stage.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width * WIDTH, y: (event.clientY - rect.top) / rect.height * HEIGHT };
  }
  function moveHeld(event) {
    const point = scenePoint(event);
    const feet = { x: point.x + held.offset.x, y: point.y + held.offset.y - HOLD_LIFT };
    // Her shadow goes on the floor straight below her; over the wall, that's the floor's back edge.
    const onFloor = t => t.x >= .4 && t.y >= .4 && t.x <= GRID_SIZE - .4 && t.y <= GRID_SIZE - .4;
    // Search straight down first (she's over the wall), then straight up (she's past the front edge).
    let tile = screenToTile(feet.x, feet.y + HOLD_LIFT);
    for (let step = 1; step < 200 && !onFloor(tile); step++) {
      const down = screenToTile(feet.x, feet.y + HOLD_LIFT + step * 4), up = screenToTile(feet.x, feet.y + HOLD_LIFT - step * 4);
      tile = onFloor(down) ? down : onFloor(up) ? up : tile;
    }
    position = { x: Math.max(.4, Math.min(GRID_SIZE - .4, tile.x)), y: Math.max(.4, Math.min(GRID_SIZE - .4, tile.y)) };
    // Pulled up the wall or past the floor's edge, she hangs higher above her shadow.
    lift = Math.max(10, tileToScreen(position.x, position.y).y - feet.y);
    drawPosition();
  }
  function startHold(event) {
    held.dragging = true;
    clearTimeout(pressTimer);
    cancelVisit(); wake();
    path = []; manualTrip = false; clearDestination();
    preload(['held']);
    character.classList.add('is-held');
    stage.classList.add('is-holding-fibi');
    setAnimation(ready('held') ? 'held' : 'idle'); drawSprite();
    feedback.textContent = `You picked up ${config.name}.`;
    moveHeld(event);
    schedule();
  }
  function dropHeld(cancelled = false) {
    const wasDragging = held?.dragging;
    held = null;
    if (!wasDragging) return;
    character.classList.remove('is-held');
    stage.classList.remove('is-holding-fibi');
    droppedAt = performance.now();
    // She lands on the nearest open floor, drifting there while she falls.
    const spot = isWalkable(getLayout(), position) ? { ...position } : nearestWalkable(getLayout(), position) || nearestWalkable(getLayout(), HOME);
    air = { vz: 0, from: { ...position }, to: spot ? { ...spot } : { ...position }, t: 0, bounces: 0, cancelled };
    greetingUntil = elapsed + 3; nextWander = elapsed + 6; lastActivity = elapsed;
    preload(['falling']);
    if (reducedMotion.matches) { lift = 0; position = { ...air.to }; land(0); air = null; settle(); return; }
    schedule();
  }
  // One physics step: gravity, the drift to her landing spot, and bounces.
  function stepAir(seconds) {
    air.t += seconds;
    air.vz += GRAVITY * seconds;
    lift -= air.vz * seconds;
    const drift = Math.min(1, air.t / .35);
    position = { x: air.from.x + (air.to.x - air.from.x) * drift, y: air.from.y + (air.to.y - air.from.y) * drift };
    if (lift <= 0 && air.vz > 0) {
      lift = 0;
      const impact = air.vz;
      land(impact);
      if (impact > REST_SPEED) { air.vz = -impact * BOUNCE_DAMPING; air.bounces++; }
      else { position = { ...air.to }; air = null; settle(); }
    }
    drawPosition();
  }
  // Touching down: a squash, a puff of dust, and a nudge for whatever is underfoot.
  function land(impact) {
    const strength = Math.min(1, impact / 220);
    character.style.setProperty('--fibi-squash', (strength * .16).toFixed(3));
    character.classList.remove('is-landing'); void character.offsetWidth; character.classList.add('is-landing');
    if (strength > .15) {
      const dust = document.createElement('span');
      dust.className = 'fibi-dust';
      const feet = tileToScreen(position.x, position.y);
      dust.style.left = `${feet.x / WIDTH * 100}%`; dust.style.top = `${feet.y / HEIGHT * 100}%`;
      dust.style.setProperty('--dust', strength.toFixed(2));
      stage.append(dust);
      dust.addEventListener('animationend', () => dust.remove(), { once: true });
    }
    document.dispatchEvent(new CustomEvent('fibi:landed', { detail: { x: position.x, y: position.y, impact, strength } }));
  }
  function settle() {
    const cancelled = air?.cancelled;
    playReaction('happy', 1.8);
    feedback.textContent = `${config.name} landed.`;
    if (!cancelled && !tourMode) document.dispatchEvent(new CustomEvent('fibi:say', { detail: { text: 'Wheee! Thanks for the lift.', holdMs: 2400 } }));
  }
  // Tap: a laugh. Press and hold: she leans into a head pat. Drag: pick her up.
  button.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    // No text selection or native image drag while she is held.
    event.preventDefault();
    window.getSelection?.()?.removeAllRanges();
    air = null;
    const feet = tileToScreen(position.x, position.y), point = scenePoint(event);
    feet.y -= lift;
    point.x = Math.max(feet.x - 14, Math.min(feet.x + 14, point.x));
    point.y = Math.max(feet.y - 62, Math.min(feet.y - 4, point.y));
    held = { id: event.pointerId, x: event.clientX, y: event.clientY, offset: { x: feet.x - point.x, y: feet.y - point.y }, dragging: false };
    try { button.setPointerCapture(event.pointerId); } catch { /* Synthetic pointers. */ }
    petted = false;
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      petted = true; cancelVisit(); stop(); wake(); greetingUntil = elapsed + 3; playReaction('pet', 2.4);
      document.dispatchEvent(new CustomEvent('fibi:say', { detail: { text: 'Hehe, thank you! ♡', holdMs: 2600 } }));
    }, 550);
  });
  button.addEventListener('pointermove', event => {
    if (!held || held.id !== event.pointerId) return;
    if (!held.dragging && Math.hypot(event.clientX - held.x, event.clientY - held.y) < (event.pointerType === 'touch' ? 9 : 5)) return;
    event.preventDefault();
    if (!held.dragging) startHold(event); else moveHeld(event);
  });
  button.addEventListener('pointerup', event => { if (held?.id === event.pointerId) dropHeld(); });
  button.addEventListener('pointercancel', event => { if (held?.id === event.pointerId) dropHeld(true); });
  button.addEventListener('lostpointercapture', event => { if (held?.id === event.pointerId) dropHeld(); });
  for (const type of ['pointerup', 'pointercancel', 'pointerleave']) button.addEventListener(type, () => clearTimeout(pressTimer));
  button.addEventListener('contextmenu', event => event.preventDefault());
  button.addEventListener('click', () => {
    if (petted) { petted = false; return; }
    if (performance.now() - droppedAt < 400) return;
    const wasSleeping = sleeping;
    cancelVisit(); stop(); wake(); greetingUntil = elapsed + 2; nextWander = elapsed + 3.5;
    if (!wasSleeping) playReaction('laugh', 2.2);
    if (!tourMode) document.dispatchEvent(new CustomEvent('fibi:say', { detail: { text: wasSleeping ? 'Oh! I’m up, I’m up. ✦' : 'Hehe! You can pick me up and drag me around, too. ✦', holdMs: 3600 } }));
  });
  for (const type of ['pointerdown', 'keydown', 'wheel']) document.addEventListener(type, () => { if (!sleeping) lastActivity = elapsed; }, { passive: true });
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
  return {
    syncLayout, editingChanged, visitTarget, walkTo, setTourMode, cancelVisit, preload, hold, wake,
    play: playReaction,
    home: () => ({ ...HOME }),
    greet: () => playReaction('hello', 3.4),
    celebrate: () => playReaction('celebrate', 2.7),
    // Fibi's feet in scene coordinates (1000 × 666.67), for anchoring her speech card.
    feet: () => position && tileToScreen(position.x, position.y),
  };
}
