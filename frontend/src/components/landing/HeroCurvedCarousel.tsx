import React, { useState, useEffect, useRef } from 'react';
import { Play, Clock, Calendar, ShieldCheck, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import gsap from 'gsap';

interface CarouselItem {
  id: number;
  title: string;
  originalTitle: string;
  year: number;
  runtime: number;
  tagline: string;
  genres: string[];
  director: string;
  backdrop: string;
  poster: string;
}

const HERO_CLASSICS: CarouselItem[] = [
  {
    id: 1,
    title: 'Jejum de Amor',
    originalTitle: 'His Girl Friday',
    year: 1940,
    runtime: 92,
    tagline: 'O ápice da comédia romântica dos jornais de Chicago.',
    genres: ['Comédia', 'Romance', 'Clássico'],
    director: 'Howard Hawks',
    backdrop: 'https://image.tmdb.org/t/p/original/bS6ZkF3zP5gU2sQz9Y8xH1mQ5nZ.jpg',
    poster: 'https://image.tmdb.org/t/p/w500/z0nS2a3l6pM7YF31L1zH9G8XG8P.jpg',
  },
  {
    id: 2,
    title: 'O Gabinete do Dr. Caligari',
    originalTitle: 'Das Cabinet des Dr. Caligari',
    year: 1920,
    runtime: 77,
    tagline: 'O monumento fundador do Expressionismo Alemão.',
    genres: ['Terror', 'Mistério', 'Expressionismo'],
    director: 'Robert Wiene',
    backdrop: 'https://image.tmdb.org/t/p/original/vH8pQ4z5hW1hP8mY7n2k9Z1X3m9.jpg',
    poster: 'https://image.tmdb.org/t/p/w500/6f3P8gZ3hW0hP7mY7n1k9Z1X2m8.jpg',
  },
  {
    id: 3,
    title: 'O Fantasma da Ópera',
    originalTitle: 'The Phantom of the Opera',
    year: 1925,
    runtime: 93,
    tagline: 'Lon Chaney nas catacumbas sob a Ópera de Paris.',
    genres: ['Terror', 'Mistério', 'Clássico'],
    director: 'Rupert Julian',
    backdrop: 'https://image.tmdb.org/t/p/original/u7H0eJ2yG8N7bX1k3mY5pQ9n0Z1.jpg',
    poster: 'https://image.tmdb.org/t/p/w500/vQ9n9rWbC1mY7T2l0mH9n8Z1k8P.jpg',
  },
  {
    id: 4,
    title: 'A General',
    originalTitle: 'The General',
    year: 1926,
    runtime: 78,
    tagline: 'Buster Keaton e a maior perseguição sobre trilhos.',
    genres: ['Comédia', 'Ação', 'Aventura'],
    director: 'Buster Keaton',
    backdrop: 'https://image.tmdb.org/t/p/original/q4z2u3v1k7p8m9n0b1c2d3e4f5g.jpg',
    poster: 'https://image.tmdb.org/t/p/w500/9k1n2m3l4o5p6q7r8s9t0u1v2w.jpg',
  },
  {
    id: 5,
    title: 'Almas Perversas',
    originalTitle: 'Scarlet Street',
    year: 1945,
    runtime: 102,
    tagline: 'Fritz Lang e a mais devastadora descida moral do Film Noir.',
    genres: ['Noir', 'Drama', 'Crime'],
    director: 'Fritz Lang',
    backdrop: 'https://image.tmdb.org/t/p/original/5o1nS2b4hW3mP1mZ0n6k2Z4X7m4.jpg',
    poster: 'https://image.tmdb.org/t/p/w500/4n0mR1a3hW2mP0mY9n5k1Z3X6m3.jpg',
  },
  {
    id: 6,
    title: 'O Estranho',
    originalTitle: 'The Stranger',
    year: 1946,
    runtime: 95,
    tagline: 'Orson Welles na caça implacável no pós-guerra.',
    genres: ['Suspense', 'Noir', 'Drama'],
    director: 'Orson Welles',
    backdrop: 'https://image.tmdb.org/t/p/original/8aR6pY2hW9mP8mY7n3k9Z1X4m0.jpg',
    poster: 'https://image.tmdb.org/t/p/w500/7aQ5pY1hW8mP8mY7n2k9Z1X3m9.jpg',
  },
];

interface Props {
  onSelectMovie: (id: number) => void;
}

export default function HeroCurvedCarousel({ onSelectMovie }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const total = HERO_CLASSICS.length;

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  // Animação 3D com GSAP
  useEffect(() => {
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, idx) => {
        if (!card) return;

        // Calcula a distância circular relativa ao activeIndex
        let diff = idx - activeIndex;
        if (diff > total / 2) diff -= total;
        if (diff < -total / 2) diff += total;

        const isCenter = diff === 0;
        const absDiff = Math.abs(diff);

        // Se estiver muito longe, esconde
        if (absDiff > 2) {
          gsap.to(card, {
            opacity: 0,
            scale: 0.6,
            xPercent: diff * 70,
            z: -400,
            rotateY: diff * -25,
            zIndex: 0,
            pointerEvents: 'none',
            duration: 0.6,
            ease: 'power3.out',
          });
          return;
        }

        // Posicionamento curvo em arco 3D (estilo Dribbble reference)
        const xOffset = diff * 55; // percentual de translação
        const rotationY = diff * -18; // rotação no eixo Y para criar a curvatura cilíndrica
        const zTranslate = isCenter ? 120 : -80 * absDiff;
        const scaleVal = isCenter ? 1.05 : 0.85 - absDiff * 0.05;
        const opacityVal = isCenter ? 1 : 0.65;
        const zIndexVal = 10 - absDiff;

        gsap.to(card, {
          opacity: opacityVal,
          scale: scaleVal,
          xPercent: xOffset,
          z: zTranslate,
          rotateY: rotationY,
          zIndex: zIndexVal,
          pointerEvents: isCenter ? 'auto' : 'auto',
          duration: 0.7,
          ease: 'power3.out',
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, [activeIndex, total]);

  const activeMovie = HERO_CLASSICS[activeIndex];

  return (
    <div ref={containerRef} className="relative w-full max-w-6xl mx-auto py-8 select-none">
      
      {/* Botões de Navegação em Arco */}
      <div className="absolute top-1/2 -left-4 md:-left-6 -translate-y-1/2 z-30">
        <button
          onClick={handlePrev}
          aria-label="Anterior"
          className="w-11 h-11 md:w-13 md:h-13 rounded-full bg-[#111319]/80 hover:bg-amber-500 text-white hover:text-slate-950 border border-white/10 hover:border-amber-400 flex items-center justify-center backdrop-blur-xl transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] cursor-pointer group"
        >
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="absolute top-1/2 -right-4 md:-right-6 -translate-y-1/2 z-30">
        <button
          onClick={handleNext}
          aria-label="Próximo"
          className="w-11 h-11 md:w-13 md:h-13 rounded-full bg-[#111319]/80 hover:bg-amber-500 text-white hover:text-slate-950 border border-white/10 hover:border-amber-400 flex items-center justify-center backdrop-blur-xl transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] cursor-pointer group"
        >
          <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Palco 3D do Carrossel */}
      <div 
        className="relative w-full h-[360px] sm:h-[420px] md:h-[480px] flex items-center justify-center"
        style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
      >
        {HERO_CLASSICS.map((item, idx) => {
          const isCenter = idx === activeIndex;

          return (
            <div
              key={item.id}
              ref={(el) => { cardsRef.current[idx] = el; }}
              onClick={() => {
                if (isCenter) {
                  onSelectMovie(item.id);
                } else {
                  setActiveIndex(idx);
                }
              }}
              className={`absolute w-[280px] sm:w-[360px] md:w-[480px] h-[340px] sm:h-[400px] md:h-[460px] rounded-3xl overflow-hidden cursor-pointer transition-shadow duration-300 ${
                isCenter 
                  ? 'border-2 border-amber-500/80 shadow-[0_15px_40px_rgba(245,158,11,0.25)]' 
                  : 'border border-white/10 hover:border-amber-500/40'
              }`}
              style={{ transformStyle: 'preserve-3d', willChange: 'transform, opacity' }}
            >
              {/* Imagem de Fundo (Backdrop ou Poster) */}
              <img
                src={item.backdrop}
                alt={item.title}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = item.poster;
                }}
                className="w-full h-full object-cover object-center"
              />

              {/* Gradiente Cinematográfico */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/50 to-transparent" />

              {/* Selo Domínio Público */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-500/30 text-[10px] font-black text-amber-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                DOMÍNIO PÚBLICO
              </div>

              {/* Informações no Rodapé do Cartão */}
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 flex flex-col justify-end">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-amber-500 text-slate-950">
                    {item.year}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-gray-300 font-medium">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {item.runtime} min
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {item.genres.slice(0, 2).join(' • ')}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-md mb-1">
                  {item.title}
                </h3>
                
                <p className="text-xs text-amber-200/90 italic line-clamp-1 mb-3">
                  &ldquo;{item.tagline}&rdquo;
                </p>

                {/* Botão Play no Centro */}
                {isCenter && (
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-xs text-gray-400 font-medium">
                      Direção: <strong className="text-white">{item.director}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMovie(item.id);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      Assistir Agora
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Indicadores / Dots em Pílula */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {HERO_CLASSICS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              idx === activeIndex
                ? 'w-8 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                : 'w-2 bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
