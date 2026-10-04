// The room starts asleep in grayscale. Each story Fibi visits paints its corner back
// into color; when every story is awake, the whole room is in color and she dances.
// Fibi talks in her own small speech bubble; there are no extra panels or labels.
const SEEN_KEY = 'todsophon.tour-seen.v1';
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function createGuidedTour({ stage, guide, keyboard }) {
  const config = window.PORTFOLIO;
  const value = (chapter, index) => config.chapters[chapter]?.metrics?.[index]?.value;
  // Each story: what belongs to it, where its single glow sits, and what Fibi says there.
  const STORIES = [
    { id: 'oto', name: 'Oto desk', selector: '[data-furniture="oto"], .wall-pinboard', beacon: 'oto', color: '#68cbf5', anim: 'talking', chapter: 'oto',
      title: 'Oto at Frisson Labs', line: `Tod’s current role: community growth and hands-on product work on Oto’s apps and games. ${value('oto', 0) || '15K'} people brought to Discord.` },
    { id: 'youtube', name: 'YouTube desk', selector: '[data-furniture="youtube"], [data-furniture="bookshelf"], .wall-award', beacon: 'youtube', color: '#f4c967', anim: 'happy', chapter: 'youtube',
      title: 'From 100K to a million', line: `${value('youtube', 0) || '1.81M'} subscribers and ${value('youtube', 1) || '455M'} views. The play buttons on the wall mark the milestones.` },
    { id: 'tiktok', name: 'Ring light', selector: '[data-furniture="tiktok"]', beacon: 'tiktok', color: '#79d9cf', anim: 'jumping', chapter: 'tiktok',
      title: 'Short-form', line: 'Hooks, pacing, and paying attention to how people actually respond.' },
    { id: 'videos', name: 'Beanbag', selector: '[data-furniture="chair"]', beacon: 'chair', color: '#f1bd76', anim: 'sitLoop', screening: true,
      title: 'The screening beanbag', line: 'Pull up a seat: a little gallery of the videos and Shorts Tod made.' },
    { id: 'about', name: 'Portrait', selector: '.wall-portrait', color: '#d9b6e9', anim: 'hello', chapter: 'about',
      title: 'Meet Tod', line: 'From Thailand to Seattle, with a camera along the way.' },
    { id: 'analytics', name: 'Chart easel', selector: '[data-furniture="plant"]', beacon: 'plant', color: '#b3d98c', anim: 'thinking', chapter: 'analytics',
      title: 'A head for the numbers', line: 'Growth work, a Salesforce capstone, and churn modeling: the numbers behind creative calls.' },
  ];
  const byId = Object.fromEntries(STORIES.map(story => [story.id, story]));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const bubble = document.querySelector('#speech-bubble');
  const message = document.querySelector('#speech-message');
  const actions = document.querySelector('#speech-actions');
  const status = document.querySelector('#fibi-status');
  const dialog = document.querySelector('#project-dialog');
  let awake = new Set();
  let active = false;   // the room is (partly) asleep
  let touring = false;  // Fibi leads from story to story
  let speechTimer = 0;
  try { awake = new Set((JSON.parse(localStorage.getItem(SEEN_KEY)) || []).filter(id => byId[id])); } catch { /* Progress lasts for this visit. */ }

  const elementsFor = story => [...stage.querySelectorAll(story.selector)];
  const targetFor = story => {
    const element = stage.querySelector(story.selector);
    return element?.matches('.furniture-piece') ? element.querySelector('.furniture-hit') : element;
  };
  function storyFor(target) {
    const furniture = target.closest('.furniture-piece')?.dataset.furniture;
    if (target.closest('.wall-portrait')) return byId.about;
    if (target.closest('.wall-award')) return byId.youtube;
    if (target.closest('.board-note, .wall-pinboard')) return byId.oto;
    return STORIES.find(story => story.beacon === furniture) || (furniture === 'bookshelf' ? byId.youtube : null);
  }
  function save() { try { localStorage.setItem(SEEN_KEY, JSON.stringify([...awake])); } catch { /* Progress lasts for this visit. */ } }

  // One soft glow per story, named on hover.
  for (const story of STORIES) {
    const label = story.beacon && stage.querySelector(`[data-furniture="${story.beacon}"] .furniture-label`);
    if (label) label.dataset.name = story.name;
  }
  function syncClasses() {
    stage.classList.toggle('reveal-active', active);
    for (const story of STORIES) for (const element of elementsFor(story)) element.classList.toggle('is-painted', !active || awake.has(story.id));
    for (const story of STORIES) for (const element of elementsFor(story)) {
      const button = element.matches('.furniture-piece') ? element.querySelector('.furniture-hit') : element;
      if (!button?.matches('button')) continue;
      if (!button.dataset.awakeLabel) button.dataset.awakeLabel = button.getAttribute('aria-label') || story.name;
      button.setAttribute('aria-label', active && !awake.has(story.id) ? `Wake up the ${story.name.toLowerCase()} with Fibi` : button.dataset.awakeLabel);
    }
  }

  // Fibi's speech bubble: a line of text and, when useful, one or two small buttons.
  function hideSpeech() { clearTimeout(speechTimer); bubble.classList.remove('is-visible', 'is-guide'); }
  function speak(html, buttons = [], holdMs = 0) {
    clearTimeout(speechTimer);
    message.innerHTML = html;
    status.textContent = message.textContent;
    actions.replaceChildren(...buttons.map(({ label, action, primary, open, screening, href }) => {
      const element = document.createElement(href ? 'a' : 'button');
      element.className = `speech-action${primary ? ' is-primary' : ''}`;
      element.textContent = label;
      if (href) element.href = href; else element.type = 'button';
      if (action) element.dataset.speech = action;
      if (open) element.dataset.open = open;
      if (screening) element.dataset.screening = '';
      return element;
    }));
    actions.hidden = !buttons.length;
    bubble.classList.add('is-visible');
    bubble.classList.toggle('is-guide', buttons.length > 0);
    if (holdMs) speechTimer = setTimeout(hideSpeech, holdMs);
  }
  const remaining = () => STORIES.filter(story => !awake.has(story.id));

  function welcome() {
    const left = remaining().length;
    speak(left === STORIES.length
      ? `<strong>Hi, I’m ${escapeHTML(config.character.name)}!</strong> This is Tod’s room, but it’s still asleep. Tap anything that glows and I’ll wake it up.`
      : `<strong>Welcome back!</strong> ${left} ${left === 1 ? 'corner is' : 'corners are'} still asleep.`,
    [{ label: left === STORIES.length ? 'Show me around' : 'Keep going', action: 'tour', primary: true }, { label: 'I’ll explore', action: 'explore' }]);
  }
  function burstAt(element, color) {
    const room = stage.getBoundingClientRect(), box = element.getBoundingClientRect();
    const x = (box.left + box.width / 2 - room.left) / room.width * 100, y = (box.top + box.height / 2 - room.top) / room.height * 100;
    const spot = document.createElement('span');
    spot.className = 'room-color-spot';
    spot.style.setProperty('--paint-x', `${x}%`); spot.style.setProperty('--paint-y', `${y}%`);
    spot.style.setProperty('--spot-radius', element.matches('.wall-award') ? '7%' : element.matches('.wall-pinboard, .wall-portrait') ? '9%' : '12%');
    stage.insertBefore(spot, stage.querySelector('.tile-room'));
    const burst = document.createElement('span');
    burst.className = 'room-paint-burst'; burst.style.left = `${x}%`; burst.style.top = `${y}%`;
    burst.style.setProperty('--burst-color', color);
    stage.append(burst);
    burst.addEventListener('animationend', () => burst.remove(), { once: true });
  }
  /** Wake one story: paint it into color and let Fibi tell it. */
  function wake(story, target = targetFor(story)) {
    const first = !awake.has(story.id);
    awake.add(story.id); save();
    if (first && active) {
      for (const element of elementsFor(story)) {
        element.classList.add('is-painting');
        burstAt(element, story.color);
        setTimeout(() => element.classList.remove('is-painting'), reducedMotion.matches ? 0 : 950);
      }
    }
    syncClasses();
    guide.hold(story.anim);
    const left = remaining().length;
    const open = story.screening ? { label: 'Watch the films', screening: true, primary: true } : { label: 'Open the story', open: story.chapter, primary: true };
    speak(`<strong>${escapeHTML(story.title)}</strong> ${escapeHTML(story.line)}${active ? `<small>${STORIES.length - left} of ${STORIES.length} awake</small>` : ''}`,
      left ? [open, { label: touring ? 'Next' : 'Next one', action: 'next' }] : [open, { label: 'Finish', action: 'finish' }]);
  }
  function visit(story) {
    const target = targetFor(story);
    hideSpeech();
    guide.setTourMode(true);
    guide.preload([story.anim]);
    if (!target) { wake(story); return; }
    guide.visitTarget({ target, furnitureId: story.beacon || null, quiet: true, reaction: story.anim, reactionTime: .4, onComplete: () => wake(story, target) });
  }
  function next() {
    const story = remaining()[0];
    if (story) visit(story); else finish();
  }
  /** Everything is awake: full color, a little dance, and a way to say hi. */
  function finish() {
    touring = false;
    const wasActive = active;
    active = false; syncClasses();
    // The room is fully in color now; the painted patches are no longer needed.
    stage.querySelectorAll('.room-color-spot').forEach(spot => spot.remove());
    guide.setTourMode(true);
    guide.walkTo(guide.home(), { reaction: 'dancing', reactionTime: .4, onComplete: () => {
      guide.hold('dancing');
      speak(`<strong>${wasActive ? 'The whole room is awake!' : 'That’s everything!'}</strong> Thanks for visiting. If something here sparked an idea, Tod would love to hear from you.`,
        [config.contact?.email && { label: 'Say hi to Tod', href: `mailto:${config.contact.email}`, primary: true }, { label: 'Résumé', open: 'resume' }].filter(Boolean));
      setTimeout(() => { if (!touring) guide.setTourMode(false); }, 9000);
    } });
  }
  function start({ replay = false } = {}) {
    if (replay) { awake.clear(); save(); stage.querySelectorAll('.room-color-spot').forEach(spot => spot.remove()); }
    active = remaining().length > 0;
    touring = false;
    syncClasses();
    if (!active) { guide.setTourMode(false); return; }
    guide.setTourMode(true);
    guide.preload(['hello', 'talking', 'happy']);
    guide.walkTo(guide.home(), { onComplete: () => { guide.play('hello', 3.4); welcome(); } });
  }
  /** Step away from the guided part; the room stays as awake as it is. */
  function leave() {
    touring = false;
    hideSpeech();
    guide.cancelVisit();
    guide.setTourMode(false);
  }

  actions.addEventListener('click', event => {
    const action = event.target.closest('[data-speech]')?.dataset.speech;
    if (!action) { if (event.target.closest('[data-open], [data-screening], a')) setTimeout(hideSpeech, 0); return; }
    if (action === 'tour') { touring = true; next(); }
    else if (action === 'next') { touring = true; next(); }
    else if (action === 'explore') { leave(); speak('Tap anything that glows and I’ll walk you there.', [], 4200); }
    else if (action === 'finish') finish();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && bubble.classList.contains('is-visible') && !dialog.open) hideSpeech();
  });
  // Short remarks from elsewhere (Fibi waking up, a furniture move) never interrupt a story.
  document.addEventListener('fibi:say', event => { if (!bubble.classList.contains('is-guide')) speak(escapeHTML(event.detail.text), [], event.detail.holdMs || 3000); });
  document.addEventListener('portfolio:chapter-open', hideSpeech);
  document.addEventListener('portfolio:view', event => { if (event.detail.showList) leave(); });
  document.querySelector('#tour-replay')?.addEventListener('click', () => start({ replay: true }));
  document.querySelector('#keys-play')?.addEventListener('click', () => { leave(); keyboard?.playTune(); });
  const soundButton = document.querySelector('#sound-toggle');
  const syncSound = () => {
    const on = keyboard?.isSoundOn() ?? true;
    soundButton?.setAttribute('aria-pressed', String(on));
    if (soundButton) soundButton.textContent = on ? 'Keyboard sound: on' : 'Keyboard sound: off';
  };
  soundButton?.addEventListener('click', () => { keyboard?.setSound(!keyboard.isSoundOn()); syncSound(); });
  syncSound();

  // Chapter links open straight to their story with the room awake.
  const chapterLink = /^#(work\/|about$|resume$)/.test(location.hash);
  if (chapterLink) { active = false; syncClasses(); }
  else setTimeout(start, reducedMotion.matches ? 0 : 400);

  return {
    /** A glowing object: Fibi walks there and wakes it instead of opening the story. */
    isAsleep: target => { const story = storyFor(target); return active && !!story && !awake.has(story.id); },
    wakeTarget: target => { const story = storyFor(target); if (story) wake(story, target); },
    markSeen: target => { const story = storyFor(target); if (story && !awake.has(story.id)) { awake.add(story.id); save(); syncClasses(); } },
    leave,
    // Arranging needs to see the real room: wake everything quietly.
    pause: () => {
      hideSpeech(); guide.cancelVisit(); touring = false;
      if (active) { for (const story of STORIES) awake.add(story.id); save(); active = false; syncClasses(); stage.querySelectorAll('.room-color-spot').forEach(spot => spot.remove()); }
      guide.setTourMode(false);
    },
  };
}
