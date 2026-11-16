import React from 'react';
import { ShieldCheck, PlayCircle, Sparkles, Award } from 'lucide-react';

export default function WhyLumiereSection() {
  const cards = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      badge: 'DOMÍNIO PÚBLICO REAL',
      title: '100% Livre & Gratuito',
      desc: 'Em estrito cumprimento ao Art. 44 da Lei nº 9.610/1998, as obras audiovisuais entram em domínio público 70 anos após a primeira divulgação. Sem taxas, sem pegadinhas e sem expiração.',
      highlight: 'Lei 9.610/98 Art. 44',
    },
    {
      icon: <PlayCircle className="w-6 h-6 text-amber-400" />,
      badge: 'INFRAESTRUTURA INDEPENDENTE',
      title: 'Streaming Nativo sem YouTube',
      desc: 'Transmissão direta em alta resolução a partir do Internet Archive via protocolo HTTP 206 Partial Content (Range Requests). Sem bloqueios de região ou embeds instáveis.',
      highlight: 'HTTP 206 Range Stream',
    },
    {
      icon: <Sparkles className="w-6 h-6 text-amber-300" />,
      badge: 'PRESERVAÇÃO HISTÓRICA',
      title: 'Mais de 600 Obras Raras',
      desc: 'Obras-primas pré-1956 de cineastas que inventaram a linguagem do cinema: Georges Méliès, Buster Keaton, Charles Chaplin, Fritz Lang, Orson Welles e Robert Wiene.',
      highlight: '648 Obras Catalogadas',
    },
  ];

  return (
    <section className="py-20 px-6 md:px-14 container mx-auto max-w-7xl select-none">
      
      {/* Header da Seção */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <Award className="w-3.5 h-3.5" />
          Diferenciais do Projeto
        </div>
        
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
          O que torna o <span className="text-amber-400">Lumière</span> diferente?
        </h2>
        
        <p className="text-sm md:text-base text-gray-400 mt-3 leading-relaxed">
          Uma biblioteca viva que resgata o cinema mundial em seu estado mais puro: acessível, preservado e livre para todos.
        </p>
      </div>

      {/* Grid com os 3 Cards Minimalistas (Estilo Dribbble Reference) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((c, idx) => (
          <div
            key={idx}
            className="group relative flex flex-col justify-between p-8 rounded-3xl bg-[#111319]/80 border border-white/5 hover:border-amber-500/40 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(245,158,11,0.1)] overflow-hidden"
          >
            {/* Glow sutil no hover */}
            <div className="absolute -right-12 -top-12 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-all duration-500 pointer-events-none" />

            <div>
              {/* Ícone no topo */}
              <div className="w-14 h-14 rounded-2xl bg-[#090a0f] border border-white/10 group-hover:border-amber-500/40 flex items-center justify-center mb-6 shadow-inner transition-colors">
                {c.icon}
              </div>

              {/* Tag / Badge */}
              <span className="text-[10px] font-black tracking-widest uppercase text-amber-400/90 block mb-2">
                {c.badge}
              </span>

              {/* Título */}
              <h3 className="text-xl font-extrabold text-white mb-3 group-hover:text-amber-400 transition-colors">
                {c.title}
              </h3>

              {/* Descrição */}
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                {c.desc}
              </p>
            </div>

            {/* Rodapé com Destaque */}
            <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Garantia Técnica</span>
              <span className="font-bold text-amber-400/90">{c.highlight}</span>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}
