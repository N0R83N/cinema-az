import { API } from '../config.js';

export function getPosterUrl(item, size = 'md') {
  if (!item) return API.FALLBACK_POSTER;
  let url = item.poster_url || '';
  if (!url) return API.FALLBACK_POSTER;
  // Replace size in TMDB URLs
  if (url.includes('image.tmdb.org')) {
    const sizeMap = { sm: 'w342', md: 'w500', lg: 'original' };
    return url.replace(/\/t\/p\/[^/]+\//, `/t/p/${sizeMap[size] || 'w500'}/`);
  }
  return url;
}

export function formatRating(rating) {
  const r = parseFloat(rating);
  if (!r || r === 0) return null;
  return r.toFixed(1);
}

export function formatYear(year) {
  if (!year) return '';
  return String(year).substring(0, 4);
}

export function truncate(str, max = 80) {
  if (!str) return '';
  return str.length > max ? str.substring(0, max) + '…' : str;
}

export function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function getEmbedUrl(item, season, episode) {
  const id = item.imdb_id || item.tmdb_id || item.show_imdb_id || item.show_tmdb_id;
  if (!id) return null;
  if (item.type === 'movie') return API.EMBED_MOVIE(id);
  if (item.type === 'tv') return API.EMBED_TV(id, season || 1, episode || 1);
  if (item.type === 'episode') {
    return API.EMBED_TV(
      item.show_imdb_id || item.show_tmdb_id,
      item.season_number,
      item.episode_number
    );
  }
  return null;
}

export function parseGenres(genreInput) {
  if (!genreInput) return [];
  const values = Array.isArray(genreInput) ? genreInput : String(genreInput).split(/[,;|]/);
  const combined = { 'sci-fi & fantasy': ['Sci-Fi', 'Fantasy'], 'science fiction & fantasy': ['Sci-Fi', 'Fantasy'], 'action & adventure': ['Action', 'Adventure'] };
  const aliases = { 'science fiction': 'Sci-Fi', 'sci fi': 'Sci-Fi', 'sci-fi': 'Sci-Fi', 'reality-tv': 'Reality TV', 'reality tv': 'Reality TV', 'film noir': 'Film-Noir', 'film-noir': 'Film-Noir', 'talk show': 'Talk-Show', 'talk-show': 'Talk-Show', 'tv movie': 'TV Movie' };
  return [...new Set(values.flatMap(value => {
    const label = String(value || '').trim().replace(/[–—]/g, '-').replace(/\s+/g, ' ');
    if (!label) return [];
    const key = label.toLowerCase();
    if (combined[key]) return combined[key];
    return [aliases[key] || label];
  }))];
}

export function formatAirDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('az-Latn-AZ', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function sortByPopularity(items) {
  return [...items].sort((a, b) => parseFloat(b.popularity || 0) - parseFloat(a.popularity || 0));
}

export function sortByRating(items) {
  return [...items].sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0));
}

export function filterWithPoster(items) {
  return items.filter(item => item.poster_url && item.poster_url.length > 0);
}

export function filterHasTitle(items) {
  return items.filter(item => item.title || item.show_title || item.episode_title);
}

export function getTopRated(items, count = 5) {
  return sortByPopularity(filterWithPoster(items)).slice(0, count);
}

export function extractGenres(items) {
  const genreSet = new Set();
  items.forEach(item => parseGenres(item.genre ?? item.genres).forEach(g => genreSet.add(g)));
  const order = ['Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'Film-Noir', 'Game-Show', 'History', 'Horror', 'Music', 'Musical', 'Mystery', 'News', 'Reality TV', 'Romance', 'Sci-Fi', 'Short', 'Sport', 'Talk-Show', 'Thriller', 'TV Movie', 'War', 'Western'];
  return [...genreSet].sort((a, b) => {
    const ai = order.indexOf(a), bi = order.indexOf(b);
    if (ai < 0 && bi < 0) return a.localeCompare(b);
    if (ai < 0) return 1;
    if (bi < 0) return -1;
    return ai - bi;
  });
}

export function matchesGenre(item, genre) {
  return genre === 'all' || parseGenres(item?.genre ?? item?.genres).includes(genre);
}

export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  });
  children.forEach(child => {
    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
    else if (child) el.appendChild(child);
  });
  return el;
}
