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

// Robust Search: Fetches recent catalog and filters locally to avoid CORS issues
export async function search(query) {
  if (!query || query.length < 2) return { movies: [], tvshows: [] };
  const q = query.toLowerCase().trim();
  
  try {
    // Fetch a significant chunk of the catalog (cached) to search within
    // We fetch 15 pages each (~360 items per type) to cover most recent/popular content
    const [movies, tvshows] = await Promise.all([
      fetchMultipleMoviePages(15),
      fetchMultipleTVPages(15)
    ]);
    
    const filteredMovies = movies.filter(m => 
      (m.title || '').toLowerCase().includes(q)
    );
    
    const filteredTV = tvshows.filter(t => 
      (t.title || '').toLowerCase().includes(q)
    );
    
    return { 
      movies: filteredMovies, 
      tvshows: filteredTV 
    };
  } catch (e) {
    console.error('Search failed:', e);
    return { movies: [], tvshows: [] };
  }
}
