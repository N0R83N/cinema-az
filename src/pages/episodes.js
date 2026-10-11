import { i18n } from '../i18n/index.js';
import { createFooter } from '../components/footer.js';
import { fetchEpisodes, fetchMultipleTVPages, search as searchIMDb } from '../api/vidapi.js';
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

    const poster = ep.poster_url || '';

    card.innerHTML = `
      <div class="ep-thumb" style="position:relative;background:var(--bg3);border-radius:4px;overflow:hidden;background-size:cover;background-position:center;">
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

    if (poster) card.querySelector('.ep-thumb').style.backgroundImage = `url("${poster}")`;

    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      if (id) {
        const ids = new URLSearchParams();
        if (ep.show_tmdb_id) ids.set('tmdb', ep.show_tmdb_id);
        if (ep.show_imdb_id) ids.set('imdb', ep.show_imdb_id);
        router.navigate(`/watch/tv/${encodeURIComponent(id)}/${ep.season_number || 1}/${ep.episode_number || 1}${ids.toString() ? `?${ids}` : ''}`);
      }
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
      
      const posterMap = Object.create(null);
      const normalizeTitle = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      tvPool.forEach(tv => {
        if (!tv.poster_url) return;
        if (tv.imdb_id) posterMap[`imdb:${String(tv.imdb_id).toLowerCase()}`] = tv.poster_url;
        if (tv.tmdb_id) posterMap[`tmdb:${String(tv.tmdb_id)}`] = tv.poster_url;
        if (tv.title) posterMap[`title:${normalizeTitle(tv.title)}`] = tv.poster_url;
      });

      const episodeItems = (data.items || []).filter(ep => ep.show_title || ep.episode_title);
      const missingTitles = [...new Set(episodeItems
        .filter(ep => !ep.poster_url
          && !posterMap[`tmdb:${String(ep.show_tmdb_id || '')}`]
          && !posterMap[`imdb:${String(ep.show_imdb_id || '').toLowerCase()}`]
          && !posterMap[`title:${normalizeTitle(ep.show_title)}`])
        .map(ep => ep.show_title)
        .filter(Boolean))];

      // Older or less common shows may not be in the first 120 catalog entries.
      // Use IMDb suggestions as a title-based fallback, accepting exact title matches only.
      await Promise.all(missingTitles.map(async title => {
        try {
          const result = await Promise.race([
            searchIMDb(title),
            new Promise(resolve => setTimeout(() => resolve({ tvshows: [] }), 3500))
          ]);
          const expectedTitle = normalizeTitle(title);
          const match = (result.tvshows || []).find(show =>
            show.poster_url && normalizeTitle(show.title) === expectedTitle
          );
          if (match) posterMap[`title:${expectedTitle}`] = match.poster_url;
        } catch { }
      }));

      totalPages = data.total_pages;
      if (p === 1) grid.innerHTML = '';
      
      (data.items || [])
        .filter(ep => ep.show_title || ep.episode_title)
        .forEach(ep => {
          // Episode records omit poster URLs; resolve from the parent series using either ID.
          const poster = ep.poster_url
            || posterMap[`tmdb:${String(ep.show_tmdb_id || '')}`]
            || posterMap[`imdb:${String(ep.show_imdb_id || '').toLowerCase()}`]
            || posterMap[`title:${normalizeTitle(ep.show_title)}`]
            || '';
          grid.appendChild(createEpCard({ ...ep, poster_url: poster }));
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
