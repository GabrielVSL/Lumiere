import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ArrowUpRight, ArrowLeft, ArrowRight, Clock, Star } from 'lucide-react';
import gsap from 'gsap';
import LandingNavbar from './LandingNavbar';
import LandingHero from './LandingHero';
import { useAuth } from '../../context/AuthContext';
import { getPlayCatalog, getPlayStream } from '../../services/api';
import { PlayWorkItem, PlayStreamManifest } from '../../types';
import LumierePlayerModal from '../player/LumierePlayerModal';

const JOURNEY_CARDS = [
  {
    num: '01',
    title: 'Era Silenciosa &\nPioneiros',
    decade: '1920',
    desc: 'De 1895 aos anos 20 — O nascimento da linguagem cinematográfica, de Georges Méliès ao Expressionismo Alemão.',
    theme: 'light' as const,
  },
  {
    num: '02',
    title: 'Era de Ouro &\nFilm Noir',
    decade: '1940',
    desc: 'Anos 30 e 40 — O esplendor dos grandes estúdios, o mistério das sombras e os clássicos imortais.',
    theme: 'red' as const,
  },
  {
    num: '03',
    title: 'Anos 50 &\nGrandes Autores',
    decade: '1950',
    desc: 'A transição para o cinema moderno — Aventuras em Technicolor, dramas intensos e atuações históricas que marcaram época.',
    theme: 'dark' as const,
  },
];

// Slides interativos para a seção "Explore nossa biblioteca" (100% focada no cinema clássico)
const LIBRARY_SLIDES = [
  {
    category: 'LUMIÈRE PLAY',
    headline:
      'Da primeira sessão em Paris ao streaming nativo, trouxemos nova energia e clareza para as obras que fundaram o cinema.',
    reviewText:
      'A plataforma reúne mais de 640 longas e curtas históricos em domínio público com player próprio em HTML5, carregamento instantâneo via HTTP 206, sem anúncios e com fichas técnicas completas.',
    author: 'Acervo Digital Lumière',
    role: 'Preservação Audiovisual • Art. 44 da Lei nº 9.610/98',
  },
  {
    category: 'RESTAURAÇÃO & MEMÓRIA',
    headline:
      'Dos primeiros experimentos de 1895 às grandes produções de estúdio, preservamos a memória viva da sétima arte.',
    reviewText:
      'Cada obra do catálogo é catalogada com pôster original, sinopse histórica, ano de lançamento e reprodução direta a partir das matrizes preservadas no Internet Archive.',
    author: 'Curadoria Histórica',
    role: 'Cinemateca Digital em Domínio Público',
  },
  {
    category: 'CURADORIA POR ÉPOCAS',
    headline:
      'Cada década conta uma revolução estética: do Expressionismo Alemão ao suspense Noir e aos mestres dos anos 50.',
    reviewText:
      'Navegue por filtros precisos de década, gênero e formato. Descubra obras fundamentais de Buster Keaton, F. W. Murnau, Sergei Eisenstein, Frank Sinatra, Gregory Peck e Fred Astaire.',
    author: 'Cinemateca Aberta',
    role: 'Mais de 600 Clássicos Disponíveis',
  },
];

// Obras reais do nosso banco (lumiere.db) com capas e backdrops oficiais do TMDB
const CURATED_HIGHLIGHTS: PlayWorkItem[] = [
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
      'O corretor de imóveis Hutter viaja até os Montes Cárpatos para fechar negócio com o excêntrico Conde Orlok, sem saber que seu anfitrião é uma criatura milenar das sombras. Marco fundador do terror expressionista dirigido por F. W. Murnau.',
    tagline: 'Uma sinfonia do horror.',
    genres: ['Terror', 'Fantasia'],
    directors: ['F. W. Murnau'],
    license: { region: 'BR', status: 'public_domain', rule: 'lei_9610_art_44_audiovisual', confidence: 'high' },
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
    license: { region: 'BR', status: 'public_domain', rule: 'lei_9610_art_44_audiovisual', confidence: 'high' },
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
    license: { region: 'BR', status: 'public_domain', rule: 'lei_9610_art_44_audiovisual', confidence: 'high' },
  },
  {
    id: 3,
    title: 'O Gabinete do Dr. Caligari',
    original_title: 'Das Cabinet des Dr. Caligari',
    year: 1920,
    runtime_min: 77,
    kind: 'feature',
    poster_path: 'https://image.tmdb.org/t/p/w500/j09TT0S1crBSYjPu14vgzSSFqFo.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/sLq72hBx8Xs2IISVsZJqgjOd31b.jpg',
    overview_pt:
      'Em um vilarejo alemão de cenários distorcidos e sombrios, o hipnotizador Dr. Caligari exibe o sonâmbulo Cesare, que prevê o futuro à noite enquanto crimes misteriosos assombram a cidade.',
    tagline: 'Você deve se tornar Caligari.',
    genres: ['Terror', 'Mistério', 'Crime'],
    directors: ['Robert Wiene'],
    license: { region: 'BR', status: 'public_domain', rule: 'lei_9610_art_44_audiovisual', confidence: 'high' },
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
      'Em 1905, os marinheiros do encouraçado Potemkin se rebelam contra as condições desumanas a bordo, desencadeando um levante histórico no porto de Odessa. Revolução da montagem cinematográfica por Sergei Eisenstein.',
    tagline: 'A obra que reinventou a montagem no cinema.',
    genres: ['Drama', 'História'],
    directors: ['Sergei Eisenstein'],
    license: { region: 'BR', status: 'public_domain', rule: 'lei_9610_art_44_audiovisual', confidence: 'high' },
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
    tagline: 'Baseado na obra clássica de Ernest Hemingway.',
    genres: ['Aventura', 'Romance', 'Drama'],
    directors: ['Henry King'],
    license: { region: 'BR', status: 'public_domain', rule: 'lei_9610_art_44_audiovisual', confidence: 'high' },
  },
  {
    id: 17,
    title: 'Repentinamente',
    original_title: 'Suddenly',
    year: 1954,
    runtime_min: 77,
    kind: 'feature',
    poster_path: 'https://image.tmdb.org/t/p/w500/sVLx30Uftwcvf7KFQpikDtyhvI7.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/mxW3h5E71IOnctX65wRWBTqwm5i.jpg',
    overview_pt:
      'A tranquilidade da pequena cidade de Suddenly é quebrada quando três homens armados liderados por John Baron (Frank Sinatra) tomam uma casa no alto da colina antes da passagem do trem presidencial.',
    tagline: 'Suspense noir de alta tensão estrelado por Frank Sinatra.',
    genres: ['Crime', 'Thriller', 'Noir'],
    directors: ['Lewis Allen'],
    license: { region: 'BR', status: 'public_domain', rule: 'lei_9610_art_44_audiovisual', confidence: 'high' },
  },
  {
    id: 9,
    title: 'Núpcias Reais',
    original_title: 'Royal Wedding',
    year: 1951,
    runtime_min: 93,
    kind: 'feature',
    poster_path: 'https://image.tmdb.org/t/p/w500/gIFEbOjUaurHIZ55KkRNcRXInyJ.jpg',
    backdrop_path: 'https://image.tmdb.org/t/p/original/iBVKjk68mfOZNW0TtymZj00g7Qv.jpg',
    overview_pt:
      'Os irmãos dançarinos Tom e Ellen Bowen (Fred Astaire e Jane Powell) viajam da Broadway para Londres durante a semana do casamento real, vivendo romances e números musicais antológicos.',
    tagline: 'O musical clássico em que Fred Astaire dança pelas paredes e pelo teto.',
    genres: ['Comédia', 'Música', 'Romance'],
    directors: ['Stanley Donen'],
    license: { region: 'BR', status: 'public_domain', rule: 'lei_9610_art_44_audiovisual', confidence: 'high' },
  },
];

const METRICS = [
  {
    value: '648+',
    label: 'Obras preservadas no acervo',
    desc: 'Filmes clássicos completos verificados com streaming direto em alta disponibilidade, prontos para assistir.',
  },
  {
    value: '130',
    label: 'Anos de história da sétima arte',
    desc: 'Dos primeiros experimentos fotográficos de 1895 em Paris até os grandes movimentos cinematográficos do século XX.',
  },
  {
    value: '100%',
    label: 'Acesso cultural livre e legal',
    desc: 'Todas as obras gratuitas respeitam integralmente o domínio público previsto no Art. 44 da Lei nº 9.610/1998.',
  },
];

export default function LandingPage() {
  const { isAuthenticated, openAuthModal, signInAsGuest } = useAuth();
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);

  const [highlights, setHighlights] = useState<PlayWorkItem[]>(CURATED_HIGHLIGHTS);
  const [selectedFilmIndex, setSelectedFilmIndex] = useState(0);
  const [librarySlideIndex, setLibrarySlideIndex] = useState(0);
  const [activeManifest, setActiveManifest] = useState<PlayStreamManifest | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  // Carrega obras reais adicionais do backend caso disponíveis
  useEffect(() => {
    let mounted = true;
    getPlayCatalog({ page: 1, pageSize: 24, kind: 'feature', sort: 'year_asc' })
      .then((res) => {
        if (!mounted || !res?.items?.length) return;
        const withRichArt = res.items.filter(
          (item: PlayWorkItem) =>
            item.poster_path &&
            item.backdrop_path &&
            item.poster_path !== item.backdrop_path &&
            item.runtime_min &&
            item.runtime_min >= 60
        );
        if (withRichArt.length >= 6) {
          const merged = [...CURATED_HIGHLIGHTS];
          for (const item of withRichArt) {
            if (!merged.some((m) => m.id === item.id) && merged.length < 10) {
              merged.push(item);
            }
          }
          setHighlights(merged);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const elements = pageRef.current?.querySelectorAll('.gsap-reveal');

    if (elements) {
      elements.forEach((el) => {
        gsap.set(el, { opacity: 0, y: 28 });
        const obs = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                gsap.to(entry.target, {
                  opacity: 1,
                  y: 0,
                  duration: 0.95,
                  ease: 'power3.out',
                });
                obs.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.12 }
        );
        obs.observe(el);
        observers.push(obs);
      });
    }

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const handleAccessLibrary = () => {
    if (isAuthenticated) {
      navigate('/app');
    } else {
      openAuthModal('login');
    }
  };

  const handleSelectEra = (decade: string) => {
    if (isAuthenticated) {
      navigate(`/play?decade=${decade}`);
    } else {
      openAuthModal('login');
    }
  };

  const handleWatchFilm = async (movieId: number) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    try {
      const manifest = await getPlayStream(movieId);
      if (manifest) {
        setActiveManifest(manifest);
        setIsPlayerOpen(true);
      }
    } catch {
      navigate('/play');
    }
  };

  const prevSlide = () => {
    setLibrarySlideIndex((prev) => (prev - 1 + LIBRARY_SLIDES.length) % LIBRARY_SLIDES.length);
  };

  const nextSlide = () => {
    setLibrarySlideIndex((prev) => (prev + 1) % LIBRARY_SLIDES.length);
  };

  const activeFilm = highlights[selectedFilmIndex] || highlights[0];
  const currentSlide = LIBRARY_SLIDES[librarySlideIndex];

  return (
    <div
      ref={pageRef}
      className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-[#e04f26]/30 selection:text-white"
    >
      {/* 1. Navbar Minimalista Sem Caps Lock */}
      <LandingNavbar />

      <main>
        {/* 2. Hero Moldurada com Filtro Laranja Quente & Tipografia Editorial */}
        <LandingHero />

        {/* 3. Declaração Editorial (Manifesto) + Selos Históricos */}
        <section id="historia" className="pt-28 pb-16 px-6 md:px-14 max-w-5xl mx-auto text-center">
          <p className="gsap-reveal font-serif text-3xl sm:text-4xl md:text-[46px] text-white/90 font-normal leading-[1.18] tracking-[-0.01em] max-w-3xl mx-auto">
            Preservamos a identidade, as narrativas e as obras que moldaram o olhar da{' '}
            <span className="italic text-white">sétima arte</span>. Para que você possa viver o cinema em sua forma pura, enquanto mantemos acesa a memória de quem o criou.
          </p>

          {/* Faixa de Selos Minimalistas */}
          <div className="gsap-reveal mt-16 pt-8 border-t border-white/[0.07] flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-xs text-white/45 font-light">
            <span className="flex items-center gap-2 text-white/70">
              <span className="text-white/30 text-base font-serif">(</span>
              <span>Paris, 1895 — Irmãos Lumière</span>
              <span className="text-white/30 text-base font-serif">)</span>
            </span>
            <span>Domínio Público Verificado</span>
            <span>Lei nº 9.610 / Art. 44</span>
            <span>648+ Filmes Restaurados</span>
            <span>TMDB &amp; Internet Archive</span>
          </div>
        </section>

        {/* 4. "Em que época começa a sua jornada?" — 3 Cartas Inclinadas em Leque */}
        <section id="epocas" className="py-20 px-6 md:px-14 max-w-6xl mx-auto">
          <div className="gsap-reveal text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-5xl text-white font-normal tracking-tight">
              Em que época começa a sua <span className="italic">jornada</span>?
            </h2>
          </div>

          <div className="gsap-reveal flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0 pt-4 pb-10">
            {JOURNEY_CARDS.map((card, idx) => {
              const isLight = card.theme === 'light';
              const isRed = card.theme === 'red';

              const rotationClass =
                idx === 0
                  ? 'md:-rotate-6 md:translate-x-4 md:translate-y-4 hover:rotate-0 hover:-translate-y-2'
                  : idx === 1
                  ? 'md:z-20 md:-translate-y-3 hover:-translate-y-6'
                  : 'md:rotate-6 md:-translate-x-4 md:translate-y-4 hover:rotate-0 hover:-translate-y-2';

              const themeClass = isLight
                ? 'bg-gradient-to-b from-[#eceae6] to-[#bab5ae] text-[#111111] shadow-[0_25px_60px_rgba(0,0,0,0.6)]'
                : isRed
                ? 'bg-gradient-to-b from-[#e84c22] via-[#b8280d] to-[#4a0e04] text-white shadow-[0_30px_70px_rgba(232,76,34,0.28)] border border-white/15'
                : 'bg-gradient-to-b from-[#1a1b1f] to-[#0d0e11] text-white border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.75)]';

              return (
                <div
                  key={card.num}
                  onClick={() => handleSelectEra(card.decade)}
                  className={`w-full max-w-[300px] aspect-[3/4] rounded-2xl p-7 flex flex-col justify-between transition-all duration-500 cursor-pointer ${rotationClass} ${themeClass}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-light ${
                        isLight ? 'text-black/50' : 'text-white/50'
                      }`}
                    >
                      {card.num}
                    </span>
                    <ArrowUpRight
                      className={`w-4 h-4 ${
                        isLight ? 'text-black/40' : 'text-white/40'
                      }`}
                    />
                  </div>

                  <div className="my-auto">
                    <h3 className="font-serif text-3xl leading-[1.08] whitespace-pre-line font-normal">
                      {card.title}
                    </h3>
                  </div>

                  <p
                    className={`text-xs leading-relaxed font-light ${
                      isLight ? 'text-black/70' : 'text-white/70'
                    }`}
                  >
                    {card.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. "Obras em destaque" (Sem frase acima do título) */}
        <section id="acervo" className="py-24 px-6 md:px-14 max-w-6xl mx-auto">
          <div className="gsap-reveal flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="font-serif text-4xl sm:text-5xl text-white font-normal">
                Obras em <span className="italic">destaque</span>
              </h2>
            </div>
            <button
              onClick={handleAccessLibrary}
              className="self-start sm:self-auto inline-flex items-center gap-2 text-xs text-white/70 hover:text-white border border-white/15 hover:border-white/35 rounded-full px-4 py-2 transition-all cursor-pointer"
            >
              <span>Ver todas as 648 obras</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Palco Principal da Obra Selecionada */}
          {activeFilm && (
            <div className="gsap-reveal relative rounded-3xl overflow-hidden border border-white/10 bg-[#0b0c10] mb-8 shadow-[0_25px_70px_rgba(0,0,0,0.85)]">
              <div className="absolute inset-0 z-0 pointer-events-none">
                <img
                  key={activeFilm.backdrop_path || activeFilm.id}
                  src={activeFilm.backdrop_path || activeFilm.poster_path || ''}
                  alt={activeFilm.title}
                  className="w-full h-full object-cover object-center opacity-35 scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#07080b] via-[#07080b]/85 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-transparent to-[#07080b]/40" />
              </div>

              <div className="relative z-10 p-6 sm:p-10 md:p-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Capa Oficial (Pôster 2:3) */}
                <div className="md:col-span-4 lg:col-span-3 flex justify-center md:justify-start">
                  <div className="w-44 sm:w-52 aspect-[2/3] rounded-2xl overflow-hidden border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.9)] bg-[#14161d] shrink-0">
                    <img
                      src={activeFilm.poster_path || ''}
                      alt={activeFilm.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Metadados Reais da Obra */}
                <div className="md:col-span-8 lg:col-span-9 space-y-4 text-left">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-white/70 font-light">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#e04f26]/20 border border-[#e04f26]/40 text-[#ff825c] font-normal">
                      {activeFilm.year}
                    </span>
                    {activeFilm.runtime_min && (
                      <span className="inline-flex items-center gap-1 text-white/60">
                        <Clock className="w-3.5 h-3.5" />
                        {activeFilm.runtime_min} min
                      </span>
                    )}
                    {Array.isArray(activeFilm.genres) &&
                      activeFilm.genres.slice(0, 3).map((g: string) => (
                        <span
                          key={g}
                          className="px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-white/70"
                        >
                          {g}
                        </span>
                      ))}
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px]">
                      Domínio Público
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif text-3xl sm:text-5xl text-white font-normal leading-tight">
                      {activeFilm.title}
                    </h3>
                    {activeFilm.original_title && activeFilm.original_title !== activeFilm.title && (
                      <p className="text-xs text-white/45 font-light italic mt-0.5">
                        Título original: {activeFilm.original_title}
                        {activeFilm.directors?.length ? ` • Direção de ${activeFilm.directors[0]}` : ''}
                      </p>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-white/70 font-light leading-relaxed max-w-2xl">
                    {activeFilm.overview_pt}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleWatchFilm(activeFilm.id)}
                      className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-white hover:bg-white/90 text-black text-[13px] font-medium transition-all cursor-pointer shadow-[0_4px_25px_rgba(255,255,255,0.2)]"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isAuthenticated ? 'Assistir filme agora' : 'Entrar para assistir'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Estante de Capas Reais */}
          <div className="gsap-reveal grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {highlights.slice(0, 8).map((film, idx) => {
              const isSelected = idx === selectedFilmIndex;
              return (
                <button
                  key={film.id}
                  type="button"
                  onClick={() => setSelectedFilmIndex(idx)}
                  className={`group text-left transition-all duration-300 cursor-pointer ${
                    isSelected ? 'scale-[1.03]' : 'opacity-65 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`relative aspect-[2/3] rounded-xl overflow-hidden bg-[#121318] transition-all ${
                      isSelected
                        ? 'ring-2 ring-[#ff6738] shadow-[0_10px_30px_rgba(224,79,38,0.3)]'
                        : 'border border-white/10'
                    }`}
                  >
                    <img
                      src={film.poster_path || ''}
                      alt={film.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                      <span className="text-[10px] text-white/90 font-medium leading-tight line-clamp-2">
                        {film.title}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-white/85 font-normal truncate">{film.title}</p>
                  <span className="text-[11px] text-white/45 font-light block">{film.year}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 6. "Explore nossa biblioteca" — Retângulo perfeitamente alinhado (Esquerda e Direita com 480px fixos no Desktop) */}
        <section id="diferenciais" className="py-24 px-6 md:px-14 max-w-6xl mx-auto">
          <div className="gsap-reveal text-center mb-16">
            <h2 className="font-serif text-4xl sm:text-5xl text-white font-normal">
              Explore nossa <span className="italic">biblioteca</span>
            </h2>
          </div>

          <div className="gsap-reveal grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 lg:h-[480px] items-stretch">
            {/* COLUNA ESQUERDA: Mosaico 2x2 com altura 100% travada em 480px */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-3.5 h-[480px]">
              {/* Sub-coluna Esquerda do Mosaico */}
              <div className="flex flex-col gap-3.5 h-full">
                {/* Tile 1 (Topo-Esquerda): Logo oficial do site com linhas de grade */}
                <div
                  onClick={handleAccessLibrary}
                  className="relative rounded-2xl bg-[#f3efe8] text-[#141413] p-6 h-[175px] shrink-0 flex flex-col items-center justify-center overflow-hidden cursor-pointer group"
                >
                  <div className="absolute inset-x-0 top-1/3 h-px bg-black/[0.08]" />
                  <div className="absolute inset-x-0 bottom-1/3 h-px bg-black/[0.08]" />
                  <div className="absolute inset-y-0 left-1/4 w-px bg-black/[0.08]" />
                  <div className="absolute inset-y-0 right-1/4 w-px bg-black/[0.08]" />

                  <img
                    src="/lumiere_logo.png"
                    alt="Lumière"
                    className="relative z-10 h-10 sm:h-11 w-auto object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Tile 3 (Base-Esquerda): Preenche exatamente o restante dos 480px */}
                <div
                  onClick={handleAccessLibrary}
                  className="relative rounded-2xl overflow-hidden flex-1 min-h-0 p-4 flex flex-col justify-between cursor-pointer group bg-[#1a1816]"
                >
                  <img
                    src={highlights[0]?.backdrop_path || '/hero.jpg'}
                    alt="Lumière Play Preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/15 to-black/70" />

                  <div className="relative z-10">
                    <span className="text-xs font-bold text-white block leading-none">
                      Lumière
                    </span>
                    <span className="text-[10px] font-semibold tracking-wider text-white/80 uppercase">
                      PLAY
                    </span>
                  </div>

                  {/* Mockup de Tela estilo Player no centro */}
                  <div className="relative z-10 my-auto mx-auto w-full max-w-[220px] aspect-[16/11] rounded-xl bg-[#0b0c10] border-[3px] border-[#1f2128] shadow-2xl overflow-hidden flex flex-col">
                    <div className="px-2.5 py-1.5 border-b border-white/10 flex items-center justify-between bg-[#07080b]">
                      <span className="text-[8px] font-semibold text-[#ff6738]">LUMIÈRE PLAY</span>
                      <span className="text-[7px] text-white/50">648 filmes</span>
                    </div>
                    <div className="p-2 grid grid-cols-3 gap-1.5 flex-1 items-center bg-[#0d0f14]">
                      {highlights.slice(0, 3).map((h) => (
                        <div key={h.id} className="aspect-[2/3] rounded overflow-hidden border border-white/10">
                          <img src={h.poster_path || ''} alt={h.title} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-coluna Direita do Mosaico */}
              <div className="flex flex-col gap-3.5 h-full">
                {/* Tile 2 (Topo-Direita): Card Claro com a Película de Filme enviada */}
                <div
                  onClick={handleAccessLibrary}
                  className="relative rounded-2xl bg-[#f8f6f2] text-[#141413] p-5 h-[235px] shrink-0 flex flex-col justify-between overflow-hidden cursor-pointer group"
                >
                  <div className="relative z-10">
                    <span className="text-xs font-bold text-[#141413] block leading-none">
                      Lumière
                    </span>
                    <span className="text-[10px] font-semibold tracking-wider text-black/65 uppercase">
                      HISTÓRIA • 1895
                    </span>
                  </div>

                  {/* Imagem da Película de Cinema enviada pelo usuário */}
                  <div className="my-auto flex items-center justify-center overflow-hidden py-1">
                    <img
                      src="/filmstrip.png"
                      alt="Película Cinematográfica"
                      className="h-32 w-auto object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="h-px w-24 mx-auto bg-black/15 shrink-0" />
                </div>

                {/* Tile 4 (Base-Direita): Preenche exatamente o restante dos 480px */}
                <div
                  onClick={handleAccessLibrary}
                  className="relative rounded-2xl bg-[#16171a] border border-white/10 p-5 flex-1 min-h-0 flex flex-col justify-between overflow-hidden cursor-pointer group"
                >
                  <div className="flex items-start justify-between shrink-0">
                    <div>
                      <span className="text-xs font-bold text-white block leading-none">
                        Lumière
                      </span>
                      <span className="text-[10px] font-semibold tracking-wider text-white/60 uppercase">
                        CLUB &amp; ACERVO
                      </span>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-[#8be0d6] text-[#0c1a18] text-[9px] font-bold uppercase tracking-wide rotate-6 shadow-md">
                      Art. 44 • Livre
                    </span>
                  </div>

                  {/* Leque de Capas Físicas no Centro/Base */}
                  <div className="relative flex items-center justify-center my-auto pt-1">
                    {highlights.slice(1, 4).map((film, i) => (
                      <div
                        key={film.id}
                        className={`w-16 sm:w-[72px] aspect-[2/3] rounded-lg overflow-hidden border border-white/20 shadow-xl transition-transform duration-500 ${
                          i === 0
                            ? '-rotate-12 translate-x-3 opacity-85'
                            : i === 1
                            ? 'z-10 -translate-y-1 scale-105'
                            : 'rotate-12 -translate-x-3 opacity-90'
                        }`}
                      >
                        <img src={film.poster_path || ''} alt={film.title} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA: Altura 100% travada em 480px (alinhada milimetricamente ao topo e à base da coluna esquerda) */}
            <div className="lg:col-span-6 h-[480px] flex flex-col justify-between">
              {/* Topo Fixo (40px): Categoria + Setas */}
              <div className="h-10 shrink-0 flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-[0.16em] text-white/60 uppercase">
                  {currentSlide.category}
                </span>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={prevSlide}
                    aria-label="Anterior"
                    className="w-10 h-10 rounded-full border border-white/15 hover:border-white/40 flex items-center justify-center text-white/75 hover:text-white transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Próximo"
                    className="w-10 h-10 rounded-full border border-white/15 hover:border-white/40 flex items-center justify-center text-white/75 hover:text-white transition-all cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bloco Central Fixo (165px): Frase Editorial que nunca altera a altura da coluna */}
              <div className="h-[165px] shrink-0 flex items-center">
                <h3 className="font-serif text-2xl sm:text-3xl lg:text-[36px] text-white font-normal leading-[1.15] tracking-[-0.01em] line-clamp-4">
                  {currentSlide.headline}
                </h3>
              </div>

              {/* Card Inferior Fixo (240px): Base alinhada exatamente com a base do mosaico esquerdo */}
              <div className="h-[240px] shrink-0 rounded-2xl bg-[#111216] border border-white/[0.08] p-6 sm:p-7 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-2.5 shrink-0">
                  <img
                    src="/lumiere_icon.png"
                    alt="Lumière"
                    className="w-6 h-6 object-contain"
                  />
                  <div className="flex items-center gap-1 text-[#ff6738]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>

                <p className="text-xs sm:text-[13px] text-white/75 font-light leading-relaxed line-clamp-3 my-auto">
                  {currentSlide.reviewText}
                </p>

                <div className="shrink-0">
                  <p className="text-xs font-semibold text-white">{currentSlide.author}</p>
                  <p className="text-[11px] text-white/45 font-light mt-0.5">{currentSlide.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Métricas Horizontais Minimalistas */}
          <div className="mt-24 max-w-3xl mx-auto border-b border-white/10">
            {METRICS.map((m) => (
              <div
                key={m.value}
                className="gsap-reveal border-t border-white/10 py-9 grid grid-cols-1 sm:grid-cols-12 gap-4 items-baseline"
              >
                <div className="sm:col-span-4">
                  <span className="font-serif text-4xl sm:text-5xl text-white font-normal">
                    {m.value}
                  </span>
                </div>
                <div className="sm:col-span-8 space-y-1">
                  <h4 className="text-sm font-medium text-white/90">{m.label}</h4>
                  <p className="text-xs text-white/50 font-light leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Banner Final Moldurado em Vermelho/Âmbar Quente */}
        <section className="p-2.5 sm:p-4 bg-[#050505]">
          <div className="relative rounded-2xl md:rounded-[26px] overflow-hidden min-h-[440px] flex flex-col justify-between p-8 md:p-14 border border-white/[0.08] bg-[#140603]">
            {/* Imagem de fundo com filtro laranja quente igual à Hero */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <img
                src="/hero.jpg"
                alt="Lumière Finale"
                className="w-full h-full object-cover object-center"
              />
              <div
                className="absolute inset-0 mix-blend-multiply"
                style={{
                  background:
                    'radial-gradient(ellipse 90% 80% at 50% 25%, rgba(245, 95, 35, 0.82) 0%, rgba(180, 45, 14, 0.85) 55%, rgba(35, 10, 5, 0.92) 100%)',
                }}
              />
            </div>

            <div className="relative z-10 my-auto py-16 text-center max-w-xl mx-auto space-y-5">
              <p className="text-xs text-white/80 font-light tracking-wide">
                A memória do cinema está aberta.
              </p>
              <h2 className="font-serif text-4xl sm:text-6xl text-white font-normal leading-[1.06]">
                Vamos assistir <span className="italic">juntos</span>?
              </h2>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleAccessLibrary}
                  className="px-6 py-2.5 rounded-full bg-white hover:bg-white/90 text-black text-[13px] font-medium transition-all cursor-pointer"
                >
                  {isAuthenticated ? 'Ir para o catálogo' : 'Entrar na plataforma'}
                </button>
                {!isAuthenticated && (
                  <button
                    onClick={() => {
                      signInAsGuest();
                      navigate('/app');
                    }}
                    className="px-5 py-2.5 rounded-full bg-black/35 hover:bg-black/55 text-white/90 border border-white/20 text-[13px] font-light backdrop-blur-md transition-all cursor-pointer"
                  >
                    Acesso convidado (Demo)
                  </button>
                )}
              </div>
            </div>

            {/* Rodapé integrado dentro da moldura final */}
            <div className="relative z-10 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/65 font-light">
              <span>© Lumière Cinema • Art. 44 da Lei nº 9.610/1998</span>
              <span>A Biblioteca Aberta da Sétima Arte</span>
              <span>Dados cortesia de TMDB &amp; IMDb</span>
            </div>
          </div>
        </section>
      </main>

      {/* Player Modal para Previews */}
      <LumierePlayerModal
        manifest={activeManifest}
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
      />
    </div>
  );
}
