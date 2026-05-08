import { i18n } from '../i18n/index.js';
import { createMovieCard, createSkeletonCards } from '../components/movieCard.js';
import { createFooter } from '../components/footer.js';
import { fetchMovies } from '../api/vidapi.js';
import { sortByPopularity, sortByRating, filterWithPoster, extractGenres } from '../utils/helpers.js';
import { APP_CONFIG } from '../config.js';

export async function moviesPage({ query }) {
  const page = document.createElement('div');
  page.id = 'movies-page';

  let allItems = [];
  let currentPage = 1;
  let loading = false;
  let totalPages = 1;
  let activeGenre = 'all';
  let activeSort = 'latest';

  // Header
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `<h1 class="page-title">${i18n.t('page_movies')}</h1>`;
  page.appendChild(header);

  // Filter bar
  const filterBar = document.createElement('div');
  filterBar.className = 'filters';
  filterBar.id = 'filter-bar';
  filterBar.innerHTML = `<button class="filter-btn active" data-genre="all">${i18n.t('filter_all')}</button>
    <select class="sort-select" id="sort-select">
      <option value="latest">${i18n.t('sort_latest')}</option>
      <option value="rating">${i18n.t('sort_rating')}</option>
      <option value="popular">${i18n.t('sort_popular')}</option>
    </select>`;
  page.appendChild(filterBar);

  // Grid
  const grid = document.createElement('div');
  grid.className = 'grid-container';
  createSkeletonCards(12).forEach(c => grid.appendChild(c));
  page.appendChild(grid);

  // Load more sentinel
  const sentinel = document.createElement('div');
  sentinel.style.height = '1px';
  page.appendChild(sentinel);

  page.appendChild(createFooter());

  function applyFilters(items) {
    let filtered = activeGenre === 'all' ? items : items.filter(i => (i.genre || '').includes(activeGenre));
    if (activeSort === 'rating') filtered = sortByRating(filtered);
    else if (activeSort === 'popular') filtered = sortByPopularity(filtered);
    return filtered;
  }

  function renderGrid(items) {
    grid.innerHTML = '';
    const filtered = applyFilters(items);
    if (!filtered.length) {
      grid.innerHTML = `<p style="color:var(--text3);padding:40px 0;grid-column:1/-1;text-align:center">${i18n.t('no_content')}</p>`;
      return;
    }
    filtered.forEach(item => grid.appendChild(createMovieCard(item)));
  }

  function updateGenreFilters() {
    const TARGET_GENRES = [
      { id: 'Action', label: 'Action' },
      { id: 'Adult', label: 'Adult' },
      { id: 'Adventure', label: 'Adventure' },
      { id: 'Animation', label: 'Animation' },
      { id: 'Biography', label: 'Biography' },
      { id: 'Comedy', label: 'Comedy' },
      { id: 'Crime', label: 'Crime' },
      { id: 'Documentary', label: 'Documentary' },
      { id: 'Drama', label: 'Drama' },
      { id: 'Family', label: 'Family' },
      { id: 'Fantasy', label: 'Fantasy' },
      { id: 'Film-Noir', label: 'Film-Noir' },
      { id: 'Game-Show', label: 'Game-Show' },
      { id: 'History', label: 'History' },
      { id: 'Horror', label: 'Horror' },
      { id: 'Music', label: 'Music' },
      { id: 'Musical', label: 'Musical' },
      { id: 'Mystery', label: 'Mystery' },
      { id: 'News', label: 'News' },
      { id: 'Reality-TV', label: 'Reality-TV' },
      { id: 'Romance', label: 'Romance' },
      { id: 'Sci-Fi', label: 'Sci-Fi' },
      { id: 'Short', label: 'Short' },
      { id: 'Sport', label: 'Sport' },
      { id: 'Talk-Show', label: 'Talk-Show' },
      { id: 'Thriller', label: 'Thriller' },
      { id: 'War', label: 'War' },
      { id: 'Western', label: 'Western' }
    ];

    const sel = filterBar.querySelector('#sort-select');
    TARGET_GENRES.forEach(g => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.genre = g.id;
      btn.textContent = g.label;
      filterBar.insertBefore(btn, sel);
    });
    
    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeGenre = btn.dataset.genre;
        renderGrid(allItems);
      });
    });
  }

  filterBar.querySelector('#sort-select').addEventListener('change', (e) => {
    activeSort = e.target.value;
    renderGrid(allItems);
  });

  async function loadPage(p) {
    if (loading) return;
    loading = true;
    try {
      const data = await fetchMovies(p);
      totalPages = data.total_pages;
      const newItems = filterWithPoster(data.items || []);
      allItems.push(...newItems);
      if (p === 1) { updateGenreFilters(); renderGrid(allItems); }
      else { applyFilters(newItems).forEach(item => grid.appendChild(createMovieCard(item))); }
      currentPage = p;
    } catch { } finally { loading = false; }
  }

  // Infinite scroll
  const obs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && currentPage < totalPages) loadPage(currentPage + 1);
  }, { rootMargin: `${APP_CONFIG.infiniteScrollOffset}px` });
  obs.observe(sentinel);

  loadPage(1);
  return page;
}
