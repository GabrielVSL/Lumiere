import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Play,
  Search,
  Clock,
  ChevronDown,
  Loader2,
  Plus,
  Check,
  SlidersHorizontal,
  X,
  Sparkles,
} from 'lucide-react';
import { PlayWorkItem, PlayStreamManifest } from '../types';
import { getPlayCatalog, getPlayStream } from '../services/api';
import { addFavorite, removeFavorite, isFavorite } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import LumierePlayerModal from './player/LumierePlayerModal';

interface CuratedSpotlight {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  image: string;
  decade: string;
  genre: string;
  kind: string;
}

const CURATED_SPOTLIGHTS: CuratedSpotlight[] = [
  {
    id: 'expressionism',
    title: 'Expressionismo Alemão',
    subtitle: 'Caligari, Nosferatu e o cinema das sombras',
    tag: 'Anos 1920 • Terror',
    image: 'https://image.tmdb.org/t/p/original/sLq72hBx8Xs2IISVsZJqgjOd31b.jpg',
    decade: '1920',
    genre: 'Terror',
    kind: 'feature',
  },
  {
    id: 'silent-masters',
    title: 'Mestres do Silencioso',
    subtitle: 'Buster Keaton, Chaplin e a era de ouro visual',
    tag: 'Anos 1920 • Comédia & Aventura',
    image: 'https://image.tmdb.org/t/p/original/mzox4HbcV9W42MH2dB1QsdDVGo3.jpg',
    decade: '1920',
    genre: 'Comédia',
    kind: 'feature',
  },
  {
    id: 'film-noir',
    title: 'Film Noir & Suspense',
    subtitle: 'Crimes urbanos, detetives e estética chiaroscuro',
    tag: 'Anos 1940 • Crime',
    image: 'https://image.tmdb.org/t/p/original/mxW3h5E71IOnctX65wRWBTqwm5i.jpg',
    decade: '1940',
    genre: 'Crime',
    kind: 'feature',
  },
  {
    id: 'pioneers',
    title: 'Pioneiros do Cinema',
    subtitle: 'As primeiras experiências de 1895 a 1919',
    tag: '1895–1919 • Curtas',
    image: 'https://image.tmdb.org/t/p/original/3RH61Z7BP3f215936PJBEG2qQrT.jpg',
    decade: '1910',
    genre: 'Todos',
    kind: 'short',
  },
  {
    id: 'modern-50s',
    title: 'Modernismo dos Anos 50',
    subtitle: 'Technicolor, grandes dramas e novos horizontes',
    tag: 'Anos 1950 • Longas',
    image: 'https://image.tmdb.org/t/p/original/zQERahUUbVZTosd41NNUPNHqSKJ.jpg',
    decade: '1950',
    genre: 'Todos',
    kind: 'feature',
  },
];

const GENRE_OPTIONS = [
  'Todos',
  'Terror',
  'Comédia',
  'Drama',
  'Crime',
  'Mistério',
  'Aventura',
  'Romance',
  'Ficção Científica',
  'História',
  'Documentário',
];

const DECADE_OPTIONS = [
  { id: 'all', label: 'Todas as épocas', years: '1895–1955' },
  { id: '1950', label: 'Anos 1950', years: 'Modernismo (1950–1955)' },
  { id: '1940', label: 'Anos 1940', years: 'Film Noir & Pós-Guerra' },
  { id: '1930', label: 'Anos 1930', years: 'Era de Ouro Sonora' },
  { id: '1920', label: 'Anos 1920', years: 'Ápice Silencioso' },
  { id: '1910', label: 'Até 1919', years: 'Pioneiros (1895–1919)' },
];

const KIND_TABS = [
  { id: 'all', label: 'Todos' },
  { id: 'feature', label: 'Longas-metragens' },
  { id: 'short', label: 'Curtas pioneiros' },
];

export default function LumierePlay() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user, openAuthModal } = useAuth();

  const initialGenre = searchParams.get('genre') || 'Todos';
  const initialDecade = searchParams.get('decade') || 'all';
  const initialKind = searchParams.get('kind') || 'all';

  const [works, setWorks] = useState<PlayWorkItem[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre);
  const [selectedDecade, setSelectedDecade] = useState<string>(initialDecade);
  const [selectedKind, setSelectedKind] = useState<string>(initialKind);
  const [selectedSort, setSelectedSort] = useState<string>('popular');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const [activeManifest, setActiveManifest] = useState<PlayStreamManifest | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false);
  const [favTrigger, setFavTrigger] = useState(0);

  // Sincroniza quando a URL mudar
  useEffect(() => {
    const g = searchParams.get('genre') || 'Todos';
    const d = searchParams.get('decade') || 'all';
    const k = searchParams.get('kind') || 'all';
    setSelectedGenre(g);
    setSelectedDecade(d);
    setSelectedKind(k);
  }, [searchParams]);

  // Fecha o drawer ao pressionar Escape
  useEffect(() => {
    if (!isFilterDrawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFilterDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFilterDrawerOpen]);

  // Recarrega catálogo ao mudar filtros
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setPage(1);

    getPlayCatalog({
      page: 1,
      pageSize: 30,
      genre: selectedGenre === 'Todos' ? undefined : selectedGenre,
      decade: selectedDecade === 'all' ? undefined : selectedDecade,
      kind: selectedKind === 'all' ? undefined : (selectedKind as 'feature' | 'short'),
      sort: selectedSort,
      search: searchQuery.trim() || undefined,
    })
      .then((res) => {
        if (!isMounted) return;
        setWorks(res.items);
        setTotalPages(res.total_pages);
        setTotalCount(res.total);
      })
      .catch((err) => {
        console.error('Erro ao buscar catálogo:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedGenre, selectedDecade, selectedKind, selectedSort, searchQuery]);

  const handleLoadMore = async () => {
    if (page >= totalPages || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      const res = await getPlayCatalog({
        page: nextPage,
        pageSize: 30,
        genre: selectedGenre === 'Todos' ? undefined : selectedGenre,
        decade: selectedDecade === 'all' ? undefined : selectedDecade,
        kind: selectedKind === 'all' ? undefined : (selectedKind as 'feature' | 'short'),
        sort: selectedSort,
        search: searchQuery.trim() || undefined,
      });

      setWorks((prev) => [...prev, ...res.items]);
      setPage(nextPage);
      setTotalPages(res.total_pages);
      setTotalCount(res.total);
    } catch (err) {
      console.error('Erro ao carregar mais páginas:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handlePlayMovie = async (work: PlayWorkItem) => {
    try {
      const manifest = await getPlayStream(work.id);
      if (manifest) {
        setActiveManifest(manifest);
        setIsPlayerOpen(true);
      }
    } catch (err) {
      console.error('Erro ao iniciar stream:', err);
    }
  };

  const toggleWorkFavorite = (work: PlayWorkItem, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated || user?.isGuest) {
      openAuthModal('signup');
      return;
    }

    if (isFavorite(work.id)) {
      removeFavorite(work.id);
    } else {
      addFavorite({
        id: work.id,
        title: work.title,
        image: work.poster_path || work.backdrop_path || '',
        rating: work.year ? String(work.year) : 'Clássico',
        media_type: 'movie',
      });
    }
    setFavTrigger((v) => v + 1);
  };

  const syncParams = (nextKind: string, nextDecade: string, nextGenre: string) => {
    const next = new URLSearchParams();
    if (nextKind !== 'all') next.set('kind', nextKind);
    if (nextDecade !== 'all') next.set('decade', nextDecade);
    if (nextGenre !== 'Todos') next.set('genre', nextGenre);
    setSearchParams(next, { replace: true });
  };

  const handleSelectSpotlight = (spot: CuratedSpotlight) => {
    const isSame =
      selectedDecade === spot.decade &&
      selectedGenre === spot.genre &&
      selectedKind === spot.kind;

    if (isSame) {
      setSelectedKind('all');
      setSelectedDecade('all');
      setSelectedGenre('Todos');
      syncParams('all', 'all', 'Todos');
    } else {
      setSelectedKind(spot.kind);
      setSelectedDecade(spot.decade);
      setSelectedGenre(spot.genre);
      syncParams(spot.kind, spot.decade, spot.genre);
    }
  };

  const handleClearAllFilters = () => {
    setSelectedKind('all');
    setSelectedDecade('all');
    setSelectedGenre('Todos');
    setSearchQuery('');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const activeFilterCount =
    (selectedDecade !== 'all' ? 1 : 0) +
    (selectedGenre !== 'Todos' ? 1 : 0) +
    (selectedKind !== 'all' ? 1 : 0);

  const activeDecadeObj = DECADE_OPTIONS.find((d) => d.id === selectedDecade);

  return (
    <main
      className="min-h-screen bg-[#050505] pt-24 pb-20 text-white select-none"
      data-fav={favTrigger}
    >
      {/* 1. TOPO EDITORIAL LEVE + CATEGORIZAÇÃO VISUAL EM DESTAQUE (MUBI / CRITERION STYLE) */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl text-white font-normal tracking-tight leading-none">
              Explorar o <span className="italic text-white/85">acervo</span>
            </h1>
            <p className="text-xs sm:text-[13px] text-white/50 font-light mt-2">
              Curadoria por movimentos históricos, décadas e estilos cinematográficos (1895–1955)
            </p>
          </div>

          <div className="text-xs text-white/45 font-light tabular-nums">
            <span className="text-white font-medium">{totalCount || 648}</span> obras catalogadas
          </div>
        </div>

        {/* Cards Visuais de Categorização que Chamam a Atenção */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {CURATED_SPOTLIGHTS.map((spot) => {
            const isSelected =
              selectedDecade === spot.decade &&
              selectedGenre === spot.genre &&
              selectedKind === spot.kind;

            return (
              <button
                key={spot.id}
                type="button"
                onClick={() => handleSelectSpotlight(spot)}
                className={`group relative h-36 sm:h-40 rounded-2xl overflow-hidden text-left p-4 flex flex-col justify-between transition-all duration-300 cursor-pointer border ${
                  isSelected
                    ? 'border-[#ff6738] ring-1 ring-[#ff6738]/50 scale-[1.01]'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <img
                  src={spot.image}
                  alt={spot.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover object-center opacity-55 group-hover:scale-105 group-hover:opacity-75 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
                {isSelected && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle at 80% 20%, rgba(232, 76, 34, 0.35), transparent 65%)',
                    }}
                  />
                )}

                <div className="relative z-10 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md border ${
                      isSelected
                        ? 'bg-[#e84c22] text-white border-[#ff6738]'
                        : 'bg-black/50 text-white/75 border-white/15'
                    }`}
                  >
                    {spot.tag}
                  </span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <div className="relative z-10">
                  <h2 className="font-serif text-xl text-white font-normal leading-tight group-hover:text-[#ff825c] transition-colors">
                    {spot.title}
                  </h2>
                  <p className="text-[11px] text-white/60 font-light line-clamp-1 mt-0.5">
                    {spot.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. BARRA DE CONTROLE COMPACTA (Abas de Formato + Busca + Botão de Filtro + Ordenação) */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 mb-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-4 border-b border-white/[0.08]">
          {/* Esquerda: Segmented Control (Todos / Longas / Curtas) */}
          <div className="inline-flex items-center p-1 rounded-full bg-white/[0.04] border border-white/[0.08] self-start">
            {KIND_TABS.map((tab) => {
              const active = selectedKind === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedKind(tab.id);
                    syncParams(tab.id, selectedDecade, selectedGenre);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                    active
                      ? 'bg-white text-black font-medium shadow-sm'
                      : 'text-white/65 hover:text-white font-light'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Direita: Busca Rápida + Botão de Filtro (Ano e Estilo) + Ordenar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Busca Rápida */}
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar título ou diretor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 focus:border-white/30 text-xs text-white placeholder-white/40 focus:outline-none font-light transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Botão Principal de Filtros (Abre o Filter Drawer de Ano e Estilo) */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                activeFilterCount > 0
                  ? 'bg-[#e84c22]/20 border-[#ff6738] text-white'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/12 text-white/85'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#ff6738]" />
              <span>Filtros</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#ff6738] text-black text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Seletor de Ordenação */}
            <div className="relative">
              <select
                aria-label="Ordenar por"
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="appearance-none bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-full px-4 py-2 pr-8 text-xs text-white/85 font-light focus:outline-none focus:border-white/30 cursor-pointer transition-colors"
              >
                <option value="popular" className="bg-[#0c0d12] text-white">
                  Destaques da curadoria
                </option>
                <option value="year_desc" className="bg-[#0c0d12] text-white">
                  Mais recentes (1955 → 1895)
                </option>
                <option value="year_asc" className="bg-[#0c0d12] text-white">
                  Mais antigos (1895 → 1955)
                </option>
                <option value="title" className="bg-[#0c0d12] text-white">
                  Ordem alfabética (A–Z)
                </option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-white/45 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Pílulas de Filtros Ativos (Remoção Rápida com 1 clique) */}
        {(selectedDecade !== 'all' || selectedGenre !== 'Todos' || searchQuery.trim() !== '') && (
          <div className="flex flex-wrap items-center gap-2 pt-3">
            <span className="text-[11px] text-white/40 font-light mr-1">Filtros ativos:</span>

            {selectedDecade !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDecade('all');
                  syncParams(selectedKind, 'all', selectedGenre);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white font-light transition-colors cursor-pointer"
              >
                <span>{activeDecadeObj?.label || `Anos ${selectedDecade}`}</span>
                <X className="w-3 h-3 text-white/60" />
              </button>
            )}

            {selectedGenre !== 'Todos' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedGenre('Todos');
                  syncParams(selectedKind, selectedDecade, 'Todos');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e84c22]/20 hover:bg-[#e84c22]/30 border border-[#e84c22]/40 text-xs text-[#ff9473] font-light transition-colors cursor-pointer"
              >
                <span>Estilo: {selectedGenre}</span>
                <X className="w-3 h-3 text-[#ff9473]" />
              </button>
            )}

            {searchQuery.trim() !== '' && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white font-light transition-colors cursor-pointer"
              >
                <span>Busca: "{searchQuery}"</span>
                <X className="w-3 h-3 text-white/60" />
              </button>
            )}

            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-[11px] text-white/45 hover:text-white underline underline-offset-4 ml-2 cursor-pointer transition-colors"
            >
              Limpar tudo
            </button>
          </div>
        )}
      </section>

      {/* 3. GRADE DE PÔSTERES DO ACERVO */}
      <section className="max-w-7xl mx-auto px-6 md:px-12">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div
                key={idx}
                className="aspect-[2/3] rounded-2xl bg-white/[0.03] animate-pulse border border-white/[0.06]"
              />
            ))}
          </div>
        ) : works.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-white/[0.02] border border-white/[0.07]">
            <p className="font-serif text-2xl text-white/85 font-normal">
              Nenhuma obra encontrada para esta combinação
            </p>
            <p className="text-xs text-white/45 font-light mt-1 mb-5">
              Experimente remover um dos filtros de década ou estilo.
            </p>
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="px-5 py-2 rounded-full bg-white text-black text-xs font-medium hover:bg-white/90 transition-colors cursor-pointer"
            >
              Redefinir filtros
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
              {works.map((work) => (
                <div
                  key={work.id}
                  onClick={() => handlePlayMovie(work)}
                  className="group flex flex-col cursor-pointer"
                >
                  <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#101116] border border-white/10 group-hover:border-[#ff6738]/60 transition-all duration-300">
                    <img
                      src={work.poster_path || work.backdrop_path || '/hero.jpg'}
                      alt={work.title}
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/hero.jpg';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />

                    {/* Botão Favoritar */}
                    <button
                      type="button"
                      onClick={(e) => toggleWorkFavorite(work, e)}
                      title="Salvar na Minha Lista"
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-white hover:text-black border border-white/15 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10"
                    >
                      {isFavorite(work.id) ? (
                        <Check className="w-3.5 h-3.5 text-[#ff6738]" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Play Central no Hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-[0_8px_25px_rgba(0,0,0,0.7)] transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Rodapé Interno Limpo: Ano e Duração */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-white/70 font-light">
                      <span>{work.year}</span>
                      {work.runtime_min && (
                        <span className="inline-flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {work.runtime_min}m
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="mt-2.5 font-serif text-base text-white group-hover:text-[#ff7a52] truncate transition-colors leading-snug">
                    {work.title}
                  </h3>
                  {work.original_title && work.original_title !== work.title && (
                    <p className="text-[11px] text-white/40 font-light italic truncate">
                      {work.original_title}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Botão Carregar Mais (Pílula Branca Editorial) */}
            {page < totalPages && (
              <div className="flex flex-col items-center justify-center mt-14 gap-2">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full bg-white hover:bg-white/90 text-black text-xs font-medium transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Carregando mais obras...</span>
                    </>
                  ) : (
                    <span>Carregar mais obras ({totalCount - works.length} restantes)</span>
                  )}
                </button>
                <span className="text-[11px] text-white/40 font-light">
                  Mostrando {works.length} de {totalCount} obras
                </span>
              </div>
            )}
          </>
        )}
      </section>

      {/* 4. FILTER DRAWER LATERAL (Seleção de Ano/Década, Estilo/Gênero e Formato) */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsFilterDrawerOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          />

          {/* Painel Lateral */}
          <div className="relative z-10 w-full max-w-md bg-[#09090c]/95 backdrop-blur-2xl border-l border-white/10 h-full flex flex-col justify-between p-6 sm:p-8 overflow-y-auto shadow-[0_0_60px_rgba(0,0,0,0.9)]">
            <div className="space-y-7">
              {/* Cabeçalho do Drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <span className="text-[11px] text-[#ff6738] font-medium block">
                    Refinar catálogo
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal">
                    Ano &amp; <span className="italic">Estilo</span>
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-white/75 hover:text-white cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. Formato */}
              <div>
                <label className="block text-xs text-white/50 font-light mb-3">
                  Formato da obra
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {KIND_TABS.map((tab) => {
                    const active = selectedKind === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setSelectedKind(tab.id);
                          syncParams(tab.id, selectedDecade, selectedGenre);
                        }}
                        className={`px-3 py-2.5 rounded-xl text-xs text-center border transition-all cursor-pointer ${
                          active
                            ? 'bg-white text-black border-white font-medium'
                            : 'bg-white/[0.03] hover:bg-white/[0.07] text-white/70 border-white/10 font-light'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Época / Década */}
              <div>
                <label className="block text-xs text-white/50 font-light mb-3">
                  Época / Década de lançamento
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {DECADE_OPTIONS.map((dec) => {
                    const active = selectedDecade === dec.id;
                    return (
                      <button
                        key={dec.id}
                        type="button"
                        onClick={() => {
                          setSelectedDecade(dec.id);
                          syncParams(selectedKind, dec.id, selectedGenre);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          active
                            ? 'bg-[#e84c22]/20 border-[#ff6738] text-white'
                            : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 text-white/75'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-serif text-base font-normal">{dec.label}</span>
                          {active && <Check className="w-3.5 h-3.5 text-[#ff6738]" />}
                        </div>
                        <span className="text-[10px] text-white/45 font-light mt-0.5">
                          {dec.years}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Estilo / Gênero Cinematográfico */}
              <div>
                <label className="block text-xs text-white/50 font-light mb-3">
                  Estilo / Gênero cinematográfico
                </label>
                <div className="flex flex-wrap gap-2">
                  {GENRE_OPTIONS.map((genre) => {
                    const active = selectedGenre === genre;
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => {
                          setSelectedGenre(genre);
                          syncParams(selectedKind, selectedDecade, genre);
                        }}
                        className={`px-3.5 py-2 rounded-full text-xs border transition-all cursor-pointer ${
                          active
                            ? 'bg-white text-black border-white font-medium'
                            : 'bg-white/[0.03] hover:bg-white/[0.08] text-white/70 border-white/10 font-light'
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rodapé do Drawer (Limpar + Aplicar com contador em tempo real) */}
            <div className="pt-5 border-t border-white/10 mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="px-4 py-3 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-white/75 hover:text-white font-light transition-colors cursor-pointer"
              >
                Limpar
              </button>

              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="flex-1 py-3 px-6 rounded-full bg-white hover:bg-white/90 text-black text-xs font-medium transition-all shadow-[0_4px_20px_rgba(255,255,255,0.2)] cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ver {totalCount} obras</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <LumierePlayerModal
        manifest={activeManifest}
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
      />
    </main>
  );
}
