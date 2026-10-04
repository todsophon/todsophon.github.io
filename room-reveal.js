const GROUPS = {
  oto: { name: 'Oto / Frisson Labs', selector: '[data-furniture="oto"], .wall-pinboard', color: '#68cbf5', detail: 'Explore the shipped app, playable games, published AI films, and the community behind them.', chapter: 'oto' },
  youtube: { name: 'YouTube', selector: '[data-furniture="youtube"], [data-furniture="bookshelf"], .wall-award', color: '#f4c967', detail: 'From the first 100K to a community of more than one million.', chapter: 'youtube' },
  tiktok: { name: 'TikTok', selector: '[data-furniture="tiktok"]', color: '#79d9cf', detail: 'Short-form ideas shaped by hooks, pacing, and audience response.', chapter: 'tiktok' },
  about: { name: 'Meet Tod', selector: '.wall-portrait', color: '#d9b6e9', detail: 'The person behind the stories, products, and this room.', chapter: 'about' },
  cinema: { name: 'The screening room', selector: '[data-furniture="chair"]', color: '#f1bd76', detail: 'A little gallery of the videos Tod made.', screening: true },
  growth: { name: 'Growth', selector: '[data-furniture="plant"]', color: '#b3d98c', detail: 'Experiments, analytics, and the numbers behind creative decisions.', chapter: 'analytics' },
};
const GROUP_IDS = Object.keys(GROUPS);
const BUTTON_SELECTOR = '.furniture-hit, .wall-award, .wall-portrait, .board-note';
const GUIDE_STEPS = [
  { message: 'Hi, I’m Fibi! Welcome to Tod’s little world.', button: 'Show me around →' },
  { message: 'Every object is part of his story. See those warm little lights? They mark what you can discover.', button: 'And then? →' },
  { message: 'Choose one. I’ll walk to it, bring it into color, and show you a closer look. Tap again to open the story. You can drag the furniture and pinboard notes too!', button: 'Let’s explore ✦' },
];

function groupFor(target) {
  const id = target.closest('.furniture-piece')?.dataset.furniture;
  if (id === 'oto' || target.closest('.board-note')) return 'oto';
  if (id === 'youtube' || id === 'bookshelf' || target.closest('.wall-award')) return 'youtube';
  if (id === 'tiktok') return 'tiktok';
  if (target.closest('.wall-portrait')) return 'about';
  if (id === 'chair') return 'cinema';
  if (id === 'plant') return 'growth';
  return null;
}

export function createRoomReveal({ stage, guide }) {
  const toggle = document.querySelector('#room-reveal-toggle');
  const progress = document.querySelector('#room-reveal-progress');
  const hint = document.querySelector('#room-hint');
  const bubble = document.querySelector('#speech-bubble');
  const message = document.querySelector('#speech-message');
  const next = document.querySelector('#guide-next');
  const fibi = document.querySelector('#character');
  const status = document.querySelector('#fibi-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const painted = new Set(), painting = new Set(), timers = new Set();
  let active = false, guideStep = 0, currentShowcase = null, speechTimeout = 0;
  function after(ms, callback) { const id = setTimeout(() => { timers.delete(id); callback(); }, ms); timers.add(id); }
  function clearTimers() { for (const id of timers) clearTimeout(id); timers.clear(); }
  function targetsFor(id) { return [...stage.querySelectorAll(GROUPS[id].selector)]; }
  function buttonsFor(id) { return targetsFor(id).flatMap(element => element.matches(BUTTON_SELECTOR) ? [element] : [...element.querySelectorAll(BUTTON_SELECTOR)]); }
  function hideSpeech() { clearTimeout(speechTimeout); speechTimeout = 0; bubble.classList.remove('is-visible'); }
  function say(copy, holdMs = 0) {
    clearTimeout(speechTimeout);
    message.textContent = copy; status.textContent = copy; bubble.classList.add('is-visible');
    if (holdMs) speechTimeout = setTimeout(hideSpeech, holdMs);
  }
  function updateProgress() { progress.textContent = `${painted.size} / ${GROUP_IDS.length} stories in color`; progress.hidden = !active; }
  function syncButtonNames() {
    for (const id of GROUP_IDS) for (const button of buttonsFor(id)) {
      if (!button.dataset.originalRevealLabel) button.dataset.originalRevealLabel = button.getAttribute('aria-label') || GROUPS[id].name;
      button.setAttribute('aria-label', active && !painted.has(id) ? `Guide Fibi to discover ${GROUPS[id].name}` : button.dataset.originalRevealLabel);
    }
  }
  function closeShowcase() { currentShowcase?.remove(); currentShowcase = null; }
  function clearEffects() { stage.querySelectorAll('.room-color-spot, .room-paint-burst, .unlock-showcase').forEach(element => element.remove()); currentShowcase = null; }
  function endGuide() { next.hidden = true; bubble.classList.remove('is-guide'); stage.classList.add('reveal-ready'); }
  function complete(copy = 'You brought the room to life. Everything is ready to explore!', celebrate = false) {
    clearTimers(); closeShowcase(); active = false; painting.clear(); painted.clear();
    for (const id of GROUP_IDS) painted.add(id);
    stage.classList.remove('reveal-active', 'reveal-zoom', 'reveal-ready');
    stage.querySelectorAll('.is-painting, .is-painted').forEach(element => element.classList.remove('is-painting', 'is-painted'));
    clearEffects(); next.hidden = true; bubble.classList.remove('is-guide');
    guide.cancelVisit(); guide.setTourMode(false);
    if (celebrate) guide.celebrate();
    toggle.textContent = '↺ Replay Fibi’s tour'; toggle.setAttribute('aria-label', 'Replay Fibi’s room tour');
    hint.textContent = 'Drag furniture · tap the floor to guide Fibi';
    say(copy, 4500); updateProgress(); syncButtonNames();
  }
  function locationFor(element) {
    const room = stage.getBoundingClientRect(), rect = element.getBoundingClientRect();
    return { x: (rect.left + rect.width / 2 - room.left) / room.width * 100, y: (rect.top + rect.height / 2 - room.top) / room.height * 100 };
  }
  function addColorSpot(element) {
    const { x, y } = locationFor(element), spot = document.createElement('span');
    spot.className = 'room-color-spot';
    spot.style.setProperty('--paint-x', `${x}%`); spot.style.setProperty('--paint-y', `${y}%`);
    spot.style.setProperty('--spot-radius', element.matches('.wall-award') ? '7%' : element.matches('.wall-pinboard, .wall-portrait') ? '9%' : element.matches('.furniture-piece') ? '12%' : '11%');
    stage.insertBefore(spot, stage.querySelector('.tile-room'));
  }
  function burstAt(element, color) {
    const { x, y } = locationFor(element), burst = document.createElement('span');
    burst.className = 'room-paint-burst'; burst.style.left = `${x}%`; burst.style.top = `${y}%`;
    burst.style.setProperty('--burst-color', color); stage.append(burst);
    burst.addEventListener('animationend', () => burst.remove(), { once: true });
  }
  function showcaseArt(target, id) {
    if (target.closest('.wall-award')) {
      const metal = target.dataset.milestone === 'gold' ? 'gold' : 'silver', plaque = document.createElement('div');
      plaque.className = `showcase-award ${metal}`;
      plaque.innerHTML = `<span class="showcase-play" aria-hidden="true">▶</span><strong>${metal === 'gold' ? '1,000,000' : '100,000'}</strong><small>TODSOPHON · YOUTUBE</small>`;
      return plaque;
    }
    if (target.closest('.wall-portrait')) {
      const photo = document.createElement('div'); photo.className = 'showcase-photo';
      const image = document.createElement('img'); image.src = 'assets/tod-portrait.png'; image.alt = ''; photo.append(image); return photo;
    }
    if (target.closest('.board-note')) {
      const note = document.createElement('div'); note.className = 'showcase-paper';
      note.textContent = target.dataset.note === 'community' ? 'Games: Word Guess + Bridge Walk' : target.dataset.note === 'films' ? 'AI films and Reels' : 'The shipped Oto app';
      return note;
    }
    const furnitureId = { about: 'bookshelf', growth: 'plant', cinema: 'chair' }[id] || id;
    const piece = target.closest('.furniture-piece') || stage.querySelector(`[data-furniture="${furnitureId}"]`);
    if (!piece) return document.createElement('span');
    const object = document.createElement('div'); object.className = 'showcase-object';
    object.style.aspectRatio = piece.style.aspectRatio;
    for (const property of ['--ground-anchor', '--ground-center', '--furniture-perspective'])
      object.style.setProperty(property, piece.style.getPropertyValue(property) || 'none');
    object.append(piece.querySelector('.furniture-art').cloneNode(true));
    return object;
  }
  function showObject(target, id) {
    closeShowcase();
    const config = GROUPS[id], showcase = document.createElement('div');
    showcase.className = 'unlock-showcase'; showcase.style.setProperty('--unlock-color', config.color);
    const visual = document.createElement('div'); visual.className = 'unlock-visual'; visual.append(showcaseArt(target, id));
    const copy = document.createElement('div'); copy.className = 'unlock-copy';
    const eyebrow = document.createElement('span'); eyebrow.textContent = 'A little closer ✦';
    const heading = document.createElement('strong');
    heading.textContent = target.closest('.wall-award') ? target.dataset.milestone === 'gold' ? 'One million people' : 'The first 100K' : config.name;
    const detail = document.createElement('p'); detail.textContent = config.detail;
    const link = document.createElement('button'); link.type = 'button';
    if (config.screening || target.matches('[data-screening]')) link.dataset.screening = '';
    else link.dataset.open = config.chapter;
    link.textContent = config.screening || target.matches('[data-screening]') ? 'Watch the films ↗' : 'Open this story ↗';
    link.addEventListener('click', closeShowcase, { once: true });
    const close = document.createElement('button'); close.type = 'button'; close.className = 'unlock-close'; close.setAttribute('aria-label', 'Close object close-up'); close.textContent = '×';
    close.addEventListener('click', closeShowcase);
    copy.append(eyebrow, heading, detail, link); showcase.append(visual, copy, close); stage.append(showcase);
    currentShowcase = showcase;
    after(12000, () => { if (currentShowcase === showcase) closeShowcase(); });
  }
  function paint(target) {
    const id = groupFor(target);
    if (!active || !id || painted.has(id) || painting.has(id)) return;
    endGuide(); painting.add(id);
    const elements = targetsFor(id);
    for (const element of elements) { element.classList.add('is-painting'); addColorSpot(element); }
    burstAt(target, GROUPS[id].color); showObject(target, id);
    say(`You found ${GROUPS[id].name}! It’s coming to life.`);
    after(reducedMotion.matches ? 0 : 950, () => {
      if (!active) return;
      painting.delete(id); painted.add(id);
      for (const element of elements) { element.classList.remove('is-painting'); element.classList.add('is-painted'); }
      syncButtonNames(); updateProgress();
      say(`${GROUPS[id].name} is in color. Open the story here, or choose another glowing object.`, 5000);
      if (painted.size === GROUP_IDS.length) after(reducedMotion.matches ? 0 : 6500, () => { if (active) complete(undefined, true); });
    });
  }
  function showGuideStep(index) {
    guideStep = index; bubble.classList.add('is-guide'); next.hidden = false;
    say(GUIDE_STEPS[index].message); next.textContent = GUIDE_STEPS[index].button;
  }
  function start() {
    clearTimers(); clearEffects(); active = true; painted.clear(); painting.clear();
    stage.querySelectorAll('.is-painted, .is-painting').forEach(element => element.classList.remove('is-painted', 'is-painting'));
    stage.classList.add('reveal-active'); stage.classList.remove('reveal-zoom', 'reveal-ready');
    stage.style.setProperty('--intro-fibi-x', fibi.style.left || '50%');
    stage.style.setProperty('--intro-fibi-y', fibi.style.top || '65%');
    const rect = fibi.getBoundingClientRect();
    stage.style.setProperty('--intro-pan-x', `${window.innerWidth / 2 - (rect.left + rect.width / 2)}px`);
    stage.style.setProperty('--intro-pan-y', `${window.innerHeight * .58 - (rect.top + rect.height * .45)}px`);
    guide.setTourMode(true); guide.greet();
    toggle.textContent = 'Skip tour'; toggle.setAttribute('aria-label', 'Skip the guided room tour');
    hint.textContent = 'Fibi will show you around';
    showGuideStep(0); next.hidden = true; updateProgress(); syncButtonNames();
    if (reducedMotion.matches) { stage.classList.add('reveal-ready'); next.hidden = false; return; }
    requestAnimationFrame(() => requestAnimationFrame(() => { if (active) stage.classList.add('reveal-zoom'); }));
    after(1850, () => { if (!active) return; stage.classList.remove('reveal-zoom'); stage.classList.add('reveal-ready'); guide.greet(); next.hidden = false; });
  }
  next.addEventListener('click', () => {
    if (!active) return;
    if (guideStep < GUIDE_STEPS.length - 1) showGuideStep(guideStep + 1);
    else { endGuide(); say('Start with the Oto desk, or choose any glowing object. I’ll meet you there!', 6500); hint.textContent = 'Choose a glowing object to explore'; }
  });
  toggle.addEventListener('click', () => active ? complete('Make yourself at home. Click anything to explore!') : start());
  document.addEventListener('portfolio:view', event => { if (event.detail.showList && active) complete(); });
  document.addEventListener('portfolio:chapter-open', () => { closeShowcase(); hideSpeech(); });
  document.addEventListener('portfolio:screening', event => { if (event.detail.open) closeShowcase(); });
  document.addEventListener('fibi:say', event => { if (!active && !stage.classList.contains('is-arranging')) say(event.detail.text, event.detail.holdMs || 3000); });
  if (!location.hash || location.hash === '#scene-section') start();
  else { for (const id of GROUP_IDS) painted.add(id); syncButtonNames(); }
  return { isLocked: target => { const id = groupFor(target); return active && !!id && !painted.has(id); }, paint, finishAll: () => { if (active) complete('Make yourself at home. Click anything to explore!'); } };
}
