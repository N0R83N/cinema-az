// Hash-based SPA router
const routes = {};
let appContainer = null;

export const router = {
  register(path, handler) {
    routes[path] = handler;
  },

  navigate(path) {
    window.location.hash = path.startsWith('#') ? path : '#' + path;
  },

  getCurrentPath() {
    return window.location.hash.replace('#', '') || '/';
  },

  parseParams(path, pattern) {
    const pp = pattern.split('/');
    const ap = path.split('/');
    if (pp.length !== ap.length) return null;
    const params = {};
    for (let i = 0; i < pp.length; i++) {
      if (pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(ap[i]);
      else if (pp[i] !== ap[i]) return null;
    }
    return params;
  },

  parseQuery(raw) {
    const [basePath, qs] = raw.split('?');
    const query = {};
    if (qs) qs.split('&').forEach(p => {
      const [k, v] = p.split('=');
      if (k) query[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
    return { basePath, query };
  },

  async resolve(rawPath) {
    const { basePath, query } = this.parseQuery(rawPath);
    let handler = null, params = {};
    for (const pattern of Object.keys(routes)) {
      const p = this.parseParams(basePath, pattern);
      if (p !== null) { handler = routes[pattern]; params = p; break; }
    }
    if (!handler) handler = routes['/'];
    if (!appContainer || !handler) return;

    appContainer.style.opacity = '0';
    appContainer.style.transform = 'translateY(8px)';
    await new Promise(r => setTimeout(r, 150));

    const content = await handler({ params, query });
    appContainer.innerHTML = '';
    if (typeof content === 'string') appContainer.innerHTML = content;
    else if (content) appContainer.appendChild(content);

    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => {
      appContainer.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      appContainer.style.opacity = '1';
      appContainer.style.transform = 'translateY(0)';
    });
  },

  init(container) {
    appContainer = container;
    const go = () => this.resolve(this.getCurrentPath());
    window.addEventListener('hashchange', go);
    go();
  }
};
