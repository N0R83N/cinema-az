import { i18n } from '../i18n/index.js';
import { createFooter } from '../components/footer.js';
import { createContentRow, populateRow } from '../components/contentRow.js';
import { API } from '../config.js';
import { cache } from '../utils/cache.js';
import { fetchMultipleMoviePages, fetchMultipleTVPages } from '../api/vidapi.js';
import { parseGenres, formatRating, sortByPopularity, filterWithPoster } from '../utils/helpers.js';
import { router } from '../router/index.js';
import { createChat } from '../components/Chat.js';

export async function watchPage({ params }) {
  const { type, id, season = '1', episode = '1' } = params;
  const page = document.createElement('div');
  page.className = 'watch-page';

  let currentProviderIndex = 0;
  let embedUrl = '';
  const savedProgress = cache.getProgress(`${id}_${season}_${episode}`) || 0;

  function getEmbedUrl(index) {
    const provider = API.EMBED_PROVIDERS[index];
    if (type === 'movie') return provider.getMovieUrl(id, savedProgress);
    return provider.getTvUrl(id, season, episode, savedProgress);
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

  // Room Button (only if not in room)
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

  API.EMBED_PROVIDERS.forEach((provider, idx) => {
    const btn = document.createElement('button');
    btn.className = `btn btn-outline ${idx === currentProviderIndex ? 'active' : ''}`;
    btn.style.cssText = 'padding:6px 14px; font-size:0.8rem;';
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;vertical-align:middle"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg> ${provider.name}`;
    
    if (idx === currentProviderIndex) {
      btn.style.background = 'var(--accent)';
      btn.style.borderColor = 'var(--accent)';
      btn.style.color = '#fff';
    }

    btn.addEventListener('click', () => {
      currentProviderIndex = idx;
      serverWrap.querySelectorAll('button').forEach((b, i) => {
        if (i === idx) {
          b.style.background = 'var(--accent)';
          b.style.borderColor = 'var(--accent)';
          b.style.color = '#fff';
        } else {
          b.style.background = 'transparent';
          b.style.borderColor = 'rgba(255,255,255,0.4)';
          b.style.color = '#fff';
        }
      });
      const iframe = playerWrap.querySelector('#video-player');
      if (iframe) iframe.src = getEmbedUrl(currentProviderIndex);
    });
    serverWrap.appendChild(btn);
  });

  page.appendChild(serverWrap);

  // Info section (placeholder while loading)
  const infoWrap = document.createElement('div');
  infoWrap.className = 'watch-info';
  infoWrap.innerHTML = `
    <div class="skeleton" style="height:28px;width:60%;border-radius:4px;margin-bottom:12px"></div>
    <div class="skeleton" style="height:16px;width:40%;border-radius:4px;margin-bottom:20px"></div>
  `;
  page.appendChild(infoWrap);

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
    if (e.data?.type !== 'PLAYER_EVENT') return;
    const { player_status, player_progress, player_info } = e.data.data;
    if (player_status === 'playing' && player_progress > 0) {
      cache.setProgress(progressKey, player_progress);
    }
    if (player_status === 'completed' && type === 'tv') {
      const nextEp = parseInt(episode) + 1;
      router.navigate(`/watch/tv/${id}/${season}/${nextEp}`);
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
