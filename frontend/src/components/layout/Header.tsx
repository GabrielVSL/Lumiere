import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, X, Play, LogOut, Bookmark, Clock } from 'lucide-react';
import { getPlayCatalog, getPlayStream } from '../../services/api';
import { PlayWorkItem, PlayStreamManifest } from '../../types';
import { useAuth } from '../../context/AuthContext';
import LumierePlayerModal from '../player/LumierePlayerModal';

export default function Header() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayWorkItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [activeManifest, setActiveManifest] = useState<PlayStreamManifest | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Busca diretamente no catálogo de filmes clássicos do Lumière Play
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await getPlayCatalog({ page: 1, pageSize: 8, search: query.trim() });
        setResults(res.items || []);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePlayFromSearch = async (workId: number) => {
    setIsSearchOpen(false);
    setQuery('');
    try {
      const manifest = await getPlayStream(workId);
      if (manifest) {
        setActiveManifest(manifest);
        setIsPlayerOpen(true);
      }
    } catch {
      navigate('/play');
    }
  };

  const navItems = [
    { label: 'Início', path: '/app' },
    { label: 'Explorar', path: '/play' },
    { label: 'Minha lista', path: '/minha-lista' },
  ];

  const isPathActive = (itemPath: string) => {
    if (itemPath === '/play') {
      return location.pathname === '/play' || location.pathname === '/explorar';
    }
    return location.pathname === itemPath;
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 select-none ${
          scrolled
            ? 'bg-[#050505]/90 backdrop-blur-xl border-b border-white/[0.07] py-3.5'
            : 'bg-gradient-to-b from-black/85 via-black/40 to-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between gap-6">
          {/* Logo Oficial à Esquerda */}
          <div className="flex items-center gap-10">
            <Link to="/app" className="flex items-center shrink-0">
              <img
                src="/lumiere_logo.png"
                alt="Lumière"
                className="h-5 md:h-6 w-auto object-contain opacity-95 hover:opacity-100 transition-opacity"
              />
            </Link>

            {/* Links Centrais em Caixa Normal (Estética da Landing Page + Referência) */}
            <nav className="hidden lg:flex items-center gap-7 text-[13px] font-normal">
              {navItems.map((item) => {
                const active = isPathActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`transition-colors duration-300 relative py-1 ${
                      active ? 'text-white font-medium' : 'text-white/65 hover:text-white'
                    }`}
                  >
                    {item.label}
                    {active && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[#ff6738]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Direita: Busca de Obras Clássicas + Perfil + Sair */}
          <div className="flex items-center gap-3.5">
            {/* Barra de Busca no Acervo Clássico */}
            <div ref={searchRef} className="relative">
              <div
                className={`flex items-center rounded-full border transition-all duration-300 ${
                  isSearchOpen
                    ? 'w-56 sm:w-72 bg-[#0d0e12] border-white/25 px-3.5 py-1.5'
                    : 'w-40 sm:w-52 bg-white/[0.05] hover:bg-white/[0.08] border-white/10 px-3.5 py-1.5'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-white/50 shrink-0 mr-2" />
                <input
                  type="text"
                  value={query}
                  onFocus={() => setIsSearchOpen(true)}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  placeholder="Buscar obra clássica..."
                  className="w-full bg-transparent text-xs text-white placeholder-white/40 focus:outline-none font-light"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setResults([]);
                    }}
                    className="text-white/40 hover:text-white ml-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Dropdown de Resultados Reais do Acervo */}
              {isSearchOpen && query.trim().length > 0 && (
                <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl bg-[#0c0d12]/95 backdrop-blur-2xl border border-white/15 shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden z-50">
                  <div className="px-4 py-2.5 border-b border-white/[0.07] flex items-center justify-between text-[11px] text-white/50 font-light">
                    <span>Acervo Lumière Play</span>
                    <span>{isSearching ? 'Buscando...' : `${results.length} resultado(s)`}</span>
                  </div>

                  {results.length === 0 && !isSearching ? (
                    <div className="p-6 text-center text-xs text-white/50 font-light">
                      Nenhuma obra clássica encontrada para "{query}".
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.06]">
                      {results.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handlePlayFromSearch(item.id)}
                          className="w-full p-3 flex items-center gap-3.5 hover:bg-white/[0.05] text-left transition-colors cursor-pointer group"
                        >
                          <div className="w-10 aspect-[2/3] rounded-lg overflow-hidden bg-[#161820] border border-white/10 shrink-0">
                            {item.poster_path && (
                              <img
                                src={item.poster_path}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-serif text-base text-white group-hover:text-[#ff7a52] truncate transition-colors">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-white/45 font-light">
                              {item.year && <span>{item.year}</span>}
                              {item.runtime_min && (
                                <span className="inline-flex items-center gap-1">
                                  • <Clock className="w-3 h-3" /> {item.runtime_min}m
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-white group-hover:text-black flex items-center justify-center text-white transition-colors shrink-0">
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Atalho Minha Lista (Mobile/Tablet) */}
            <Link
              to="/minha-lista"
              title="Minha lista"
              className="lg:hidden p-2 rounded-full bg-white/[0.05] border border-white/10 text-white/75 hover:text-white"
            >
              <Bookmark className="w-4 h-4" />
            </Link>

            {/* Usuário + Botão Sair */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <span className="hidden md:inline text-xs text-white/75 font-light max-w-[110px] truncate">
                {user?.name || 'Cinéfilo'}
              </span>
              <button
                type="button"
                onClick={() => {
                  signOut();
                  navigate('/');
                }}
                title="Sair da conta"
                className="p-2 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 text-white/65 hover:text-white transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <LumierePlayerModal
        manifest={activeManifest}
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
      />
    </>
  );
}
