import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Star, 
  Heart, 
  Play, 
  Tv, 
  Calendar, 
  Clock, 
  ExternalLink,
  ChevronDown,
  Sparkles,
  Lock
} from 'lucide-react';
import { getMediaDetails, getSeasonDetails, getImageUrl } from '../services/api';
import { isFavorite, toggleFavorite } from '../utils/storage';
import { MediaDetails, Episode, MediaType, MediaItem } from '../types';
import MediaCard from './common/MediaCard';

export default function MovieDetails() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type') as MediaType | null;

  const [movie, setMovie] = useState<MediaDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados dos Episódios
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [isSeasonOpen, setIsSeasonOpen] = useState(false);
  const seasonRef = useRef<HTMLDivElement>(null);

  // Estado do Favorito (Minha Lista)
  const [favorited, setFavorited] = useState(false);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (seasonRef.current && !seasonRef.current.contains(event.target as Node)) {
        setIsSeasonOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reseta estados e carrega os detalhes ao mudar o ID
  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedSeason(null);
    setEpisodes([]);

    const fetchDetails = async () => {
      if (!id) return;
      setLoading(true);
      const primaryType: MediaType = typeParam || 'movie';
      let data = await getMediaDetails(id, primaryType);
      if (!data) {
        const fallbackType: MediaType = primaryType === 'movie' ? 'tv' : 'movie';
        data = await getMediaDetails(id, fallbackType);
      }
      setMovie(data);
      setFavorited(isFavorite(id));
      setLoading(false);
    };

    fetchDetails();
  }, [id, typeParam]);

  // Define primeira temporada real
  useEffect(() => {
    if (movie?.seasons && movie.seasons.length > 0 && selectedSeason === null) {
      const firstReal = movie.seasons.find((s) => s.season_number > 0) || movie.seasons[0];
      if (firstReal) {
        setSelectedSeason(firstReal.season_number);
      }
    }
  }, [movie, selectedSeason]);

  // Carrega episódios da temporada
  useEffect(() => {
    const fetchEpisodes = async () => {
      if (selectedSeason === null || !id) return;
      setLoadingEpisodes(true);
      const eps = await getSeasonDetails(id, selectedSeason);
      setEpisodes(eps);
      setLoadingEpisodes(false);
    };

    fetchEpisodes();
  }, [id, selectedSeason]);

  const handleFavoriteClick = () => {
    if (!movie) return;
    const title = movie.title || movie.name || 'Sem Título';
    const image = getImageUrl(movie.poster_path, 'w500');
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

    const newState = toggleFavorite({
      id: movie.id,
      title,
      image,
      rating,
      media_type: 'tv',
    });
    setFavorited(newState);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080b] flex flex-col items-center justify-center gap-4 text-amber-400">
        <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold tracking-wider text-gray-400">Carregando detalhes...</span>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#07080b] flex flex-col items-center justify-center text-white">
        <p className="text-xl font-bold mb-4">Título não encontrado.</p>
        <Link to="/" className="text-amber-400 hover:underline">Voltar para o Início</Link>
      </div>
    );
  }

  const title = movie.name || movie.title || 'Título';
  const backdropUrl = getImageUrl(movie.backdrop_path, 'original');
  const posterUrl = getImageUrl(movie.poster_path, 'w500');
  const trailer = movie.videos?.results?.find(
    (vid) => vid.site === 'YouTube' && vid.type === 'Trailer'
  ) || movie.videos?.results?.[0];

  const watchProviders = movie['watch/providers']?.results?.BR;
  const flatrateProviders = watchProviders?.flatrate || [];
  const freeProviders = [...(watchProviders?.free || []), ...(watchProviders?.ads || [])];
  const rentProviders = watchProviders?.rent || [];
  const castList = movie.credits?.cast?.slice(0, 10) || [];
  const recommendations = movie.recommendations?.results || [];

  const currentSeasonObj = movie.seasons?.find((s) => s.season_number === selectedSeason);
  const seasonLabel = currentSeasonObj
    ? `${currentSeasonObj.name} (${currentSeasonObj.episode_count} eps)`
    : 'Selecione a Temporada...';

  return (
    <main className="min-h-screen bg-[#07080b] relative pb-28 md:pb-24 overflow-x-hidden">
      
      {/* IMMERSIVE BACKDROP BLUR HEADER */}
      <div className="absolute top-0 left-0 right-0 h-[60vh] md:h-[75vh] overflow-hidden pointer-events-none">
        <img
          src={backdropUrl}
          alt=""
          className="w-full h-full object-cover object-top opacity-25 filter blur-xs scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080b] via-[#07080b]/60 to-transparent" />
      </div>

      <div className="container mx-auto px-4 md:px-12 pt-24 md:pt-28 relative z-20">
        
        {/* Back Link Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Voltar ao Catálogo
        </Link>

        {/* TOP HERO DETAILS GRID */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mb-16 items-start">
          
          {/* POSTER CARD */}
          <div className="w-full sm:w-64 md:w-72 lg:w-80 flex-shrink-0 flex flex-col gap-6 mx-auto lg:mx-0">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group">
              <img src={posterUrl} alt={title} className="w-full object-cover aspect-[2/3]" />
            </div>

            {/* CAST LIST (Glassmorphic Container) */}
            {castList.length > 0 && (
              <div className="bg-[#111319]/80 backdrop-blur-md p-5 rounded-2xl border border-white/5 flex flex-col shadow-xl">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-400 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-amber-400 rounded-full" />
                  Elenco Principal
                </h3>
                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                  {castList.map((actor) => (
                    <div key={actor.id} className="flex items-center gap-3 p-1 rounded-lg hover:bg-white/5 transition-colors">
                      <img
                        src={getImageUrl(actor.profile_path, 'w200', actor.name)}
                        alt={actor.name}
                        className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-gray-200 block truncate">{actor.name}</span>
                        <span className="text-[11px] text-gray-400 block truncate">{actor.character}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MAIN INFO COLUMN */}
          <div className="flex-1 text-white flex flex-col">
            
            {/* Title & Favorite Action */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Série
                  </span>
                  {movie.first_air_date && (
                    <span className="text-xs font-semibold text-gray-400">
                      {new Date(movie.first_air_date).getFullYear()}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
                  {title}
                </h1>
              </div>

              {/* Heart Pill Button */}
              <button
                type="button"
                onClick={handleFavoriteClick}
                className={`flex-shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 shadow-xl ${
                  favorited
                    ? 'bg-red-500/15 text-red-400 border border-red-500/50 hover:bg-red-500/25 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-amber-400/50'
                }`}
              >
                <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
                {favorited ? 'Salvo na Lista' : 'Salvar na Lista'}
              </button>
            </div>

            {/* Ratings & Tags */}
            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-semibold text-gray-300 mb-6">
              {movie.vote_average > 0 && (
                <span className="inline-flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/25 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {movie.vote_average.toFixed(1)} ★ TMDB
                </span>
              )}
              {movie.number_of_seasons && (
                <span className="text-gray-400">
                  {movie.number_of_seasons} {movie.number_of_seasons === 1 ? 'Temporada' : 'Temporadas'}
                </span>
              )}
              {movie.runtime ? (
                <span className="flex items-center gap-1 text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  {movie.runtime} min
                </span>
              ) : null}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 ml-2">
                  {movie.genres.map((g) => (
                    <span key={g.id} className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
                      {g.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ONDE ASSISTIR / WATCH PROVIDERS (Com links diretos!) */}
            <div className="mb-8 p-5 rounded-2xl bg-[#111319]/60 backdrop-blur-md border border-white/5">
              <span className="text-xs font-extrabold uppercase tracking-widest text-gray-400 block mb-3">
                Onde Assistir nos Streamings Oficiais (Brasil):
              </span>

              {flatrateProviders.length === 0 && freeProviders.length === 0 && rentProviders.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  Nenhum provedor de streaming informado para esta região no momento.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Streaming por Assinatura */}
                  {flatrateProviders.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-amber-400 block mb-2">Disponível por Assinatura:</span>
                      <div className="flex flex-wrap gap-3">
                        {flatrateProviders.map((provider) => (
                          <a
                            key={provider.provider_id}
                            href={watchProviders?.link || `https://www.google.com/search?q=${encodeURIComponent('Assistir ' + title + ' ' + provider.provider_name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/p relative flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/50 transition-all duration-300"
                            title={`Assistir em ${provider.provider_name}`}
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                              alt={provider.provider_name}
                              className="w-8 h-8 rounded-lg shadow-md"
                            />
                            <span className="text-xs font-bold text-gray-200 group-hover/p:text-amber-400 transition-colors">
                              {provider.provider_name}
                            </span>
                            <ExternalLink className="w-3 h-3 text-gray-500 group-hover/p:text-amber-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Streaming Gratuito / Com Anúncios */}
                  {freeProviders.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-emerald-400 block mb-2">Gratuito / Com Anúncios:</span>
                      <div className="flex flex-wrap gap-3">
                        {freeProviders.map((provider) => (
                          <a
                            key={provider.provider_id}
                            href={watchProviders?.link || `https://www.google.com/search?q=${encodeURIComponent('Assistir gratis ' + title)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/p relative flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all duration-300"
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                              alt={provider.provider_name}
                              className="w-8 h-8 rounded-lg shadow-md"
                            />
                            <span className="text-xs font-bold text-emerald-300">
                              {provider.provider_name}
                            </span>
                            <ExternalLink className="w-3 h-3 text-emerald-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sinopse */}
            <div className="mb-8">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400 mb-2">
                Sinopse
              </h3>
              <p className="text-gray-300 leading-relaxed text-base max-w-3xl">
                {movie.overview || 'Nenhuma sinopse disponível para este título no momento.'}
              </p>
            </div>

            {/* Trailer Oficial Embed */}
            {trailer && (
              <section className="mt-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                  <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                  Trailer Oficial
                </h3>
                <div className="aspect-video w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${trailer.key}?autoplay=0&rel=0`}
                    title="Trailer Oficial"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </section>
            )}

          </div>
        </div>

        {/* EPISÓDIOS E TEMPORADAS */}
        {movie.seasons && movie.seasons.length > 0 && (
          <section className="mt-16 border-t border-white/5 pt-10 mb-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]" />
                <h3 className="text-2xl font-black text-white">Episódios</h3>
              </div>

              {/* Seletor Customizado de Temporadas */}
              <div className="relative w-full sm:w-auto min-w-[220px]" ref={seasonRef}>
                <button
                  type="button"
                  onClick={() => setIsSeasonOpen(!isSeasonOpen)}
                  className="w-full bg-[#111319] text-white font-bold text-sm border border-white/10 rounded-xl px-4 py-3 flex justify-between items-center hover:border-amber-400 transition-all shadow-inner"
                >
                  <span className="truncate">{seasonLabel}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSeasonOpen ? 'rotate-180 text-amber-400' : ''}`} />
                </button>

                {isSeasonOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-[#111319] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 animate-fade-in max-h-64 overflow-y-auto custom-scrollbar">
                    {movie.seasons
                      .filter((s) => s.season_number > 0)
                      .map((season) => (
                        <button
                          key={season.id}
                          type="button"
                          onClick={() => {
                            setSelectedSeason(season.season_number);
                            setIsSeasonOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                            selectedSeason === season.season_number
                              ? 'bg-amber-400/10 text-amber-400 border-l-2 border-amber-400'
                              : 'text-gray-200 hover:bg-white/5 hover:text-amber-400'
                          }`}
                        >
                          {season.name} ({season.episode_count} eps)
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Episodes List */}
            {loadingEpisodes ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[640px] overflow-y-auto custom-scrollbar pr-2 pb-2">
                {episodes.map((ep) => {
                  const isUnreleased = !ep.air_date || new Date(ep.air_date) > new Date();

                  return (
                    <div
                      key={ep.id}
                      className={`flex gap-4 bg-[#111319]/50 hover:bg-[#111319] p-3.5 rounded-2xl border border-white/5 transition-all duration-300 group ${
                        isUnreleased ? 'opacity-50' : 'hover:border-white/15'
                      }`}
                    >
                      <div className="w-36 sm:w-44 flex-shrink-0 relative rounded-xl overflow-hidden aspect-video bg-black shadow-md">
                        {ep.still_path ? (
                          <img
                            src={getImageUrl(ep.still_path, 'w500')}
                            alt={ep.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            <Tv className="w-6 h-6" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-[#07080b]/90 px-2 py-0.5 rounded text-[10px] font-black text-white border border-white/10">
                          E{ep.episode_number}
                        </div>
                        {isUnreleased && (
                          <div className="absolute top-2 right-2 bg-red-500/90 px-2 py-0.5 rounded text-[9px] font-black text-white flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Breve
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="text-sm font-bold text-gray-100 group-hover:text-amber-400 transition-colors truncate mb-1">
                          {ep.name}
                        </h4>
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2">
                          {ep.overview || 'Sinopse não disponível para este episódio.'}
                        </p>
                        <div className="mt-auto flex items-center gap-3 text-[11px] text-gray-500 font-semibold">
                          {ep.air_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(ep.air_date).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          {ep.runtime && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {ep.runtime} min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* RECOMENDAÇÕES */}
        {recommendations.length > 0 && (
          <section className="pt-8 border-t border-white/5">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-xl font-bold text-white">Você Também Pode Gostar</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendations.slice(0, 6).map((rec: MediaItem) => (
                <MediaCard key={rec.id} item={rec} variant="poster" />
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
