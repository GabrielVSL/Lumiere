/**
 * Tipos centrais da aplicação Lumière
 */

export type MediaType = 'movie' | 'tv';

export interface Genre {
  id: number;
  name: string;
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority?: number;
}

export interface WatchProvidersData {
  link?: string;
  flatrate?: WatchProvider[];
  free?: WatchProvider[];
  ads?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order?: number;
}

export interface VideoTrailer {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  still_path: string | null;
  vote_average: number;
  runtime?: number;
}

export interface Season {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  air_date: string | null;
  episodes?: Episode[];
}

export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: MediaType;
  genre_ids?: number[];
  popularity?: number;
}

export interface MediaDetails extends MediaItem {
  tagline?: string;
  status?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Season[];
  genres?: Genre[];
  runtime?: number;
  episode_run_time?: number[];
  credits?: {
    cast?: CastMember[];
    crew?: Array<{ id: number; name: string; job: string }>;
  };
  videos?: {
    results?: VideoTrailer[];
  };
  'watch/providers'?: {
    results?: Record<string, WatchProvidersData>;
  };
  recommendations?: {
    results?: MediaItem[];
  };
}

export interface Comment {
  id: string | number;
  author: string;
  avatar?: string;
  content: string;
  rating?: number;
  createdAt: string;
}

export interface UserRating {
  mediaId: number;
  rating: number;
  updatedAt: string;
}

export interface FavoriteItem {
  id: number;
  title: string;
  image: string;
  rating: string;
  media_type?: MediaType;
  added_at?: string;
}

export interface UserFavorite {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  media_type?: MediaType;
  addedAt: string;
}

export interface UserWatchLaterItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  media_type?: MediaType;
  addedAt: string;
}

export interface LicenseSummary {
  region: string;
  status: 'public_domain' | 'creative_commons' | 'protected' | 'unknown';
  rule: string;
  confidence: 'high' | 'medium' | 'low';
  evidence?: Record<string, unknown>;
}

export interface PlayWorkItem {
  id: number;
  title: string;
  original_title?: string;
  year?: number;
  runtime_min?: number;
  kind: 'feature' | 'short';
  poster_path?: string;
  backdrop_path?: string;
  overview_pt?: string;
  tagline?: string;
  genres: string[];
  directors: string[];
  license?: LicenseSummary;
}

export interface PlayCatalogResponse {
  items: PlayWorkItem[];
  total: number;
  page: number;
  total_pages: number;
}

export interface PlayFacetItem {
  name: string;
  count: number;
}

export interface PlayDecadeFacet {
  decade: string;
  label: string;
  count: number;
}

export interface PlayFacetsResponse {
  total_works: number;
  genres: PlayFacetItem[];
  decades: PlayDecadeFacet[];
}

export interface PlayStreamOption {
  url: string;
  container: string;
  codec: string;
  height?: number;
  provider: string;
  priority: number;
}

export interface PlaySubtitle {
  id: number;
  lang: string;
  url: string;
  origin: string;
}

export interface PlayStreamManifest {
  work_id: number;
  title: string;
  original_title?: string;
  year?: number;
  runtime_min?: number;
  backdrop_path?: string;
  poster_path?: string;
  overview_pt?: string;
  streams: PlayStreamOption[];
  subtitles: PlaySubtitle[];
  license_status: string;
  license_rule: string;
  license_confidence: string;
  license_evidence?: Record<string, unknown>;
}

export interface PlayableSource {
  id: number;
  media_id: number;
  title: string;
  kind: 'archive_direct' | 'hosted_hls';
  url: string;
  license: 'public_domain' | 'creative_commons';
  subtitles?: Array<{ lang: string; url: string; label: string }>;
}
