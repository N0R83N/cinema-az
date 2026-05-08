import './style.css';
import { router } from './router/index.js';
import { createNavbar, createMobileNav } from './components/navbar.js';
import { homePage } from './pages/home.js';
import { moviesPage } from './pages/movies.js';
import { seriesPage } from './pages/series.js';
import { episodesPage } from './pages/episodes.js';
import { watchPage } from './pages/watch.js';

// ── App shell ──────────────────────────────────────────────
const app = document.getElementById('app');

// Navbar (fixed, outside page content)
app.appendChild(createNavbar());
app.appendChild(createMobileNav());

// Page content container
const pageContent = document.createElement('div');
pageContent.id = 'page-content';
app.appendChild(pageContent);

// ── Routes ─────────────────────────────────────────────────
router.register('/',          () => homePage());
router.register('/movies',    (ctx) => moviesPage(ctx));
router.register('/series',    (ctx) => seriesPage(ctx));
router.register('/episodes',  (ctx) => episodesPage(ctx));

router.register('/watch/movie/:id',                (ctx) => watchPage({ params: { ...ctx.params, type: 'movie' } }));
router.register('/watch/tv/:id/:season/:episode',  (ctx) => watchPage({ params: { ...ctx.params, type: 'tv' } }));

// Fallback → home
router.register('*', () => homePage());

// ── Boot ───────────────────────────────────────────────────
router.init(pageContent);
