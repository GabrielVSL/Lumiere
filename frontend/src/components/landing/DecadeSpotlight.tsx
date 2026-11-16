import React, { useState } from 'react';
import { Film, Play, Sparkles, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

interface SpotlightFilm {
  id: number;
  title: string;
  year: number;
  runtime: number;
  genre: string;
  decade: string;
  poster: string;
}

const SPOTLIGHT_FILMS: SpotlightFilm[] = [
  {
    id: 1,
    title: 'Jejum de Amor',
    year: 1940,
    runtime: 92,
    genre: 'Comédia',
    decade: '1940',
    poster: 'https://image.tmdb.org/t/p/w500/z0nS2a3l6pM7YF31L1zH9G8XG8P.jpg',
  },
  {
    id: 2,
    title: 'O Fantasma da Ópera',
    year: 1925,
    runtime: 93,
    genre: 'Terror',
    decade: '1920',
    poster: 'https://image.tmdb.org/t/p/w500/vQ9n9rWbC1mY7T2l0mH9n8Z1k8P.jpg',
  },
  {
    id: 3,
    title: 'O Gabinete do Dr. Caligari',
    year: 1920,
    runtime: 77,
    genre: 'Expressionismo',
    decade: '1920',
    poster: 'https://image.tmdb.org/t/p/w500/6f3P8gZ3hW0hP7mY7n1k9Z1X2m8.jpg',
  },
  {
    id: 4,
    title: 'O Estranho',
    year: 1946,
    runtime: 95,
    genre: 'Noir',
    decade: '1940',
    poster: 'https://image.tmdb.org/t/p/w500/7aQ5pY1hW8mP8mY7n2k9Z1X3m9.jpg',
  },
  {
    id: 5,
    title: 'A General',
    year: 1926,
    runtime: 78,
    genre: 'Comédia',
    decade: '1920',
    poster: 'https://image.tmdb.org/t/p/w500/9k1n2m3l4o5p6q7r8s9t0u1v2w.jpg',
  },
  {
    id: 6,
    title: 'Almas Perversas',
    year: 1945,
    runtime: 102,
    genre: 'Crime / Noir',
    decade: '1940',
    poster: 'https://image.tmdb.org/t/p/w500/4n0mR1a3hW2mP0mY9n5k1Z3X6m3.jpg',
  },
  {
    id: 9,
    title: 'Núpcias Reais',
    year: 1951,
    runtime: 93,
    genre: 'Musical',
    decade: '1950',
    poster: 'https://image.tmdb.org/t/p/w500/0t6sX7g9hW8mP6mZ5n1k7Z9X2m9.jpg',
  },
  {
    id: 12,
    title: 'Cyrano de Bergerac',
    year: 1950,
    runtime: 113,
    genre: 'Drama',
    decade: '1950',
    poster: 'https://image.tmdb.org/t/p/w500/6z2yA3m5hW4mP2mZ1n7k3Z5X8n5.jpg',
  },
  {
    id: 8,
    title: 'As Viagens de Gulliver',
    year: 1939,
    runtime: 76,
    genre: 'Animação',
    decade: '1930',
    poster: 'https://image.tmdb.org/t/p/w500/8r4qV5e7hW6mP4mZ3n9k5Z7X0m7.jpg',
  },
  {
    id: 10,
    title: 'Vestida Para Matar',
    year: 1946,
    runtime: 71,
    genre: 'Mistério',
    decade: '1940',
    poster: 'https://image.tmdb.org/t/p/w500/2v8uY9i1hW0mP8mZ7n3k9Z1X4n1.jpg',
  },
  {
    id: 30,
    title: 'Viagem à Lua',
    year: 1902,
    runtime: 14,
    genre: 'Ficção Científica',
    decade: 'pre-1920',
    poster: 'https://image.tmdb.org/t/p/w500/9O7gLzmreU0nGkIB6K3BsJbzvNv.jpg',
  },
  {
    id: 31,
    title: 'A Chegada do Trem na Estação',
    year: 1895,
    runtime: 1,
    genre: 'Histórico',
    decade: 'pre-1920',
    poster: 'https://image.tmdb.org/t/p/w500/eN7YpYJpE5K7YV4zG8yQ9wX0m1.jpg',
  },
];

interface Props {
  onSelectMovie: (id: number) => void;
  onExploreMore: () => void;
}

export default function DecadeSpotlight({ onSelectMovie, onExploreMore }: Props) {
  const [selectedDecade, setSelectedDecade] = useState<string>('all');

  const tabs = [
    { id: 'all', label: 'Todos os Destaques' },
    { id: 'pre-1920', label: 'Cinema Primitivo (1895–1919)' },
    { id: '1920', label: 'Anos 1920' },
    { id: '1930', label: 'Anos 1930' },
    { id: '1940', label: 'Anos 1940' },
    { id: '1950', label: 'Anos 1950' },
  ];

  const filtered = selectedDecade === 'all'
    ? SPOTLIGHT_FILMS.slice(0, 8)
    : SPOTLIGHT_FILMS.filter((f) => f.decade === selectedDecade);

  return (
    <section className="py-20 px-6 md:px-14 container mx-auto max-w-7xl select-none">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Film className="w-3.5 h-3.5" />
            Galeria Curada
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Obras fundamentais em exibição
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Restauradas e catalogadas para reprodução imediata sem intermediários.
          </p>
        </div>

        {/* Tabs de Filtro (Estilo Dribbble Reference "Popular shows") */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#111319] border border-white/5 overflow-x-auto scrollbar-none self-start md:self-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedDecade(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedDecade === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Posters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 md:gap-6">
        {filtered.map((film) => (
          <div
            key={film.id}
            onClick={() => onSelectMovie(film.id)}
            className="group relative flex flex-col rounded-3xl bg-[#111319] border border-white/5 hover:border-amber-500/50 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_30px_rgba(245,158,11,0.2)]"
          >
            {/* Imagem do Poster */}
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#090a0f]">
              <img
                src={film.poster}
                alt={film.title}
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60';
                }}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Tag Domínio Público */}
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[9px] font-black text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                LIVRE
              </div>

              {/* Hover Overlay com Botão de Play */}
              <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-[0_0_20px_rgba(245,158,11,0.6)]">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>
            </div>

            {/* Metadados no Rodapé */}
            <div className="p-4 flex flex-col flex-grow justify-between">
              <div>
                <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-amber-400 transition-colors">
                  {film.title}
                </h3>
                <span className="text-[11px] text-gray-500 font-medium">
                  {film.genre}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-2.5 border-t border-white/5">
                <span className="font-bold text-amber-400">{film.year}</span>
                <span className="flex items-center gap-1 text-[11px]">
                  <Clock className="w-3 h-3" />
                  {film.runtime} min
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botão Ver Acervo Completo */}
      <div className="flex justify-center mt-12">
        <button
          onClick={onExploreMore}
          className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          Acessar o Acervo Completo (Mais de 600 Obras)
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </section>
  );
}
