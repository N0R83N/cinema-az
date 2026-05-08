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

export async function fetchMultipleEpisodePages(count = 2) {
  const pages = Array.from({ length: count }, (_, i) => fetchEpisodes(i + 1));
  const results = await Promise.allSettled(pages);
  const items = [];
  results.forEach(r => {
    if (r.status === 'fulfilled') items.push(...(r.value.items || []));
  });
  return filterHasTitle(items);
}

// Search using IMDb suggestion API (client-side)
export async function search(query) {
  if (!query || query.length < 2) return { movies: [], tvshows: [] };
  const q = encodeURIComponent(query.toLowerCase());
  const url = `https://v3.sg.media-imdb.com/suggestion/x/${q}.json`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return { movies: [], tvshows: [] };
    const data = await res.json();
    
    const movies = [];
    const tvshows = [];
    
    (data.d || []).forEach(item => {
      // Only include actual titles starting with 'tt'
      if (!item.id || !item.id.startsWith('tt')) return;
      
      const mapped = {
        imdb_id: item.id,
        tmdb_id: null,
        title: item.l,
        type: item.qid === 'tvSeries' ? 'tv' : 'movie',
        poster_url: item.i ? item.i.imageUrl : '',
        year: item.y ? String(item.y) : '',
        rating: '',
        genre: item.s || '' // Subtitle (e.g. actors)
      };
      
      if (mapped.type === 'movie') movies.push(mapped);
      else tvshows.push(mapped);
    });
    
    return { movies, tvshows };
  } catch (e) {
    return { movies: [], tvshows: [] };
  }
}
