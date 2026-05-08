import { cache } from '../utils/cache.js';

import az from './az.json';
import en from './en.json';
import tr from './tr.json';
import ru from './ru.json';

const LANGS = { az, en, tr, ru };

let currentLang = cache.getLang();

// Auto-detect browser language on first visit
if (!localStorage.getItem('cinemaaz_lang')) {
  const browser = navigator.language?.split('-')[0];
  if (LANGS[browser]) currentLang = browser;
}

export const i18n = {
  t(key) {
    const dict = LANGS[currentLang] || LANGS.az;
    return dict[key] || LANGS.az[key] || key;
  },

  getLang() {
    return currentLang;
  },

  setLang(lang) {
    if (!LANGS[lang]) return;
    currentLang = lang;
    cache.setLang(lang);
    document.documentElement.lang = lang;
    window.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  },

  getAvailableLangs() {
    return [
      { code: 'az', label: 'AZ' },
      { code: 'en', label: 'EN' },
      { code: 'tr', label: 'TR' },
      { code: 'ru', label: 'RU' },
    ];
  }
};

// Set initial HTML lang attr
document.documentElement.lang = currentLang;
