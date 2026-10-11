// Central API configuration — swap endpoints here easily
export const API = {
  MOVIES_LATEST: 'https://vidapi.ru/movies/latest/page-{PAGE}.json',
  TVSHOWS_LATEST: 'https://vidapi.ru/tvshows/latest/page-{PAGE}.json',
  EPISODES_LATEST: 'https://vidapi.ru/episodes/latest/page-{PAGE}.json',
  STATS: 'https://vidapi.ru/imdb/api/?action=stats',

  // Provider URL builders accept an explicitly selected identifier type.
  EMBED_PROVIDERS: [
    { id: 'vidcore', name: 'VidCore', idType: 'tmdb', movie: id => `https://vidcore.org/embed/movie/${id}?theme=E50914`, tv: (id, s, e) => `https://vidcore.org/embed/tv/${id}/${s}/${e}?theme=E50914` },
    { id: 'embedwave', name: 'EmbedWave', idType: 'tmdb', movie: id => `https://embedwave.cc/embed/movie/${id}?server=auto`, tv: (id, s, e) => `https://embedwave.cc/embed/tv/${id}/${s}/${e}?server=auto` },
    { id: 'ezvidapi', name: 'ezvidapi', idType: 'tmdb', movie: id => `https://ezvidapi.com/embed/movie/${id}`, tv: (id, s, e) => `https://ezvidapi.com/embed/tv/${id}/${s}/${e}` },
    { id: 'vidrift', name: 'VidRift', idType: 'tmdb', movie: id => `https://embed.vidrift.in/embed/movie/${id}?brandColor=E50914`, tv: (id, s, e) => `https://embed.vidrift.in/embed/tv/${id}/${s}/${e}?brandColor=E50914` },
    { id: 'apiplayer', name: 'APIPlayer.ru', idType: 'both', movie: id => `https://apiplayer.ru/embed/movie/${id}?lang=tr&color=E50914`, tv: (id, s, e) => `https://apiplayer.ru/embed/tv/${id}/${s}/${e}?lang=tr&color=E50914` },
    { id: 'vidspark', name: 'VidSpark / MoviesAPI', idType: 'both', movie: id => `https://vidspark.to/movie/${id}?theme=E50914`, tv: (id, s, e) => `https://vidspark.to/tv/${id}/${s}/${e}?theme=E50914` },
    { id: 'autoembed', name: 'AutoEmbed', idType: 'both', movie: (id, kind) => `https://autoembed.co/movie/${kind}/${id}`, tv: (id, s, e, kind) => `https://autoembed.co/tv/${kind}/${id}-${s}-${e}` },
    { id: 'frembed', name: 'Frembed', idType: 'both', movie: id => `https://frembed.surf/embed/movie/${id}`, tv: (id, s, e) => `https://frembed.surf/embed/serie/${id}?sa=${s}&epi=${e}` },
    { id: 'nontongo', name: 'Nontongo', idType: 'both', movie: id => `https://www.nontongo.win/embed/movie/${id}`, tv: (id, s, e) => `https://www.nontongo.win/embed/tv/${id}/${s}/${e}` },
    { id: 'vidfast', name: 'VidFast', idType: 'both', movie: id => `https://vidfast.to/movie/${id}`, tv: (id, s, e) => `https://vidfast.to/tv/${id}/${s}/${e}` },
    { id: 'vidlink', name: 'VidLink', idType: 'tmdb', movie: id => `https://vidlink.pro/movie/${id}?primaryColor=E50914`, tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=E50914` }
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
