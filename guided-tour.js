// Fibi's guided first visit: a welcome card, six numbered stops she walks to, and a dock
// that shows progress. The room stays fully explorable on its own at every point.
const SEEN_KEY = 'todsophon.tour-seen.v1';
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function createGuidedTour({ stage, guide, keyboard }) {
  const config = window.PORTFOLIO;
  const chapters = config.chapters;
  const metric = (chapter, index) => chapters[chapter]?.metrics?.[index];
  // `anchor` is where the numbered spot sits on its object, as fractions of the object's box.
  const STOPS = [
    { id: 'oto', name: 'Oto', sub: 'Current role', furniture: 'oto', anchor: [.56, .3], anim: 'talking', open: { chapter: 'oto', label: 'Open the Oto story' },
      eyebrow: 'Current role', title: 'Oto at Frisson Labs',
      body: 'Tod connects community growth with hands-on product work across Oto’s companion home, mobile apps, games, and Discord.',
      stats: [metric('oto', 0), metric('oto', 1)] },
    { id: 'youtube', name: 'YouTube', sub: chapters.youtube?.metrics?.[0]?.value ? `${chapters.youtube.metrics[0].value} subs` : 'Creator', furniture: 'youtube', anchor: [.44, .18], anim: 'happy', open: { chapter: 'youtube', label: 'Read the YouTube story' },
      eyebrow: 'YouTube', title: 'From 100K to a million',
      body: 'The silver and gold play buttons on the wall mark each milestone of the Todsophon channel.',
      stats: [metric('youtube', 0), metric('youtube', 1)] },
    { id: 'tiktok', name: 'TikTok', sub: 'Short-form', furniture: 'tiktok', side: 'left', anchor: [.5, .1], anim: 'jumping', open: { chapter: 'tiktok', label: 'Open the TikTok work' },
      eyebrow: 'Short-form', title: 'TikTok & short-form',
      body: 'Short-form ideas shaped by hooks, pacing, and how the audience actually responds.' },
    { id: 'videos', name: 'Videos', sub: 'Watch', furniture: 'chair', side: 'left', anchor: [.42, .4], anim: 'sitLoop', open: { screening: true, label: 'Watch the films' },
      eyebrow: 'Screening room', title: 'Pull up a beanbag',
      body: 'A little gallery of the on-camera videos and Shorts Tod made. Fibi will wait here while you watch.' },
    { id: 'about', name: 'Meet Tod', sub: 'About', selector: '.wall-portrait', anchor: [.62, .5], anim: 'hello', open: { chapter: 'about', label: 'Read Tod’s story' },
      eyebrow: 'About', title: 'Meet Tod',
      body: 'From Thailand to Seattle, with a camera along the way: the person behind the stories, products, and this room.' },
    { id: 'analytics', name: 'Analytics', sub: 'Growth', furniture: 'plant', anchor: [.5, .2], anim: 'thinking', open: { chapter: 'analytics', label: 'See the analytics work' },
      eyebrow: 'Growth', title: 'A head for the numbers',
      body: 'Growth work at Spotly, a Salesforce capstone, and customer churn modeling: the numbers behind creative calls.' },
  ];
  const section = stage.closest('.scene-section');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const bubble = document.querySelector('#speech-bubble');
  const message = document.querySelector('#speech-message');
  const status = document.querySelector('#fibi-status');
  const dialog = document.querySelector('#project-dialog');
  const dockStops = document.querySelector('#dock-stops');
  const dockCount = document.querySelector('#dock-count');
  const dockFill = document.querySelector('#dock-bar-fill');
  const playButton = document.querySelector('#keys-play');
  const soundButton = document.querySelector('#sound-toggle');
  let step = null; // null · 'intro' · 1–6 · 'finale'
  let seen = new Set();
  let speechTimer = 0;
  let toastTimer = 0;
  let spotFrame = 0;
  try { seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY)) || []); } catch { /* Progress lasts for this visit. */ }
  seen = new Set([...seen].filter(id => STOPS.some(stop => stop.id === id)));

  // Numbered spots on the objects themselves.
  const spots = document.createElement('div');
  spots.className = 'tour-spots';
  stage.append(spots);
  const spotButtons = STOPS.map((stop, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tour-spot';
    button.innerHTML = `<span class="tour-spot-label"><b>${escapeHTML(stop.name)}</b><span>${escapeHTML(stop.sub)}</span></span><span class="tour-spot-dot" aria-hidden="true"></span>`;
    button.classList.toggle('is-left', stop.side === 'left');
    button.addEventListener('click', () => goStop(index + 1));
    spots.append(button);
    return button;
  });
  // The same stops in the dock below the room.
  const chipButtons = STOPS.map((stop, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dock-stop';
    button.innerHTML = `<span class="dock-stop-number" aria-hidden="true"></span>${escapeHTML(stop.name)}`;
    button.addEventListener('click', () => goStop(index + 1));
    dockStops.append(button);
    return button;
  });

  const card = document.createElement('div');
  card.className = 'tour-card';
  card.id = 'tour-card';
  card.setAttribute('role', 'region');
  card.setAttribute('aria-label', `${config.character.name}, your guide`);
  card.hidden = true;
  stage.after(card);
  const toast = document.createElement('p');
  toast.className = 'tour-toast';
  toast.setAttribute('role', 'status');
  toast.hidden = true;
  stage.append(toast);

  const targetFor = stop => stop.selector ? stage.querySelector(stop.selector) : stage.querySelector(`[data-furniture="${stop.furniture}"] .furniture-hit`);
  const anchorFor = stop => stop.selector ? stage.querySelector(stop.selector) : stage.querySelector(`[data-furniture="${stop.furniture}"]`);

  function placeSpots() {
    spotFrame = 0;
    const room = stage.getBoundingClientRect();
    if (!room.width) return;
    STOPS.forEach((stop, index) => {
      const box = anchorFor(stop)?.getBoundingClientRect();
      if (!box) return;
      spotButtons[index].style.left = `${(box.left + box.width * stop.anchor[0] - room.left) / room.width * 100}%`;
      spotButtons[index].style.top = `${(box.top + box.height * stop.anchor[1] - room.top) / room.height * 100}%`;
    });
  }
  const queueSpots = () => { if (!spotFrame) spotFrame = requestAnimationFrame(placeSpots); };
  new ResizeObserver(queueSpots).observe(stage);
  new MutationObserver(queueSpots).observe(stage, { subtree: true, attributes: true, attributeFilter: ['style'] });

  function renderProgress() {
    const current = typeof step === 'number' ? STOPS[step - 1].id : null;
    STOPS.forEach((stop, index) => {
      const state = stop.id === current ? 'is-current' : seen.has(stop.id) ? 'is-seen' : '';
      for (const button of [spotButtons[index], chipButtons[index]]) {
        button.classList.remove('is-current', 'is-seen');
        if (state) button.classList.add(state);
        button.querySelector('.tour-spot-dot, .dock-stop-number').textContent = state === 'is-seen' ? '✓' : String(index + 1);
        button.setAttribute('aria-label', `Stop ${index + 1} of ${STOPS.length}: ${stop.name}, ${stop.sub}${seen.has(stop.id) ? ' (seen)' : ''}`);
        if (stop.id === current) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
      }
    });
    stage.classList.toggle('is-touring', typeof step === 'number');
    dockCount.textContent = `${seen.size} of ${STOPS.length} seen`;
    dockFill.style.width = `${seen.size / STOPS.length * 100}%`;
  }
  function saveSeen() {
    try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seen])); } catch { /* Progress lasts for this visit. */ }
  }
  function markSeenId(id) {
    if (!id || seen.has(id)) return;
    seen.add(id); saveSeen(); renderProgress();
  }
  // Clicking an object directly counts too.
  function markSeen(target) {
    const furniture = target.closest('.furniture-piece')?.dataset.furniture;
    const id = target.closest('.wall-portrait') ? 'about' : target.closest('.wall-award') ? 'youtube' : target.closest('.board-note') ? 'oto'
      : { oto: 'oto', youtube: 'youtube', bookshelf: 'youtube', tiktok: 'tiktok', chair: 'videos', plant: 'analytics' }[furniture];
    markSeenId(id);
  }

  function hideSpeech() { clearTimeout(speechTimer); bubble.classList.remove('is-visible'); }
  function say(text, holdMs = 3000) {
    if (!card.hidden) return;
    clearTimeout(speechTimer);
    message.textContent = text; status.textContent = text;
    bubble.classList.add('is-visible');
    speechTimer = setTimeout(hideSpeech, holdMs);
  }
  function showToast(text, ms = 5200) {
    clearTimeout(toastTimer);
    toast.textContent = text; toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, ms);
  }

  function statsHTML(stats = []) {
    const shown = stats.filter(Boolean);
    return shown.length ? `<div class="tour-stats">${shown.map(stat => `<div><strong>${escapeHTML(stat.value)}</strong><span>${escapeHTML(stat.label)}</span></div>`).join('')}</div>` : '';
  }
  function openButton(open) {
    return open.screening
      ? `<button type="button" class="guide-btn is-ghost" data-screening>${escapeHTML(open.label)} <span aria-hidden="true">▶</span></button>`
      : `<button type="button" class="guide-btn is-ghost" data-open="${escapeHTML(open.chapter)}">${escapeHTML(open.label)} <span aria-hidden="true">↗</span></button>`;
  }
  function cardHTML() {
    const name = escapeHTML(config.character.name);
    if (step === 'intro') {
      const returning = seen.size > 0;
      return `<p class="tour-eyebrow">${returning ? 'Welcome back' : 'Welcome in'}</p>
        <h2 class="tour-title">Hi, I’m ${name}, Tod’s guide.</h2>
        <p class="tour-body">Tod makes YouTube videos for ${escapeHTML(metric('youtube', 0)?.value || '1.8M')} subscribers and now helps build AI companions at Oto. This room is his portfolio.${returning ? ` You’ve seen ${seen.size} of ${STOPS.length} stops.` : ' Want the quick tour?'}</p>
        <div class="tour-actions"><button type="button" class="guide-btn" data-tour="start">${returning && seen.size < STOPS.length ? 'Continue the tour' : 'Show me around'} <span class="guide-btn-note">· ${STOPS.length} stops</span></button><button type="button" class="guide-btn is-ghost" data-tour="explore">I’ll explore</button></div>
        <p class="tour-note">In a hurry? <button type="button" class="tour-link" data-open="resume">Open the résumé</button> or <button type="button" class="tour-link" data-tour="list">see everything as a list</button>.</p>`;
    }
    if (step === 'finale') {
      const email = config.contact?.email;
      return `<p class="tour-eyebrow">Tour complete</p>
        <h2 class="tour-title">That’s the whole room!</h2>
        <p class="tour-body">Thanks for visiting. If something here sparked an idea, Tod would love to hear from you.</p>
        <div class="tour-actions">${email ? `<a class="guide-btn" href="mailto:${escapeHTML(email)}">Email Tod</a>` : ''}<button type="button" class="guide-btn is-ghost" data-open="resume">Résumé</button>${config.contact?.linkedin ? `<a class="guide-btn is-ghost" href="${escapeHTML(config.contact.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>` : ''}</div>
        <p class="tour-note">Or tap the floor keyboard. <button type="button" class="tour-link" data-tour="play">Let ${name} play a tune</button> · <button type="button" class="tour-link" data-tour="replay">Replay the tour</button></p>`;
    }
    const stop = STOPS[step - 1];
    const next = STOPS[step];
    return `<p class="tour-eyebrow">Stop ${step} of ${STOPS.length} · ${escapeHTML(stop.eyebrow)}</p>
      <h2 class="tour-title">${escapeHTML(stop.title)}</h2>
      <p class="tour-body">${escapeHTML(stop.body)}</p>
      ${statsHTML(stop.stats)}
      <div class="tour-actions"><button type="button" class="guide-btn is-icon is-ghost" data-tour="back" aria-label="${step === 1 ? 'Back to the welcome' : `Back to ${escapeHTML(STOPS[step - 2].name)}`}"><span aria-hidden="true">←</span></button>${openButton(stop.open)}<button type="button" class="guide-btn is-wide" data-tour="next">${next ? `Next: ${escapeHTML(next.name)}` : 'Finish the tour'} <span aria-hidden="true">→</span></button></div>`;
  }
  function showCard(focus = false) {
    hideSpeech();
    card.innerHTML = `${cardHTML()}<span class="tour-card-tail" aria-hidden="true"></span>`;
    card.dataset.step = String(step);
    card.hidden = false;
    placeCard();
    status.textContent = card.querySelector('.tour-title')?.textContent || '';
    if (focus) card.querySelector('.guide-btn')?.focus({ preventScroll: true });
  }
  function hideCard() { card.hidden = true; }
  // Desktop: the card floats beside Fibi, preferring above her head and never over
  // the object she is presenting. Phones: it sits below the room.
  function placeCard() {
    if (card.hidden) return;
    if (matchMedia('(max-width: 760px)').matches) { card.style.left = card.style.top = ''; return; }
    const feet = guide.feet();
    const room = stage.getBoundingClientRect(), frame = section.getBoundingClientRect();
    if (!feet || !room.width) return;
    const fibi = stage.querySelector('#character').getBoundingClientRect();
    const x = room.left - frame.left + feet.x / 1000 * room.width;
    const footY = room.top - frame.top + feet.y / (2000 / 3) * room.height;
    const head = footY - fibi.height * .78, middle = footY - fibi.height * .45;
    const width = card.offsetWidth, height = card.offsetHeight;
    const bounds = { left: room.left - frame.left + 8, right: room.right - frame.left - 8, top: room.top - frame.top + 6, bottom: room.bottom - frame.top - 6 };
    const clampX = value => Math.max(bounds.left, Math.min(bounds.right - width, value));
    const clampY = value => Math.max(bounds.top, Math.min(bounds.bottom - height, value));
    const object = typeof step === 'number' ? anchorFor(STOPS[step - 1])?.getBoundingClientRect() : null;
    const avoid = object && { left: object.left - frame.left, right: object.right - frame.left, top: object.top - frame.top, bottom: object.bottom - frame.top };
    const overlap = (l, t) => avoid ? Math.max(0, Math.min(l + width, avoid.right) - Math.max(l, avoid.left)) * Math.max(0, Math.min(t + height, avoid.bottom) - Math.max(t, avoid.top)) : 0;
    const candidates = [
      { side: 'above', left: clampX(x - width / 2), top: head - height - 14, fits: head - height - 14 >= bounds.top },
      { side: 'right', left: clampX(x + fibi.width * .42 + 14), top: clampY(middle - height / 2), fits: x + fibi.width * .42 + 14 + width <= bounds.right },
      { side: 'left', left: clampX(x - fibi.width * .42 - 14 - width), top: clampY(middle - height / 2), fits: x - fibi.width * .42 - 14 - width >= bounds.left },
    ];
    for (const candidate of candidates) candidate.cost = (candidate.fits ? 0 : 1e9) + overlap(candidate.left, candidate.top);
    const { side, left, top } = candidates.reduce((best, candidate) => candidate.cost < best.cost ? candidate : best);
    card.dataset.side = side;
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
    card.style.setProperty('--tail-x', `${Math.max(22, Math.min(width - 22, x - left))}px`);
    card.style.setProperty('--tail-y', `${Math.max(22, Math.min(height - 22, footY - fibi.height * .45 - top))}px`);
  }

  function enter() {
    guide.setTourMode(true);
    guide.preload(['talking', 'happy', 'jumping', 'sitLoop', 'thinking', 'dancing']);
  }
  function intro({ walk = true } = {}) {
    enter();
    step = 'intro'; renderProgress(); hideCard();
    const greet = () => { if (step !== 'intro') return; guide.play('hello', 3.4); showCard(); };
    if (walk) guide.walkTo(guide.home(), { onComplete: greet }); else greet();
  }
  function goStop(number, focus = false) {
    const stop = STOPS[number - 1];
    if (!stop) return;
    enter();
    step = number; renderProgress(); hideCard();
    const target = targetFor(stop);
    const arrive = () => {
      if (step !== number) return;
      guide.hold(stop.anim);
      markSeenId(stop.id);
      showCard(focus);
    };
    if (!target) { arrive(); return; }
    guide.visitTarget({ target, furnitureId: stop.furniture || null, quiet: true, reaction: stop.anim, reactionTime: .5, onComplete: arrive });
  }
  function finale(focus = false) {
    enter();
    step = 'finale'; renderProgress(); hideCard();
    guide.walkTo(guide.home(), { reaction: 'dancing', reactionTime: .4, onComplete: () => {
      if (step !== 'finale') return;
      guide.hold('dancing'); showCard(focus);
    } });
  }
  /** End the guided part; Fibi goes back to wandering. */
  function leave() {
    if (step === null) return;
    step = null; hideCard(); renderProgress();
    guide.cancelVisit();
    guide.setTourMode(false);
  }

  card.addEventListener('click', event => {
    const action = event.target.closest('[data-tour]')?.dataset.tour;
    const viaKeyboard = event.detail === 0;
    if (!action) return;
    if (action === 'start') goStop(STOPS.findIndex(stop => !seen.has(stop.id)) + 1 || 1, viaKeyboard);
    else if (action === 'next') typeof step === 'number' && step < STOPS.length ? goStop(step + 1, viaKeyboard) : finale(viaKeyboard);
    else if (action === 'back') step === 1 ? intro() : goStop(step - 1, viaKeyboard);
    else if (action === 'explore') { leave(); showToast('Tap a numbered spot and Fibi will walk you there.'); }
    else if (action === 'list') { leave(); document.querySelector('#view-toggle').click(); }
    else if (action === 'replay') { seen.clear(); saveSeen(); renderProgress(); intro(); }
    else if (action === 'play') { leave(); keyboard?.playTune(); }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !card.hidden && !dialog.open && !stage.classList.contains('is-arranging')) leave();
  });
  document.addEventListener('fibi:say', event => say(event.detail.text, event.detail.holdMs || 3000));
  document.addEventListener('fibi:moved', () => { if (!card.hidden) placeCard(); });
  window.addEventListener('resize', placeCard);
  document.addEventListener('portfolio:view', event => { if (event.detail.showList) leave(); });
  document.addEventListener('portfolio:chapter-open', hideSpeech);

  playButton?.addEventListener('click', () => { leave(); keyboard?.playTune(); });
  const syncSound = () => {
    const on = keyboard?.isSoundOn() ?? true;
    soundButton?.setAttribute('aria-pressed', String(on));
    if (soundButton) soundButton.querySelector('span:last-child').textContent = on ? 'Sound on' : 'Sound off';
  };
  soundButton?.addEventListener('click', () => { keyboard?.setSound(!keyboard.isSoundOn()); syncSound(); });
  syncSound();

  renderProgress();
  placeSpots();
  // Chapter links skip the welcome; everyone else meets Fibi first.
  const chapterLink = /^#(work\/|about$|resume$)/.test(location.hash);
  if (!chapterLink) setTimeout(() => intro({ walk: false }), reducedMotion.matches ? 0 : 450);

  return { leave, pause: leave, markSeen };
}
