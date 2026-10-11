import { i18n } from '../i18n/index.js';
import { createMovieCard, createSkeletonCards } from '../components/movieCard.js';
import { createFooter } from '../components/footer.js';
import { fetchTVShows } from '../api/vidapi.js';
import { sortByPopularity, sortByRating, filterWithPoster, extractGenres, matchesGenre } from '../utils/helpers.js';
import { APP_CONFIG } from '../config.js';

export async function seriesPage() {
  const page = document.createElement('div');
  page.id = 'series-page';

  let allItems = [];
  let currentPage = 1;
  let loading = false;
  let totalPages = 1;
  let activeGenre = 'all';
  let activeSort = 'latest';

  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `<h1 class="page-title">${i18n.t('page_series')}</h1>`;
  page.appendChild(header);

  const filterBar = document.createElement('div');
  filterBar.className = 'filters';
  filterBar.innerHTML = `
    <button class="filter-btn active" data-genre="all">${i18n.t('filter_all')}</button>
    <select class="sort-select" id="sort-select">
      <option value="latest">${i18n.t('sort_latest')}</option>
      <option value="rating">${i18n.t('sort_rating')}</option>
      <option value="popular">${i18n.t('sort_popular')}</option>
    </select>`;
  page.appendChild(filterBar);

  const grid = document.createElement('div');
  grid.className = 'grid-container';
  createSkeletonCards(12).forEach(c => grid.appendChild(c));
  page.appendChild(grid);

  const sentinel = document.createElement('div');
  sentinel.style.height = '1px';
  page.appendChild(sentinel);
  page.appendChild(createFooter());

  function applyFilters(items) {
    let f = activeGenre === 'all' ? items : items.filter(i => matchesGenre(i, activeGenre));
    if (activeSort === 'rating') f = sortByRating(f);
    else if (activeSort === 'popular') f = sortByPopularity(f);
    return f;
  }

  function renderGrid() {
    grid.innerHTML = '';
    const filtered = applyFilters(allItems);
    if (!filtered.length) {
      grid.innerHTML = `<div class="category-empty" style="color:var(--text3);padding:40px 0;grid-column:1/-1;text-align:center">${currentPage >= totalPages ? i18n.t('no_content') : 'Bu kategoride henüz eşleşme bulunmadı; sonraki sayfaları da arayabilirsiniz.'}${currentPage < totalPages ? '<button type="button" class="filter-btn category-load-more" style="display:block;margin:16px auto 0">Daha fazla sonuç ara</button>' : ''}</div>`;
      return;
    }
    filtered.forEach(item => grid.appendChild(createMovieCard({ ...item, type: 'tv' })));
  }

  function addGenreFilters() {
    const sel = filterBar.querySelector('#sort-select');
    filterBar.querySelectorAll('.filter-btn:not([data-genre="all"])').forEach(btn => btn.remove());
    extractGenres(allItems).forEach(genre => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn' + (activeGenre === genre ? ' active' : '');
      btn.dataset.genre = genre;
      btn.textContent = genre;
      filterBar.insertBefore(btn, sel);
    });
  }

  filterBar.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn[data-genre]');
    if (!btn || !filterBar.contains(btn)) return;
    filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeGenre = btn.dataset.genre;
    renderGrid();
  });

  grid.addEventListener('click', e => {
    if (e.target.closest('.category-load-more')) loadPage(currentPage + 1);
  });

  filterBar.querySelector('#sort-select').addEventListener('change', e => {
    activeSort = e.target.value;
    renderGrid();
  });

  async function loadPage(p) {
    if (loading) return;
    loading = true;
    try {
      const data = await fetchTVShows(p);
      totalPages = data.total_pages;
      const items = filterWithPoster(data.items || []);
      allItems.push(...items);
      addGenreFilters();
      renderGrid();
      currentPage = p;
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  new IntersectionObserver(entries => {
    const hasGenreMatches = activeGenre === 'all' || allItems.some(item => matchesGenre(item, activeGenre));
    if (entries[0].isIntersecting && currentPage < totalPages && hasGenreMatches) loadPage(currentPage + 1);
  }, { rootMargin: `${APP_CONFIG.infiniteScrollOffset}px` }).observe(sentinel);

  loadPage(1);
  return page;
}
