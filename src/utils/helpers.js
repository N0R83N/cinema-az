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

export function parseGenres(genreStr) {
  if (!genreStr) return [];
  return genreStr.split(',').map(g => g.trim()).filter(Boolean);
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
  items.forEach(item => {
    parseGenres(item.genre).forEach(g => genreSet.add(g));
  });
  return Array.from(genreSet).sort();
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
