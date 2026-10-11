import { i18n } from '../i18n/index.js';
import { createFooter } from '../components/footer.js';
import { createContentRow, populateRow } from '../components/contentRow.js';
import { API } from '../config.js';
import { cache } from '../utils/cache.js';
import { fetchMultipleMoviePages, fetchMultipleTVPages } from '../api/vidapi.js';
import { parseGenres, formatRating, sortByPopularity, filterWithPoster } from '../utils/helpers.js';
import { router } from '../router/index.js';
import { createChat } from '../components/Chat.js';

export async function watchPage({ params, query = {} }) {
  const { type, id, season = '1', episode = '1' } = params;
  const tmdbId = query.tmdb || (/^[0-9]+$/.test(id) ? id : '');
  const imdbId = query.imdb || (/^tt[0-9]+$/i.test(id) ? id : '');
  const page = document.createElement('div');
  page.className = 'watch-page';

  let currentProviderIndex = API.EMBED_PROVIDERS.findIndex(p => p.idType !== 'tmdb' || tmdbId);
  let embedUrl = '';
  const savedProgress = cache.getProgress(`${id}_${season}_${episode}`) || 0;

  function getEmbedUrl(index) {
    const provider = API.EMBED_PROVIDERS[index];
    const playerId = provider.idType === 'tmdb' ? tmdbId : provider.idType === 'imdb' ? imdbId : (tmdbId || imdbId);
    if (!playerId) return '';
    const encodedId = encodeURIComponent(playerId);
    if (type === 'movie') return provider.id === 'autoembed'
      ? provider.movie(encodedId, playerId.startsWith('tt') ? 'imdb' : 'tmdb')
      : provider.movie(encodedId);
    return provider.id === 'autoembed'
      ? provider.tv(encodedId, season, episode, playerId.startsWith('tt') ? 'imdb' : 'tmdb')
      : provider.tv(encodedId, season, episode);
  }

  embedUrl = getEmbedUrl(currentProviderIndex);

  // Detect Room
  const hashParts = window.location.hash.split('?');
  const urlParams = new URLSearchParams(hashParts[1] || '');
  const roomId = urlParams.get('room');

  // Player
  const playerWrap = document.createElement('div');
  playerWrap.className = 'player-wrap';
  playerWrap.innerHTML = `
    <iframe
      id="video-player"
      src="${embedUrl}"
      width="100%" height="100%"
      frameborder="0"
      allowfullscreen
      allow="autoplay; fullscreen; picture-in-picture"
      loading="eager"
    ></iframe>`;

  const iframe = playerWrap.querySelector('#video-player');

  if (roomId) {
    const layout = document.createElement('div');
    layout.className = 'watch-layout';
    
    playerWrap.classList.add('player-flex');
    layout.appendChild(playerWrap);
    
    const chatElement = createChat(roomId);
    layout.appendChild(chatElement);
    
    page.appendChild(layout);
  } else {
    page.appendChild(playerWrap);
  }

  // Server Switcher UI
  const serverWrap = document.createElement('div');
  serverWrap.className = 'server-switcher';
  
  const serverLabel = document.createElement('span');
  serverLabel.textContent = i18n.t('servers') || 'Servers:';
  serverLabel.style.cssText = 'color:var(--text2); font-size:0.9rem; margin-right:8px; font-weight:600;';
  serverWrap.appendChild(serverLabel);

  API.EMBED_PROVIDERS.forEach((provider, idx) => {
    if (provider.idType === 'tmdb' && !tmdbId) return;
    if (provider.idType === 'imdb' && !imdbId) return;
    const btn = document.createElement('button');
    btn.className = `btn btn-outline ${idx === currentProviderIndex ? 'active' : ''}`;
    btn.style.cssText = 'padding:6px 14px; font-size:0.8rem;';
    btn.dataset.providerIndex = String(idx);
    btn.textContent = provider.name;
    btn.setAttribute('aria-pressed', String(idx === currentProviderIndex));
    
    if (idx === currentProviderIndex) {
      btn.style.background = 'var(--accent)';
      btn.style.borderColor = 'var(--accent)';
      btn.style.color = '#fff';
    }

    btn.addEventListener('click', () => {
      currentProviderIndex = idx;
      serverWrap.querySelectorAll('button[data-provider-index]').forEach((b) => {
        // Skip the Room Create button if it exists
        if (!b.classList.contains('btn-outline')) return;
        
        const bIdx = parseInt(b.dataset.providerIndex, 10);
        if (bIdx === idx) {
          b.style.background = 'var(--accent)';
          b.style.borderColor = 'var(--accent)';
          b.style.color = '#fff';
        } else {
          b.style.background = 'transparent';
          b.style.borderColor = 'rgba(255,255,255,0.4)';
          b.style.color = '#fff';
        }
      });
      serverWrap.querySelectorAll('.btn-outline').forEach(button => button.setAttribute('aria-pressed', String(parseInt(button.dataset.providerIndex, 10) === idx)));
      const iframe = playerWrap.querySelector('#video-player');
      if (iframe) iframe.src = getEmbedUrl(currentProviderIndex);
    });
    serverWrap.appendChild(btn);
  });

  // Room Button (now at the end)
  if (!roomId) {
    const roomBtn = document.createElement('button');
    roomBtn.className = 'btn btn-primary room-create-btn';
    roomBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> ${i18n.t('create_room') || 'Create Virtual Room'}`;
    roomBtn.addEventListener('click', () => {
      const newRoomId = Math.random().toString(36).substring(2, 9);
      const currentHash = window.location.hash;
      const newHash = currentHash.includes('?') 
        ? `${currentHash}&room=${newRoomId}`
        : `${currentHash}?room=${newRoomId}`;
      window.location.hash = newHash;
      window.location.reload(); // Force reload to init Supabase
    });
    serverWrap.appendChild(roomBtn);
  }

  page.appendChild(serverWrap);

  // Info section (placeholder while loading)
  const infoWrap = document.createElement('div');
  infoWrap.className = 'watch-info';
  infoWrap.innerHTML = `
    <div class="skeleton" style="height:28px;width:60%;border-radius:4px;margin-bottom:12px"></div>
    <div class="skeleton" style="height:16px;width:40%;border-radius:4px;margin-bottom:20px"></div>
  `;
  page.appendChild(infoWrap);
  const episodeNav = document.createElement('div');
  episodeNav.className = 'watch-actions episode-navigation';
  if (type === 'tv') {
    const prevButton = document.createElement('button');
    prevButton.className = 'btn btn-secondary';
    prevButton.textContent = '< ' + (i18n.t('episode_ep') || 'Episode') + ' ' + Math.max(1, parseInt(episode, 10) - 1);
    prevButton.disabled = parseInt(episode, 10) <= 1;
    prevButton.addEventListener('click', () => navigateEpisode(parseInt(season, 10), Math.max(1, parseInt(episode, 10) - 1)));
    const nextButton = document.createElement('button');
    nextButton.className = 'btn btn-primary';
    nextButton.textContent = (i18n.t('episode_ep') || 'Episode') + ' ' + (parseInt(episode, 10) + 1) + ' >';
    nextButton.addEventListener('click', () => navigateEpisode(parseInt(season, 10), parseInt(episode, 10) + 1));
    episodeNav.append(prevButton, nextButton);
  }
  page.appendChild(episodeNav);

  function navigateEpisode(nextSeason, nextEpisode) {
    const ids = new URLSearchParams();
    if (tmdbId) ids.set('tmdb', tmdbId);
    if (imdbId) ids.set('imdb', imdbId);
    const suffix = ids.toString() ? `?${ids}` : '';
    router.navigate(`/watch/tv/${encodeURIComponent(id)}/${nextSeason}/${nextEpisode}${suffix}`);
  }

  // Related row placeholder
  const relatedRow = createContentRow(
    type === 'movie' ? i18n.t('row_latest_movies') : i18n.t('row_popular_series'),
    null, 6
  );
  page.appendChild(relatedRow);
  page.appendChild(createFooter());

  // Listen for player events
  const progressKey = `${id}_${season}_${episode}`;
  window.addEventListener('message', (e) => {
    if (!page.isConnected || !iframe.src) return;
    let origin;
    try { origin = new URL(iframe.src).origin; } catch { return; }
    if (e.origin !== origin || !e.data || typeof e.data !== 'object') return;
    if (e.data.source === 'vidspark-player') {
      if (Number.isFinite(e.data.currentTime) && e.data.currentTime > 0) cache.setProgress(progressKey, e.data.currentTime);
      if (type === 'tv' && e.data.event === 'ended') navigateEpisode(parseInt(season, 10), parseInt(episode, 10) + 1);
    }
    if ((origin === 'https://embed.vidrift.in' || origin === 'https://embed.vidrift.net') && e.data.type === 'vidrift:nextup-play' && type === 'tv') {
      navigateEpisode(parseInt(season, 10), parseInt(episode, 10) + 1);
    }
    if ((origin === 'https://embed.vidrift.in' || origin === 'https://embed.vidrift.net') && e.data.type === 'vidrift:progress' && Number.isFinite(e.data.currentTime)) {
      cache.setProgress(progressKey, e.data.currentTime);
    }
  });

  iframe.addEventListener('load', () => {
    const provider = API.EMBED_PROVIDERS[currentProviderIndex];
    if (type === 'tv' && provider?.id === 'vidrift') {
      const origin = new URL(iframe.src).origin;
      iframe.contentWindow?.postMessage({ type: 'vidrift:nextup-info', next: { season: parseInt(season, 10), episode: parseInt(episode, 10) + 1 } }, origin);
    }
  });

  // Load metadata + related content
  (async () => {
    try {
      const [movies, tvshows] = await Promise.all([
        type === 'movie' ? fetchMultipleMoviePages(2) : Promise.resolve([]),
        type === 'tv' ? fetchMultipleTVPages(2) : Promise.resolve([]),
      ]);

      const items = type === 'movie' ? movies : tvshows;
      // Find current item
      const current = items.find(i => i.imdb_id === id || String(i.tmdb_id) === String(id));

      if (current) {
        const rating = formatRating(current.rating);
        const genres = parseGenres(current.genre);
        const year = (current.year || '').substring(0, 4);

        let metaHtml = `<h1 class="watch-title">${current.title || ''}</h1>
          <div class="watch-meta">
            ${rating ? `<span>★ <strong>${rating}</strong></span>` : ''}
            ${year ? `<span>${i18n.t('label_year')}: <strong>${year}</strong></span>` : ''}
            ${type === 'tv' ? `<span>${i18n.t('label_season')} ${season} · ${i18n.t('label_episode')} ${episode}</span>` : ''}
          </div>`;

        if (genres.length) {
          metaHtml += `<div class="watch-genres">${genres.map(g => `<span class="watch-genre">${g}</span>`).join('')}</div>`;
        }

        metaHtml += `<div class="watch-actions">
          ${type === 'tv' && parseInt(episode) > 1 ? `
            <button class="btn btn-secondary" id="prev-ep">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
              ${i18n.t('episode_season')}${String(season).padStart(2,'0')} ${i18n.t('episode_ep')}${String(parseInt(episode)-1).padStart(2,'0')}
            </button>` : ''}
          ${type === 'tv' ? `
            <button class="btn btn-primary" id="next-ep">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
              ${i18n.t('episode_season')}${String(season).padStart(2,'0')} ${i18n.t('episode_ep')}${String(parseInt(episode)+1).padStart(2,'0')}
            </button>` : ''}
        </div>`;

        infoWrap.innerHTML = metaHtml;

        infoWrap.querySelector('#next-ep')?.addEventListener('click', () => {
          router.navigate(`/watch/tv/${id}/${season}/${parseInt(episode) + 1}`);
        });
        infoWrap.querySelector('#prev-ep')?.addEventListener('click', () => {
          router.navigate(`/watch/tv/${id}/${season}/${parseInt(episode) - 1}`);
        });
      } else {
        infoWrap.innerHTML = `<h1 class="watch-title">${id}</h1>`;
      }

      // Populate related
      const related = sortByPopularity(filterWithPoster(items)).filter(i => {
        const itemId = i.imdb_id || String(i.tmdb_id);
        return itemId !== id;
      }).slice(0, 18);

      populateRow(relatedRow, related);

    } catch (err) {
      infoWrap.innerHTML = `<p style="color:var(--text2)">${i18n.t('error_fetch')}</p>`;
    }
  })();

  return page;
}
