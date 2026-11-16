import React, { useState, useRef } from 'react';
import { Compass, Sparkles, Film, ArrowRight } from 'lucide-react';
import gsap from 'gsap';

interface EraCard {
  id: string;
  name: string;
  period: string;
  desc: string;
  directors: string;
  poster: string;
  decadeFilter: string;
}

const ERAS: EraCard[] = [
  {
    id: 'primitive',
    name: 'Cinema Primitivo',
    period: '1895 – 1919',
    desc: 'O nascimento da imagem em movimento: Méliès, Lumière e as primeiras narrativas fantásticas.',
    directors: 'Irmãos Lumière, Georges Méliès',
    poster: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop&q=80',
    decadeFilter: 'pre-1920',
  },
  {
    id: 'twenties',
    name: 'Anos 1920: Expressionismo',
    period: '1920 – 1929',
    desc: 'O ápice da era muda: sombras expressionistas, Buster Keaton e as grandes vanguardas europeias.',
    directors: 'Robert Wiene, Buster Keaton, Fritz Lang',
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80',
    decadeFilter: '1920',
  },
  {
    id: 'thirties',
    name: 'Anos 1930: Era de Ouro',
    period: '1930 – 1939',
    desc: 'A chegada definitiva do som, os primeiros monstros clássicos e as comédias screwball.',
    directors: 'James Whale, Frank Capra, Fritz Lang',
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80',
    decadeFilter: '1930',
  },
  {
    id: 'forties',
    name: 'Anos 1940: Film Noir',
    period: '1940 – 1949',
    desc: 'Detetives cínicos, femmes fatales, iluminação dramática e o impacto moral da Segunda Guerra.',
    directors: 'Orson Welles, Howard Hawks, Billy Wilder',
    poster: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=500&auto=format&fit=crop&q=80',
    decadeFilter: '1940',
  },
  {
    id: 'fifties',
    name: 'Anos 1950: Ficção & Cor',
    period: '1950 – 1955',
    desc: 'O surgimento da ficção científica moderna na Guerra Fria e a expansão do Technicolor vibrante.',
    directors: 'Stanley Donen, Jack Arnold, Fred M. Wilcox',
    poster: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=500&auto=format&fit=crop&q=80',
    decadeFilter: '1950',
  },
];

interface Props {
  onSelectEra: (decadeFilter: string) => void;
}

export default function EraFanDeck({ onSelectEra }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Rotações angulares que formam o leque (fan-out)
  const defaultRotations = [-14, -7, 0, 7, 14];
  const defaultYOffsets = [20, 5, 0, 5, 20];

  return (
    <section className="py-20 px-6 md:px-14 container mx-auto max-w-7xl select-none overflow-hidden">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <Compass className="w-3.5 h-3.5" />
          Navegação Histórica
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
          Uma viagem no tempo pelas <span className="text-amber-400">grandes épocas</span>
        </h2>

        <p className="text-sm md:text-base text-gray-400 mt-3 leading-relaxed">
          Passe o mouse sobre os períodos para explorar os movimentos artísticos que moldaram a sétima arte.
        </p>
      </div>

      {/* Fan Deck Stage */}
      <div className="relative w-full max-w-5xl mx-auto h-[480px] sm:h-[520px] flex items-center justify-center">
        {ERAS.map((era, idx) => {
          const isHovered = hoveredIdx === idx;
          const anyHovered = hoveredIdx !== null;

          // Se estiver com mouse sobre este card, endireita e eleva
          let rot = defaultRotations[idx];
          let yOff = defaultYOffsets[idx];
          let scale = 1;
          let zIndex = 5;

          if (isHovered) {
            rot = 0;
            yOff = -30;
            scale = 1.1;
            zIndex = 30;
          } else if (anyHovered) {
            scale = 0.95;
            rot = defaultRotations[idx] * 1.2;
          }

          // Deslocamento horizontal escalonado
          const xOffset = (idx - 2) * 110; // espalhamento horizontal

          return (
            <div
              key={era.id}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onSelectEra(era.decadeFilter)}
              className="absolute w-[220px] sm:w-[260px] md:w-[280px] h-[360px] sm:h-[400px] md:h-[430px] rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 shadow-2xl border"
              style={{
                transform: `translateX(${xOffset}px) translateY(${yOff}px) rotate(${rot}deg) scale(${scale})`,
                zIndex: zIndex,
                borderColor: isHovered ? 'rgba(245, 158, 11, 0.8)' : 'rgba(255, 255, 255, 0.1)',
                boxShadow: isHovered
                  ? '0 25px 50px -12px rgba(245, 158, 11, 0.35)'
                  : '0 20px 30px -10px rgba(0, 0, 0, 0.8)',
              }}
            >
              <img
                src={era.poster}
                alt={era.name}
                className="w-full h-full object-cover transition-transform duration-700"
                style={{
                  transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                }}
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/60 to-black/30" />

              {/* Badge Época */}
              <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-500/30 text-[10px] font-black text-amber-400">
                {era.period}
              </div>

              {/* Conteúdo */}
              <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col justify-end">
                <h3 className="text-lg sm:text-xl font-black text-white leading-tight mb-1.5 drop-shadow-md">
                  {era.name}
                </h3>

                <p className="text-xs text-gray-300 leading-relaxed line-clamp-2 mb-3">
                  {era.desc}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                  <span className="text-[11px] text-gray-400">
                    Grandes Nomes: <strong className="text-amber-400 font-semibold">{era.directors.split(',')[0]}</strong>
                  </span>
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
}
