import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Cloud, Info, RefreshCw, Server } from 'lucide-react';
import { useBackend } from '../../context/BackendContext';

const ESTIMATED_BOOT_SECONDS = 50;

export default function ServerStartingScreen() {
  const { status, elapsedSeconds, retryWakeup } = useBackend();
  const navigate = useNavigate();

  const isError = status === 'error';

  const progressPercent = isError
    ? 100
    : Math.min(94, Math.max(8, Math.round((elapsedSeconds / ESTIMATED_BOOT_SECONDS) * 94)));

  const currentStageMessage =
    elapsedSeconds < 12
      ? 'Acordando instância na nuvem...'
      : elapsedSeconds < 30
      ? 'Inicializando API FastAPI e conexões do acervo...'
      : 'Finalizando aquecimento do servidor...';

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center px-5 py-12 relative overflow-hidden selection:bg-[#e04f26]/30 selection:text-white">
      {/* Brilho atmosférico sutil no fundo */}
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 50% 35%, rgba(232, 76, 34, 0.14) 0%, transparent 72%)',
        }}
      />

      <div className="relative z-10 w-full max-w-lg animate-fade-in">
        {/* Card Principal */}
        <div className="rounded-3xl border border-white/[0.09] bg-[#0c0c0f]/90 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.8)] p-7 sm:p-9">
          {/* Animação Central */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6 flex items-center justify-center">
              {/* Halo pulsante */}
              {!isError && (
                <div className="absolute w-24 h-24 rounded-full bg-[#e84c22]/15 animate-ping [animation-duration:2.6s]" />
              )}

              {/* Anel giratório */}
              <div
                className={`relative w-20 h-20 rounded-full flex items-center justify-center border ${
                  isError
                    ? 'border-amber-500/35 bg-amber-500/10'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                {!isError && (
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#e84c22] border-r-amber-400/70 animate-spin [animation-duration:1.4s]" />
                )}
                <img
                  src="/lumiere_icon.png"
                  alt="Lumière"
                  className="w-8 h-8 object-contain opacity-95"
                />
              </div>
            </div>

            {/* Badge de status */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[11px] font-medium text-white/75 mb-4">
              {isError ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tempo limite atingido</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff6738]" />
                  </span>
                  <span>Cold Boot em andamento</span>
                  <span className="text-white/30">•</span>
                  <span className="font-mono text-amber-300/90">{elapsedSeconds}s</span>
                </>
              )}
            </div>

            {/* Título */}
            <h1 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-white">
              {isError ? 'Servidor ainda não respondeu' : 'Iniciando servidor...'}
            </h1>

            <p className="mt-2 text-sm text-white/60">
              {isError
                ? 'A instância em nuvem demorou além do previsto para inicializar.'
                : currentStageMessage}
            </p>
          </div>

          {/* Barra de Progresso */}
          {!isError && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-[11px] text-white/45 mb-2">
                <span className="inline-flex items-center gap-1.5">
                  <Server className="w-3 h-3 text-[#ff6738]" />
                  <span>Aquecendo API em nuvem</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Estimativa: 30s – 50s</span>
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/[0.07] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#e84c22] via-amber-400 to-[#ff6738] transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Explicação Transparente */}
          <div className="mt-7 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5 text-left">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/90 mb-2">
              <Info className="w-3.5 h-3.5 text-[#ff6738] shrink-0" />
              <span>Por que o servidor estava desligado?</span>
            </div>
            <p className="text-xs leading-relaxed text-white/60">
              O <strong className="text-white/85 font-medium">Lumière</strong> é um projeto de
              portfólio hospedado em infraestrutura sob demanda (camada gratuita em nuvem). Para
              otimizar recursos e manter múltiplos projetos disponíveis sem custos fixos de servidor
              24/7, a instância hiberna automaticamente após{' '}
              <span className="text-white/80">15 minutos de inatividade</span>.
            </p>
            <p className="mt-2.5 text-xs leading-relaxed text-white/60">
              Na primeira visita, o container leva cerca de{' '}
              <span className="text-white/80">30 a 50 segundos</span> para iniciar (
              <em>cold boot</em>). Assim que a API estiver online, você entrará{' '}
              <span className="text-white/85">automaticamente</span> na plataforma — não precisa
              recarregar a página.
            </p>
          </div>

          {/* Ações */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isError && (
              <button
                type="button"
                onClick={retryWakeup}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#e84c22] hover:bg-[#ff5e33] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar novamente</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white/75 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para a página inicial</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
