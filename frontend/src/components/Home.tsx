import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Check, Clock, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPlayCatalog, getPlayStream } from '../services/api';
import { PlayWorkItem, PlayStreamManifest } from '../types';
import { addFavorite, removeFavorite, isFavorite, getWatchProgress, WatchProgressItem } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import LumierePlayerModal from './player/LumierePlayerModal';

const HERO_MASTERPIECES: PlayWorkItem[] = [
  {
    id: 13,
    title: 'Nosferatu',
    original_title: 'Nosferatu, eine Symphonie des Grauens',
    year: 1922,
    runtime_min: 94,
    kind: 'feature',
    poster_path: 'https://image.tmdb.org/t/p/w500/zEzQTngP7F4qVmLDCWg5Hby6cgX.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/cA9iGtvjRGJHzDBfrq48l0eyCvA.jpg',
    overview_pt:
      'O corretor de imóveis Hutter viaja até os Montes Cárpatos para fechar negócio com o excêntrico Conde Orlok, sem saber que seu anfitrião é uma criatura milenar das sombras. Marco absoluto do Expressionismo Alemão dirigido por F. W. Murnau.',
    tagline: 'Uma sinfonia do horror.',
    genres: ['Terror', 'Fantasia'],
    directors: ['F. W. Murnau'],
  },
  {
    id: 5,
    title: 'A General',
    original_title: 'The General',
    year: 1926,
    runtime_min: 78,
    kind: 'feature',
    poster_path: 'https://image.tmdb.org/t/p/w500/lEMTwy0CM9rgpem1YPobdSLtHME.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/mzox4HbcV9W42MH2dB1QsdDVGo3.jpg',
    overview_pt:
      'Quando espiões da União roubam sua amada locomotiva com sua noiva a bordo, o maquinista Johnny Gray atravessa as linhas inimigas sozinho para resgatá-las. A obra-prima máxima de Buster Keaton.',
    tagline: 'A maior aventura ferroviária do cinema clássico.',
    genres: ['Aventura', 'Comédia', 'Ação'],
    directors: ['Buster Keaton'],
  },
  {
    id: 528,
    title: 'As Neves do Kilimanjaro',
    original_title: 'The Snows of Kilimanjaro',
    year: 1952,
    runtime_min: 117,
    kind: 'feature',
    poster_path: 'https://image.tmdb.org/t/p/w500/qyacg8is64T8b7ujrSyhDF19LSg.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/zQERahUUbVZTosd41NNUPNHqSKJ.jpg',
    overview_pt:
      'O escritor Harry Street (Gregory Peck), ferido durante um safári na África aos pés do Monte Kilimanjaro, revisita suas memórias de Paris, Espanha e sua grande paixão vivida ao lado de Cynthia Green (Ava Gardner).',
    tagline: 'Baseado no clássico de Ernest Hemingway.',
    genres: ['Aventura', 'Romance', 'Drama'],
    directors: ['Henry King'],
  },
  {
    id: 2,
    title: 'O Fantasma da Ópera',
    original_title: 'The Phantom of the Opera',
    year: 1925,
    runtime_min: 93,
    kind: 'feature',
    poster_path: 'https://image.tmdb.org/t/p/w500/g6gFsONr9GdGiIhbdpqM65Patbi.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/6FSs7jMimg1PBYdhZtPNQhtKtEc.jpg',
    overview_pt:
      'Nas catacumbas subterrâneas da Ópera de Paris, uma figura mascarada guia a jovem cantora Christine Daaé ao estrelato enquanto assombra os bastidores do teatro.',
    tagline: 'O clássico imortal com Lon Chaney.',
    genres: ['Terror', 'Drama', 'Mistério'],
    directors: ['Rupert Julian'],
  },
  {
    id: 14,
    title: 'O Encouraçado Potemkin',
    original_title: 'Bronenosets Potyomkin',
    year: 1925,
    runtime_min: 75,
    kind: 'feature',
    poster_path: 'https://image.tmdb.org/t/p/w500/a1AvYpBbEixfNK6KgG5bpowsm7X.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/3RH61Z7BP3f215936PJBEG2qQrT.jpg',
    overview_pt:
      'Em 1905, os marinheiros do encouraçado Potemkin se rebelam contra as condições desumanas a bordo, desencadeando um levante histórico no porto de Odessa. Revolução da montagem por Sergei Eisenstein.',
    tagline: 'A obra que reinventou a linguagem do cinema.',
    genres: ['Drama', 'História'],
    directors: ['Sergei Eisenstein'],
  },
];

const DECADE_BLOCKS = [
  {
    decade: '1910',
    label: 'Pioneiros',
    years: '1895 — 1919',
    watermark: '1910',
    style: 'bg-gradient-to-br from-[#eceae6] to-[#b5b0a6] text-[#121212]',
    subColor: 'text-black/60',
  },
  {
    decade: '1920',
    label: 'Era Silenciosa',
    years: 'Anos 1920',
    watermark: '1920',
    style: 'bg-gradient-to-br from-[#e84c22] via-[#b8280d] to-[#591104] text-white',
    subColor: 'text-white/70',
  },
  {
    decade: '1930',
    label: 'Era de Ouro',
    years: 'Anos 1930',
    watermark: '1930',
    style: 'bg-gradient-to-br from-[#d97724] via-[#8f3f0b] to-[#3b1703] text-white',
    subColor: 'text-white/70',
  },
  {
    decade: '1940',
    label: 'Film Noir',
    years: 'Anos 1940',
    watermark: '1940',
    style: 'bg-gradient-to-br from-[#9e2222] via-[#520e0e] to-[#1c0505] text-white',
    subColor: 'text-white/70',
  },
  {
    decade: '1950',
    label: 'Modernismo',
    years: 'Anos 1950',
    watermark: '1950',
    style: 'bg-gradient-to-br from-[#2a2d37] via-[#171920] to-[#0b0c10] text-white border border-white/15',
    subColor: 'text-white/65',
  },
];

const SUBGENRE_CARDS = [
  {
    label: 'Terror & Mistério',
    genreQuery: 'Terror',
    image: 'https://image.tmdb.org/t/p/original/sLq72hBx8Xs2IISVsZJqgjOd31b.jpg',
  },
  {
    label: 'Comédia Clássica',
    genreQuery: 'Comédia',
    image: 'https://image.tmdb.org/t/p/original/mzox4HbcV9W42MH2dB1QsdDVGo3.jpg',
  },
  {
    label: 'Drama & História',
    genreQuery: 'Drama',
    image: 'https://image.tmdb.org/t/p/original/3RH61Z7BP3f215936PJBEG2qQrT.jpg',
  },
  {
    label: 'Crime & Film Noir',
    genreQuery: 'Crime',
    image: 'https://image.tmdb.org/t/p/original/mxW3h5E71IOnctX65wRWBTqwm5i.jpg',
  },
  {
    label: 'Aventura & Ação',
    genreQuery: 'Aventura',
    image: 'https://image.tmdb.org/t/p/original/mdNae6nOlJ7iKxFgsWSAgxU9shS.jpg',
  },
  {
    label: 'Romance & Música',
    genreQuery: 'Romance',
    image: 'https://image.tmdb.org/t/p/original/iBVKjk68mfOZNW0TtymZj00g7Qv.jpg',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, user, openAuthModal } = useAuth();

  const [heroIndex, setHeroIndex] = useState(0);
  const [features, setFeatures] = useState<PlayWorkItem[]>(HERO_MASTERPIECES);
  const [silentAndGolden, setSilentAndGolden] = useState<PlayWorkItem[]>([]);
  const [noirAndThriller, setNoirAndThriller] = useState<PlayWorkItem[]>([]);
  const [comedyAndMusical, setComedyAndMusical] = useState<PlayWorkItem[]>([]);
  const [pioneerShorts, setPioneerShorts] = useState<PlayWorkItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<WatchProgressItem[]>([]);

  const [activeManifest, setActiveManifest] = useState<PlayStreamManifest | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [favTrigger, setFavTrigger] = useState(0);

  // Carrega histórico de reprodução em andamento apenas se logado
  useEffect(() => {
    if (isAuthenticated && !user?.isGuest) {
      setContinueWatching(getWatchProgress());
    } else {
      setContinueWatching([]);
    }
  }, [isAuthenticated, user, isPlayerOpen]);

  // Rotação suave do Hero
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_MASTERPIECES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [heroIndex]);

  // Carrega as linhas de filmes clássicos reais do banco de dados
  useEffect(() => {
    let mounted = true;

    const loadAllRows = async () => {
      try {
        const [featRes, classicRes, noirRes, comedyRes, shortRes] = await Promise.all([
          getPlayCatalog({ page: 1, pageSize: 20, kind: 'feature', sort: 'year_desc' }),
          getPlayCatalog({ page: 1, pageSize: 16, kind: 'feature', sort: 'year_asc' }),
          getPlayCatalog({ page: 1, pageSize: 12, genre: 'Crime' }),
          getPlayCatalog({ page: 1, pageSize: 12, genre: 'Comédia' }),
          getPlayCatalog({ page: 1, pageSize: 12, kind: 'short', sort: 'year_asc' }),
        ]);

        if (!mounted) return;

        const withPoster = (items: PlayWorkItem[]) =>
          (items || []).filter((i) => i.poster_path && i.poster_path.trim() !== '');

        if (featRes?.items?.length) {
          setFeatures(withPoster(featRes.items));
        }
        if (classicRes?.items?.length) {
          setSilentAndGolden(withPoster(classicRes.items));
        }
        if (noirRes?.items?.length) {
          setNoirAndThriller(withPoster(noirRes.items));
        }
        if (comedyRes?.items?.length) {
          setComedyAndMusical(withPoster(comedyRes.items));
        }
        if (shortRes?.items?.length) {
          setPioneerShorts(withPoster(shortRes.items));
        }
      } catch (e) {
        console.warn('Erro ao carregar fileiras do catálogo clássico:', e);
      }
    };

    loadAllRows();
    return () => {
      mounted = false;
    };
  }, []);

  const handlePlayMovie = async (workId: number) => {
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

  const toggleWorkFavorite = (work: PlayWorkItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Se o visitante não for membro cadastrado, bloqueia e abre o modal de cadastro/login
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

  const currentHero = HERO_MASTERPIECES[heroIndex] || HERO_MASTERPIECES[0];
  const heroSaved = isFavorite(currentHero.id);

  // Obra em destaque no banner central (estilo Kingdom of the Planet of the Apes da referência)
  const midSpotlight: PlayWorkItem = {
    id: 3,
    title: 'O Gabinete do Dr. Caligari',
    original_title: 'Das Cabinet des Dr. Caligari',
    year: 1920,
    runtime_min: 77,
    kind: 'feature',
    poster_path: 'https://image.tmdb.org/t/p/w500/j09TT0S1crBSYjPu14vgzSSFqFo.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/sLq72hBx8Xs2IISVsZJqgjOd31b.jpg',
    overview_pt:
      'Em um vilarejo alemão de cenários distorcidos e sombrios, o misterioso Dr. Caligari exibe o sonâmbulo Cesare, que prevê o futuro à noite enquanto crimes assombram a cidade.',
    genres: ['Terror', 'Mistério', 'Expressionismo'],
    directors: ['Robert Wiene'],
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-16 select-none" data-fav={favTrigger}>
      {/* 1. HERO BILLBOARD FULL-WIDTH (Inspirado no topo da referência + Estética da Landing Page) */}
      <section className="relative h-[86vh] min-h-[580px] max-h-[820px] w-full overflow-hidden flex items-end pb-14 md:pb-20">
        {/* Imagens de Backdrop com Crossfade Suave e Ken Burns leve */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {HERO_MASTERPIECES.map((item, idx) => {
            const isActive = idx === heroIndex;
            return (
              <div
                key={item.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={item.backdrop_path || item.poster_path || ''}
                  alt={item.title}
                  className={`w-full h-full object-cover object-center opacity-55 transition-transform duration-1000 ease-out ${
                    isActive ? 'scale-105' : 'scale-100'
                  }`}
                />
              </div>
            );
          })}

          {/* Brilho laranja/âmbar sutil no topo-centro como na Landing Page */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 55% at 60% 18%, rgba(232, 76, 34, 0.28) 0%, transparent 65%)',
            }}
          />

          {/* Degradês laterais e inferiores para leitura perfeita */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/25 to-transparent" />
        </div>

        {/* Seta Lateral Esquerda (Sem círculo em volta) */}
        <button
          type="button"
          onClick={() =>
            setHeroIndex((prev) => (prev - 1 + HERO_MASTERPIECES.length) % HERO_MASTERPIECES.length)
          }
          aria-label="Título anterior"
          className="absolute left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 p-2 text-white/40 hover:text-white transition-all duration-300 hover:scale-125 cursor-pointer focus:outline-none"
        >
          <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]" />
        </button>

        {/* Seta Lateral Direita (Sem círculo em volta) */}
        <button
          type="button"
          onClick={() => setHeroIndex((prev) => (prev + 1) % HERO_MASTERPIECES.length)}
          aria-label="Próximo título"
          className="absolute right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 p-2 text-white/40 hover:text-white transition-all duration-300 hover:scale-125 cursor-pointer focus:outline-none"
        >
          <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]" />
        </button>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
          {/* Conteúdo de Texto com Animação Leve de Transição */}
          <div key={currentHero.id} className="max-w-xl space-y-4 animate-hero-slide">
            {/* Metadados Superiores */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-white/75 font-light">
              <span className="px-2.5 py-0.5 rounded-full bg-[#e84c22]/25 border border-[#e84c22]/45 text-[#ff825c] font-normal">
                {currentHero.year}
              </span>
              {currentHero.runtime_min && (
                <span className="inline-flex items-center gap-1 text-white/65">
                  <Clock className="w-3.5 h-3.5" />
                  {currentHero.runtime_min} min
                </span>
              )}
              {currentHero.genres.map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-white/75"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Título em Instrument Serif (Sem Caps Lock) */}
            <div>
              <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl text-white font-normal leading-[1.02] tracking-tight">
                {currentHero.title}
              </h1>
              {currentHero.original_title && currentHero.original_title !== currentHero.title && (
                <p className="text-xs text-white/50 font-light italic mt-1">
                  {currentHero.original_title}
                  {currentHero.directors?.length ? ` • Direção de ${currentHero.directors[0]}` : ''}
                </p>
              )}
            </div>

            {/* Sinopse */}
            <p className="text-xs sm:text-[13px] text-white/70 font-light leading-relaxed line-clamp-3">
              {currentHero.overview_pt}
            </p>

            {/* Botões de Ação (Estilo Referência + Pílula Branca da Landing Page) */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => handlePlayMovie(currentHero.id)}
                className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-white hover:bg-white/90 text-black text-[13px] font-medium transition-all shadow-[0_4px_25px_rgba(255,255,255,0.2)] cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Assistir agora</span>
              </button>

              <button
                type="button"
                onClick={(e) => toggleWorkFavorite(currentHero, e)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/15 text-[13px] font-light backdrop-blur-md transition-all cursor-pointer"
              >
                {heroSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#ff7a52]" />
                    <span>Na minha lista</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Minha lista</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Dots de Paginação na Base Central (Idêntico à Referência) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {HERO_MASTERPIECES.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setHeroIndex(i)}
              aria-label={`Destaque ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === heroIndex ? 'w-6 bg-[#ff6738]' : 'w-1.5 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL EM FILEIRAS (Estrutura fiel à imagem de referência) */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-14 mt-4">
        {/* FILEIRA 1: "Continuar assistindo" — Apenas para membros cadastrados que tenham progresso salvo */}
        {isAuthenticated && !user?.isGuest && continueWatching.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal">
                Continuar <span className="italic">assistindo</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {continueWatching.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handlePlayMovie(item.id)}
                  className="group relative aspect-[16/10] rounded-xl overflow-hidden bg-[#101116] border border-white/10 hover:border-white/30 cursor-pointer transition-all duration-300"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-white/15 group-hover:bg-white group-hover:text-black border border-white/25 backdrop-blur-md flex items-center justify-center text-white shrink-0 transition-colors">
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-serif text-base text-white truncate leading-tight">
                          {item.title}
                        </h3>
                        <span className="text-[10px] text-white/55 font-light block">
                          Parou em {Math.floor(item.currentTime / 60)} min
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Barra de progresso real na base do card */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
                    <div
                      className="h-full bg-[#ff6738]"
                      style={{ width: `${Math.min(Math.max(item.progressPercent, 0), 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FILEIRA 2: "Clássicos dos anos 50" (Cards Horizontais 16:9 estilo "Top Movies" da referência) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal">
              Clássicos dos <span className="italic">anos 50</span>
            </h2>
            <button
              type="button"
              onClick={() => navigate('/play?decade=1950')}
              className="text-xs text-white/55 hover:text-white font-light inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Explorar década</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {features.slice(0, 5).map((film) => (
              <div
                key={film.id}
                onClick={() => handlePlayMovie(film.id)}
                className="group relative aspect-[16/10] rounded-xl overflow-hidden bg-[#101116] border border-white/10 hover:border-[#e84c22]/50 cursor-pointer transition-all duration-300"
              >
                <img
                  src={film.backdrop_path || film.poster_path || ''}
                  alt={film.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-serif text-lg text-white truncate leading-tight group-hover:text-[#ff7a52] transition-colors">
                    {film.title}
                  </h3>
                  <div className="mt-1 text-[11px] text-white/50 font-light">
                    <span>{film.year}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FILEIRA 3: "Navegar por época" (5 Blocos Gradientes estilo "Watch in Your Language" da referência) */}
        <section>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal mb-4">
            Navegar por <span className="italic">época</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {DECADE_BLOCKS.map((block) => (
              <button
                key={block.decade}
                type="button"
                onClick={() => navigate(`/play?decade=${block.decade}`)}
                className={`relative h-24 rounded-2xl p-5 flex flex-col justify-center items-center overflow-hidden transition-transform duration-300 hover:scale-[1.03] cursor-pointer ${block.style}`}
              >
                {/* Marca d'água tipográfica grande no fundo igual à referência */}
                <span className="absolute -left-2 -bottom-4 font-serif italic text-6xl opacity-15 pointer-events-none select-none">
                  {block.watermark}
                </span>

                <span className="relative z-10 font-serif text-xl sm:text-2xl font-normal leading-none">
                  {block.label}
                </span>
                <span className={`relative z-10 text-[11px] font-light mt-1 ${block.subColor}`}>
                  {block.years}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* FILEIRA 4: "Obras-primas imortais" (Pôsteres Verticais 2:3 estilo "Original Series" da referência) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal">
              Obras-primas <span className="italic">imortais</span>
            </h2>
            <button
              type="button"
              onClick={() => navigate('/play?kind=feature')}
              className="text-xs text-white/55 hover:text-white font-light inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Ver todos os longas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {(silentAndGolden.length >= 5 ? silentAndGolden.slice(0, 5) : HERO_MASTERPIECES).map(
              (film) => (
                <div
                  key={film.id}
                  onClick={() => handlePlayMovie(film.id)}
                  className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#101116] border border-white/10 hover:border-white/30 cursor-pointer transition-all duration-300"
                >
                  <img
                    src={film.poster_path || ''}
                    alt={film.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />

                  {/* Botão Favoritar no Topo Direito */}
                  <button
                    type="button"
                    onClick={(e) => toggleWorkFavorite(film, e)}
                    title="Salvar na Minha Lista"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/55 hover:bg-white hover:text-black border border-white/15 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    {isFavorite(film.id) ? (
                      <Check className="w-3.5 h-3.5 text-[#ff6738]" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="absolute bottom-3.5 left-3.5 right-3.5">
                    <h3 className="font-serif text-lg text-white leading-tight truncate">
                      {film.title}
                    </h3>
                    <div className="mt-1 text-[11px] text-white/50 font-light">
                      <span>{film.year}</span>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {/* FILEIRA 5: "Filtrar por gênero" (6 Cards Visuais estilo "Filter by Subgenre" da referência) */}
        <section>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal mb-4">
            Filtrar por <span className="italic">gênero</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {SUBGENRE_CARDS.map((sub) => (
              <button
                key={sub.label}
                type="button"
                onClick={() => navigate(`/play?genre=${encodeURIComponent(sub.genreQuery)}`)}
                className="group relative aspect-[16/10] rounded-xl overflow-hidden bg-[#121318] border border-white/10 hover:border-[#ff6738]/60 text-left cursor-pointer transition-all"
              >
                <img
                  src={sub.image}
                  alt={sub.label}
                  loading="lazy"
                  className="w-full h-full object-cover opacity-70 group-hover:scale-105 group-hover:opacity-90 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <span className="absolute bottom-2.5 left-3 font-serif text-base sm:text-lg text-white font-normal leading-tight">
                  {sub.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* BANNER CENTRAL EM DESTAQUE (Estilo "Kingdom of the Planet of the Apes" no meio da referência) */}
        <section className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#0d0705] min-h-[340px] sm:min-h-[380px] flex items-center p-7 sm:p-12 shadow-[0_25px_70px_rgba(0,0,0,0.85)]">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src={midSpotlight.backdrop_path || ''}
              alt={midSpotlight.title}
              className="w-full h-full object-cover object-center opacity-55"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 75% 65% at 70% 30%, rgba(232, 76, 34, 0.32) 0%, transparent 70%)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent" />
          </div>

          <div className="relative z-10 max-w-lg space-y-4">
            <span className="inline-block px-3 py-1 rounded-full bg-[#e84c22]/20 border border-[#e84c22]/40 text-[11px] text-[#ff825c] font-normal">
              Marco do Expressionismo Alemão • {midSpotlight.year}
            </span>

            <h2 className="font-serif text-4xl sm:text-5xl text-white font-normal leading-[1.06]">
              {midSpotlight.title}
            </h2>

            <p className="text-xs sm:text-[13px] text-white/70 font-light leading-relaxed">
              {midSpotlight.overview_pt}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handlePlayMovie(midSpotlight.id)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-white/90 text-black text-[13px] font-medium transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Assistir agora</span>
              </button>

              <button
                type="button"
                onClick={(e) => toggleWorkFavorite(midSpotlight, e)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/15 text-[13px] font-light backdrop-blur-md transition-all cursor-pointer"
              >
                {isFavorite(midSpotlight.id) ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#ff7a52]" />
                    <span>Salvo na lista</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Minha lista</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* FILEIRA 6: "Suspense, Crime & Film Noir" (Pôsteres Verticais 2:3 estilo "Original Movies" da referência) */}
        {noirAndThriller.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal">
                Suspense, Crime &amp; <span className="italic">Film Noir</span>
              </h2>
              <button
                type="button"
                onClick={() => navigate('/play?genre=Crime')}
                className="text-xs text-white/55 hover:text-white font-light inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Ver mais</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {noirAndThriller.slice(0, 5).map((film) => (
                <div
                  key={film.id}
                  onClick={() => handlePlayMovie(film.id)}
                  className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#101116] border border-white/10 hover:border-white/30 cursor-pointer transition-all duration-300"
                >
                  <img
                    src={film.poster_path || ''}
                    alt={film.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
                  <div className="absolute bottom-3.5 left-3.5 right-3.5">
                    <h3 className="font-serif text-lg text-white leading-tight truncate">
                      {film.title}
                    </h3>
                    <div className="mt-1 text-[11px] text-white/50 font-light">
                      <span>{film.year}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FILEIRA 7: "Curtas pioneiros (1895–1920)" (Cards Horizontais 16:9) */}
        {pioneerShorts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal">
                Curtas <span className="italic">pioneiros</span> (1895–1920)
              </h2>
              <button
                type="button"
                onClick={() => navigate('/play?kind=short')}
                className="text-xs text-white/55 hover:text-white font-light inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Ver todos os curtas</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {pioneerShorts.slice(0, 5).map((film) => (
                <div
                  key={film.id}
                  onClick={() => handlePlayMovie(film.id)}
                  className="group relative aspect-[16/10] rounded-xl overflow-hidden bg-[#101116] border border-white/10 hover:border-white/30 cursor-pointer transition-all duration-300"
                >
                  <img
                    src={film.backdrop_path || film.poster_path || ''}
                    alt={film.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-serif text-base text-white truncate leading-tight">
                      {film.title}
                    </h3>
                    <div className="mt-1 text-[11px] text-white/50 font-light">
                      <span>{film.year}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FILEIRA 8: "Comédias & Musicais Clássicos" (Pôsteres Verticais 2:3 estilo "Top TV Shows" da referência) */}
        {comedyAndMusical.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal">
                Comédias &amp; <span className="italic">musicais</span> clássicos
              </h2>
              <button
                type="button"
                onClick={() => navigate('/play?genre=Com%C3%A9dia')}
                className="text-xs text-white/55 hover:text-white font-light inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Ver mais</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {comedyAndMusical.slice(0, 5).map((film) => (
                <div
                  key={film.id}
                  onClick={() => handlePlayMovie(film.id)}
                  className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#101116] border border-white/10 hover:border-white/30 cursor-pointer transition-all duration-300"
                >
                  <img
                    src={film.poster_path || ''}
                    alt={film.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
                  <div className="absolute bottom-3.5 left-3.5 right-3.5">
                    <h3 className="font-serif text-lg text-white leading-tight truncate">
                      {film.title}
                    </h3>
                    <div className="mt-1 text-[11px] text-white/50 font-light">
                      <span>{film.year}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Player Modal Nativo */}
      <LumierePlayerModal
        manifest={activeManifest}
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
      />
    </div>
  );
}
