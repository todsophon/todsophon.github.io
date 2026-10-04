/* A small, self-contained cinema. Video media loads only after pressing Play. */
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

function youtubeVideo(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    let id;
    if (host === 'youtu.be') id = url.pathname.split('/')[1];
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
      const parts = url.pathname.split('/').filter(Boolean);
      id = parts[0] === 'watch' ? url.searchParams.get('v') : ['shorts', 'embed'].includes(parts[0]) ? parts[1] : null;
    }
    return VIDEO_ID.test(id || '') ? { id, url: `https://www.youtube.com/watch?v=${id}` } : null;
  } catch { return null; }
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text);
  return element;
}

function button(className, text, label) {
  const element = node('button', className, text);
  element.type = 'button';
  if (label) element.setAttribute('aria-label', label);
  return element;
}

/** `index` addresses the original content.js videos array; the default is Tod's on-camera film. */
export function createScreeningRoom({ onOpen, onClose } = {}) {
  const chapter = window.PORTFOLIO?.chapters?.youtube;
  const videos = (Array.isArray(chapter?.videos) ? chapter.videos : []).flatMap((video, index) => {
    const parsed = youtubeVideo(video?.url);
    return parsed ? [{ ...video, ...parsed, index, short: /short/i.test(video.format || '') }] : [];
  });
  // Lead with the personal film, then show the character-led shorts.
  const ordered = [...videos].sort((a, b) => Number(a.short) - Number(b.short) || a.index - b.index);
  const dialog = node('dialog', 'screening-dialog');
  dialog.id = 'screening-dialog';
  dialog.setAttribute('aria-labelledby', 'screening-title');
  dialog.setAttribute('aria-describedby', 'screening-intro');
  const shell = node('div', 'screening-shell');
  const header = node('header', 'screening-header');
  const identity = node('div', 'screening-identity');
  const identityMark = node('span', 'screening-identity-mark', '▶');
  identityMark.setAttribute('aria-hidden', 'true');
  const identityCopy = node('div', 'screening-identity-copy');
  identityCopy.append(node('span', 'screening-eyebrow', 'TOD’S SCREENING ROOM'));
  const heading = node('h2', 'screening-title', 'A few stories. Press play.');
  heading.id = 'screening-title';
  identityCopy.append(heading);
  identity.append(identityMark, identityCopy);
  const closeButton = button('screening-close', '×', 'Close screening room');
  header.append(identity, closeButton);

  const body = node('div', 'screening-body');
  const stageColumn = node('div', 'screening-stage-column');
  const stage = node('div', 'screening-stage');
  const poster = button('screening-poster', undefined, 'Play selected video');
  const posterImage = node('img', 'screening-poster-image');
  posterImage.alt = '';
  posterImage.width = 480;
  posterImage.height = 360;
  posterImage.decoding = 'async';
  const playAffordance = node('span', 'screening-play-affordance');
  const playIcon = node('span', 'screening-play-icon', '▶');
  playIcon.setAttribute('aria-hidden', 'true');
  playAffordance.append(playIcon, node('span', 'screening-play-label', 'Play film'));
  poster.append(posterImage, playAffordance);
  const curtains = node('div', 'screening-curtains');
  curtains.setAttribute('aria-hidden', 'true');
  curtains.append(node('span'), node('span'));
  stage.append(poster, curtains);
  const stageNote = node('p', 'screening-stage-note', 'Pick a story below. Sound starts when you press play.');
  stageNote.id = 'screening-intro';
  stageColumn.append(stage, stageNote);

  const details = node('section', 'screening-details');
  details.setAttribute('aria-labelledby', 'screening-film-title');
  const position = node('div', 'screening-position');
  const nowShowing = node('span', 'screening-eyebrow', 'NOW SHOWING');
  const counter = node('span', 'screening-counter');
  position.append(nowShowing, counter);
  const format = node('p', 'screening-format');
  const title = node('h3', 'screening-film-title');
  title.id = 'screening-film-title';
  const description = node('p', 'screening-description');
  const metric = node('p', 'screening-metric');
  const metricValue = node('strong');
  const metricNote = node('span', '', 'Recorded September 21, 2026');
  metric.append(metricValue, metricNote);
  const external = node('a', 'screening-youtube', 'Watch on YouTube ↗');
  external.target = '_blank';
  external.rel = 'noopener noreferrer';
  const storyButton = button('screening-case', 'Results & process ↗');
  const navigation = node('div', 'screening-navigation');
  const previousButton = button('screening-step', '←', 'Previous video');
  const nextButton = button('screening-step', '→', 'Next video');
  const keyboardHint = node('span', 'screening-keyboard-hint', 'A different story');
  navigation.append(previousButton, keyboardHint, nextButton);
  details.append(position, format, title, description, metric, external, storyButton, navigation);
  body.append(stageColumn, details);

  const collection = node('section', 'screening-collection');
  collection.setAttribute('aria-labelledby', 'screening-collection-title');
  const collectionHeader = node('div', 'screening-collection-header');
  const collectionHeading = node('h3', 'screening-eyebrow', 'THE COLLECTION');
  collectionHeading.id = 'screening-collection-title';
  const filters = node('div', 'screening-filters');
  filters.setAttribute('role', 'group');
  filters.setAttribute('aria-label', 'Filter videos by format');
  const filterButtons = new Map();
  for (const [key, label] of [['all', 'All films'], ['shorts', 'Shorts'], ['long-form', 'Long-form']]) {
    const item = button('screening-filter', label);
    item.dataset.filter = key;
    item.setAttribute('aria-pressed', 'false');
    filterButtons.set(key, item);
    filters.append(item);
  }
  collectionHeader.append(collectionHeading, filters);
  const filmstrip = node('div', 'screening-filmstrip');
  const filmButtons = new Map();
  for (const video of ordered) {
    const item = button('screening-film');
    item.dataset.videoIndex = String(video.index);
    item.setAttribute('aria-label', `Select ${video.title}`);
    item.setAttribute('aria-pressed', 'false');
    const imageWrap = node('span', 'screening-film-image-wrap');
    const image = node('img', 'screening-film-image');
    image.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
    image.alt = '';
    image.width = 480;
    image.height = 360;
    image.loading = 'lazy';
    image.decoding = 'async';
    const selectionMark = node('span', 'screening-film-selection', '▶');
    selectionMark.setAttribute('aria-hidden', 'true');
    imageWrap.append(image, selectionMark);
    const copy = node('span', 'screening-film-copy');
    copy.append(node('span', 'screening-film-format', video.format), node('strong', 'screening-film-name', video.title));
    item.append(imageWrap, copy);
    item.addEventListener('click', () => {
      selectVideo(video.index);
      const stageBounds = stage.getBoundingClientRect();
      const headerBounds = header.getBoundingClientRect();
      const dialogBounds = dialog.getBoundingClientRect();
      if (stageBounds.top < headerBounds.bottom || stageBounds.bottom > dialogBounds.bottom) {
        stage.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
    });
    filmButtons.set(video.index, item);
    filmstrip.append(item);
  }
  const sourceNote = node('p', 'screening-source-note', 'Selected work from Todsophon. View counts are dated snapshots, not live totals.');
  collection.append(collectionHeader, filmstrip, sourceNote);
  const status = node('p', 'screening-sr-only');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  shell.append(header, body, collection, status);
  dialog.append(shell);
  document.body.append(dialog);

  let selected = ordered[0] || null;
  let filter = 'all';
  let iframe = null;
  let restoreFocus = null;
  let priorOverflow = '';
  let wasOpen = false;
  let pointerBeganOutside = false;
  let openingFrame = 0;

  function visibleVideos() {
    return ordered.filter(video => filter === 'all' || (filter === 'shorts' ? video.short : !video.short));
  }

  function stopPlayback() {
    const wasPlaying = Boolean(iframe);
    if (iframe) {
      iframe.remove();
      iframe = null;
    }
    stage.classList.remove('is-playing');
    poster.hidden = false;
    stageNote.textContent = 'Pick a story below. Sound starts when you press play.';
    if (wasPlaying) status.textContent = 'Playback stopped. Press play to watch the selected video.';
  }

  function selectVideo(index, announce = true) {
    const next = videos.find(video => video.index === index) || visibleVideos()[0] || ordered[0];
    if (!next) return;
    stopPlayback();
    selected = next;
    title.textContent = next.title || 'Selected video';
    description.textContent = next.description || '';
    format.textContent = next.format || 'YouTube video';
    metricValue.textContent = next.metric || '';
    metric.hidden = !next.metric;
    external.href = next.url;
    posterImage.src = `https://i.ytimg.com/vi/${next.id}/hqdefault.jpg`;
    poster.setAttribute('aria-label', `Play ${next.title}`);
    stage.classList.toggle('is-short', next.short);
    dialog.dataset.videoIndex = String(next.index);
    const visible = visibleVideos();
    counter.textContent = `${String(visible.findIndex(video => video.index === next.index) + 1).padStart(2, '0')} / ${String(visible.length).padStart(2, '0')}`;
    previousButton.disabled = nextButton.disabled = visible.length < 2;
    for (const [indexKey, item] of filmButtons) item.setAttribute('aria-pressed', String(indexKey === next.index));
    status.textContent = announce ? `Selected: ${next.title}. ${next.format || 'Video'}. Press play to watch.` : '';
  }

  function applyFilter(value, preserveSelection = true) {
    filter = filterButtons.has(value) ? value : 'all';
    const visible = visibleVideos();
    for (const [key, item] of filterButtons) item.setAttribute('aria-pressed', String(key === filter));
    for (const video of videos) filmButtons.get(video.index).hidden = !visible.includes(video);
    if (!preserveSelection || !visible.includes(selected)) selectVideo(visible[0]?.index, dialog.open);
    else selectVideo(selected?.index, false);
  }

  function step(amount) {
    const visible = visibleVideos();
    if (visible.length < 2) return;
    const current = visible.indexOf(selected);
    selectVideo(visible[(current + amount + visible.length) % visible.length].index);
  }

  function play() {
    if (!selected || !dialog.open || document.hidden) return;
    stopPlayback();
    iframe = node('iframe', 'screening-player');
    iframe.title = `${selected.title} — YouTube video player`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.src = `https://www.youtube-nocookie.com/embed/${selected.id}?autoplay=1&playsinline=1&rel=0`;
    stage.append(iframe);
    poster.hidden = true;
    stage.classList.add('is-playing');
    const fallback = node('a', 'screening-playback-fallback', 'watch on YouTube ↗');
    fallback.href = selected.url;
    fallback.target = '_blank';
    fallback.rel = 'noopener noreferrer';
    stageNote.replaceChildren('If the player doesn’t load, ', fallback, '.');
    status.textContent = `Opening the player for ${selected.title}. If the player is unavailable, use Watch on YouTube.`;
    iframe.focus();
  }

  function finishClose() {
    if (!wasOpen) return;
    wasOpen = false;
    cancelAnimationFrame(openingFrame);
    stopPlayback();
    dialog.classList.remove('is-entering');
    document.body.style.overflow = priorOverflow;
    onClose?.();
    if (restoreFocus?.isConnected && !restoreFocus.closest('[hidden]')) restoreFocus.focus({ preventScroll: true });
    restoreFocus = null;
  }

  function close() {
    stopPlayback();
    if (dialog.open) dialog.close();
    finishClose();
  }

  function open({ index = 2, source = null, filter: requestedFilter = 'all' } = {}) {
    if (!videos.length) return;
    const alreadyOpen = dialog.open;
    if (!alreadyOpen) {
      restoreFocus = source instanceof HTMLElement ? source : document.activeElement instanceof HTMLElement ? document.activeElement : null;
      priorOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      wasOpen = true;
    }
    selected = videos.find(video => video.index === index) || ordered[0];
    applyFilter(requestedFilter);
    if (!alreadyOpen) {
      dialog.showModal();
      onOpen?.();
      const sourceRect = source?.getBoundingClientRect?.() || source;
      const bounds = dialog.getBoundingClientRect();
      const originX = Number.isFinite(sourceRect?.left) ? sourceRect.left + sourceRect.width / 2 - bounds.left : bounds.width / 2;
      const originY = Number.isFinite(sourceRect?.top) ? sourceRect.top + sourceRect.height / 2 - bounds.top : bounds.height;
      dialog.style.setProperty('--screening-origin', `${originX}px ${originY}px`);
      dialog.classList.add('is-entering');
      openingFrame = requestAnimationFrame(() => closeButton.focus({ preventScroll: true }));
    }
    dialog.scrollTop = 0;
  }

  closeButton.addEventListener('click', close);
  poster.addEventListener('click', play);
  previousButton.addEventListener('click', () => step(-1));
  nextButton.addEventListener('click', () => step(1));
  for (const [key, item] of filterButtons) item.addEventListener('click', () => applyFilter(key));
  storyButton.addEventListener('click', () => {
    close();
    document.dispatchEvent(new CustomEvent('portfolio:show-video-case', { detail: { chapter: 'youtube' } }));
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('close', () => { if (!dialog.open) finishClose(); });
  dialog.addEventListener('pointerdown', event => { pointerBeganOutside = event.target === dialog && outsideDialog(event); });
  dialog.addEventListener('click', event => {
    if (event.target === dialog && pointerBeganOutside && outsideDialog(event)) close();
    pointerBeganOutside = false;
  });
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target.closest('input,textarea,select,[contenteditable="true"],iframe')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      step(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  dialog.addEventListener('animationend', event => {
    if (event.animationName === 'screening-curtain') dialog.classList.remove('is-entering');
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopPlayback(); });

  function outsideDialog(event) {
    const bounds = dialog.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  }

  selectVideo(selected?.index, false);
  return { open, close };
}
