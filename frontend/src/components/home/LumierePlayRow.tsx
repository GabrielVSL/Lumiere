import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Film, Play, ChevronLeft, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';
import { PlayWorkItem, PlayStreamManifest } from '../../types';
import { getPlayCatalog, getPlayStream } from '../../services/api';
import LumierePlayerModal from '../player/LumierePlayerModal';

export default function LumierePlayRow() {
  const [works, setWorks] = useState<PlayWorkItem[]>([]);
  const [activeManifest, setActiveManifest] = useState<PlayStreamManifest | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getPlayCatalog({ page: 1 })
      .then((res) => {
        setWorks(res.items);
      })
      .catch((err) => {
        console.error('Erro ao carregar fila do Lumière Play:', err);
      });
  }, []);

  const handlePlay = async (work: PlayWorkItem) => {
    try {
      setIsLoadingStream(true);
      const manifest = await getPlayStream(work.id);
      if (manifest) {
        setActiveManifest(manifest);
        setIsPlayerOpen(true);
      }
    } catch (err) {
      console.error('Erro ao abrir stream:', err);
    } finally {
      setIsLoadingStream(false);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (works.length === 0) return null;

  return (
    <section className="py-6 px-4 md:px-12 select-none relative group/row">
      {/* Header da Linha */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
                Lumière Play • Assistir Agora no Navegador
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Domínio Público (Lei 9.610/98)
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Clássicos mundiais restaurados, transmitidos sem anúncios diretamente no seu navegador.
            </p>
          </div>
        </div>

        <Link
          to="/play"
          className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
        >
          Ver Todos ({works.length}) &rarr;
        </Link>
      </div>

      {/* Controles de Navegação Horizontal */}
      <button
        onClick={() => scroll('left')}
        aria-label="Rolar para esquerda"
        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/80 text-white border border-white/10 hover:border-amber-400 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 hover:scale-110 shadow-xl backdrop-blur-sm"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={() => scroll('right')}
        aria-label="Rolar para direita"
        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/80 text-white border border-white/10 hover:border-amber-400 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 hover:scale-110 shadow-xl backdrop-blur-sm"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Lista Horizontal de Cards */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-4 overflow-x-auto scrollbar-none scroll-smooth pb-4 pt-1"
      >
        {works.map((work) => (
          <div
            key={work.id}
            onClick={() => handlePlay(work)}
            className="flex-shrink-0 w-64 md:w-72 rounded-2xl bg-[#111319] border border-white/5 hover:border-amber-500/40 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(245,158,11,0.2)] group"
          >
            {/* Widescreen Preview */}
            <div className="aspect-video w-full relative overflow-hidden bg-[#0c0d12]">
              <img
                src={work.backdrop_path || work.poster_path}
                alt={work.title}
                loading="lazy"
                onError={(e) => {
                  if (work.poster_path) {
                    (e.currentTarget as HTMLImageElement).src = work.poster_path;
                  }
                }}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              <div className="absolute top-2 left-2 z-10">
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-black/80 backdrop-blur-md text-amber-400 border border-amber-500/30">
                  ASSISTIR AGORA
                </span>
              </div>

              {/* Hover Overlay com Botão de Play */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="w-11 h-11 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(245,158,11,0.6)] transform scale-75 group-hover:scale-100 transition-transform duration-300">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>
            </div>

            {/* Informações */}
            <div className="p-3">
              <h3 className="text-xs md:text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1 mb-1">
                {work.title}
              </h3>
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span>{work.year} • {work.runtime_min} min</span>
                <span className="text-amber-400/90 font-semibold">{work.genres[0]}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Player Modal */}
      <LumierePlayerModal
        manifest={activeManifest}
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
      />
    </section>
  );
}
