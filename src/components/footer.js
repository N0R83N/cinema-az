import { i18n } from '../i18n/index.js';
import { router } from '../router/index.js';

let toastContainer = null;

export function showToast(msg, type = 'info') {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

export function createFooter() {
  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = `
    <div class="footer-inner">
      <div>
        <div class="footer-logo">
          <img src="/logo.png" alt="Cinema Az" class="site-logo" />
        </div>
        <p class="footer-desc">${i18n.t('footer_desc')}</p>
      </div>
      <nav class="footer-links" aria-label="Footer navigation">
        <a href="#/">Ana Səhifə</a>
        <a href="#/movies">${i18n.t('nav_movies')}</a>
        <a href="#/series">${i18n.t('nav_series')}</a>
        <a href="#/episodes">${i18n.t('nav_episodes')}</a>
      </nav>
    </div>
    <div class="footer-bottom">
      © ${new Date().getFullYear()} CinemaAz — ${i18n.t('footer_rights')}
    </div>
  `;
  return footer;
}
