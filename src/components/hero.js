import { i18n } from '../i18n/index.js';
import { router } from '../router/index.js';
import { getPosterUrl, getTopRated, parseGenres, formatRating } from '../utils/helpers.js';
import { APP_CONFIG } from '../config.js';

export function createHero(items) {
  const top = getTopRated(items, 6);
  if (!top.length) return document.createElement('div');

  const section = document.createElement('section');
  section.className = 'hero';
  section.id = 'hero';

  let currentIdx = 0;
  let timer = null;

  function renderSlides() {
    section.innerHTML = top.map((item, i) => {
      const poster = getPosterUrl(item, 'lg');
      const rating = formatRating(item.rating);
      const genres = parseGenres(item.genre).slice(0, 3);
      const year = (item.year || '').substring(0, 4);
      const id = item.imdb_id || item.tmdb_id;

      return `
        <div class="hero-slide ${i === 0 ? 'active' : 'inactive'}" data-idx="${i}">
          ${poster && poster !== 'https://via.placeholder.com/300x450/141414/808080?text=No+Image'
            ? `<img class="hero-bg" src="${poster}" alt="${item.title}" loading="${i === 0 ? 'eager' : 'lazy'}" onerror="this.nextElementSibling.style.display='block';this.style.display='none'"/>`
            : ''}
          <div class="hero-bg-fallback" style="display:${poster ? 'none' : 'block'}"></div>
          <div class="hero-overlay"></div>
          <div class="hero-overlay2"></div>
          <div class="hero-content">
            <div class="hero-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
              ${i18n.t('label_trending')}
            </div>
            <h1 class="hero-title">${item.title || ''}</h1>
            <div class="hero-meta">
              ${rating ? `<div class="hero-rating">★ ${rating}</div>` : ''}
              ${year ? `<span class="hero-year">${year}</span>` : ''}
              ${genres.length ? `<div class="hero-genres">${genres.map(g => `<span class="hero-genre-tag">${g}</span>`).join('')}</div>` : ''}
            </div>
            <div class="hero-actions">
              <button class="btn btn-primary hero-play" data-id="${id}" data-type="${item.type}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                ${i18n.t('btn_play')}
              </button>
              <button class="btn btn-secondary hero-info" data-id="${id}" data-type="${item.type}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                ${i18n.t('btn_more_info')}
              </button>
            </div>
          </div>
        </div>`;
    }).join('') +
    `<div class="hero-dots">${top.map((_, i) =>
      `<div class="hero-dot ${i === 0 ? 'active' : ''}" data-dot="${i}"></div>`
    ).join('')}</div>`;

    bindHeroEvents();
  }

  function goTo(idx) {
    const slides = section.querySelectorAll('.hero-slide');
    const dots = section.querySelectorAll('.hero-dot');
    slides.forEach((s, i) => {
      s.classList.toggle('active', i === idx);
      s.classList.toggle('inactive', i !== idx);
    });
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    currentIdx = idx;
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo((currentIdx + 1) % top.length), APP_CONFIG.heroRotateInterval);
  }

  function bindHeroEvents() {
    section.querySelectorAll('.hero-play').forEach(btn => {
      btn.addEventListener('click', () => {
        const { id, type } = btn.dataset;
        if (type === 'movie') router.navigate(`/watch/movie/${id}`);
        else router.navigate(`/watch/tv/${id}/1/1`);
      });
    });
    section.querySelectorAll('.hero-info').forEach(btn => {
      btn.addEventListener('click', () => {
        const { id, type } = btn.dataset;
        if (type === 'movie') router.navigate(`/watch/movie/${id}`);
        else router.navigate(`/watch/tv/${id}/1/1`);
      });
    });
    section.querySelectorAll('.hero-dot').forEach(dot => {
      dot.addEventListener('click', () => { goTo(parseInt(dot.dataset.dot)); startTimer(); });
    });
  }

  renderSlides();
  startTimer();
  return section;
}

export function createHeroSkeleton() {
  const el = document.createElement('div');
  el.className = 'hero skeleton-hero skeleton';
  return el;
}
