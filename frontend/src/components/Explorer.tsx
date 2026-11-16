import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, RotateCcw, ChevronDown, Compass, Film, Tv, Sparkles } from 'lucide-react';
import MediaCard from './common/MediaCard';
import { searchMedia, getGenres, discoverMedia } from '../services/api';
import { Genre, MediaItem, MediaType } from '../types';

export default function Explorer() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const categoriaParam = searchParams.get('categoria');

  // Tipo de Mídia: 'all' | 'movie' | 'tv'
  const [mediaType, setMediaType] = useState<'all' | 'movie' | 'tv'>('all');

  const [genres, setGenres] = useState<Genre[]>([]);
  const [activeGenre, setActiveGenre] = useState<number | null>(null);

  const [year, setYear] = useState('');
  const [rating, setRating] = useState(0);
  const [sort, setSort] = useState('popularity.desc');

  const [results, setResults] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const sortOptions = [
    { value: 'popularity.desc', label: 'Mais Populares' },
    { value: 'vote_average.desc', label: 'Melhores Avaliados' },
    { value: 'primary_release_date.desc', label: 'Mais Recentes' },
  ];

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadGenres = async () => setGenres(await getGenres());
    loadGenres();
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setPage(1);

      if (query) {
        setActiveGenre(null);
        const searchType = mediaType === 'all' ? undefined : (mediaType as MediaType);
        const items = await searchMedia(query, searchType);
        setResults(items);
        setTotalResults(items.length);
        setTotalPages(1);
      } else {
        const finalRating = rating > 0 ? rating : '';
        const initialSort = categoriaParam === 'populares' ? 'popularity.desc' : sort;
        const res = await discoverMedia({
          type: mediaType,
          genreId: activeGenre,
          page: 1,
          year,
          rating: finalRating,
          sort: initialSort,
        });
        setResults(res.results);
        setTotalPages(res.total_pages);
        setTotalResults(res.total_results);
      }

      setLoading(false);
    };

    window.scrollTo(0, 0);
    fetchInitialData();
  }, [query, mediaType, activeGenre, year, rating, sort, categoriaParam]);

  const handleLoadMore = async () => {
    if (query || page >= totalPages || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const finalRating = rating > 0 ? rating : '';
    const res = await discoverMedia({
      type: mediaType,
      genreId: activeGenre,
      page: nextPage,
      year,
      rating: finalRating,
      sort,
    });
    setResults((prev) => [...prev, ...res.results]);
    setPage(nextPage);
    setTotalPages(res.total_pages);
    setTotalResults(res.total_results);
    setLoadingMore(false);
  };

  const clearFilters = () => {
    setYear('');
    setRating(0);
    setSort('popularity.desc');
    setActiveGenre(null);
    setIsSortOpen(false);
  };

  const currentSortLabel = sortOptions.find((opt) => opt.value === sort)?.label;

  return (
    <main className="min-h-screen bg-[#07080b] pt-24 pb-28 md:pb-20 px-4 md:px-12 select-none">
      <div className="container mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]" />
            <div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight flex items-center gap-3">
                <Compass className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
                {query ? `Resultados para: "${query}"` : 'Guia Universal de Streamings'}
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                Descubra onde assistir a filmes e séries nos serviços oficiais de streaming no Brasil
              </p>
            </div>
          </div>

          {/* Seletor de Tipo: Todos / Filmes / Séries */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-[#111319] border border-white/10 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setMediaType('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                mediaType === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Todos
            </button>
            <button
              type="button"
              onClick={() => setMediaType('movie')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                mediaType === 'movie'
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              Filmes
            </button>
            <button
              type="button"
              onClick={() => setMediaType('tv')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                mediaType === 'tv'
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              Séries
            </button>
          </div>
        </div>

        {!query && (
          <div className="space-y-6 mb-12">
            
            {/* GENRES PILL BAR */}
            <div className="flex overflow-x-auto gap-2.5 pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveGenre(null)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 flex items-center gap-2 cursor-pointer ${
                  activeGenre === null
                    ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105'
                    : 'bg-[#111319] text-gray-300 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                Todos os Gêneros
              </button>

              {genres.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setActiveGenre(g.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                    activeGenre === g.id
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105'
                      : 'bg-[#111319] text-gray-300 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>

            {/* FILTERS BAR */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#111319]/80 backdrop-blur-md border border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <span>Filtros do Catálogo:</span>
                {totalResults > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded bg-white/5 text-[11px] text-gray-300">
                    {totalResults} títulos encontrados
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 flex-1 justify-start md:justify-end">
                
                {/* Ano Input */}
                <div className="w-28">
                  <input
                    type="number"
                    placeholder="Ano (Ex: 2024)"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className="w-full bg-[#07080b] text-white text-xs font-bold border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 transition-all placeholder-gray-500"
                  />
                </div>

                {/* Nota Mínima Selector */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#07080b] border border-white/10 text-xs">
                  <span className="text-gray-400 font-semibold">Nota Mínima:</span>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="bg-transparent text-amber-400 font-bold outline-none cursor-pointer"
                  >
                    <option value={0} className="bg-[#0f1118] text-white">Todas</option>
                    <option value={6} className="bg-[#0f1118] text-white">+ 6.0 ★</option>
                    <option value={7} className="bg-[#0f1118] text-white">+ 7.0 ★</option>
                    <option value={8} className="bg-[#0f1118] text-white">+ 8.0 ★</option>
                    <option value={9} className="bg-[#0f1118] text-white">+ 9.0 ★</option>
                  </select>
                </div>

                {/* Ordenação Dropdown */}
                <div className="relative" ref={sortRef}>
                  <button
                    type="button"
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#07080b] border border-white/10 text-xs font-bold text-gray-200 hover:border-amber-400 transition-all cursor-pointer"
                  >
                    <span>{currentSortLabel}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isSortOpen ? 'rotate-180 text-amber-400' : ''}`} />
                  </button>

                  {isSortOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#111319] border border-white/10 shadow-2xl overflow-hidden py-1 z-50 animate-fade-in">
                      {sortOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setSort(opt.value);
                            setIsSortOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                            sort === opt.value
                              ? 'bg-amber-400/10 text-amber-400'
                              : 'text-gray-200 hover:bg-white/5 hover:text-amber-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Limpar Filtros */}
                {(year || rating > 0 || sort !== 'popularity.desc' || activeGenre) && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Limpar filtros"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}

              </div>
            </div>

          </div>
        )}

        {/* RESULTS GRID */}
        {loading ? (
          <div className="flex justify-center my-32">
            <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {results.map((item, index) => (
                <MediaCard key={`${item.id}-${index}`} item={item} variant="poster" />
              ))}
            </div>

            {!query && page < totalPages && (
              <div className="flex flex-col items-center justify-center mt-16 gap-2">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3.5 rounded-full bg-[#111319] hover:bg-white/10 text-white font-bold text-sm border border-white/10 hover:border-amber-400/50 transition-all flex items-center gap-2 shadow-xl disabled:opacity-50 cursor-pointer"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      Carregando mais títulos...
                    </>
                  ) : (
                    'Carregar Mais Títulos'
                  )}
                </button>
                <span className="text-xs text-gray-500">
                  Página {page} de {totalPages}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-400 py-32 bg-[#111319]/40 rounded-3xl border border-white/5 max-w-xl mx-auto p-8">
            <Compass className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhum título encontrado</h3>
            <p className="text-sm text-gray-400">
              Tente diminuir a nota mínima ou remover os filtros de ano para ver mais resultados.
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
