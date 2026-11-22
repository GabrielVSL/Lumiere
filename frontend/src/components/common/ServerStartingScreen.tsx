import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useBackend } from '../../context/BackendContext';

const ESTIMATED_BOOT_SECONDS = 50;

export default function ServerStartingScreen() {
  const { status, elapsedSeconds, retryWakeup } = useBackend();
  const navigate = useNavigate();

  const isError = status === 'error';

  const progressPercent = isError
    ? 100
    : Math.min(94, Math.max(6, Math.round((elapsedSeconds / ESTIMATED_BOOT_SECONDS) * 94)));

  const currentStageMessage =
    elapsedSeconds < 12
      ? 'Acordando instância na nuvem • Estimativa de 30 a 50 segundos'
      : elapsedSeconds < 30
      ? 'Inicializando API FastAPI e conexões do acervo clássico...'
      : 'Finalizando aquecimento do servidor • Quase pronto...';

  return (
    <section className="min-h-screen w-full p-2.5 sm:p-4 bg-[#050505] text-white select-none flex flex-col selection:bg-[#e04f26]/30 selection:text-white">
      {/* Moldura cinematográfica arredondada no mesmo estilo editorial da Landing Page */}
      <div className="relative flex-1 w-full min-h-[640px] rounded-2xl md:rounded-[26px] overflow-hidden border border-white/10 bg-[#0b0706] flex flex-col justify-between">
        {/* Camada atmosférica sutil remetendo ao Hero */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/hero.jpg"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center opacity-20 scale-105"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 38%, rgba(232, 76, 34, 0.22) 0%, rgba(12, 8, 7, 0.88) 58%, rgba(5, 5, 5, 0.98) 100%)',
            }}
          />
        </div>

        {/* Topo Editorial Minimalista */}
        <header className="relative z-10 px-6 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2.5 text-white/85 hover:text-white transition-colors cursor-pointer"
          >
            <img src="/lumiere_icon.png" alt="Lumière" className="w-5 h-5 object-contain" />
            <span className="text-[11px] font-medium tracking-[0.26em] uppercase">Lumière</span>
          </button>

          <div className="inline-flex items-center gap-2 text-[11px] font-mono tracking-wider text-white/60 uppercase">
            {isError ? (
              <span className="text-amber-300/90">Tempo limite atingido</span>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff6738] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff6738]" />
                </span>
                <span>Cold Boot</span>
                <span className="text-white/25">•</span>
                <span className="text-white/85">{elapsedSeconds}s</span>
              </>
            )}
          </div>
        </header>

        {/* Palco Central Aberto (Sem caixas/blocos) */}
        <main className="relative z-10 px-6 py-12 flex flex-col items-center justify-center text-center max-w-2xl mx-auto animate-fade-in">
          {/* Folding Cube · BufferLab by @LegedsDaD */}
          {!isError && (
            <div
              className="loader-stage mb-6"
              style={
                {
                  '--c1': '#ff6738',
                  '--c2': '#fbbf24',
                } as React.CSSProperties
              }
            >
              <div className="l51">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          <h1 className="font-serif text-4xl sm:text-5xl md:text-[60px] text-white font-normal leading-[1.06] tracking-[-0.01em] drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            {isError ? (
              <>
                Servidor ainda <span className="italic font-normal text-[#ff825c]">não respondeu</span>
              </>
            ) : (
              <>
                Iniciando o <span className="italic font-normal text-[#ff825c]">servidor</span>
              </>
            )}
          </h1>

          <p className="mt-4 text-xs sm:text-[14px] text-white/75 font-light tracking-wide max-w-md">
            {isError
              ? 'A instância em nuvem demorou além do esperado para inicializar. Você pode tentar conectar novamente.'
              : currentStageMessage}
          </p>

          {/* Linha de progresso minimalista */}
          {!isError && (
            <div className="mt-8 w-56 sm:w-72">
              <div className="h-[2px] w-full bg-white/12 overflow-hidden rounded-full">
                <div
                  className="h-full bg-gradient-to-r from-[#e84c22] via-[#ff6738] to-[#fbbf24] transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {isError && (
            <div className="mt-8">
              <button
                type="button"
                onClick={retryWakeup}
                className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-white hover:bg-white/90 text-black text-[13px] font-medium transition-all cursor-pointer shadow-[0_4px_25px_rgba(255,255,255,0.18)]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar novamente</span>
              </button>
            </div>
          )}
        </main>

        {/* Rodapé Editorial com a Explicação (Aberto, separado apenas por uma linha sutil) */}
        <footer className="relative z-10 border-t border-white/10 px-6 sm:px-10 py-6 sm:py-7">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
            <div className="md:col-span-8 text-left space-y-1.5">
              <p className="text-[10px] tracking-[0.22em] uppercase text-[#ff825c] font-medium">
                Por que o servidor estava desligado?
              </p>
              <p className="text-xs leading-relaxed text-white/60 font-light">
                O <span className="text-white/85 font-normal">Lumière</span> é um projeto de
                portfólio hospedado em infraestrutura sob demanda (camada gratuita em nuvem). Para
                otimizar recursos e manter múltiplos projetos disponíveis sem custos fixos 24/7, o
                servidor entra em hibernação após 15 minutos sem acessos e leva cerca de 30 a 50
                segundos para aquecer na primeira visita. Assim que ficar online, você entra
                automaticamente na plataforma.
              </p>
            </div>

            <div className="md:col-span-4 flex md:justify-end">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white font-light tracking-wide transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para a página inicial</span>
              </button>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}
