import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { MediaItem } from '../../types';
import { getImageUrl } from '../../services/api';
import { isFavorite, toggleFavorite } from '../../utils/storage';

interface MediaCardProps {
  item: MediaItem;
  variant?: 'widescreen' | 'poster';
  badgeLabel?: string;
}

export default function MediaCard({ item, variant = 'poster', badgeLabel }: MediaCardProps) {
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    setFavorited(isFavorite(item.id));
  }, [item.id]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const title = item.title || item.name || 'Sem Título';
    const image = getImageUrl(item.poster_path || item.backdrop_path, 'w500');
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';

    const newState = toggleFavorite({
      id: item.id,
      title,
      image,
      rating,
      media_type: item.media_type || 'tv',
    });
    setFavorited(newState);
  };

  const title = item.title || item.name || 'Sem Título';
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
  const detailUrl = `/detalhes/${item.id}?type=${mediaType}`;
  const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
  const year = item.first_air_date
    ? new Date(item.first_air_date).getFullYear()
    : item.release_date
    ? new Date(item.release_date).getFullYear()
    : null;

  /* ========================================================
     MODO 1: WIDESCREEN 16:9 (Estilo SlothUI "Popular on slothUI")
     ======================================================== */
  if (variant === 'widescreen') {
    const imageUrl = getImageUrl(item.backdrop_path || item.poster_path, 'w500');

    return (
      <Link
        to={detailUrl}
        className="group relative block w-full rounded-2xl overflow-hidden bg-[#111319] border border-white/5 hover:border-amber-400/50 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] select-none"
      >
        <div className="aspect-video w-full overflow-hidden relative">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Mask Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/30 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />

          {/* SlothUI Mini Badge no canto superior esquerdo */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#07080b]/80 backdrop-blur-md border border-white/10 text-[10px] font-black text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {badgeLabel || 'LUMIÈRE'}
          </div>

          {/* Heart Favorite Button */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 ${
              favorited
                ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)] scale-105'
                : 'bg-black/50 text-white/70 hover:text-white hover:bg-black/80'
            }`}
            title={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
          </button>

          {/* Title & Rating overlay at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-gray-100 group-hover:text-amber-400 transition-colors truncate">
                {title}
              </h4>
              {year && <span className="text-xs text-gray-400">{year}</span>}
            </div>

            {item.vote_average > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20 text-xs font-bold text-amber-400 flex-shrink-0">
                <Star className="w-3 h-3 fill-amber-400" />
                {rating}
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }

  /* ========================================================
     MODO 2: POSTER 2:3 (Estilo FlickStream / Cinema Clássico)
     ======================================================== */
  const posterUrl = getImageUrl(item.poster_path, 'w500');

  return (
    <Link
      to={detailUrl}
      className="group relative block w-full rounded-2xl overflow-hidden bg-[#111319] border border-white/5 hover:border-amber-400/50 transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] select-none"
    >
      <div className="aspect-[2/3] w-full overflow-hidden relative">
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
          loading="lazy"
        />

        {/* Gradient Mask */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Heart Favorite Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 ${
            favorited
              ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)] scale-105'
              : 'bg-black/50 text-white/70 hover:text-white hover:bg-black/80'
          }`}
          title={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
        </button>

        {/* Rating chip top left */}
        {item.vote_average > 0 && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#07080b]/80 backdrop-blur-md border border-white/10 text-xs font-bold text-amber-400">
            <Star className="w-3 h-3 fill-amber-400" />
            {rating}
          </div>
        )}

        {/* Title at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5">
          <h4 className="text-sm font-bold text-gray-100 group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
            {title}
          </h4>
          {year && <span className="text-xs text-gray-400 mt-0.5 block">{year}</span>}
        </div>
      </div>
    </Link>
  );
}
