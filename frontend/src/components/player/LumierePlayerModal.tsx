import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  X,
  Subtitles,
  Settings,
  Check,
} from 'lucide-react';
import { PlayStreamManifest, PlaySubtitle } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { saveWatchProgress, clearWatchProgress, getWatchProgress } from '../../utils/storage';

interface LumierePlayerModalProps {
  manifest: PlayStreamManifest | null;
  isOpen: boolean;
  onClose: () => void;
}

interface VttCue {
  start: number;
  end: number;
  text: string;
}

function parseVttTime(ts: string): number {
  const clean = ts.trim().replace(',', '.');
  const parts = clean.split(':');
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  }
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return 0;
}

function parseWebVtt(raw: string): VttCue[] {
  const cues: VttCue[] = [];
  const blocks = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split(/\n\n+/);

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length || lines[0].startsWith('WEBVTT') || lines[0].startsWith('NOTE')) {
      continue;
    }

    const arrowIdx = lines.findIndex((l) => l.includes('-->'));
    if (arrowIdx === -1) continue;

    const timeLine = lines[arrowIdx];
    const [startRaw, endRawWithSettings] = timeLine.split('-->');
    if (!startRaw || !endRawWithSettings) continue;

    const endRaw = endRawWithSettings.trim().split(/\s+/)[0];
    const start = parseVttTime(startRaw);
    const end = parseVttTime(endRaw);
    const textLines = lines
      .slice(arrowIdx + 1)
      .map((l) => l.replace(/<[^>]+>/g, '').trim())
      .filter(Boolean);

    if (textLines.length > 0 && end > start) {
      cues.push({
        start,
        end,
        text: textLines.join('\n'),
      });
    }
  }
  return cues;
}

function formatLangLabel(sub: PlaySubtitle): string {
  const code = (sub.lang || '').toLowerCase();
  const originSuffix = sub.origin === 'curated' ? ' • Curada' : sub.origin === 'asr' ? ' • Auto' : '';
  if (code.startsWith('pt')) return `Português (BR)${originSuffix}`;
  if (code.startsWith('en')) return `Inglês (Original)${originSuffix}`;
  if (code.startsWith('es')) return `Espanhol${originSuffix}`;
  if (code.startsWith('fr')) return `Francês${originSuffix}`;
  return `${code.toUpperCase()}${originSuffix}`;
}

export default function LumierePlayerModal({ manifest, isOpen, onClose }: LumierePlayerModalProps) {
  const { isAuthenticated, user } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSeekTimeRef = useRef<number | null>(null);
  const lastSavedTimeRef = useRef<number>(0);

  const [selectedStreamIndex, setSelectedStreamIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [buffered, setBuffered] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Menus de Qualidade e Legenda
  const [showSubtitleMenu, setShowSubtitleMenu] = useState<boolean>(false);
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<number | null>(null);
  const [cues, setCues] = useState<VttCue[]>([]);

  // Reseta estado ao abrir um novo filme
  useEffect(() => {
    if (!manifest || !isOpen) return;
    setSelectedStreamIndex(0);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setIsLoading(true);
    setShowSubtitleMenu(false);
    setShowQualityMenu(false);
    pendingSeekTimeRef.current = null;
    lastSavedTimeRef.current = 0;

    // Restaura progresso salvo apenas se o usuário for membro logado
    if (isAuthenticated && !user?.isGuest) {
      const saved = getWatchProgress().find((p) => p.id === manifest.work_id);
      if (saved && saved.currentTime > 5 && saved.progressPercent < 95) {
        pendingSeekTimeRef.current = saved.currentTime;
      }
    }

    // Seleciona automaticamente legenda em Português (ou a primeira disponível)
    if (manifest.subtitles && manifest.subtitles.length > 0) {
      const ptSub = manifest.subtitles.find((s) => s.lang.toLowerCase().startsWith('pt'));
      setSelectedSubtitleId((ptSub || manifest.subtitles[0]).id);
    } else {
      setSelectedSubtitleId(null);
      setCues([]);
    }
  }, [manifest?.work_id, isOpen, isAuthenticated, user]);

  // Carrega e faz o parse do arquivo WebVTT da legenda ativa
  useEffect(() => {
    if (!manifest || !selectedSubtitleId) {
      setCues([]);
      return;
    }
    const sub = manifest.subtitles?.find((s) => s.id === selectedSubtitleId);
    if (!sub) {
      setCues([]);
      return;
    }

    let cancelled = false;
    fetch(sub.url)
      .then((r) => (r.ok ? r.text() : ''))
      .then((text) => {
        if (!cancelled && text) {
          setCues(parseWebVtt(text));
        }
      })
      .catch(() => {
        if (!cancelled) setCues([]);
      });

    return () => {
      cancelled = true;
    };
  }, [manifest, selectedSubtitleId]);

  const activeCueText = useMemo(() => {
    if (!selectedSubtitleId || cues.length === 0) return null;
    const match = cues.find((c) => currentTime >= c.start && currentTime <= c.end);
    return match ? match.text : null;
  }, [cues, currentTime, selectedSubtitleId]);

  const streams = manifest?.streams || [];
  const activeStream = streams[selectedStreamIndex] || streams[0];
  const subtitles = manifest?.subtitles || [];

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds <= 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleUserActivity = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      if (isPlaying && !showSubtitleMenu && !showQualityMenu) {
        setShowControls(false);
      }
    }, 3500);
  }, [isPlaying, showSubtitleMenu, showQualityMenu]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    setShowSubtitleMenu(false);
    setShowQualityMenu(false);
    handleUserActivity();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    handleUserActivity();
  };

  const skipTime = (offsetSeconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.min(Math.max(videoRef.current.currentTime + offsetSeconds, 0), duration);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    handleUserActivity();
  };

  const changePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  const handleSelectQuality = (idx: number) => {
    if (idx === selectedStreamIndex) {
      setShowQualityMenu(false);
      return;
    }
    if (videoRef.current) {
      pendingSeekTimeRef.current = videoRef.current.currentTime;
    }
    setIsLoading(true);
    setSelectedStreamIndex(idx);
    setShowQualityMenu(false);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleClose = () => {
    if (isAuthenticated && !user?.isGuest && manifest && videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || duration;
      if (dur > 0) {
        const percent = (cur / dur) * 100;
        if (percent >= 95) {
          clearWatchProgress(manifest.work_id);
        } else if (percent > 2) {
          saveWatchProgress({
            id: manifest.work_id,
            title: manifest.title,
            image: manifest.backdrop_path || manifest.poster_path || '',
            currentTime: cur,
            duration: dur,
            progressPercent: percent,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }
    onClose();
  };

  // Teclado: Atalhos de player
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSubtitleMenu || showQualityMenu) {
          setShowSubtitleMenu(false);
          setShowQualityMenu(false);
        } else if (document.fullscreenElement) {
          document.exitFullscreen();
          setIsFullscreen(false);
        } else {
          handleClose();
        }
      } else if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        skipTime(10);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        skipTime(-10);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'c' || e.key === 'C') {
        if (subtitles.length > 0) {
          setSelectedSubtitleId((prev) => (prev ? null : subtitles[0].id));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showSubtitleMenu, showQualityMenu, isPlaying, duration, subtitles]);

  // Atualização de buffer e progresso
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || duration;
    setCurrentTime(cur);
    if (videoRef.current.buffered.length > 0) {
      setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
    }

    // Salva progresso APENAS se o usuário for membro cadastrado
    if (isAuthenticated && !user?.isGuest && manifest && dur > 0) {
      if (Math.abs(cur - lastSavedTimeRef.current) >= 5) {
        lastSavedTimeRef.current = cur;
        const percent = (cur / dur) * 100;
        if (percent >= 95) {
          clearWatchProgress(manifest.work_id);
        } else if (percent > 2) {
          saveWatchProgress({
            id: manifest.work_id,
            title: manifest.title,
            image: manifest.backdrop_path || manifest.poster_path || '',
            currentTime: cur,
            duration: dur,
            progressPercent: percent,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    if (pendingSeekTimeRef.current !== null && pendingSeekTimeRef.current > 0) {
      videoRef.current.currentTime = pendingSeekTimeRef.current;
      pendingSeekTimeRef.current = null;
    }
    videoRef.current.playbackRate = playbackRate;
    setIsLoading(false);
    videoRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  const handleVideoError = () => {
    if (selectedStreamIndex + 1 < streams.length) {
      console.warn('Alternando automaticamente para fonte secundária do acervo...');
      setSelectedStreamIndex((prev) => prev + 1);
    } else {
      setIsLoading(false);
    }
  };

  if (!isOpen || !manifest || !activeStream) return null;

  const currentHeight = activeStream.height || 480;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      className="fixed inset-0 z-50 bg-[#050505] flex items-center justify-center select-none overflow-hidden font-sans"
    >
      {/* Brilho atmosférico sutil ao fundo da sala de projeção */}
      <div
        className="absolute inset-0 pointer-events-none opacity-35"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(232, 76, 34, 0.12) 0%, transparent 75%)',
        }}
      />

      {/* Vídeo Nativo com suporte a HTTP 206 Range Stream */}
      <video
        ref={videoRef}
        src={activeStream.url}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setIsLoading(true)}
        onError={handleVideoError}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer relative z-10"
      />

      {/* LEGENDA CINEMATOGRÁFICA LIMPA (Sem caixa/bloco ao redor, com contorno e sombra de cinema) */}
      {activeCueText && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none px-6 max-w-4xl w-full text-center transition-all duration-300 ${
            showControls ? 'bottom-28 md:bottom-32' : 'bottom-10 md:bottom-14'
          }`}
        >
          <p
            className="text-white text-lg md:text-2xl lg:text-[26px] font-medium tracking-wide leading-snug whitespace-pre-line"
            style={{
              textShadow:
                '0 2px 4px rgba(0,0,0,0.95), 0 0 12px rgba(0,0,0,0.9), 0 4px 24px rgba(0,0,0,0.85), -1px -1px 0 rgba(0,0,0,0.85), 1px -1px 0 rgba(0,0,0,0.85), -1px 1px 0 rgba(0,0,0,0.85), 1px 1px 0 rgba(0,0,0,0.85)',
            }}
          >
            {activeCueText}
          </p>
        </div>
      )}

      {/* Loading Spinner Minimalista */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none bg-[#050505]/40">
          <div className="w-11 h-11 border-2 border-white/15 border-t-[#ff6738] rounded-full animate-spin shadow-[0_0_25px_rgba(232,76,34,0.4)]" />
        </div>
      )}

      {/* TOP HEADER BAR — Limpo, apenas botão de fechar, título e ano */}
      <div
        className={`absolute top-0 left-0 right-0 z-30 px-6 md:px-10 pt-6 pb-12 bg-gradient-to-b from-[#050505]/90 via-[#050505]/40 to-transparent transition-opacity duration-300 flex items-center justify-between ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/10 flex items-center justify-center text-white/85 hover:text-white transition-all backdrop-blur-md"
            title="Fechar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-baseline gap-3">
            <h1 className="font-serif text-2xl md:text-3xl font-normal text-white tracking-tight">
              {manifest.title}
            </h1>
            {manifest.year && (
              <span className="font-serif italic text-lg md:text-xl text-white/50">
                {manifest.year}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM CONTROL BAR — Estética Editorial Lumière */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 px-6 md:px-10 pb-7 pt-14 bg-gradient-to-t from-[#050505]/95 via-[#050505]/70 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Timeline Slider / Scrub bar */}
        <div className="relative group mb-5 flex items-center">
          {/* Track Base */}
          <div className="w-full h-1 group-hover:h-1.5 bg-white/15 rounded-full overflow-hidden transition-all" />

          {/* Buffer Bar */}
          <div
            className="absolute left-0 h-1 group-hover:h-1.5 bg-white/30 rounded-full pointer-events-none transition-all"
            style={{ width: `${Math.min((buffered / (duration || 1)) * 100, 100)}%` }}
          />

          {/* Current Progress Bar (Vermilion / Warm Orange) */}
          <div
            className="absolute left-0 h-1 group-hover:h-1.5 bg-gradient-to-r from-[#e84c22] to-[#ff6738] rounded-full pointer-events-none shadow-[0_0_14px_rgba(232,76,34,0.75)] transition-all"
            style={{ width: `${Math.min((currentTime / (duration || 1)) * 100, 100)}%` }}
          />

          {/* Thumb indicator on hover */}
          <div
            className="w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)] absolute -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${Math.min((currentTime / (duration || 1)) * 100, 100)}%` }}
          />

          {/* Range Input invisível sobreposto */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.25}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-4 -top-1.5 opacity-0 cursor-pointer z-10"
          />
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Play / Pause — Pill Branca Editorial */}
            <button
              onClick={togglePlay}
              className="w-11 h-11 rounded-full bg-white hover:bg-white/90 text-[#050505] flex items-center justify-center transition-all shadow-[0_4px_20px_rgba(255,255,255,0.22)] hover:scale-105"
              title={isPlaying ? 'Pausar (Espaço)' : 'Reproduzir (Espaço)'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Skip -10s / +10s */}
            <button
              onClick={() => skipTime(-10)}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Voltar 10 segundos (Seta Esquerda)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => skipTime(10)}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Avançar 10 segundos (Seta Direita)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors"
                title="Mudo (M)"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-[#ff6738]" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="hidden sm:block w-20 md:w-24 h-1 accent-white bg-white/20 rounded-full cursor-pointer"
              />
            </div>

            {/* Time Indicator */}
            <div className="text-xs md:text-sm text-white/80 tabular-nums pl-1">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1.5 text-white/30">/</span>
              <span className="text-white/50">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls: Legendas (CC), Resolução (HD), Velocidade & Fullscreen */}
          <div className="flex items-center gap-2 md:gap-2.5 relative">
            {/* Botão e Menu de Legendas (CC) */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSubtitleMenu((v) => !v);
                  setShowQualityMenu(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                  selectedSubtitleId
                    ? 'bg-[#e84c22]/20 border-[#e84c22]/50 text-white'
                    : 'bg-white/[0.07] hover:bg-white/[0.14] border-white/10 text-white/75'
                }`}
                title="Legendas (C)"
              >
                <Subtitles className="w-3.5 h-3.5 text-[#ff6738]" />
                <span>Legendas</span>
                {selectedSubtitleId && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff6738]" />
                )}
              </button>

              {showSubtitleMenu && (
                <div className="absolute bottom-12 right-0 w-60 rounded-2xl bg-[#0c0c0f]/95 backdrop-blur-2xl border border-white/12 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50">
                  <div className="px-3 py-2 border-b border-white/10 mb-1">
                    <span className="text-[11px] font-medium text-white/50">
                      Legendas
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSubtitleId(null);
                      setShowSubtitleMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left hover:bg-white/[0.07] transition-colors text-white/80"
                  >
                    <span>Desativadas</span>
                    {selectedSubtitleId === null && <Check className="w-3.5 h-3.5 text-[#ff6738]" />}
                  </button>

                  {subtitles.length === 0 ? (
                    <div className="px-3 py-2.5 text-[11px] text-white/40 italic">
                      Indisponível para este título.
                    </div>
                  ) : (
                    subtitles.map((sub) => {
                      const active = selectedSubtitleId === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setSelectedSubtitleId(sub.id);
                            setShowSubtitleMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                            active
                              ? 'bg-[#e84c22]/20 text-white font-medium'
                              : 'hover:bg-white/[0.07] text-white/80'
                          }`}
                        >
                          <span>{formatLangLabel(sub)}</span>
                          {active && <Check className="w-3.5 h-3.5 text-[#ff6738]" />}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Botão e Menu de Qualidade / Resolução */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowQualityMenu((v) => !v);
                  setShowSubtitleMenu(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-xs font-medium text-white/85 transition-all"
                title="Qualidade"
              >
                <Settings className="w-3.5 h-3.5 text-white/70" />
                <span>{currentHeight}p</span>
              </button>

              {showQualityMenu && (
                <div className="absolute bottom-12 right-0 w-52 rounded-2xl bg-[#0c0c0f]/95 backdrop-blur-2xl border border-white/12 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50">
                  <div className="px-3 py-2 border-b border-white/10 mb-1">
                    <span className="text-[11px] font-medium text-white/50">
                      Qualidade
                    </span>
                  </div>
                  {streams.map((st, idx) => {
                    const h = st.height || 480;
                    const label =
                      h >= 1080
                        ? '1080p Full HD'
                        : h >= 720
                        ? '720p HD'
                        : `${h}p`;
                    const active = idx === selectedStreamIndex;
                    return (
                      <button
                        key={`${st.url}-${idx}`}
                        onClick={() => handleSelectQuality(idx)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                          active
                            ? 'bg-[#e84c22]/20 text-white font-medium'
                            : 'hover:bg-white/[0.07] text-white/80'
                        }`}
                      >
                        <span>{label}</span>
                        {active && <Check className="w-3.5 h-3.5 text-[#ff6738]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Playback Speed */}
            <button
              onClick={changePlaybackRate}
              className="px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 text-xs font-medium text-white/80 transition-colors"
              title="Velocidade de Reprodução"
            >
              {playbackRate}x
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full text-white/75 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Tela Cheia (F)"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
