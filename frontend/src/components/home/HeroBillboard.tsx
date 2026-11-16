import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, Star, Tv, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '../../types';
import { getImageUrl } from '../../services/api';

interface HeroBillboardProps {
  items: MediaItem[];
}

export default function HeroBillboard({ items }: HeroBillboardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const featuredList = items.slice(0, 5);
  const activeItem = featuredList[currentIndex];

  // Auto-advance every 8 seconds unless hovered
  useEffect(() => {
    if (featuredList.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredList.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [featuredList.length, isPaused]);

  if (!activeItem) return null;

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % featuredList.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? featuredList.length - 1 : prev - 1));

  const title = activeItem.title || activeItem.name || 'Título em Destaque';
  const releaseYear = activeItem.first_air_date
    ? new Date(activeItem.first_air_date).getFullYear()
    : activeItem.release_date
    ? new Date(activeItem.release_date).getFullYear()
    : '2024';
  const rating = activeItem.vote_average ? activeItem.vote_average.toFixed(1) : '8.5';

  return (
    <section 
      className="relative w-full h-[80vh] min-h-[580px] max-h-[820px] overflow-hidden select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* BACKGROUND IMAGE WITH CROSS-FADE ANIMATION */}
      {featuredList.map((item, index) => {
        const isCurrent = index === currentIndex;
        const bgUrl = getImageUrl(item.backdrop_path || item.poster_path, 'original');

        return (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isCurrent ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
            }`}
          >
            <img
              src={bgUrl}
              alt={item.title || item.name}
              className={`w-full h-full object-cover object-top md:object-center transition-transform duration-[10000ms] ease-out ${
                isCurrent ? 'scale-100' : 'scale-105'
              }`}
            />
            {/* DUPLA MÁSCARA DE DEGRADÊ CINEMATOGRÁFICA (Estilo SlothUI / Rise of X) */}
            {/* 1. Fade lateral esquerdo profundo para leitura perfeita do texto */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#07080b] via-[#07080b]/80 via-40% to-transparent" />
            {/* 2. Fade inferior suave para integrar com os carrosséis de conteúdo */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/40 via-25% to-transparent" />
            {/* 3. Vinheta sutil superior */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#07080b]/60 via-transparent to-transparent" />
          </div>
        );
      })}

      {/* HERO CONTENT (Estilo "Rise of X") */}
      <div className="relative z-10 h-full container mx-auto px-6 md:px-12 flex flex-col justify-center pb-12 pt-20">
        <div className="max-w-2xl animate-fade-in" key={activeItem.id}>
          
          {/* Brand Kicker */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center p-0.5 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              <img src="/lumiere_icon.png" alt="" className="w-full h-full object-contain" />
            </div>
            <span className="text-xs font-black tracking-widest uppercase text-amber-400">
              EM DESTAQUE NO GUIA
            </span>
          </div>

          {/* Massive Display Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white uppercase tracking-tight leading-[1.05] drop-shadow-2xl mb-4 line-clamp-2">
            {title}
          </h1>

          {/* Metadata Row: Ano, Avaliação */}
          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-semibold text-gray-300 mb-4">
            <span className="text-gray-200">{releaseYear}</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span className="inline-flex items-center gap-1 text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
              <Star className="w-3 h-3 fill-amber-400" />
              {rating} ★ TMDB
            </span>
          </div>

          {/* Trending Highlight Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-bold text-gray-200 mb-4">
            <Tv className="w-3.5 h-3.5 text-amber-400" />
            <span>#{currentIndex + 1} em Tendência no Catálogo</span>
          </div>

          {/* Synopsis */}
          <p className="text-gray-300 text-sm md:text-base leading-relaxed line-clamp-3 mb-8 max-w-xl text-shadow-sm">
            {activeItem.overview || 'Explore detalhes, sinopse completa e disponibilidade de streaming no guia Lumière.'}
          </p>

          {/* Action Buttons (Estilo Pill do SlothUI) */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to={`/detalhes/${activeItem.id}`}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm md:text-base transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:scale-105 active:scale-95"
            >
              <Info className="w-4 h-4 text-slate-950" />
              Onde Assistir & Detalhes
            </Link>
          </div>

        </div>
      </div>

      {/* ARROWS DE NAVEGAÇÃO DISCRETAS */}
      {featuredList.length > 1 && (
        <div className="absolute right-8 bottom-12 z-20 hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={prevSlide}
            className="w-10 h-10 rounded-full bg-[#07080b]/60 hover:bg-amber-500 text-white hover:text-slate-950 border border-white/10 flex items-center justify-center backdrop-blur-md transition-all duration-300 hover:scale-110"
            title="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="w-10 h-10 rounded-full bg-[#07080b]/60 hover:bg-amber-500 text-white hover:text-slate-950 border border-white/10 flex items-center justify-center backdrop-blur-md transition-all duration-300 hover:scale-110"
            title="Próximo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* SLIDE INDICATORS (Pills na base) */}
      <div className="absolute left-6 md:left-12 bottom-6 z-20 flex items-center gap-2">
        {featuredList.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === currentIndex ? 'w-8 bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'w-2 bg-white/30 hover:bg-white/60'
            }`}
            title={`Slide ${i + 1}`}
          />
        ))}
      </div>

    </section>
  );
}
