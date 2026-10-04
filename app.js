const config = window.PORTFOLIO;
const dialog = document.querySelector('#project-dialog');
const dialogContent = document.querySelector('#dialog-content');
const character = document.querySelector('#character');
const scene = document.querySelector('#scene');
const listView = document.querySelector('#list-view');
const viewToggle = document.querySelector('#view-toggle');
const chapterOrder = ['oto', 'youtube', 'tiktok', 'analytics', 'about'];
const chapterNames = { youtube: 'YouTube', tiktok: 'TikTok', oto: 'Oto', analytics: 'Analytics', about: 'About me', resume: 'Resume' };
const baseTitle = document.title;
const historyKey = 'todPortfolioRoute';
let currentChapter = 'oto';
let lastFocusedElement;
let previousOverflow = '';
let lastBaseHash = '';
let greetingIndex = 0;
let reactionTimer;
let closing = false;
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const titleHTML = value => escapeHTML(value).replace(/&lt;br&gt;/g, '<br>');
const asArray = value => Array.isArray(value) ? value : [];

function safeURL(value, type = 'link') {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value, window.location.href);
    if (url.username || url.password) return null;
    if (url.protocol === 'https:') return url.href;
    // The local preview uses HTTP. Only known asset types may use its origin.
    const assetRoot = new URL('assets/', window.location.href).pathname;
    const extension = type === 'image' ? /\.(png|jpe?g|webp|avif|gif|svg)$/i : /\.(docx|pdf)$/i;
    if (url.origin === window.location.origin && url.pathname.startsWith(assetRoot) && extension.test(url.pathname)) return url.href;
  } catch { /* Invalid content links are omitted from the page. */ }
  return null;
}

function linkHTML(link, className = 'external-link') {
  const url = safeURL(link?.url);
  if (!url) return '';
  const download = new URL(url).origin === window.location.origin && /\.docx$/i.test(new URL(url).pathname);
  return `<a class="${className}" href="${escapeHTML(url)}" ${download ? 'download' : 'target="_blank" rel="noopener noreferrer"'}>${escapeHTML(link.label)} <span aria-hidden="true">${download ? '↓' : '↗'}</span></a>`;
}

function sourceHTML(source) {
  if (!source) return '';
  return `<p class="source-note">${escapeHTML(source.note)}${source.url ? `<br>${linkHTML(source, 'source-link')}` : ''}</p>`;
}

function resumeContactHTML() {
  const email = config.contact?.email;
  const linkedIn = safeURL(config.contact?.linkedin);
  const links = [];
  if (typeof email === 'string' && /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) links.push(`<a href="mailto:${escapeHTML(email)}">${escapeHTML(email)}</a>`);
  if (linkedIn) links.push(`<a href="${escapeHTML(linkedIn)}" target="_blank" rel="noopener noreferrer">${escapeHTML(linkedIn.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>`);
  return links.length ? `<div class="resume-contact">${links.join('<span aria-hidden="true"> · </span>')}</div>` : '';
}

function videosHTML(videos) {
  const cards = asArray(videos).map((video, index) => {
    const url = safeURL(video.url);
    if (!url || new URL(url).protocol !== 'https:') return '';
    const thumbnail = safeURL(video.thumbnail, 'image');
    return `<a class="video-card" data-screening data-video-index="${index}" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">
      ${thumbnail ? `<img class="video-thumbnail" src="${escapeHTML(thumbnail)}" alt="" width="480" height="270" loading="lazy" decoding="async">` : ''}
      <div class="video-card-copy">${video.format ? `<span class="video-format">${escapeHTML(video.format)}</span>` : ''}<h4>${escapeHTML(video.title)} <span aria-hidden="true">↗</span></h4>${video.metric ? `<p class="video-metric">${escapeHTML(video.metric)}</p>` : ''}${video.description ? `<p>${escapeHTML(video.description)}</p>` : ''}</div>
    </a>`;
  }).join('');
  return cards ? `<section class="selected-videos" aria-labelledby="selected-videos-title"><h3 id="selected-videos-title">Selected videos</h3><div class="video-grid">${cards}</div></section>` : '';
}

function resumeHTML(item) {
  const experience = asArray(item.experience);
  const education = asArray(item.education);
  const skills = asArray(item.skills);
  return `${experience.length ? `<section aria-labelledby="experience-title"><h3 id="experience-title">Experience</h3><div class="experience-list">${experience.map(job => `<article class="experience-item"><div class="experience-heading"><h4>${escapeHTML(job.role)}</h4><span class="experience-date">${escapeHTML(job.date)}</span></div><p class="experience-company">${escapeHTML(job.company)}</p>${job.summary ? `<p>${escapeHTML(job.summary)}</p>` : ''}</article>`).join('')}</div></section>` : ''}
    ${education.length ? `<section aria-labelledby="education-title"><h3 id="education-title">Education</h3><div class="education-list">${education.map(school => `<article class="education-item"><h4>${escapeHTML(school.school)}</h4><p>${escapeHTML(school.degree)}</p>${school.date ? `<span class="education-date">${escapeHTML(school.date)}</span>` : ''}</article>`).join('')}</div></section>` : ''}
    ${skills.length ? `<section aria-labelledby="skills-title"><h3 id="skills-title">Skills & tools</h3><ul class="skills-list">${skills.map(skill => `<li>${escapeHTML(skill)}</li>`).join('')}</ul></section>` : ''}`;
}

function routeFor(key) { return key === 'about' || key === 'resume' ? `#${key}` : `#work/${key}`; }
function chapterFromHash(hash = window.location.hash) {
  return Object.keys(config.chapters).find(key => routeFor(key) === hash) || null;
}
function pageURL(hash) { return `${window.location.pathname}${window.location.search}${hash}`; }
function routeState() { return window.history.state?.[historyKey]; }
function stateWithRoute(route) {
  const state = window.history.state;
  return { ...(state && typeof state === 'object' ? state : {}), [historyKey]: route };
}
function baseHashForRoute() {
  const route = routeState();
  return route?.kind === 'chapter' && typeof route.baseHash === 'string' && !chapterFromHash(route.baseHash) ? route.baseHash : lastBaseHash;
}

function resetShareFeedback() {
  const feedback = document.querySelector('#share-feedback');
  if (feedback) { feedback.replaceChildren(); feedback.hidden = true; }
  const button = document.querySelector('#dialog-copy-link');
  if (button) button.textContent = 'Copy link';
}

function chapterHeadingHTML(item, key) {
  const heading = `<p class="project-kicker">${escapeHTML(item.kicker)}</p><h2 id="dialog-title">${titleHTML(item.title)}</h2>`;
  const portrait = ['about', 'resume'].includes(key) ? safeURL(config.portrait, 'image') : null;
  if (!portrait) return heading;
  return `<div class="chapter-heading"><div class="chapter-heading-copy">${heading}</div><img class="portrait-photo" src="${escapeHTML(portrait)}" alt="${escapeHTML(config.name)}" width="200" height="200" decoding="async"></div>`;
}

function projectGalleryHTML(projects) {
  if (!asArray(projects).length) return '';
  const area = kind => kind === 'APP' ? 'app' : kind === 'GAME' ? 'games' : 'films';
  return `<section class="oto-projects" aria-labelledby="oto-projects-title"><div class="oto-projects-heading"><span class="case-eyebrow">SELECTED WORK / FRISSON LABS</span><h3 id="oto-projects-title">Things you can actually see.</h3><p>Products, games, and films—each marked with its current status and what I contributed.</p></div><div class="oto-project-grid">${projects.map(project => {
    const image = safeURL(project.image, 'image');
    return `<article class="oto-project-card" data-project="${area(project.kind)}">
      <div class="oto-project-media ${area(project.kind)}">${image ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(project.imageAlt || '')}" loading="lazy" decoding="async">` : ''}<span class="oto-project-kind">${escapeHTML(project.kind)}</span></div>
      <div class="oto-project-copy"><span class="oto-project-status"><i aria-hidden="true"></i>${escapeHTML(project.status)}</span><h4>${escapeHTML(project.title)}</h4><p>${escapeHTML(project.text)}</p><small>${escapeHTML(project.contribution)}</small>${project.link ? linkHTML(project.link, 'oto-project-link') : ''}</div>
    </article>`;
  }).join('')}</div><p class="frisson-source">App screenshots are from the public App Store listing; game artwork comes from the Oto project catalog. Work was completed with the Frisson Labs team.</p></section>`;
}

function instagramReel(value) {
  const url = safeURL(value);
  if (!url) return null;
  const parsed = new URL(url);
  if (!['instagram.com', 'www.instagram.com'].includes(parsed.hostname)) return null;
  const match = parsed.pathname.match(/^\/(?:[a-zA-Z0-9_.]+\/)?reel\/([a-zA-Z0-9_-]+)\/?$/);
  return match ? { url: `https://www.instagram.com/reel/${match[1]}/`, embed: `https://www.instagram.com/reel/${match[1]}/embed/` } : null;
}

function channelHTML(channel) {
  const url = safeURL(channel?.url);
  if (!url) return '';
  return `<section class="frisson-channel" aria-label="Instagram channel"><div class="frisson-channel-mark" aria-hidden="true">@</div><div class="frisson-channel-copy"><span class="case-eyebrow">THE CHANNEL I CREATED</span><h3>${escapeHTML(channel.handle)}</h3><p>Short-form stories that introduce the companions and give people a reason to meet them.</p><small>${escapeHTML(channel.note)}</small></div><div class="frisson-channel-stat"><strong>${escapeHTML(channel.followers)}</strong><span>followers</span><a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">Visit the channel ↗</a></div></section>`;
}

function reelsHTML(reels, source) {
  const entries = asArray(reels).map(reel => ({ ...reel, link: instagramReel(reel.url) })).filter(reel => reel.link);
  if (!entries.length) return '';
  return `<section class="frisson-films" aria-labelledby="frisson-films-title"><div class="frisson-section-heading"><span class="case-eyebrow">01 / THE SHORT-FORM STUDIO</span><h3 id="frisson-films-title">Three ways I told the Oto story.</h3><p>I develop the idea, use tools including Seedance, Kling, and CapCut across my short-form work, then edit and review the response. These public Reels show animation, product storytelling, and me on camera.</p><div class="frisson-process" aria-label="My short-form workflow"><span>Concept</span><span aria-hidden="true">→</span><span>Animate & edit</span><span aria-hidden="true">→</span><span>Review the response</span></div></div><div class="frisson-film-grid">${entries.map((reel, index) => `
    <article class="frisson-film" data-film="${index + 1}"><a class="frisson-film-poster" href="${escapeHTML(reel.link.embed)}" target="_blank" rel="noopener noreferrer" aria-label="Watch ${escapeHTML(reel.title)} in Instagram's public player"><span class="film-reel-number">0${index + 1} / ${escapeHTML(reel.type)}</span><span class="film-reel-art" aria-hidden="true"><span></span><span></span><span></span></span><span class="film-play" aria-hidden="true">▶</span><span class="film-poster-cta">Watch the Reel ↗</span></a><div class="frisson-film-copy"><h4>${escapeHTML(reel.title)}</h4>${reel.result ? `<strong class="film-result">${escapeHTML(reel.result)}</strong>` : ''}<p>${escapeHTML(reel.note)}</p><a href="${escapeHTML(reel.link.url)}" target="_blank" rel="noopener noreferrer">Open original ↗</a></div></article>`).join('')}</div><p class="frisson-source">${escapeHTML(source?.note || '')}</p></section>`;
}

function productHTML(product) {
  if (!product) return '';
  const screenshots = asArray(product.screenshots).map(shot => ({ ...shot, src: safeURL(shot.src, 'image') })).filter(shot => shot.src);
  return `<section class="frisson-product" aria-labelledby="frisson-product-title">
    <div class="frisson-section-heading"><span class="case-eyebrow">02 / THE PRODUCT</span><h3 id="frisson-product-title">${escapeHTML(product.title)}</h3><p>${escapeHTML(product.text)}</p></div>
    <div class="frisson-product-layout"><div class="oto-device"><div class="oto-device-top"><span>oto / app preview</span><span class="oto-preview-live">AUTO</span></div><div class="oto-device-screen" role="img" aria-label="Auto-playing sequence of official Oto App Store screenshots">${screenshots.map((shot, index) => `<img src="${escapeHTML(shot.src)}" alt="" aria-hidden="true" style="--preview-index:${index}" loading="lazy" decoding="async">`).join('')}</div><div class="oto-device-bottom"><span>01—0${screenshots.length} · OFFICIAL APP STORE SCREENS</span><button type="button" id="oto-preview-toggle" aria-pressed="false">Pause preview</button></div></div><ol class="oto-product-steps">${asArray(product.steps).map(step => `<li><strong>${escapeHTML(step.label)}</strong><span>${escapeHTML(step.text)}</span></li>`).join('')}</ol></div>
    ${screenshots.length ? `<div class="oto-app-gallery-heading"><strong>Inside the shipped app</strong><span>Scroll to see more →</span></div><div class="oto-app-gallery" aria-label="Official Oto App Store screenshots">${screenshots.map(shot => `<figure><img src="${escapeHTML(shot.src)}" alt="${escapeHTML(shot.alt)}" width="314" height="680" loading="lazy" decoding="async"><figcaption>${escapeHTML(shot.label)}</figcaption></figure>`).join('')}</div><p class="frisson-source">Screenshots from the public Oto App Store listing. Product features were built with the Frisson Labs team.</p>` : ''}
    <div class="frisson-case-links"><a href="https://apps.apple.com/us/app/oto-ai-voice-companion/id6754143501" target="_blank" rel="noopener noreferrer">Explore the iPhone app ↗</a><a href="https://www.oto.chat/otomates" target="_blank" rel="noopener noreferrer">Meet Fibi in the public gallery ↗</a></div>
  </section>`;
}

function communityHTML() {
  return `<section class="frisson-community" aria-labelledby="frisson-community-title"><div class="frisson-section-heading"><span class="case-eyebrow">03 / THE COMMUNITY</span><h3 id="frisson-community-title">Give people a reason to stay.</h3><p>My work connects content, the product, and the people around it. At Frisson Labs I brought 15,000 people to Discord; Oto has more than 10,000 downloads. These are separate milestones, not a claimed video-to-download conversion.</p></div><div class="frisson-community-path" aria-label="Content, product, and community are connected parts of the work"><span>Discover through a story</span><span aria-hidden="true">→</span><span>Meet an Otomate</span><span aria-hidden="true">→</span><span>Join the community</span></div><p class="frisson-source">Discord and download figures provided by Tod, September 2026. Product work was completed with the Frisson Labs team.</p></section>`;
}

function milestonesHTML(item) {
  const milestones = asArray(item.milestones).filter(entry => ['silver', 'gold'].includes(entry.metal));
  if (!milestones.length) return '';
  const source = item.milestoneSource;
  const url = safeURL(source?.url);
  return `<div class="milestone-stories" aria-label="YouTube milestone stories">${milestones.map(entry => `<article class="milestone-story" data-metal="${entry.metal}"><span class="milestone-number">${escapeHTML(entry.value)}</span><h3>${escapeHTML(entry.title)}</h3><p>${escapeHTML(entry.text)}</p></article>`).join('')}</div>${url ? `<p class="milestone-source">${escapeHTML(source.note)} <a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(source.label)} ↗</a></p>` : ''}`;
}

function renderChapter(key) {
  const item = config.chapters[key];
  if (!item) return;
  currentChapter = key;
  if (!dialog.open) {
    lastFocusedElement = document.activeElement !== document.body ? document.activeElement : document.querySelector(`[data-open="${key}"]`) || viewToggle;
    previousOverflow = document.body.style.overflow;
  }
  const metrics = asArray(item.metrics);
  const meta = asArray(item.meta);
  document.querySelector('#dialog-label').textContent = `${item.number ? `${item.number} / ` : ''}${item.label}`;
  dialog.dataset.chapter = key;
  const fromAward = key === 'youtube' && ['silver', 'gold'].includes(dialog.dataset.award);
  dialogContent.innerHTML = `
    ${chapterHeadingHTML(item, key)}
    ${key === 'resume' ? resumeContactHTML() : ''}
    ${fromAward ? milestonesHTML(item) : ''}
    ${item.cover && safeURL(item.cover.image, 'image') ? `<figure class="chapter-cover"><img src="${escapeHTML(safeURL(item.cover.image, 'image'))}" alt="${escapeHTML(item.cover.alt)}" width="1280" height="211"><figcaption>${escapeHTML(item.cover.caption)}</figcaption></figure>` : ''}
    <p class="dialog-lead">${escapeHTML(item.lead)}</p>
    ${fromAward ? '' : milestonesHTML(item)}
    ${meta.length ? `<dl class="project-meta">${meta.map(entry => `<div><dt>${escapeHTML(entry.label)}</dt><dd>${escapeHTML(entry.value)}</dd></div>`).join('')}</dl>` : ''}
    ${metrics.length ? `<div class="metric-grid">${metrics.map(metric => `<div class="metric"><strong>${escapeHTML(metric.value)}</strong><span>${escapeHTML(metric.label)}</span></div>`).join('')}</div>` : ''}
    ${metrics.length ? sourceHTML(item.source) : ''}
    ${key === 'oto' ? projectGalleryHTML(item.projects) : ''}
    ${key === 'oto' ? channelHTML(item.channel) : ''}
    ${reelsHTML(item.reels, item.reelSource)}
    ${key === 'oto' ? productHTML(item.productShowcase) : ''}
    ${key === 'oto' ? communityHTML() : ''}
    ${asArray(item.sections).map(section => `<section class="project-section"><h3>${escapeHTML(section.title)}</h3>${section.text ? `<p>${escapeHTML(section.text)}</p>` : ''}${asArray(section.bullets).length ? `<ul class="project-bullets">${section.bullets.map(bullet => `<li>${escapeHTML(bullet)}</li>`).join('')}</ul>` : ''}</section>`).join('')}
    ${videosHTML(item.videos)}
    ${resumeHTML(item)}
    ${item.quote ? `<blockquote class="featured-quote">${escapeHTML(item.quote)}</blockquote><p class="source-note">${escapeHTML(item.quoteCredit)}</p>` : ''}
    ${asArray(item.tags).length ? `<div class="project-tags">${item.tags.map(tag => `<span>${escapeHTML(tag)}</span>`).join('')}</div>` : ''}
    ${key === 'about' ? `<div class="project-links"><button class="external-link" data-open="resume">View résumé <span aria-hidden="true">↗</span></button><a class="external-link" href="mailto:${escapeHTML(config.contact.email)}">Email me <span aria-hidden="true">↗</span></a></div>` : ''}
    ${item.link || asArray(item.links).length || (key === 'resume' && config.resumeDownload) ? `<div class="project-links">${key === 'resume' && config.resumeDownload ? linkHTML({ label: 'Download original résumé (Word)', url: config.resumeDownload }) : ''}${item.link ? linkHTML(item.link) : ''}${asArray(item.links).map(link => linkHTML(link)).join('')}</div>` : ''}
    ${!metrics.length ? sourceHTML(item.source) : ''}
    ${item.pending ? `<p class="pending-note">${escapeHTML(item.pending)}</p>` : ''}
  `;
  resetShareFeedback();
  document.title = `${chapterNames[key] || item.label} — ${config.name}`;
  document.dispatchEvent(new CustomEvent('portfolio:chapter-open', { detail: { chapter: key } }));
  document.querySelector('#speech-message').textContent = key === 'resume' ? "Here's a little more about Tod." : `Let's explore ${key === 'about' ? "Tod's story" : chapterNames[key]}!`;
  const nextKey = chapterOrder[(chapterOrder.indexOf(key) + 1) % chapterOrder.length];
  const nextButton = document.querySelector('#dialog-next');
  nextButton.textContent = `Next: ${chapterNames[nextKey]} →`;
  nextButton.hidden = key === 'resume';
  const printButton = document.querySelector('#dialog-print');
  if (printButton) printButton.hidden = key !== 'resume';
  if (!dialog.open) { dialog.showModal(); document.body.style.overflow = 'hidden'; }
  dialog.scrollTop = 0;
  document.querySelector('#dialog-close').focus({ preventScroll: true });
}

function hideChapter() {
  closing = false;
  if (!dialog.open) return;
  dialog.close();
  document.body.style.overflow = previousOverflow;
  document.title = baseTitle;
  resetShareFeedback();
  const focusTarget = lastFocusedElement?.isConnected && lastFocusedElement.getClientRects().length ? lastFocusedElement : viewToggle;
  focusTarget?.focus({ preventScroll: true });
}

function pushChapter(key) {
  // A direct URL first receives its own local room entry. Closing cannot leave the site.
  const hash = window.location.hash;
  const baseHash = chapterFromHash(hash) ? baseHashForRoute() : hash;
  lastBaseHash = baseHash;
  window.history.replaceState(stateWithRoute({ kind: 'base', version: 1 }), '', pageURL(baseHash));
  window.history.pushState(stateWithRoute({ kind: 'chapter', version: 1, key, baseHash }), '', pageURL(routeFor(key)));
}

function openChapter(key, { replace = false, source = document.activeElement } = {}) {
  if (!config.chapters[key]) return;
  const origin = source?.getBoundingClientRect?.();
  closing = false;
  const currentKey = chapterFromHash();
  if (currentKey && routeState()?.kind === 'chapter') {
    if (currentKey !== key) window.history.replaceState(stateWithRoute({ ...routeState(), key }), '', pageURL(routeFor(key)));
  } else if (replace && dialog.open) {
    window.history.replaceState(stateWithRoute({ kind: 'chapter', version: 1, key, baseHash: lastBaseHash }), '', pageURL(routeFor(key)));
  } else pushChapter(key);
  dialog.dataset.award = key === 'youtube' && ['silver', 'gold'].includes(source?.dataset?.milestone) ? source.dataset.milestone : '';
  renderChapter(key);
  if (origin) {
    const bounds = dialog.getBoundingClientRect();
    dialog.style.setProperty('--entry-x', `${Math.max(0, Math.min(bounds.width, origin.left + origin.width / 2 - bounds.left))}px`);
    dialog.style.setProperty('--entry-y', `${Math.max(0, Math.min(bounds.height, origin.top + origin.height / 2 - bounds.top))}px`);
  }
}

function closeChapter() {
  if (!dialog.open || closing) return;
  closing = true;
  if (chapterFromHash() && routeState()?.kind === 'chapter') {
    window.history.back();
  } else {
    window.history.replaceState(stateWithRoute({ kind: 'base', version: 1 }), '', pageURL(lastBaseHash));
    hideChapter();
  }
}

function syncRoute() {
  closing = false;
  const key = chapterFromHash();
  if (!key) { lastBaseHash = window.location.hash; hideChapter(); return; }
  const route = routeState();
  // Native hash navigation and pasted links do not have an owned base entry yet.
  if (route?.kind !== 'chapter' || route.key !== key || route.version !== 1) pushChapter(key);
  if (!dialog.open || currentChapter !== key) renderChapter(key);
}

function setView(showList) {
  document.dispatchEvent(new CustomEvent('portfolio:view', { detail: { showList } }));
  scene.hidden = showList;
  listView.hidden = !showList;
  viewToggle.setAttribute('aria-pressed', String(showList));
  viewToggle.textContent = showList ? 'Back to the room' : 'List view';
}

document.addEventListener('click', event => {
  const previewToggle = event.target.closest?.('#oto-preview-toggle');
  if (previewToggle) {
    const paused = previewToggle.getAttribute('aria-pressed') !== 'true';
    previewToggle.setAttribute('aria-pressed', String(paused));
    previewToggle.textContent = paused ? 'Play preview' : 'Pause preview';
    previewToggle.closest('.oto-device')?.classList.toggle('is-paused', paused);
    return;
  }
  const trigger = event.target.closest?.('[data-open]');
  if (!trigger || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (!config.chapters[trigger.dataset.open]) return;
  event.preventDefault();
  openChapter(trigger.dataset.open, { source: trigger });
  if (trigger.dataset.note) {
    const section = { product: '[data-project="app"]', community: '[data-project="games"]', films: '[data-project="films"]' }[trigger.dataset.note];
    requestAnimationFrame(() => dialog.querySelector(section)?.scrollIntoView({ block: 'start', behavior: 'instant' }));
  }
});
document.addEventListener('room:open-chapter', event => {
  const chapter = event.detail.chapter;
  const source = document.querySelector(`.furniture-piece[data-chapter="${chapter}"] .furniture-hit`);
  if (chapter === 'youtube') {
    document.dispatchEvent(new CustomEvent('portfolio:request-screening', { detail: { index: 2, filter: 'all', source } }));
  } else openChapter(chapter, { source });
});
document.addEventListener('portfolio:hide-case-for-screening', () => {
  if (!dialog.open) return;
  lastBaseHash = baseHashForRoute();
  window.history.replaceState(stateWithRoute({ kind: 'base', version: 1 }), '', pageURL(lastBaseHash));
  hideChapter();
});
document.addEventListener('portfolio:show-video-case', () => openChapter('youtube', { source: document.querySelector('[data-furniture="chair"] .furniture-hit') }));
document.querySelector('#tour-button')?.addEventListener('click', event => { event.preventDefault(); openChapter('oto', { source: event.currentTarget }); });
document.querySelector('#dialog-close').addEventListener('click', closeChapter);
document.querySelector('#dialog-back').addEventListener('click', closeChapter);
document.querySelector('#dialog-next').addEventListener('click', () => openChapter(chapterOrder[(chapterOrder.indexOf(currentChapter) + 1) % chapterOrder.length], { replace: true }));
dialog.addEventListener('cancel', event => { event.preventDefault(); closeChapter(); });
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeChapter();
});
window.addEventListener('popstate', syncRoute);
window.addEventListener('hashchange', syncRoute);

document.querySelector('#dialog-copy-link')?.addEventListener('click', async () => {
  const chapter = currentChapter;
  const url = new URL(routeFor(chapter), window.location.href).href;
  const button = document.querySelector('#dialog-copy-link');
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(url);
    if (currentChapter !== chapter || !dialog.open) return;
    button.textContent = 'Link copied ✓';
    const feedback = document.querySelector('#share-feedback');
    if (feedback) { feedback.textContent = 'Chapter link copied.'; feedback.hidden = false; }
  } catch {
    if (currentChapter !== chapter || !dialog.open) return;
    const feedback = document.querySelector('#share-feedback');
    if (!feedback) return;
    const label = document.createElement('label');
    label.textContent = 'Copy this chapter link:';
    const input = document.createElement('input');
    input.className = 'permalink-input'; input.type = 'url'; input.readOnly = true; input.value = url;
    input.setAttribute('aria-label', 'Chapter link');
    label.append(input); feedback.replaceChildren(label); feedback.hidden = false;
    input.focus(); input.select();
  }
});
document.querySelector('#dialog-print')?.addEventListener('click', () => { if (currentChapter === 'resume') window.print(); });
viewToggle.addEventListener('click', () => setView(!scene.hidden));
// One small menu holds everything that is not part of the room itself.
const menuButton = document.querySelector('#room-menu-button');
const menu = document.querySelector('#room-menu');
function setMenu(open) {
  menu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  if (open) menu.querySelector('a, button')?.focus({ preventScroll: true });
}
menuButton.addEventListener('click', () => setMenu(menu.hidden));
menu.addEventListener('click', event => { if (event.target.closest('a, button')) setMenu(false); });
document.addEventListener('click', event => { if (!menu.hidden && !event.target.closest('.room-menu')) setMenu(false); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { setMenu(false); menuButton.focus(); } });
document.addEventListener('room:placed', () => {
  const reactions = ['A lovely spot!', 'Now it feels like home.', 'A little change. A little joy.'];
  document.dispatchEvent(new CustomEvent('fibi:say', { detail: { text: reactions[greetingIndex++ % reactions.length], holdMs: 2200 } }));
  clearTimeout(reactionTimer);
  character.classList.remove('is-delighted');
  requestAnimationFrame(() => character.classList.add('is-delighted'));
  reactionTimer = window.setTimeout(() => character.classList.remove('is-delighted'), 900);
});
document.addEventListener('keydown', event => {
  if (document.querySelector('dialog[open]') || !event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
  if (['1', '2', '3'].includes(event.key)) { event.preventDefault(); openChapter(chapterOrder[Number(event.key) - 1]); }
});
const characterImage = document.querySelector('#character-image');
characterImage.setAttribute('aria-label', `${config.character.name}, your little room guide`);
document.querySelector('#speech-message').textContent = `Hi, I'm ${config.character.name}! Make yourself at home.`;
document.querySelector('.character-name').innerHTML = `${escapeHTML(config.character.name)} <span>your guide</span>`;
document.querySelector('#fibi-button').setAttribute('aria-label', `Say hello to ${config.character.name}`);
document.querySelector('#year').textContent = String(new Date().getFullYear());
syncRoute();
