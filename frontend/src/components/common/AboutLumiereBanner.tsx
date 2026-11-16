import React, { useState } from 'react';
import { Film, Compass, ShieldCheck, X, Sparkles, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutLumiereBanner() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <div className="container mx-auto px-4 md:px-12 my-4">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 text-xs font-bold text-amber-400/80 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 px-3.5 py-1.5 rounded-full transition-all"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Como funciona o Lumière?
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-12 my-6">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#12141d] to-[#0c0d13] border border-amber-500/20 p-6 md:p-8 shadow-2xl">
        
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none" />

        {/* Botão de Fechar */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          title="Minimizar explicação"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header do Banner */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center p-1">
            <img src="/lumiere_icon.png" alt="" className="w-full h-full object-contain" />
          </div>
          <span className="text-xs font-black tracking-widest uppercase text-amber-400">
            Conheça o Lumière
          </span>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">
          O Cinema Livre do Mundo & Seu Guia Universal de Streaming
        </h2>

        <p className="text-sm md:text-base text-gray-300 leading-relaxed max-w-3xl mb-6">
          O Lumière foi criado para resolver duas dores em um único lugar: resgatar obras históricas que você pode assistir de graça no nosso próprio player, e te dizer onde assistir qualquer outra produção mundial.
        </p>

        {/* 2 PILARES EXPLICADOS LADO A LADO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          
          {/* PILAR 1: LUMIÈRE PLAY */}
          <div className="p-5 rounded-2xl bg-[#090a0f]/80 border border-amber-500/30 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full mb-3">
                <Film className="w-3.5 h-3.5" />
                Pilar 1: Lumière Play (Assista Aqui)
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Filmes que rodam dentro do site
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed mb-4">
                Grandes clássicos do cinema mundial em <strong>Domínio Público</strong> (lançados até 1955, como <em>Metropolis</em>, <em>Nosferatu</em> e <em>A Noite dos Mortos-Vivos</em>) e obras <strong>Creative Commons</strong>. Você clica em <strong>Assistir</strong> e o filme toca na hora, de graça, sem cadastro e sem anúncios invasivos.
              </p>
            </div>
            <Link
              to="/play"
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ver catálogo do Lumière Play →
            </Link>
          </div>

          {/* PILAR 2: GUIA DE STREAMING */}
          <div className="p-5 rounded-2xl bg-[#090a0f]/80 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-300 bg-white/5 px-3 py-1 rounded-full mb-3">
                <Compass className="w-3.5 h-3.5" />
                Pilar 2: Guia Universal de Streaming
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Descubra onde assistir qualquer filme ou série
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed mb-4">
                Pesquise títulos modernos da Netflix, Prime Video, Disney+, Max e TV aberta. Nós cruzamos as notas do <strong>IMDb</strong> e te damos os links diretos para a plataforma oficial onde aquele filme está passando no Brasil.
              </p>
            </div>
            <Link
              to="/explorar"
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white transition-colors"
            >
              Explorar catálogo universal →
            </Link>
          </div>

        </div>

        {/* SELO DE CONFORMIDADE LEGAL */}
        <div className="flex items-center gap-2 text-xs text-gray-400 border-t border-white/5 pt-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            <strong>100% Legal e Aberto:</strong> Em conformidade com a Lei de Direitos Autorais (Lei 9.610/98 art. 44) e licenças públicas de distribuição.
          </span>
        </div>

      </div>
    </div>
  );
}
