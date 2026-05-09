import { i18n } from '../i18n/index.js';
import { createHero, createHeroSkeleton } from '../components/hero.js';
import { createContentRow, populateRow } from '../components/contentRow.js';
import { createFooter } from '../components/footer.js';
import { fetchMultipleMoviePages, fetchMultipleTVPages, fetchMultipleEpisodePages } from '../api/vidapi.js';
import { sortByPopularity, sortByRating, filterHasTitle, filterWithPoster } from '../utils/helpers.js';
import { router } from '../router/index.js';
import { cache } from '../utils/cache.js';
import { createMovieCard } from '../components/movieCard.js';

export async function homePage() {
  const page = document.createElement('div');
  page.id = 'home-page';

  // Skeleton hero
  const heroWrap = document.createElement('div');
  heroWrap.appendChild(createHeroSkeleton());
  page.appendChild(heroWrap);

  // Placeholder rows
  const rows = {
    trending: createContentRow(i18n.t('row_trending'), null),
    latest: createContentRow(i18n.t('row_latest_movies'), null),
    popular: createContentRow(i18n.t('row_popular_movies') || 'IMDb Populyar Filmlər', null),
    series: createContentRow(i18n.t('row_popular_series'), null),
  };
  Object.values(rows).forEach(r => page.appendChild(r));

  // Watchlist row (if any)
  const watchlist = cache.getWatchlist();
  if (watchlist.length > 0) {
    const wRow = createContentRow(i18n.t('row_watchlist'), watchlist);
    page.insertBefore(wRow, rows.trending);
  }

  page.appendChild(createFooter());

  // Async data load
  (async () => {
    try {
      const [movies, tvshows] = await Promise.all([
        fetchMultipleMoviePages(4), // Fetch more movies to get a good pool for popularity
        fetchMultipleTVPages(2),
      ]);

      // Replace hero skeleton
      const hero = createHero(movies);
      heroWrap.innerHTML = '';
      heroWrap.appendChild(hero);

      // Populate rows
      const trending = sortByPopularity(filterWithPoster(movies)).slice(0, 20);
      const latest = movies.slice(0, 20);
      const popularSeries = sortByPopularity(filterWithPoster(tvshows)).slice(0, 20);
      
      // Popular Movies (sorted by rating and popularity)
      const popularMovies = sortByRating(filterWithPoster(movies)).slice(0, 20);

      populateRow(rows.trending, trending);
      populateRow(rows.latest, latest);
      populateRow(rows.series, popularSeries);
      populateRow(rows.popular, popularMovies);

    } catch (err) {
      console.error('Home page load error:', err);
    }
  })();

  return page;
}
