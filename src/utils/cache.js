import { APP_CONFIG } from '../config.js';

const PREFIX = 'cinemaaz_';

export const cache = {
  get(key) {
    try {
      const item = localStorage.getItem(PREFIX + key);
      if (!item) return null;
      const { data, timestamp } = JSON.parse(item);
      if (Date.now() - timestamp > APP_CONFIG.cacheTime) {
        localStorage.removeItem(PREFIX + key);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  set(key, data) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch {
      // Storage full — clear old items
      this.clearOld();
    }
  },

  clearOld() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX));
    keys.slice(0, Math.floor(keys.length / 2)).forEach(k => localStorage.removeItem(k));
  },

  // Watch progress
  getProgress(id) {
    try {
      return parseFloat(localStorage.getItem(`progress_${id}`)) || 0;
    } catch { return 0; }
  },

  setProgress(id, seconds) {
    try {
      localStorage.setItem(`progress_${id}`, seconds);
    } catch {}
  },

  // Language preference
  getLang() {
    return localStorage.getItem('cinemaaz_lang') || APP_CONFIG.defaultLang;
  },
  setLang(lang) {
    localStorage.setItem('cinemaaz_lang', lang);
  },

  // Watchlist
  getWatchlist() {
    try {
      return JSON.parse(localStorage.getItem('cinemaaz_watchlist') || '[]');
    } catch { return []; }
  },
  toggleWatchlist(item) {
    const list = this.getWatchlist();
    const idx = list.findIndex(i => (i.imdb_id || i.tmdb_id) === (item.imdb_id || item.tmdb_id));
    if (idx >= 0) list.splice(idx, 1);
    else list.unshift(item);
    localStorage.setItem('cinemaaz_watchlist', JSON.stringify(list));
    return idx < 0; // returns true if added
  },
  isInWatchlist(item) {
    return this.getWatchlist().some(
      i => (i.imdb_id || i.tmdb_id) === (item.imdb_id || item.tmdb_id)
    );
  }
};
