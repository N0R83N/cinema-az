// Central API configuration — swap endpoints here easily
export const API = {
  MOVIES_LATEST: 'https://vidapi.ru/movies/latest/page-{PAGE}.json',
  TVSHOWS_LATEST: 'https://vidapi.ru/tvshows/latest/page-{PAGE}.json',
  EPISODES_LATEST: 'https://vidapi.ru/episodes/latest/page-{PAGE}.json',
  STATS: 'https://vidapi.ru/imdb/api/?action=stats',

  // Multiple Embed Providers for server switching
  EMBED_PROVIDERS: [
    {
      id: 'vidsrc',
      name: 'Server 1 (HD)',
      getMovieUrl: (id, progress) => `https://vidsrc-embed.ru/embed/movie/${id}?primaryColor=%23E50914&lang=az${progress > 30 ? `&resumeAt=${progress}` : ''}`,
      getTvUrl: (id, s, e, progress) => `https://vidsrc-embed.ru/embed/tv/${id}/${s}-${e}?primaryColor=%23E50914&lang=az${progress > 30 ? `&resumeAt=${progress}` : ''}`
    },
    {
      id: 'vaplayer',
      name: 'Server 2 (Fast)',
      getMovieUrl: (id, progress) => `https://vaplayer.ru/embed/movie/${id}?primaryColor=%23E50914&lang=az${progress > 30 ? `&resumeAt=${progress}` : ''}`,
      getTvUrl: (id, s, e, progress) => `https://vaplayer.ru/embed/tv/${id}/${s}/${e}?primaryColor=%23E50914&lang=az${progress > 30 ? `&resumeAt=${progress}` : ''}`
    },
    {
      id: '2embed',
      name: 'Server 3 (Backup)',
      getMovieUrl: (id, progress) => `https://www.2embed.cc/embed/${id}`,
      getTvUrl: (id, s, e, progress) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
    }
  ],

  // Primary color for player theming
  PLAYER_COLOR: '%23E50914',

  // Subtitle language
  PLAYER_LANG: 'az',

  // TMDB image base (already included in API responses)
  TMDB_IMG: 'https://image.tmdb.org/t/p',
  TMDB_POSTER_SM: 'https://image.tmdb.org/t/p/w342',
  TMDB_POSTER_MD: 'https://image.tmdb.org/t/p/w500',
  TMDB_POSTER_LG: 'https://image.tmdb.org/t/p/original',

  // Fallback poster
  FALLBACK_POSTER: 'https://via.placeholder.com/300x450/141414/808080?text=No+Image',
};

export const APP_CONFIG = {
  name: 'Cinema Az',
  defaultLang: 'az',
  cacheTime: 30 * 60 * 1000, // 30 minutes
  heroRotateInterval: 8000,  // 8 seconds
  searchDebounce: 400,       // ms
  cardsPerRow: 6,
  infiniteScrollOffset: 400, // px from bottom
};
