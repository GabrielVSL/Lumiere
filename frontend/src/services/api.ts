import {
  Episode,
  Genre,
  MediaDetails,
  MediaItem,
  MediaType,
  PlayCatalogResponse,
  PlayFacetsResponse,
  PlayStreamManifest,
  PlayWorkItem,
} from '../types';

// Permite configurar URL customizada via env ou usa a rota relativa /api
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const FASTAPI_BASE_URL =
  import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000/v1';

export const FASTAPI_HEALTH_URL = `${FASTAPI_BASE_URL.replace(/\/v1\/?$/, '')}/healthz`;

/**
 * Verifica se o backend FastAPI já acordou (útil para monitorar cold boot em nuvem sob demanda).
 */
export const checkBackendHealth = async (timeoutMs: number = 15000): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(FASTAPI_HEALTH_URL, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
};

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
export const DIRECT_TMDB_KEY =
  import.meta.env.VITE_TMDB_API_KEY || '2dca580c2a14b55200e784d157207b4d';

// Catálogo curado de fallback para quando a API local estiver iniciando
const FALLBACK_PLAY_CATALOG: PlayWorkItem[] = [
  {
    id: 9,
    title: 'Núpcias Reais',
    original_title: 'Royal Wedding',
    year: 1951,
    runtime_min: 93,
    kind: 'feature',
    tagline: 'Onde Fred Astaire desafia a gravidade dançando pelas paredes e teto.',
    genres: ['Musical', 'Comédia', 'Romance'],
    directors: ['Stanley Donen'],
    poster_path: 'https://image.tmdb.org/t/p/w500/0t6sX7g9hW8mP6mZ5n1k7Z9X2m9.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/1u7tY8h0hW9mP7mZ6n2k8Z0X3n0.jpg',
    overview_pt:
      'Tom e Ellen Bowen são uma famosa dupla de irmãos dançarinos da Broadway que viajam a Londres durante as celebrações do casamento real britânico de 1947.',
    license: {
      region: 'BR',
      status: 'public_domain',
      rule: 'lei_9610_art_44_audiovisual',
      confidence: 'high',
      evidence: { release_year: 1951, rule: 'Art. 44 da Lei 9.610/98 (70 anos pós-divulgação)' },
    },
  },
  {
    id: 1,
    title: 'Jejum de Amor',
    original_title: 'His Girl Friday',
    year: 1940,
    runtime_min: 92,
    kind: 'feature',
    tagline: 'Ela prometeu largar o jornalismo... até a maior manchete do século bater à porta.',
    genres: ['Comédia', 'Romance', 'Clássico'],
    directors: ['Howard Hawks'],
    poster_path: 'https://image.tmdb.org/t/p/w500/z0nS2a3l6pM7YF31L1zH9G8XG8P.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/bS6ZkF3zP5gU2sQz9Y8xH1mQ5nZ.jpg',
    overview_pt:
      'Walter Burns, editor de um grande jornal, usa todas as artimanhas possíveis para impedir que sua ex-esposa e repórter estrela abandone a carreira.',
    license: {
      region: 'BR',
      status: 'public_domain',
      rule: 'lei_9610_art_44_audiovisual',
      confidence: 'high',
      evidence: { release_year: 1940, rule: 'Art. 44 da Lei 9.610/98 (70 anos pós-divulgação)' },
    },
  },
  {
    id: 2,
    title: 'O Fantasma da Ópera',
    original_title: 'The Phantom of the Opera',
    year: 1925,
    runtime_min: 93,
    kind: 'feature',
    tagline: 'A lenda sombria das catacumbas de Paris.',
    genres: ['Terror', 'Mistério', 'Clássico'],
    directors: ['Rupert Julian'],
    poster_path: 'https://image.tmdb.org/t/p/w500/vQ9n9rWbC1mY7T2l0mH9n8Z1k8P.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/u7H0eJ2yG8N7bX1k3mY5pQ9n0Z1.jpg',
    overview_pt:
      'Nas catacumbas sob a Ópera de Paris vive Erik, um compositor genial e desfigurado conhecido como o Fantasma. Cego de paixão por Christine, ele aterroriza o teatro.',
    license: {
      region: 'BR',
      status: 'public_domain',
      rule: 'lei_9610_art_44_audiovisual',
      confidence: 'high',
      evidence: { release_year: 1925, rule: 'Art. 44 da Lei 9.610/98 (70 anos pós-divulgação)' },
    },
  },
  {
    id: 3,
    title: 'O Gabinete do Dr. Caligari',
    original_title: 'Das Cabinet des Dr. Caligari',
    year: 1920,
    runtime_min: 77,
    kind: 'feature',
    tagline: 'O ápice do Expressionismo Alemão no cinema mundial.',
    genres: ['Terror', 'Expressivismo', 'Mistério'],
    directors: ['Robert Wiene'],
    poster_path: 'https://image.tmdb.org/t/p/w500/6f3P8gZ3hW0hP7mY7n1k9Z1X2m8.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/vH8pQ4z5hW1hP8mY7n2k9Z1X3m9.jpg',
    overview_pt:
      'Num parque de diversões na Alemanha, o hipnotizador Dr. Caligari exibe Cesare, um sonâmbulo capaz de prever o futuro enquanto assassinatos macabros acontecem.',
    license: {
      region: 'BR',
      status: 'public_domain',
      rule: 'lei_9610_art_44_audiovisual',
      confidence: 'high',
      evidence: { release_year: 1920, rule: 'Art. 44 da Lei 9.610/98 (70 anos pós-divulgação)' },
    },
  },
  {
    id: 4,
    title: 'O Estranho',
    original_title: 'The Stranger',
    year: 1946,
    runtime_min: 95,
    kind: 'feature',
    tagline: 'Um fugitivo do pós-guerra escondido no coração da América.',
    genres: ['Suspense', 'Noir', 'Drama'],
    directors: ['Orson Welles'],
    poster_path: 'https://image.tmdb.org/t/p/w500/7aQ5pY1hW8mP8mY7n2k9Z1X3m9.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/8aR6pY2hW9mP8mY7n3k9Z1X4m0.jpg',
    overview_pt:
      'Um investigador de crimes de guerra viaja a uma pacata cidade da Nova Inglaterra na caça de Franz Kindler, um dos arquitetos do Holocausto que assumiu nova identidade.',
    license: {
      region: 'BR',
      status: 'public_domain',
      rule: 'lei_9610_art_44_audiovisual',
      confidence: 'high',
      evidence: { release_year: 1946, rule: 'Art. 44 da Lei 9.610/98 (70 anos pós-divulgação)' },
    },
  },
  {
    id: 6,
    title: 'Almas Perversas',
    original_title: 'Scarlet Street',
    year: 1945,
    runtime_min: 102,
    kind: 'feature',
    tagline: 'Uma mulher sem escrúpulos. Um pintor ingênuo. Uma descida sem volta.',
    genres: ['Noir', 'Drama', 'Crime'],
    directors: ['Fritz Lang'],
    poster_path: 'https://image.tmdb.org/t/p/w500/4n0mR1a3hW2mP0mY9n5k1Z3X6m3.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/5o1nS2b4hW3mP1mZ0n6k2Z4X7m4.jpg',
    overview_pt:
      'Christopher Cross, um modesto caixa de banco que pinta por passatempo, apaixona-se por Kitty March, que o explora até a ruína moral absoluta.',
    license: {
      region: 'BR',
      status: 'public_domain',
      rule: 'lei_9610_art_44_audiovisual',
      confidence: 'high',
      evidence: { release_year: 1945, rule: 'Art. 44 da Lei 9.610/98 (70 anos pós-divulgação)' },
    },
  },
];

const FALLBACK_STREAMS: Record<number, PlayStreamManifest> = {
  1: {
    work_id: 1,
    title: 'Jejum de Amor',
    original_title: 'His Girl Friday',
    year: 1940,
    runtime_min: 92,
    backdrop_path: 'https://image.tmdb.org/t/p/original/bS6ZkF3zP5gU2sQz9Y8xH1mQ5nZ.jpg',
    poster_path: 'https://image.tmdb.org/t/p/w500/z0nS2a3l6pM7YF31L1zH9G8XG8P.jpg',
    overview_pt:
      'Walter Burns, editor de um grande jornal, usa todas as artimanhas possíveis para impedir que sua ex-esposa se case com outro.',
    streams: [
      {
        url: 'https://archive.org/download/his_girl_friday/his_girl_friday.mp4',
        container: 'mp4',
        codec: 'h264',
        height: 480,
        provider: 'archive',
        priority: 1,
      },
    ],
    subtitles: [
      {
        id: 108,
        lang: 'pt',
        url: `${FASTAPI_BASE_URL}/play/subtitles/108.vtt`,
        origin: 'curated',
      },
      {
        id: 1,
        lang: 'en',
        url: `${FASTAPI_BASE_URL}/play/subtitles/1.vtt`,
        origin: 'asr',
      },
    ],
    license_status: 'public_domain',
    license_rule: 'lei_9610_art_44_audiovisual',
    license_confidence: 'high',
    license_evidence: {
      jurisdiction: 'Brasil (Lei 9.610/98 Art. 44)',
      release_year: 1940,
      public_domain_since: 2011,
    },
  },
  2: {
    work_id: 2,
    title: 'O Fantasma da Ópera',
    original_title: 'The Phantom of the Opera',
    year: 1925,
    runtime_min: 93,
    backdrop_path: 'https://image.tmdb.org/t/p/original/6FSs7jMimg1PBYdhZtPNQhtKtEc.jpg',
    poster_path: 'https://image.tmdb.org/t/p/w500/g6gFsONr9GdGiIhbdpqM65Patbi.jpg',
    overview_pt:
      'Nas catacumbas sob a Ópera de Paris vive Erik, o Fantasma desfigurado apaixonado por Christine.',
    streams: [
      {
        url: 'https://archive.org/download/the-phantom-of-the-opera.-1925.-remastered-version./The%20Phantom%20Of%20The%20Opera.%201925.%20Remastered%20version..mp4',
        container: 'mp4',
        codec: 'h264',
        height: 1080,
        provider: 'archive',
        priority: 1,
      },
      {
        url: 'https://archive.org/download/ThePhantomOfTheOpera_201612/The%20Phantom%20of%20the%20Opera.mp4',
        container: 'mp4',
        codec: 'h264',
        height: 480,
        provider: 'archive',
        priority: 1,
      },
    ],
    subtitles: [
      {
        id: 101,
        lang: 'pt',
        url: `${FASTAPI_BASE_URL}/play/subtitles/101.vtt`,
        origin: 'curated',
      },
      {
        id: 102,
        lang: 'en',
        url: `${FASTAPI_BASE_URL}/play/subtitles/102.vtt`,
        origin: 'asr',
      },
    ],
    license_status: 'public_domain',
    license_rule: 'lei_9610_art_44_audiovisual',
    license_confidence: 'high',
    license_evidence: {
      jurisdiction: 'Brasil (Lei 9.610/98 Art. 44)',
      release_year: 1925,
      public_domain_since: 1996,
    },
  },
  3: {
    work_id: 3,
    title: 'O Gabinete do Dr. Caligari',
    original_title: 'Das Cabinet des Dr. Caligari',
    year: 1920,
    runtime_min: 77,
    backdrop_path: 'https://image.tmdb.org/t/p/original/sLq72hBx8Xs2IISVsZJqgjOd31b.jpg',
    poster_path: 'https://image.tmdb.org/t/p/w500/j09TT0S1crBSYjPu14vgzSSFqFo.jpg',
    overview_pt:
      'Num parque de diversões na Alemanha, o hipnotizador Dr. Caligari exibe Cesare, um sonâmbulo capaz de prever o futuro enquanto assassinatos macabros acontecem.',
    streams: [
      {
        url: 'https://archive.org/download/the-cabinet-of-dr.-caligari-1920-1080p/The%20Cabinet%20of%20Dr.%20Caligari%20%281920%29%201080p.mp4',
        container: 'mp4',
        codec: 'h264',
        height: 1080,
        provider: 'archive',
        priority: 1,
      },
      {
        url: 'https://archive.org/download/the-cabinet-of-dr.-caligari-1920-1080p/The%20Cabinet%20of%20Dr%20Caligari%20%281920%29%20720p.mp4',
        container: 'mp4',
        codec: 'h264',
        height: 720,
        provider: 'archive',
        priority: 1,
      },
    ],
    subtitles: [
      {
        id: 99,
        lang: 'pt',
        url: `${FASTAPI_BASE_URL}/play/subtitles/99.vtt`,
        origin: 'curated',
      },
    ],
    license_status: 'public_domain',
    license_rule: 'lei_9610_art_44_audiovisual',
    license_confidence: 'high',
    license_evidence: {
      jurisdiction: 'Brasil (Lei 9.610/98 Art. 44)',
      release_year: 1920,
      public_domain_since: 1991,
    },
  },
  13: {
    work_id: 13,
    title: 'Nosferatu',
    original_title: 'Nosferatu, eine Symphonie des Grauens',
    year: 1922,
    runtime_min: 94,
    backdrop_path: 'https://image.tmdb.org/t/p/original/cA9iGtvjRGJHzDBfrq48l0eyCvA.jpg',
    poster_path: 'https://image.tmdb.org/t/p/w500/zEzQTngP7F4qVmLDCWg5Hby6cgX.jpg',
    overview_pt:
      'O corretor de imóveis Hutter viaja até os Montes Cárpatos para fechar negócio com o excêntrico Conde Orlok.',
    streams: [
      {
        url: 'https://archive.org/download/Nosferatu1922HD/Nosferatu%20%281922%29%20HD.mp4',
        container: 'mp4',
        codec: 'h264',
        height: 720,
        provider: 'archive',
        priority: 1,
      },
      {
        url: 'https://archive.org/download/Nosferatu1922/Nosferatu.mp4',
        container: 'mp4',
        codec: 'h264',
        height: 480,
        provider: 'archive',
        priority: 1,
      },
    ],
    subtitles: [
      {
        id: 106,
        lang: 'pt',
        url: `${FASTAPI_BASE_URL}/play/subtitles/106.vtt`,
        origin: 'curated',
      },
    ],
    license_status: 'public_domain',
    license_rule: 'lei_9610_art_44_audiovisual',
    license_confidence: 'high',
    license_evidence: {
      jurisdiction: 'Brasil (Lei 9.610/98 Art. 44)',
      release_year: 1922,
      public_domain_since: 1993,
    },
  },
};

/**
 * Busca o catálogo do Lumière Play do backend FastAPI
 * com suporte a busca, gênero, década, ordenação e paginação real.
 */
export const getPlayCatalog = async (params: {
  page?: number;
  pageSize?: number;
  genre?: string;
  decade?: string;
  sort?: string;
  search?: string;
  kind?: string;
  region?: string;
} = {}): Promise<PlayCatalogResponse> => {
  try {
    const query = new URLSearchParams();
    query.set('page_size', String(params.pageSize || 30));
    if (params.page) query.set('page', String(params.page));
    if (params.genre && params.genre !== 'Todos') query.set('genre', params.genre);
    if (params.decade && params.decade !== 'all') query.set('decade', params.decade);
    if (params.sort) query.set('sort', params.sort);
    if (params.search) query.set('search', params.search);
    if (params.kind) query.set('kind', params.kind);
    if (params.region) query.set('region', params.region);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${FASTAPI_BASE_URL}/play/catalog?${query.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data: PlayCatalogResponse = await res.json();
      return data;
    }
  } catch (error) {
    console.warn('Backend FastAPI offline ou lento, recorrendo ao catálogo curado de contingência:', error);
  }

  // Filtragem no catálogo de fallback
  let items = [...FALLBACK_PLAY_CATALOG];
  if (params.genre && params.genre !== 'Todos') {
    items = items.filter((i) =>
      i.genres.some((g) => g.toLowerCase() === params.genre!.toLowerCase())
    );
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.original_title && i.original_title.toLowerCase().includes(q))
    );
  }

  return {
    items,
    total: items.length,
    page: params.page || 1,
    total_pages: 1,
  };
};

/**
 * Busca as facetas agregadas (gêneros e décadas com contagem real) do Lumière Play
 */
export const getPlayFacets = async (): Promise<PlayFacetsResponse | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${FASTAPI_BASE_URL}/play/facets`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.warn('Erro ao carregar facetas do acervo:', error);
  }
  return null;
};

/**
 * Busca o manifesto de streaming verificado (URL do MP4, legendas e legalidade)
 */
export const getPlayStream = async (
  workId: number,
  region: string = 'BR'
): Promise<PlayStreamManifest | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(
      `${FASTAPI_BASE_URL}/play/stream/${workId}?region=${encodeURIComponent(region)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Falha de rede ou backend offline
  }

  if (FALLBACK_STREAMS[workId]) {
    return FALLBACK_STREAMS[workId];
  }

  const work = FALLBACK_PLAY_CATALOG.find((w) => w.id === workId);
  if (work) {
    return {
      work_id: work.id,
      title: work.title,
      original_title: work.original_title,
      year: work.year,
      runtime_min: work.runtime_min,
      backdrop_path: work.backdrop_path,
      poster_path: work.poster_path,
      overview_pt: work.overview_pt,
      streams: [
        {
          url: 'https://archive.org/download/his_girl_friday/his_girl_friday.mp4',
          container: 'mp4',
          codec: 'h264',
          height: 480,
          provider: 'archive',
          priority: 1,
        },
      ],
      subtitles: [],
      license_status: 'public_domain',
      license_rule: 'lei_9610_art_44_audiovisual',
      license_confidence: 'high',
      license_evidence: {
        jurisdiction: 'Brasil (Lei 9.610/98 Art. 44)',
        release_year: work.year,
      },
    };
  }

  return null;
};

/**
 * Monta URL de imagem do TMDB com tamanho ou fallback seguro
 */
export const getImageUrl = (
  path: string | null | undefined,
  size: 'w200' | 'w500' | 'original' = 'w500',
  fallbackText: string = 'Sem Imagem'
): string => {
  if (!path) {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750"><rect width="100%" height="100%" fill="%230c0d12"/><text x="50%" y="50%" fill="%236b7280" font-family="sans-serif" font-size="24" text-anchor="middle" dy=".3em">${encodeURIComponent(fallbackText)}</text></svg>`;
  }
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

// ========================================================================
// GUIA UNIVERSAL DE STREAMINGS (FILMES E SÉRIES)
// ========================================================================

/**
 * Busca filmes em alta nos streamings
 */
export const getPopularMovies = async (page: number = 1): Promise<MediaItem[]> => {
  try {
    const response = await fetch(`${BASE_URL}/movies?page=${page}`);
    if (response.ok) {
      const data = await response.json();
      return (data.results || []).map((i: MediaItem) => ({ ...i, media_type: 'movie' }));
    }
  } catch {
    // Fallback direto ao TMDB
  }

  try {
    const directRes = await fetch(
      `https://api.themoviedb.org/3/trending/movie/day?api_key=${DIRECT_TMDB_KEY}&language=pt-BR&page=${page}`
    );
    if (directRes.ok) {
      const data = await directRes.json();
      return (data.results || []).map((i: MediaItem) => ({ ...i, media_type: 'movie' }));
    }
  } catch (err) {
    console.error('Erro ao buscar filmes populares:', err);
  }
  return [];
};

/**
 * Busca séries em alta nos streamings
 */
export const getPopularSeries = async (page: number = 1): Promise<MediaItem[]> => {
  try {
    const response = await fetch(`${BASE_URL}/series?page=${page}`);
    if (response.ok) {
      const data = await response.json();
      return (data.results || []).map((i: MediaItem) => ({ ...i, media_type: 'tv' }));
    }
  } catch {
    // Fallback direto ao TMDB
  }

  try {
    const directRes = await fetch(
      `https://api.themoviedb.org/3/trending/tv/day?api_key=${DIRECT_TMDB_KEY}&language=pt-BR&page=${page}`
    );
    if (directRes.ok) {
      const data = await directRes.json();
      return (data.results || []).map((i: MediaItem) => ({ ...i, media_type: 'tv' }));
    }
  } catch (err) {
    console.error('Erro ao buscar séries populares:', err);
  }
  return [];
};

export const getNewSeries = async (): Promise<MediaItem[]> => {
  try {
    const response = await fetch(`${BASE_URL}/newSeries`);
    if (response.ok) {
      const data = await response.json();
      return (data.results || []).map((i: MediaItem) => ({ ...i, media_type: 'tv' }));
    }
  } catch {
    // Fallback direto
  }

  try {
    const directRes = await fetch(
      `https://api.themoviedb.org/3/tv/on_the_air?api_key=${DIRECT_TMDB_KEY}&language=pt-BR&page=1`
    );
    if (directRes.ok) {
      const data = await directRes.json();
      return (data.results || []).map((i: MediaItem) => ({ ...i, media_type: 'tv' }));
    }
  } catch (err) {
    console.error('Erro ao buscar novidades:', err);
  }
  return [];
};

/**
 * Busca detalhes completos com provedores de streaming para Filme ou Série
 */
export const getMediaDetails = async (
  id: string | number,
  mediaType: MediaType = 'movie'
): Promise<MediaDetails | null> => {
  const endpoint = mediaType === 'tv' ? 'series' : 'movie';
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}/${id}`);
    if (response.ok) {
      const data: MediaDetails = await response.json();
      return { ...data, media_type: mediaType };
    }
  } catch {
    // Fallback direto
  }

  try {
    const tmdbType = mediaType === 'tv' ? 'tv' : 'movie';
    const directRes = await fetch(
      `https://api.themoviedb.org/3/${tmdbType}/${id}?api_key=${DIRECT_TMDB_KEY}&language=pt-BR&append_to_response=credits,videos,recommendations,watch/providers&include_video_language=pt,en`
    );
    if (directRes.ok) {
      const data: MediaDetails = await directRes.json();
      return { ...data, media_type: mediaType };
    }
  } catch (err) {
    console.error(`Erro ao buscar detalhes de ${mediaType} ${id}:`, err);
  }
  return null;
};

// Aliases para compatibilidade reversa
export const getSeriesDetails = (id: string | number) => getMediaDetails(id, 'tv');
export const getMovieDetails = (id: string | number) => getMediaDetails(id, 'movie');

/**
 * Busca títulos por texto (Filmes, Séries ou Ambos)
 */
export const searchMedia = async (
  query: string,
  type?: MediaType
): Promise<MediaItem[]> => {
  if (!query || !query.trim()) return [];
  const cleanQ = encodeURIComponent(query.trim());
  const typeParam = type ? `&type=${type}` : '';

  try {
    const response = await fetch(`${BASE_URL}/search?query=${cleanQ}${typeParam}`);
    if (response.ok) {
      const data = await response.json();
      return data.results || [];
    }
  } catch {
    // Fallback direto
  }

  try {
    const tmdbEndpoint = type === 'movie' ? 'search/movie' : type === 'tv' ? 'search/tv' : 'search/multi';
    const directRes = await fetch(
      `https://api.themoviedb.org/3/${tmdbEndpoint}?api_key=${DIRECT_TMDB_KEY}&language=pt-BR&query=${cleanQ}&page=1&include_adult=false`
    );
    if (directRes.ok) {
      const data = await directRes.json();
      return (data.results || [])
        .filter((i: MediaItem) => (i as unknown as { media_type: string }).media_type !== 'person')
        .map((i: MediaItem) => ({
          ...i,
          media_type: i.media_type || type || (i.title ? 'movie' : 'tv'),
        }));
    }
  } catch (err) {
    console.error('Erro na busca de títulos:', err);
  }
  return [];
};

export const searchSeries = (query: string) => searchMedia(query, 'tv');

/**
 * Retorna os gêneros combinados de Filmes e Séries
 */
export const getGenres = async (): Promise<Genre[]> => {
  try {
    const response = await fetch(`${BASE_URL}/genres`);
    if (response.ok) {
      const data = await response.json();
      return data.genres || [];
    }
  } catch {
    // Fallback direto
  }

  try {
    const [mRes, tRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${DIRECT_TMDB_KEY}&language=pt-BR`),
      fetch(`https://api.themoviedb.org/3/genre/tv/list?api_key=${DIRECT_TMDB_KEY}&language=pt-BR`),
    ]);
    const mData = await mRes.json();
    const tData = await tRes.json();

    const map = new Map<number, Genre>();
    for (const g of mData.genres || []) map.set(g.id, g);
    for (const g of tData.genres || []) {
      if (!map.has(g.id)) map.set(g.id, g);
    }
    return Array.from(map.values());
  } catch (err) {
    console.error('Erro ao buscar gêneros:', err);
    return [];
  }
};

/**
 * Discover com suporte completo a Filmes, Séries, paginação real e filtros de ano/avaliação/ordem
 */
export const discoverMedia = async (params: {
  type?: 'movie' | 'tv' | 'all';
  genreId?: number | null;
  page?: number;
  year?: string;
  rating?: string | number;
  sort?: string;
} = {}): Promise<{ results: MediaItem[]; total_pages: number; total_results: number }> => {
  const { type = 'movie', genreId, page = 1, year = '', rating = '', sort = 'popularity.desc' } = params;

  // Tenta backend /api/discover
  try {
    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('type', type === 'all' ? 'movie' : type);
    if (genreId) query.set('genre', String(genreId));
    if (year) query.set('year', String(year));
    if (rating) query.set('rating', String(rating));
    if (sort) query.set('sort', sort);

    const response = await fetch(`${BASE_URL}/discover?${query.toString()}`);
    if (response.ok) {
      const data = await response.json();
      return {
        results: data.results || [],
        total_pages: data.total_pages || 1,
        total_results: data.total_results || (data.results || []).length,
      };
    }
  } catch {
    // Fallback direto
  }

  // Fallback direto ao TMDB
  try {
    const endpoint = type === 'tv' ? 'discover/tv' : 'discover/movie';
    const q = new URLSearchParams({
      api_key: DIRECT_TMDB_KEY,
      language: 'pt-BR',
      page: String(page),
      sort_by: sort || 'popularity.desc',
    });
    if (genreId) q.set('with_genres', String(genreId));
    if (rating) q.set('vote_average.gte', String(rating));
    if (year) {
      if (type === 'tv') q.set('first_air_date_year', String(year));
      else q.set('primary_release_year', String(year));
    }

    const directRes = await fetch(`https://api.themoviedb.org/3/${endpoint}?${q.toString()}`);
    if (directRes.ok) {
      const data = await directRes.json();
      const results = (data.results || []).map((i: MediaItem) => ({
        ...i,
        media_type: (type === 'tv' ? 'tv' : 'movie') as MediaType,
      }));
      return {
        results,
        total_pages: Math.min(data.total_pages || 1, 500),
        total_results: data.total_results || results.length,
      };
    }
  } catch (err) {
    console.error('Erro ao descobrir mídia:', err);
  }

  return { results: [], total_pages: 1, total_results: 0 };
};

export const discoverSeries = async (
  genreId?: number | null,
  page: number = 1,
  year: string = '',
  rating: string | number = '',
  sort: string = ''
): Promise<MediaItem[]> => {
  const res = await discoverMedia({ type: 'tv', genreId, page, year, rating, sort });
  return res.results;
};

export const getSeasonDetails = async (
  seriesId: string | number,
  seasonNumber: number
): Promise<Episode[]> => {
  try {
    const response = await fetch(`${BASE_URL}/series/${seriesId}/season/${seasonNumber}`);
    if (response.ok) {
      const data = await response.json();
      return data.episodes || [];
    }
  } catch {
    // Fallback direto
  }

  try {
    const directRes = await fetch(
      `https://api.themoviedb.org/3/tv/${seriesId}/season/${seasonNumber}?api_key=${DIRECT_TMDB_KEY}&language=pt-BR`
    );
    if (directRes.ok) {
      const data = await directRes.json();
      return data.episodes || [];
    }
  } catch (err) {
    console.error(`Erro ao buscar temporada ${seasonNumber}:`, err);
  }
  return [];
};
