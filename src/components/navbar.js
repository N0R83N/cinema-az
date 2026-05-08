import { i18n } from '../i18n/index.js';
import { router } from '../router/index.js';
import { debounce } from '../utils/helpers.js';
import { search } from '../api/vidapi.js';
import { APP_CONFIG } from '../config.js';

function getNavLinks() {
  return [
    { path: '/', label: i18n.t('nav_home') },
    { path: '/movies', label: i18n.t('nav_movies') },
    { path: '/series', label: i18n.t('nav_series') },
    { path: '/episodes', label: i18n.t('nav_episodes') },
  ];
}

export function createNavbar() {
  const nav = document.createElement('nav');
  nav.className = 'navbar';
  nav.id = 'main-navbar';

  function render() {
    const currentPath = router.getCurrentPath().split('?')[0];
    nav.innerHTML = `
      <div class="navbar-logo" id="nav-logo">
        <img src="/logo.png" alt="Cinema Az" class="site-logo" />
      </div>
      <ul class="navbar-nav" id="nav-links">
        ${getNavLinks().map(l => `
          <li><a href="#${l.path}" class="${currentPath === l.path ? 'active' : ''}">${l.label}</a></li>
        `).join('')}
      </ul>
      <div class="navbar-right">
        <div class="search-box" id="search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" id="search-input" placeholder="${i18n.t('search_placeholder')}" autocomplete="off" />
        </div>
        <div class="lang-switcher" id="lang-switcher">
          <button class="lang-btn" id="lang-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            ${i18n.getLang().toUpperCase()}
          </button>
          <div class="lang-dropdown" id="lang-dropdown">
            ${i18n.getAvailableLangs().map(l => `
              <div class="lang-option ${l.code === i18n.getLang() ? 'active' : ''}" data-lang="${l.code}">
                ${l.label} — ${i18n.t('lang_' + l.code)}
              </div>
            `).join('')}
          </div>
        </div>
        <button class="hamburger" id="hamburger" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    `;
    bindEvents();
  }

  function bindEvents() {
    // Logo click
    nav.querySelector('#nav-logo')?.addEventListener('click', () => router.navigate('/'));

    // Search
    const input = nav.querySelector('#search-input');
    const searchBox = nav.querySelector('#search-box');
    if (input) {
      input.addEventListener('focus', () => openSearchOverlay());
      input.addEventListener('input', debounce(async (e) => {
        const q = e.target.value.trim();
        updateSearchOverlay(q);
      }, APP_CONFIG.searchDebounce));
    }

    // Lang dropdown
    const langBtn = nav.querySelector('#lang-btn');
    const langDrop = nav.querySelector('#lang-dropdown');
    langBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      langDrop.classList.toggle('open');
    });
    nav.querySelectorAll('.lang-option').forEach(opt => {
      opt.addEventListener('click', () => {
        i18n.setLang(opt.dataset.lang);
        langDrop.classList.remove('open');
        render();
      });
    });
    document.addEventListener('click', () => langDrop?.classList.remove('open'), { once: true });

    // Hamburger
    const burger = nav.querySelector('#hamburger');
    const mobileNav = document.getElementById('mobile-nav');
    burger?.addEventListener('click', () => {
      mobileNav?.classList.toggle('open');
    });
  }

  // Scroll behavior
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const curr = window.scrollY;
    if (curr > 60) nav.classList.add('scrolled'); else nav.classList.remove('scrolled');
    if (curr > lastScroll + 40 && curr > 200) nav.classList.add('hidden');
    else if (curr < lastScroll - 10) nav.classList.remove('hidden');
    lastScroll = curr;
  });

  // Re-render on lang change and route change
  window.addEventListener('langchange', render);
  window.addEventListener('hashchange', () => setTimeout(render, 100));

  render();
  return nav;
}

// Mobile nav element
export function createMobileNav() {
  const el = document.createElement('div');
  el.className = 'mobile-nav';
  el.id = 'mobile-nav';
  function render() {
    const currentPath = router.getCurrentPath().split('?')[0];
    el.innerHTML = getNavLinks().map(l =>
      `<a href="#${l.path}" class="${currentPath === l.path ? 'active' : ''}">${l.label}</a>`
    ).join('');
    el.querySelectorAll('a').forEach(a => a.addEventListener('click', () => el.classList.remove('open')));
  }
  window.addEventListener('langchange', render);
  window.addEventListener('hashchange', () => setTimeout(render, 100));
  render();
  return el;
}

// Search overlay
let searchOverlay = null;

function openSearchOverlay() {
  if (!searchOverlay) {
    searchOverlay = document.createElement('div');
    searchOverlay.className = 'search-overlay';
    searchOverlay.id = 'search-overlay';
    searchOverlay.innerHTML = `
      <button class="search-overlay-close" id="search-close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div class="search-overlay-input-wrap">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input class="search-overlay-input" id="search-overlay-input" placeholder="${i18n.t('search_placeholder')}" autofocus autocomplete="off" />
      </div>
      <div class="search-results-wrap" id="search-results-wrap">
        <div class="search-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <p>${i18n.t('search_placeholder')}</p>
        </div>
      </div>
    `;
    document.body.appendChild(searchOverlay);

    searchOverlay.querySelector('#search-close').addEventListener('click', closeSearchOverlay);
    searchOverlay.addEventListener('click', e => { if (e.target === searchOverlay) closeSearchOverlay(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearchOverlay(); });

    const overlayInput = searchOverlay.querySelector('#search-overlay-input');
    overlayInput.addEventListener('input', debounce(async (e) => {
      updateSearchOverlay(e.target.value.trim());
    }, APP_CONFIG.searchDebounce));

    // Sync with navbar input
    const navInput = document.getElementById('search-input');
    if (navInput) { overlayInput.value = navInput.value; overlayInput.focus(); }
  }
  searchOverlay.classList.add('open');
  searchOverlay.querySelector('#search-overlay-input')?.focus();
}

function closeSearchOverlay() {
  searchOverlay?.classList.remove('open');
  document.getElementById('search-input').value = '';
}

async function updateSearchOverlay(query) {
  const wrap = document.getElementById('search-results-wrap');
  if (!wrap) return;
  if (!query || query.length < 2) {
    wrap.innerHTML = `<div class="search-empty"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><p>${i18n.t('search_placeholder')}</p></div>`;
    return;
  }
  wrap.innerHTML = `<div class="search-empty"><p>${i18n.t('loading')}</p></div>`;
  try {
    const { movies, tvshows } = await search(query, 3);
    if (!movies.length && !tvshows.length) {
      wrap.innerHTML = `<div class="search-empty"><p>${i18n.t('search_no_results')}: "${query}"</p></div>`;
      return;
    }
    let html = '';
    if (movies.length) {
      html += `<p class="search-section-title">${i18n.t('search_movies')}</p><div class="search-grid">`;
      html += movies.slice(0, 12).map(m => miniCard(m)).join('');
      html += '</div>';
    }
    if (tvshows.length) {
      html += `<p class="search-section-title">${i18n.t('search_series')}</p><div class="search-grid">`;
      html += tvshows.slice(0, 12).map(m => miniCard(m)).join('');
      html += '</div>';
    }
    wrap.innerHTML = html;
    wrap.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.imdb || card.dataset.tmdb;
        const type = card.dataset.type;
        closeSearchOverlay();
        if (type === 'movie') router.navigate(`/watch/movie/${id}`);
        else router.navigate(`/watch/tv/${id}/1/1`);
      });
    });
  } catch {
    wrap.innerHTML = `<div class="search-empty"><p>${i18n.t('error_fetch')}</p></div>`;
  }
}

function miniCard(item) {
  const poster = item.poster_url || '';
  const id = item.imdb_id || item.tmdb_id;
  return `
    <div class="card" data-imdb="${item.imdb_id || ''}" data-tmdb="${item.tmdb_id || ''}" data-type="${item.type}" style="cursor:pointer">
      ${poster ? `<img class="card-img" src="${poster}" alt="${item.title}" loading="lazy" onerror="this.style.display='none'"/>` : `<div class="card-img skeleton"></div>`}
      <div class="card-overlay"></div>
      <div class="card-play"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg></div>
      <div class="card-info">
        <div class="card-title">${item.title || ''}</div>
        <div class="card-meta">
          <span class="card-rating">★ ${item.rating && item.rating != '0.0' ? parseFloat(item.rating).toFixed(1) : '—'}</span>
          <span class="card-year">${(item.year || '').substring(0, 4)}</span>
        </div>
      </div>
    </div>`;
}
