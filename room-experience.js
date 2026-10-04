import { createScreeningRoom } from './gallery.js';

const scene = document.querySelector('#scene');
const screeningSource = () => document.querySelector('[data-furniture="chair"] .furniture-hit');
const selectedVideos = window.PORTFOLIO.chapters.youtube.videos || [];
const featuredIndex = Math.max(0, selectedVideos.findIndex(video => video.format === 'Long-form video'));

const cinema = createScreeningRoom({
  onOpen() {
    scene.classList.add('is-screening');
    document.body.classList.add('screening-open');
    document.dispatchEvent(new CustomEvent('portfolio:screening', { detail: { open: true } }));
  },
  onClose() {
    scene.classList.remove('is-screening');
    document.body.classList.remove('screening-open');
    document.dispatchEvent(new CustomEvent('portfolio:screening', { detail: { open: false } }));
  },
});

function openScreening({ index = featuredIndex, filter = 'all', source = screeningSource() } = {}) {
  if (document.querySelector('#project-dialog').open) {
    document.dispatchEvent(new CustomEvent('portfolio:hide-case-for-screening'));
    source = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : screeningSource();
  }
  cinema.open({ index, filter, source: source || screeningSource() });
}
document.addEventListener('portfolio:request-screening', event => openScreening(event.detail));
document.addEventListener('click', event => {
  const trigger = event.target.closest?.('[data-screening]');
  if (!trigger || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const supplied = trigger.dataset.videoIndex;
  openScreening({ index: supplied === undefined ? featuredIndex : Number(supplied), source: trigger });
});
