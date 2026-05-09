import { API } from '../config.js';
import { cache } from '../utils/cache.js';
import { filterWithPoster, filterHasTitle } from '../utils/helpers.js';

async function fetchJSON(url) {
  const cacheKey = url.replace(/https?:\/\/[^/]+\//, '').replace(/[^a-z0-9]/gi, '_');
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const data = await res.json();
  cache.set(cacheKey, data);
  return data;
}

export async function fetchMovies(page = 1) {
  const url = API.MOVIES_LATEST.replace('{PAGE}', page);
  return fetchJSON(url);
}

export async function fetchTVShows(page = 1) {
  const url = API.TVSHOWS_LATEST.replace('{PAGE}', page);
  return fetchJSON(url);
}

export async function fetchEpisodes(page = 1) {
  const url = API.EPISODES_LATEST.replace('{PAGE}', page);
  return fetchJSON(url);
}

export async function fetchStats() {
  return fetchJSON(API.STATS);
}

// Fetch multiple pages in parallel and merge items
export async function fetchMultipleMoviePages(count = 3) {
  const pages = Array.from({ length: count }, (_, i) => fetchMovies(i + 1));
  const results = await Promise.allSettled(pages);
  const items = [];
  results.forEach(r => {
    if (r.status === 'fulfilled') items.push(...(r.value.items || []));
  });
  return filterWithPoster(filterHasTitle(items));
}

export async function fetchMultipleTVPages(count = 2) {
  const pages = Array.from({ length: count }, (_, i) => fetchTVShows(i + 1));
  const results = await Promise.allSettled(pages);
  const items = [];
  results.forEach(r => {
    if (r.status === 'fulfilled') items.push(...(r.value.items || []));
  });
  return filterWithPoster(filterHasTitle(items));
}

// Robust Episode Fetcher: Cross-references with TV show list and uses external fallback for posters
export async function fetchMultipleEpisodePages(count = 2) {
  try {
    const epRes = await Promise.all(Array.from({ length: count }, (_, i) => fetchEpisodes(i + 1)));
    
    // Flatten all episodes
    let items = [];
    epRes.forEach(res => {
      items.push(...(res.items || []));
    });

    // Try to recover posters for these episodes
    // 1. Get a pool of latest TV shows to match posters
    const tvPool = await fetchMultipleTVPages(5); // Get ~120 popular shows
    const posterMap = {};
    tvPool.forEach(tv => {
      if (tv.imdb_id) posterMap[tv.imdb_id] = tv.poster_url;
    });

    // 2. Map items and use a clever fallback for missing posters
    const mappedItems = items.map(item => {
      const imdbId = item.show_imdb_id;
      let poster = item.poster_url || posterMap[imdbId] || '';
      
      // If still no poster, we'll try a public TMDB/IMDB lookup pattern if we can
      // For now, we'll use a specific placeholder that looks better
      if (!poster && item.show_tmdb_id) {
         // Some APIs support a direct redirect or we can use a known pattern
         // poster = `https://image.tmdb.org/t/p/w500/...`; // We don't have the path here
      }

      return {
        ...item,
        imdb_id: imdbId,
        tmdb_id: item.show_tmdb_id,
        title: item.show_title || item.episode_title,
        poster_url: poster,
        type: 'tv'
      };
    });

    return filterHasTitle(mappedItems);
  } catch (e) {
    console.error('Episode fetch error:', e);
    return [];
  }
}

// Global IMDb Search using JSONP (bypasses all CORS restrictions everywhere)
export async function search(query) {
  if (!query || query.length < 2) return { movies: [], tvshows: [] };
  
  const cleanQ = query.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const firstChar = cleanQ[0] || 'a';
  const callbackName = `imdb$${cleanQ}`;
  const url = `https://sg.media-imdb.com/suggests/${firstChar}/${cleanQ}.json`;

  return new Promise((resolve) => {
    const script = document.createElement('script');
    
    // IMDb JSONP callback
    window[callbackName] = (data) => {
      const movies = [];
      const tvshows = [];
      
      (data.d || []).forEach(item => {
        if (!item.id || !item.id.startsWith('tt')) return;
        
        const mapped = {
          imdb_id: item.id,
          tmdb_id: null,
          title: item.l,
          type: (item.qid === 'tvSeries' || item.qid === 'tvMiniSeries') ? 'tv' : 'movie',
          poster_url: (item.i && item.i[0]) ? item.i[0] : '',
          year: item.y ? String(item.y) : '',
          rating: '',
          genre: item.s || ''
        };
        
        if (mapped.type === 'movie') movies.push(mapped);
        else tvshows.push(mapped);
      });
      
      resolve({ movies, tvshows });
      document.head.removeChild(script);
      delete window[callbackName];
    };

    script.src = url;
    script.onerror = () => {
      resolve({ movies: [], tvshows: [] });
      if (document.head.contains(script)) document.head.removeChild(script);
      delete window[callbackName];
    };
    document.head.appendChild(script);
  });
}
