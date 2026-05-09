import { i18n } from '../i18n/index.js';
import { createFooter } from '../components/footer.js';
import { fetchEpisodes, fetchMultipleTVPages } from '../api/vidapi.js';
import { formatAirDate } from '../utils/helpers.js';
import { router } from '../router/index.js';
import { APP_CONFIG } from '../config.js';

export async function episodesPage() {
  const page = document.createElement('div');
  page.id = 'episodes-page';

  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `<h1 class="page-title">${i18n.t('page_episodes')}</h1>`;
  page.appendChild(header);

  const grid = document.createElement('div');
  grid.style.cssText = 'padding:20px 4%;display:flex;flex-direction:column;gap:8px;';
  page.appendChild(grid);

  // Skeleton placeholders
  for (let i = 0; i < 10; i++) {
    const sk = document.createElement('div');
    sk.className = 'ep-card';
    sk.innerHTML = `
      <div class="ep-thumb skeleton"></div>
      <div style="flex:1">
        <div class="skeleton" style="height:10px;margin-bottom:6px;border-radius:3px"></div>
        <div class="skeleton" style="height:10px;width:60%;border-radius:3px"></div>
      </div>`;
    grid.appendChild(sk);
  }

  const sentinel = document.createElement('div');
  sentinel.style.height = '1px';
  page.appendChild(sentinel);
  page.appendChild(createFooter());

  let currentPage = 1;
  let loading = false;
  let totalPages = 1;

  function createEpCard(ep) {
    const card = document.createElement('div');
    card.className = 'ep-card';
    const airDate = formatAirDate(ep.air_date);
    const id = ep.show_imdb_id || ep.show_tmdb_id;
    const s = String(ep.season_number || 1).padStart(2, '0');
    const e = String(ep.episode_number || 1).padStart(2, '0');
    const badge = `${i18n.t('episode_season')}${s}${i18n.t('episode_ep')}${e}`;

    const poster = ep.poster_url;

    card.innerHTML = `
      <div class="ep-thumb" style="position:relative;background:var(--bg3);border-radius:4px;overflow:hidden;background-image:url(${poster});background-size:cover;background-position:center;">
        ${!poster ? `<svg style="opacity:.35" width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>` : ''}
        <div class="ep-thumb-overlay" style="position:absolute;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
        </div>
      </div>
      <div class="ep-info">
        <div class="ep-show">${ep.show_title || ''}</div>
        <div class="ep-title">${ep.episode_title || badge}</div>
        <div class="ep-meta">
          <span class="ep-badge">${badge}</span>
          ${airDate ? `<span>${airDate}</span>` : ''}
        </div>
      </div>`;

    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      if (id) router.navigate(`/watch/tv/${id}/${ep.season_number}/${ep.episode_number}`);
    });
    return card;
  }

  async function loadPage(p) {
    if (loading) return;
    loading = true;
    try {
      const [data, tvPool] = await Promise.all([
        fetchEpisodes(p),
        fetchMultipleTVPages(5) // Fetch pool for poster matching
      ]);
      
      const posterMap = {};
      tvPool.forEach(tv => { if (tv.imdb_id) posterMap[tv.imdb_id] = tv.poster_url; });

      totalPages = data.total_pages;
      if (p === 1) grid.innerHTML = '';
      
      (data.items || [])
        .filter(ep => ep.show_title || ep.episode_title)
        .forEach(ep => {
          // Attach poster if missing
          ep.poster_url = ep.poster_url || posterMap[ep.show_imdb_id] || '';
          grid.appendChild(createEpCard(ep));
        });
      currentPage = p;
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && currentPage < totalPages) loadPage(currentPage + 1);
  }, { rootMargin: `${APP_CONFIG.infiniteScrollOffset}px` }).observe(sentinel);

  loadPage(1);
  return page;
}
