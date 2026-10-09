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
  const youtubeEntries = (Array.isArray(chapter?.videos) ? chapter.videos : []).flatMap((video, index) => {
    const parsed = youtubeVideo(video?.url);
    return parsed ? [{ ...video, ...parsed, index, platform: 'YouTube', poster: video.thumbnail || `https://i.ytimg.com/vi/${parsed.id}/hqdefault.jpg`, recorded: video.recorded || 'September 21, 2026', short: /short/i.test(video.format || '') }] : [];
  });
  const reels = (window.PORTFOLIO?.chapters?.oto?.reels || []).flatMap((reel, offset) => {
    try {
      const url = new URL(reel.url);
      const match = url.pathname.match(/^\/reel\/([A-Za-z0-9_-]+)\/?$/);
      if (url.protocol !== 'https:' || !['instagram.com', 'www.instagram.com'].includes(url.hostname) || !match) return [];
      return [{ ...reel, index: (chapter?.videos?.length || 0) + offset, platform: 'Instagram', short: true,
        format: 'Instagram Reel', description: reel.note, metric: reel.result, recorded: 'September 22, 2026',
        embed: `https://www.instagram.com/reel/${match[1]}/embed/` }];
    } catch { return []; }
  });
  const videos = [...youtubeEntries, ...reels];
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
  const heading = node('h2', 'screening-title', 'A few stories I’ve made.');
  heading.id = 'screening-title';
  const intro = node('p', 'screening-subtitle', 'A little mischief, a little imagination. Pick something to watch.');
  intro.id = 'screening-intro';
  identityCopy.append(node('span', 'screening-eyebrow', 'FROM MY CREATIVE DESK'), heading, intro);
  identity.append(identityCopy);
  const closeButton = button('screening-close', '×', 'Close screening room');
  header.append(identity, closeButton);

  const body = node('div', 'screening-body');
  body.hidden = true;
  const returnToCollection = button('screening-return', '← Back to the collection');
  returnToCollection.addEventListener('click', () => {
    stopPlayback();
    body.hidden = true;
    collection.hidden = featured.hidden = false;
    dialog.classList.remove('is-viewing');
    (viewerSource || filmButtons.get(selected?.index))?.focus({ preventScroll: true });
    collection.scrollIntoView({ block: 'start', behavior: 'auto' });
  });
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
  playAffordance.append(playIcon);
  poster.append(posterImage, playAffordance);
  const curtains = node('div', 'screening-curtains');
  curtains.setAttribute('aria-hidden', 'true');
  curtains.append(node('span'), node('span'));
  stage.append(poster);
  const stageNote = node('p', 'screening-stage-note', 'Sound starts when you press play.');
  stageNote.id = 'screening-play-note';
  stageColumn.append(returnToCollection, stage, stageNote);

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
  const storyButton = button('screening-case', 'How the channel grew ↗');
  const navigation = node('div', 'screening-navigation');
  const previousButton = button('screening-step', '←', 'Previous video');
  const nextButton = button('screening-step', '→', 'Next video');
  const keyboardHint = node('span', 'screening-keyboard-hint', 'A different story');
  navigation.append(previousButton, nextButton);
  details.append(format, title, description, metric, external, storyButton, navigation);
  body.append(stageColumn, details);

  const featured = node('section', 'screening-featured');
  featured.setAttribute('aria-labelledby', 'screening-featured-title');
  const featuredHeading = node('h3', 'screening-collection-title', 'Short-form picks');
  featuredHeading.id = 'screening-featured-title';
  const featuredBand = node('div', 'screening-featured-band');
  // Channel Shorts supply portrait covers for the three featured panels.
  const featuredEntries = ordered.filter(video => video.short && video.platform === 'YouTube').slice(0, 3)
    .map(video => ({ video, label: video.title, note: '' }));
  if (!featuredEntries.length) featuredEntries.push(...ordered.filter(video => video.short).slice(0, 3)
    .map(video => ({ video, label: video.title, note: '' })));
  for (const entry of featuredEntries) {
    if (!entry.video) continue;
    const panel = button('screening-featured-panel', undefined, `Watch ${entry.video.title}`);
    const background = node('img', 'screening-featured-background');
    background.src = entry.video.poster; background.alt = ''; background.loading = 'lazy';
    const copy = node('span', 'screening-featured-copy');
    copy.append(node('span', 'screening-featured-platform', [entry.video.platform, entry.video.publishedAge].filter(Boolean).join(' · ')),
      node('strong', 'screening-featured-name', entry.label), node('span', 'screening-featured-note', entry.note));
    panel.append(background, node('span', 'screening-featured-shade'), copy,
      node('span', 'screening-featured-play', `▶ ${entry.video.metric || 'Watch story'}`));
    panel.addEventListener('click', () => showViewer(entry.video.index, panel));
    featuredBand.append(panel);
  }
  featured.append(featuredHeading, featuredBand);

  const collection = node('section', 'screening-collection');
  collection.setAttribute('aria-labelledby', 'screening-collection-title');
  const collectionHeader = node('div', 'screening-collection-header');
  const collectionHeading = node('h3', 'screening-collection-title', 'The collection');
  collectionHeading.id = 'screening-collection-title';
  const filters = node('div', 'screening-filters');
  filters.setAttribute('role', 'group');
  filters.setAttribute('aria-label', 'Filter videos by format');
  const filterButtons = new Map();
  for (const [key, label] of [['all', 'All videos'], ['shorts', 'Short-form'], ['long-form', 'Long-form']]) {
    const item = button('screening-filter', label);
    item.dataset.filter = key;
    item.setAttribute('aria-pressed', 'false');
    filterButtons.set(key, item);
    filters.append(item);
  }
  collectionHeader.append(collectionHeading, filters);
  const filmstrip = node('div', 'screening-filmstrip');
  const bands = [];
  const filmButtons = new Map();
  for (const video of ordered) {
    const formatGroup = video.short ? 'short' : 'long';
    if (bands.at(-1)?.dataset.format !== formatGroup) {
      const band = node('div', 'screening-card-group');
      band.dataset.format = formatGroup;
      band.setAttribute('aria-label', video.short ? 'Short-form videos' : 'Long-form videos');
      band.heading = node('h4', 'screening-group-title', video.short ? 'More short-form' : 'Long-form videos');
      bands.push(band);
      filmstrip.append(band.heading, band);
    }
    const item = button('screening-film');
    item.dataset.format = formatGroup;
    item.dataset.videoIndex = String(video.index);
    item.setAttribute('aria-label', `Select ${video.title}`);
    item.setAttribute('aria-pressed', 'false');
    const imageWrap = node('span', 'screening-film-image-wrap');
    const image = node('img', 'screening-film-image');
    image.src = video.poster;
    image.alt = '';
    image.width = 480;
    image.height = 360;
    image.loading = 'lazy';
    image.decoding = 'async';
    const selectionMark = node('span', 'screening-film-selection', '▶');
    selectionMark.setAttribute('aria-hidden', 'true');
    imageWrap.append(image, selectionMark);
    if (video.duration) imageWrap.append(node('span', 'screening-film-duration', video.duration));
    const copy = node('span', 'screening-film-copy');
    copy.append(node('span', 'screening-film-format', `${video.platform} · ${video.short ? 'Short-form' : 'Long-form'}`),
      node('strong', 'screening-film-name', video.title), node('span', 'screening-film-result', [video.metric, video.publishedAge].filter(Boolean).join(' · ')));
    item.append(imageWrap, copy);
    item.addEventListener('click', () => {
      showViewer(video.index, item);
    });
    filmButtons.set(video.index, item);
    bands.at(-1).append(item);
  }
  const sourceNote = node('p', 'screening-source-note', 'YouTube video counts recorded October 8, 2026; Instagram counts September 22, 2026. These are dated snapshots.');
  collection.append(collectionHeader, filmstrip, sourceNote);
  const status = node('p', 'screening-sr-only');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  shell.append(header, featured, collection, body, status);
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
  let viewerSource = null;

  function showViewer(index, source) {
    viewerSource = source;
    body.hidden = false;
    collection.hidden = featured.hidden = true;
    dialog.classList.add('is-viewing');
    selectVideo(index);
    dialog.scrollTop = 0;
    poster.focus({ preventScroll: true });
  }

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
    stageNote.textContent = 'Sound starts when you press play.';
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
    metricNote.textContent = `Recorded ${next.recorded}`;
    external.href = next.url;
    external.textContent = `Watch on ${next.platform} ↗`;
    storyButton.textContent = next.platform === 'Instagram' ? 'Insights & experiments ↗' : 'Creator story ↗';
    posterImage.src = next.poster;
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
    for (const band of bands) {
      const shown = [...band.children].filter(item => !item.hidden);
      band.hidden = !shown.length;
      band.heading.hidden = band.hidden;
      band.classList.toggle('has-single', shown.length === 1);
    }
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
    iframe.title = `${selected.title}: ${selected.platform} video player`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.src = selected.embed || `https://www.youtube-nocookie.com/embed/${selected.id}?autoplay=1&playsinline=1&rel=0`;
    stage.append(iframe);
    poster.hidden = true;
    stage.classList.add('is-playing');
    const fallback = node('a', 'screening-playback-fallback', `watch on ${selected.platform} ↗`);
    fallback.href = selected.url;
    fallback.target = '_blank';
    fallback.rel = 'noopener noreferrer';
    stageNote.replaceChildren('If the player doesn’t load, ', fallback, '.');
    status.textContent = `Opening the player for ${selected.title}. If the player is unavailable, use Watch on ${selected.platform}.`;
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
    body.hidden = true;
    collection.hidden = featured.hidden = false;
    dialog.classList.remove('is-viewing');
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
    if (source?.dataset?.videoIndex !== undefined) showViewer(index, source);
  }

  closeButton.addEventListener('click', close);
  poster.addEventListener('click', play);
  previousButton.addEventListener('click', () => step(-1));
  nextButton.addEventListener('click', () => step(1));
  for (const [key, item] of filterButtons) item.addEventListener('click', () => applyFilter(key));
  storyButton.addEventListener('click', () => {
    const chapter = selected?.platform === 'Instagram' ? 'oto' : 'youtube';
    close();
    document.dispatchEvent(new CustomEvent('portfolio:show-video-case', { detail: { chapter, section: chapter === 'oto' ? 'experiments' : '' } }));
  });
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    if (!body.hidden) returnToCollection.click(); else close();
  });
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
    if (event.animationName === 'screening-arrive') dialog.classList.remove('is-entering');
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopPlayback(); });

  function outsideDialog(event) {
    const bounds = dialog.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  }

  selectVideo(selected?.index, false);
  return { open, close };
}
