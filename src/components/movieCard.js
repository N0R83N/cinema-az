import { router } from '../router/index.js';
import { getPosterUrl, formatRating } from '../utils/helpers.js';
import { cache } from '../utils/cache.js';
import { showToast } from './footer.js';
import { i18n } from '../i18n/index.js';

export function createMovieCard(item) {
  const div = document.createElement('div');
  div.className = 'card';

  const poster = getPosterUrl(item, 'md');
  const rating = formatRating(item.rating);
  const year = (item.year || '').substring(0, 4);
  const id = item.imdb_id || item.tmdb_id;
  const type = item.type || 'movie';
  const isNew = item.year && parseInt(item.year) >= new Date().getFullYear() - 1;
  const inList = cache.isInWatchlist(item);

  div.innerHTML = `
    ${poster ? `<img class="card-img" src="${poster}" alt="${item.title || ''}" loading="lazy" onerror="this.src='';this.style.background='var(--bg3)'"/>` : `<div class="card-img skeleton"></div>`}
    <div class="card-overlay"></div>
    <div class="card-play">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
    </div>
    ${isNew ? `<div class="card-new-badge">${i18n.t('label_new')}</div>` : ''}
    <button class="card-watchlist-btn ${inList ? 'active' : ''}" title="${i18n.t(inList ? 'btn_remove_watchlist' : 'btn_add_watchlist')}">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="${inList ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
    </button>
    <div class="card-info">
      <div class="card-title">${item.title || ''}</div>
      <div class="card-meta">
        <span class="card-rating">★ ${rating || '—'}</span>
        <span class="card-year">${year}</span>
      </div>
    </div>
  `;

  div.addEventListener('click', (e) => {
    if (e.target.closest('.card-watchlist-btn')) return;
    if (type === 'movie') router.navigate(`/watch/movie/${id}`);
    else router.navigate(`/watch/tv/${id}/1/1`);
  });

  div.querySelector('.card-watchlist-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const added = cache.toggleWatchlist(item);
    const btn = div.querySelector('.card-watchlist-btn');
    const svg = btn.querySelector('svg');
    btn.classList.toggle('active', added);
    svg.setAttribute('fill', added ? 'currentColor' : 'none');
    showToast(i18n.t(added ? 'added_watchlist' : 'removed_watchlist'));
  });

  return div;
}

export function createSkeletonCards(count = 6) {
  return Array.from({ length: count }, () => {
    const div = document.createElement('div');
    div.className = 'card skeleton-card';
    div.innerHTML = `<div class="skeleton skeleton-card-img"></div><div class="skeleton skeleton-card-line"></div><div class="skeleton skeleton-card-line2"></div>`;
    return div;
  });
}
