const config = window.PORTFOLIO;
const dialog = document.querySelector('#project-dialog');
const dialogContent = document.querySelector('#dialog-content');
const character = document.querySelector('#character');
const scene = document.querySelector('#scene');
const listView = document.querySelector('#list-view');
const viewToggle = document.querySelector('#view-toggle');
const chapterOrder = ['frisson', 'oto', 'youtube', 'about'];
const chapterNames = { youtube: 'YouTube', tiktok: 'TikTok', oto: 'Oto Projects', frisson: 'Frisson Labs / Oto', contact: 'Get in touch', analytics: 'Analytics', about: 'About', resume: 'Résumé' };
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
    const extension = type === 'image' ? /\.(png|jpe?g|webp|avif|gif|svg)$/i : type === 'video' ? /\.(mp4|webm)$/i : /\.(docx|pdf)$/i;
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
  return cards ? `<section class="selected-videos" aria-labelledby="selected-videos-title"><h3 id="selected-videos-title" class="visually-hidden">The videos</h3><div class="video-grid">${cards}</div></section>` : '';
}

function resumeHTML(item) {
  const experience = asArray(item.experience);
  const education = asArray(item.education);
  const skills = asArray(item.skills);
  return `${experience.length ? `<section aria-labelledby="experience-title"><h3 id="experience-title">Experience</h3><div class="experience-list">${experience.map(job => `<article class="experience-item"><div class="experience-heading"><h4>${escapeHTML(job.role)}</h4><span class="experience-date">${escapeHTML(job.date)}</span></div><p class="experience-company">${escapeHTML(job.company)}</p>${job.summary ? `<p>${escapeHTML(job.summary)}</p>` : ''}</article>`).join('')}</div></section>` : ''}
    ${education.length ? `<section aria-labelledby="education-title"><h3 id="education-title">Education</h3><div class="education-list">${education.map(school => `<article class="education-item"><h4>${escapeHTML(school.school)}</h4><p>${escapeHTML(school.degree)}</p>${school.date ? `<span class="education-date">${escapeHTML(school.date)}</span>` : ''}</article>`).join('')}</div></section>` : ''}
    ${skills.length ? `<section aria-labelledby="skills-title"><h3 id="skills-title">Skills & tools</h3><p class="skills-line">${skills.map(escapeHTML).join(', ')}</p></section>` : ''}`;
}

function routeFor(key) { return ['about', 'resume', 'contact'].includes(key) ? `#${key}` : `#work/${key}`; }
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
  const heading = `${item.kicker ? `<p class="project-kicker">${escapeHTML(item.kicker)}</p>` : ''}<h2 id="dialog-title">${titleHTML(item.title)}</h2>`;
  const portrait = ['about', 'resume'].includes(key) ? safeURL(config.portrait, 'image') : null;
  if (!portrait) return heading;
  return `<div class="chapter-heading"><div class="chapter-heading-copy">${heading}</div><img class="portrait-photo" src="${escapeHTML(portrait)}" alt="${escapeHTML(config.name)}" width="200" height="200" decoding="async"></div>`;
}

function instagramReel(value) {
  const url = safeURL(value);
  if (!url) return null;
  const parsed = new URL(url);
  if (!['instagram.com', 'www.instagram.com'].includes(parsed.hostname)) return null;
  const match = parsed.pathname.match(/^\/(?:[a-zA-Z0-9_.]+\/)?reel\/([a-zA-Z0-9_-]+)\/?$/);
  return match ? { url: `https://www.instagram.com/reel/${match[1]}/`, embed: `https://www.instagram.com/reel/${match[1]}/embed/` } : null;
}

/** Selected Reels with their real covers. Instagram's player loads only after Play is pressed. */
function reelsHTML(reels, { heading = '', intro = '', note = '' } = {}) {
  const entries = asArray(reels).map(reel => ({ ...reel, link: instagramReel(reel.url), poster: safeURL(reel.poster, 'image') })).filter(reel => reel.link);
  if (!entries.length) return '';
  return `<section class="reel-list" aria-label="Selected Reels">${heading ? `<h3>${escapeHTML(heading)}</h3>` : ''}${intro ? `<p>${escapeHTML(intro)}</p>` : ''}<ul>${entries.map(reel => `
    <li><div class="reel-frame">${reel.poster ? `<img src="${escapeHTML(reel.poster)}" alt="" width="360" height="640" loading="lazy" decoding="async">` : ''}<button class="reel-play" type="button" data-reel-embed="${escapeHTML(reel.link.embed)}" data-reel-title="${escapeHTML(reel.title)}" aria-label="Play ${escapeHTML(reel.title)}. Loads Instagram's player"><span aria-hidden="true">▶</span></button></div>
      <strong>${escapeHTML(reel.title)}</strong><span>${escapeHTML(reel.note)}</span><small>${escapeHTML([reel.type, reel.result].filter(Boolean).join(' · '))} · <a href="${escapeHTML(reel.link.url)}" target="_blank" rel="noopener noreferrer">Open on Instagram ↗</a></small></li>`).join('')}</ul>${note ? `<p class="source-note">${escapeHTML(note)}</p>` : ''}</section>`;
}

/** The Oto chapter: real screenshots first, then the work in varied rows and plain prose. */
function otoHTML(item) {
  return `<div class="oto-collection-host">${otoCollectionHTML(item)}</div>`;
}

function frissonVideosHTML(item) {
  const firstReelIndex = config.chapters.youtube.videos.length;
  return `<section class="screening-featured project-section" aria-labelledby="frisson-videos-title"><h3 id="frisson-videos-title">Stories I made for Oto</h3><p>Character stories and an on-camera product demo. Open the screening room to watch.</p><div class="screening-featured-band">${item.reels.map((reel, index) => `<button type="button" class="screening-featured-panel" data-screening data-screening-filter="shorts" data-video-index="${firstReelIndex + index}" aria-label="Open ${escapeHTML(reel.title)} in the screening room"><img class="screening-featured-background" src="${escapeHTML(reel.poster)}" alt="" loading="lazy"><span class="screening-featured-shade" aria-hidden="true"></span><span class="screening-featured-copy"><span class="screening-featured-platform">Instagram · ${escapeHTML(reel.type)}</span><strong class="screening-featured-name">${escapeHTML(reel.title)}</strong><span class="screening-featured-note">${escapeHTML(reel.note)}</span></span><span class="screening-featured-play">▶ ${escapeHTML(reel.result)}</span></button>`).join('')}</div><p class="source-note">Instagram like counts recorded September 22, 2026.</p><button type="button" class="oto-project-back" data-screening data-screening-filter="shorts">Open the short-form screening room →</button></section>`;
}

let creatorPreviewCleanup = () => {};
function stopCreatorPreview() { creatorPreviewCleanup(); creatorPreviewCleanup = () => {}; }
function initCreatorPreview() {
  const panel = dialogContent.querySelector('[data-oto-project="animation"]');
  const sprite = panel?.querySelector('.oto-creator-sprite');
  if (!sprite) return;
  const animation = config.character.animations.happy;
  const page = animation.pages[0];
  sprite.style.backgroundImage = `url("${page.image}")`;
  sprite.style.backgroundSize = `${page.columns * 100}% ${page.rows * 100}%`;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const controller = new AbortController();
  let request = 0, started = 0;
  const draw = time => {
    const frame = Math.floor((time - started) * animation.fps / 1000) % page.frames;
    sprite.style.backgroundPosition = `${frame % page.columns / (page.columns - 1) * 100}% ${Math.floor(frame / page.columns) / (page.rows - 1) * 100}%`;
    request = requestAnimationFrame(draw);
  };
  const stop = () => { cancelAnimationFrame(request); request = 0; };
  const start = () => { if (request || motion.matches) return; started = performance.now(); request = requestAnimationFrame(draw); };
  panel.addEventListener('pointerenter', start, { signal: controller.signal });
  panel.addEventListener('pointerleave', () => { if (document.activeElement !== panel) stop(); }, { signal: controller.signal });
  panel.addEventListener('focus', start, { signal: controller.signal });
  panel.addEventListener('blur', () => { if (!panel.matches(':hover')) stop(); }, { signal: controller.signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (panel.matches(':hover, :focus')) start(); }, { signal: controller.signal });
  motion.addEventListener('change', () => { stop(); if (panel.matches(':hover, :focus')) start(); }, { signal: controller.signal });
  creatorPreviewCleanup = () => { stop(); controller.abort(); };
}

function otoCollectionHTML(item) {
  const featured = ['animation', 'discord', 'wiki'].map(id => item.collection.find(project => project.id === id));
  return `<p class="dialog-lead">Explore the tools and experiences I worked on around Oto’s companions: character creation, games, Discord, and community discovery.</p><p><a class="oto-inline-link" href="#work/frisson" data-open="frisson">Read my Frisson Labs case study →</a></p>
    <section class="oto-featured" aria-label="Featured Oto projects"><div class="oto-featured-band">${featured.map((project, index) => `<button class="oto-featured-panel" type="button" data-oto-project="${project.id}">
      <img class="oto-featured-background" src="${escapeHTML(project.image)}" alt="${escapeHTML(project.imageAlt)}"><span class="oto-featured-shade" aria-hidden="true"></span>
      <span class="oto-featured-tag">${index === 0 ? 'Start here' : 'Explore project'} ↗</span><span class="oto-featured-copy"><small>${escapeHTML(project.type)}</small><strong>${escapeHTML(project.title)}</strong><span>${escapeHTML(project.description)}</span></span>
    </button>`).join('')}</div></section>
    <div class="oto-project-grid">${item.collection.filter(project => !featured.includes(project)).map(project => `<button class="oto-project-card" type="button" data-oto-project="${project.id}">
      <div class="oto-card-media"><img src="${escapeHTML(project.image)}" alt="${escapeHTML(project.imageAlt)}" loading="lazy"></div>
      <span class="oto-card-copy"><small>${escapeHTML(project.type)}</small><strong>${escapeHTML(project.title)}</strong><span>${escapeHTML(project.description)}</span><span class="oto-card-action">Explore project →</span></span>
    </button>`).join('')}</div>
    <section class="project-section oto-traction"><h3>Product traction</h3><dl class="oto-traction-metrics">${item.traction.metrics.map(metric => `<div><dt>${escapeHTML(metric.label)}</dt><dd>${escapeHTML(metric.value)}</dd><small>${escapeHTML(metric.detail)}</small></div>`).join('')}</dl><p class="source-note">${escapeHTML(item.traction.note)}</p><details class="oto-analytics"><summary>View analytics</summary>${item.traction.evidence.map(entry => `<figure><a href="${escapeHTML(entry.src)}" target="_blank" rel="noopener noreferrer"><img src="${escapeHTML(entry.src)}" alt="${escapeHTML(entry.alt)}" loading="lazy"></a><figcaption>${escapeHTML(entry.label)}</figcaption></figure>`).join('')}</details></section>
    <p class="source-note">Descriptions draw on my Oto and Chibi Wiki repositories and my contributions within the Frisson Labs team. Creator and Discord captures show the real interfaces in local repo previews; Wiki captures show the live site.</p>`;
}

function openOtoProject(id) {
  stopCreatorPreview();
  const item = config.chapters.oto;
  const host = dialogContent.querySelector('.oto-collection-host');
  if (!host) return;
  const project = item.collection.find(entry => entry.id === id);
  if (!project) {
    host.innerHTML = otoCollectionHTML(item);
    initCreatorPreview();
    dialog.scrollTop = 0;
    host.querySelector(`[data-oto-project="${host.dataset.previousProject || 'animation'}"]`)?.focus({ preventScroll: true });
    return;
  }
  host.dataset.previousProject = id;
  const back = '<button class="oto-project-back" type="button" data-oto-project="collection">← All Oto projects</button>';
    const gameRows = id === 'games' ? item.projects.filter(entry => entry.kind === 'GAME').map(game => `<article class="oto-work has-video"><video class="loop-preview" src="${escapeHTML(game.video)}" poster="${escapeHTML(game.image)}" controls playsinline preload="metadata" aria-label="${escapeHTML(game.title)} gameplay demo"></video><div><h4>${escapeHTML(game.title)}</h4><p>${escapeHTML(game.text)}</p><p>${escapeHTML(game.contribution)}</p><small>${escapeHTML(game.status)}</small>${linkHTML(game.link, 'oto-inline-link')}</div></article>`).join('') : '';
    const home = id === 'home' ? `<div class="oto-shots">${item.productShowcase.screenshots.map(shot => `<figure><img src="${escapeHTML(shot.src)}" alt="${escapeHTML(shot.alt)}" width="314" height="680" loading="lazy"><figcaption>${escapeHTML(shot.label)}</figcaption></figure>`).join('')}</div><h3>What I contributed</h3><p>${escapeHTML(item.workSamples[0].text)}</p><p>${escapeHTML(item.projects[0].contribution)}</p>${linkHTML(item.projects[0].link, 'oto-inline-link')}` : '';
    host.innerHTML = `${back}<section class="oto-project-detail"><p class="oto-detail-type">${escapeHTML(project.type)}</p><h3 tabindex="-1" class="oto-detail-title">${escapeHTML(project.title)}</h3><p class="dialog-lead">${escapeHTML(project.description)}</p>
      ${project.screenshots ? `<div class="oto-project-captures">${project.screenshots.map(shot => `<figure><a href="${escapeHTML(shot.src)}" target="_blank" rel="noopener noreferrer" aria-label="Open full-size screenshot: ${escapeHTML(shot.label)}"><img src="${escapeHTML(shot.src)}" alt="${escapeHTML(shot.label)}" loading="lazy"></a><figcaption>${escapeHTML(shot.label)}</figcaption></figure>`).join('')}</div>` : ''}
      ${project.text ? `<p>${escapeHTML(project.text)}</p>` : ''}
      ${project.contribution ? `<h4>What I built</h4><p>${escapeHTML(project.contribution)}</p>` : ''}
      ${gameRows}${home}${project.link ? `<p>${linkHTML(project.link, 'oto-inline-link')}</p>` : ''}
      ${id === 'discord' ? '<p class="source-note">The Activity supports guest play and linked Oto accounts. Which path is available depends on the player’s session.</p>' : ''}
    </section>`;
  dialog.scrollTop = 0;
  (host.querySelector('.oto-detail-title') || host.querySelector('.oto-project-back'))?.focus({ preventScroll: true });
}

function milestonesHTML(item) {
  const milestones = asArray(item.milestones).filter(entry => ['silver', 'gold'].includes(entry.metal));
  if (!milestones.length) return '';
  const source = item.milestoneSource;
  const url = safeURL(source?.url);
  return `${milestones.map(entry => `<section class="project-section milestone-section" data-metal="${entry.metal}"><h3>${escapeHTML(entry.title)}</h3><p>${escapeHTML(entry.text)}</p></section>`).join('')}${url ? `<p class="source-note">${escapeHTML(source.note)} <a class="oto-inline-link" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(source.label)} ↗</a></p>` : ''}`;
}

/** The chapter's links as one plain line of text links. */
function chapterLinksHTML(item, key) {
  const links = [];
  if (key === 'about') links.push('<a class="oto-inline-link" href="#resume" data-open="resume">My résumé</a>', `<a class="oto-inline-link" href="mailto:${escapeHTML(config.contact.email)}">Email me</a>`);
  if (key === 'resume' && config.resumeDownload) links.push(linkHTML({ label: 'Download the original (Word)', url: config.resumeDownload }, 'oto-inline-link'));
  for (const link of [item.link, ...asArray(item.links)]) if (link) links.push(linkHTML(link, 'oto-inline-link'));
  const shown = links.filter(Boolean);
  return shown.length ? `<p class="oto-links">${shown.join('<span aria-hidden="true"> · </span>')}</p>` : '';
}

function renderChapter(key) {
  stopCreatorPreview();
  clearMilestoneSpotlight();
  const item = config.chapters[key];
  if (!item) return;
  currentChapter = key;
  if (!dialog.open) {
    lastFocusedElement = document.activeElement !== document.body ? document.activeElement : document.querySelector(`[data-open="${key}"]`) || viewToggle;
    previousOverflow = document.body.style.overflow;
  }
  document.querySelector('#dialog-label').textContent = chapterNames[key] || item.label;
  dialog.dataset.chapter = key;
  const fromAward = key === 'youtube' && ['silver', 'gold'].includes(dialog.dataset.award);
  dialogContent.innerHTML = key === 'oto' ? `${chapterHeadingHTML(item, key)}${otoHTML(item)}` : `
    ${chapterHeadingHTML(item, key)}
    ${item.role ? `<p class="oto-role">${escapeHTML(item.role)}</p>` : ''}
    ${key === 'resume' ? resumeContactHTML() : ''}
    ${fromAward ? milestonesHTML(item) : ''}
    ${item.cover && safeURL(item.cover.image, 'image') ? `<figure class="chapter-cover"><img src="${escapeHTML(safeURL(item.cover.image, 'image'))}" alt="${escapeHTML(item.cover.alt)}" width="1280" height="211"><figcaption>${escapeHTML(item.cover.caption)}</figcaption></figure>` : ''}
    <p class="dialog-lead">${escapeHTML(item.lead)}</p>
    ${key === 'contact' ? `<form class="contact-message-form" action="https://formsubmit.co/${encodeURIComponent(config.contact.email)}" method="POST" target="_blank" rel="noopener noreferrer" aria-labelledby="contact-form-heading">
      <h3 id="contact-form-heading">Leave me a message</h3>
      <input type="hidden" name="_subject" value="A new message from Tod’s portfolio">
      <input type="hidden" name="_template" value="table">
      <div class="contact-message-fields"><label>Your name<input type="text" name="name" autocomplete="name" maxlength="120" required></label><label>Your email<input type="email" name="email" autocomplete="email" maxlength="254" required></label></div>
      <label>What’s on your mind?<textarea name="message" rows="6" minlength="10" maxlength="5000" placeholder="Tell me about your team, an idea, or what you’d like to make together…" required></textarea></label>
      <div class="contact-message-honeypot" aria-hidden="true"><label>Leave this empty<input type="text" name="_honey" tabindex="-1" autocomplete="off"></label></div>
      <p class="source-note">Your name, email, and message are sent through FormSubmit to my inbox. Sending opens its spam check and confirmation in a new tab.</p>
      <button class="contact-message-send" type="submit">Send message ↗</button>
    </form><section class="project-section"><h3>Or say hello another way</h3><p><a class="oto-inline-link" href="${escapeHTML(config.contact.linkedin)}" target="_blank" rel="noopener noreferrer">Message me on LinkedIn ↗</a></p><p>Email: <span>${escapeHTML(config.contact.email)}</span> <button type="button" class="oto-project-back" data-copy-contact>Copy email</button></p><p class="source-note" id="contact-copy-status" role="status"></p></section>` : ''}
    ${fromAward ? '' : milestonesHTML(item)}
    ${key === 'frisson' ? `<section class="project-section"><h3>A home for your companion</h3><div class="oto-shots">${config.chapters.oto.productShowcase.screenshots.map(shot => `<figure><img src="${escapeHTML(shot.src)}" alt="${escapeHTML(shot.alt)}" width="314" height="680" loading="lazy"><figcaption>${escapeHTML(shot.label)}</figcaption></figure>`).join('')}</div><p class="source-note">Official Oto app screenshots. These show the companion experience; my contributions are described below.</p></section>` : ''}
    ${asArray(item.sections).map(section => `<section class="project-section"><h3>${escapeHTML(section.title)}</h3>${section.text ? `<p>${escapeHTML(section.text)}</p>` : ''}${asArray(section.bullets).length ? `<ul class="project-bullets">${section.bullets.map(bullet => `<li>${escapeHTML(bullet)}</li>`).join('')}</ul>` : ''}</section>`).join('')}
    ${key === 'frisson' ? frissonVideosHTML(item) : reelsHTML(item.reels, { heading: 'Three Reels I made for Oto', intro: item.reelIntro || '', note: item.reelSource?.note })}
    ${videosHTML(item.videos)}
    ${resumeHTML(item)}
    ${item.quote ? `<blockquote class="featured-quote">${escapeHTML(item.quote)}</blockquote><p class="source-note">${escapeHTML(item.quoteCredit)}</p>` : ''}
    ${chapterLinksHTML(item, key)}
    ${key === 'frisson' ? '<p><a class="oto-inline-link" href="#work/oto" data-open="oto">Explore Oto projects →</a></p>' : ''}${sourceHTML(item.source)}
    ${item.pending ? `<p class="pending-note">${escapeHTML(item.pending)}</p>` : ''}
  `;
  startPreviews();
  initCreatorPreview();
  resetShareFeedback();
  document.title = `${chapterNames[key] || item.label} · ${config.name}`;
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
  if (fromAward) {
    const section = dialogContent.querySelector(`[data-metal="${dialog.dataset.award}"]`);
    spotlightSection(section);
  }
}

function spotlightSection(section) {
    clearMilestoneSpotlight();
    if (!section) return;
    section.scrollIntoView({ block: section.offsetHeight > dialog.clientHeight * .65 ? 'start' : 'center', behavior: 'instant' });
    section.classList.add('is-spotlight');
    dialogContent.classList.add('has-milestone-spotlight');
    const initialScroll = dialog.scrollTop;
    const controller = new AbortController();
    milestoneSpotlight = controller;
    dialog.addEventListener('scroll', () => {
      if (Math.abs(dialog.scrollTop - initialScroll) > 2) clearMilestoneSpotlight();
    }, { signal: controller.signal });
    dialog.addEventListener('wheel', clearMilestoneSpotlight, { passive: true, signal: controller.signal });
    dialog.addEventListener('touchmove', clearMilestoneSpotlight, { passive: true, signal: controller.signal });
    dialog.addEventListener('keydown', event => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) clearMilestoneSpotlight();
    }, { signal: controller.signal });
}

let milestoneSpotlight;
function clearMilestoneSpotlight() {
  milestoneSpotlight?.abort();
  milestoneSpotlight = null;
  dialogContent.classList.remove('has-milestone-spotlight');
  dialogContent.querySelector('.is-spotlight')?.classList.remove('is-spotlight');
}

/** Game clips loop quietly; with reduced motion they stay still and get controls instead. */
function startPreviews() {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  for (const video of dialogContent.querySelectorAll('video.loop-preview')) {
    if (still) { video.controls = true; continue; }
    video.play().catch(() => { video.controls = true; });
  }
}

function hideChapter() {
  stopCreatorPreview();
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
  const otoProject = key === 'oto' ? source?.dataset?.otoEntry || { product: 'home', community: 'games', games: 'games' }[source?.dataset?.note] : null;
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
  if (otoProject) openOtoProject(otoProject);
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
  if (event.target.closest?.('[data-copy-contact]')) {
    navigator.clipboard.writeText(config.contact.email).then(() => { document.querySelector('#contact-copy-status').textContent = 'Email address copied.'; }).catch(() => { document.querySelector('#contact-copy-status').textContent = 'Select the email address above to copy it.'; });
    return;
  }
  const projectLink = event.target.closest?.('[data-oto-project]');
  if (projectLink) { event.preventDefault(); openOtoProject(projectLink.dataset.otoProject); return; }
  const sectionLink = event.target.closest?.('[data-oto-section]');
  if (sectionLink) {
    event.preventDefault();
    document.getElementById(sectionLink.dataset.otoSection)?.scrollIntoView({ block: 'start', behavior: 'instant' });
    return;
  }
  const reel = event.target.closest?.('[data-reel-embed]');
  if (reel) {
    const frame = document.createElement('iframe');
    frame.className = 'reel-player';
    frame.src = reel.dataset.reelEmbed;
    frame.title = `${reel.dataset.reelTitle} on Instagram`;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture';
    reel.closest('.reel-frame').replaceChildren(frame);
    frame.focus();
    return;
  }
  const trigger = event.target.closest?.('[data-open]');
  if (!trigger || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (!config.chapters[trigger.dataset.open]) return;
  event.preventDefault();
  openChapter(trigger.dataset.open, { source: trigger });
});
document.addEventListener('room:open-chapter', event => {
  const chapter = event.detail.chapter;
  const source = event.detail.source || document.querySelector(`.furniture-piece[data-chapter="${chapter}"] .furniture-hit`);
  if (chapter === 'youtube') {
    document.dispatchEvent(new CustomEvent('portfolio:request-screening', { detail: { filter: 'all', source } }));
  } else if (chapter === 'tiktok') {
    document.dispatchEvent(new CustomEvent('portfolio:request-screening', { detail: { filter: 'shorts', source } }));
  } else {
    openChapter(chapter, { source });
  }
});
document.addEventListener('portfolio:hide-case-for-screening', () => {
  if (!dialog.open) return;
  lastBaseHash = baseHashForRoute();
  window.history.replaceState(stateWithRoute({ kind: 'base', version: 1 }), '', pageURL(lastBaseHash));
  hideChapter();
});
document.addEventListener('portfolio:show-video-case', event => {
  openChapter(event.detail?.chapter || 'youtube', { source: document.querySelector('[data-furniture="youtube"] .furniture-hit') });
});
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
