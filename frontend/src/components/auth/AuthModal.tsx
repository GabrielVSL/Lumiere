import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMode, signIn, signUp, signInAsGuest } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMode(authModalMode);
    setError(null);
  }, [authModalMode, isAuthModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await signIn(email, password);
        if (res.success) {
          navigate('/app');
        } else {
          setError(res.error || 'Não foi possível entrar.');
        }
      } else {
        const res = await signUp(name, email, password);
        if (res.success) {
          navigate('/app');
        } else {
          setError(res.error || 'Não foi possível criar a conta.');
        }
      }
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestAccess = () => {
    signInAsGuest();
    navigate('/app');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in select-none"
      onClick={closeAuthModal}
    >
      <div
        className="relative w-full max-w-[420px] rounded-[28px] bg-[#08080a] border border-white/10 p-8 sm:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Luz atmosférica quente no topo central igual à Hero da Landing Page */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-56 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(232, 76, 34, 0.38) 0%, rgba(160, 35, 10, 0.15) 55%, transparent 80%)',
          }}
        />

        {/* Botão Fechar Minimalista */}
        <button
          onClick={closeAuthModal}
          aria-label="Fechar"
          className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/10 transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cabeçalho Editorial */}
        <div className="relative z-10 flex flex-col items-center text-center mb-7">
          <img
            src="/lumiere_logo.png"
            alt="Lumière"
            className="h-5 w-auto object-contain mb-5 opacity-95"
          />

          <h2 className="font-serif text-3xl sm:text-4xl text-white font-normal leading-tight">
            {mode === 'login' ? (
              <>
                Bem-vindo à <span className="italic">cinemateca</span>
              </>
            ) : (
              <>
                Crie seu <span className="italic">acesso</span>
              </>
            )}
          </h2>
          <p className="text-xs text-white/55 font-light mt-1.5 max-w-xs leading-relaxed">
            Mais de 640 obras históricas restauradas em domínio público prontas para assistir.
          </p>
        </div>

        {/* Seletor de Modo Elegante (Sem Caps Lock) */}
        <div className="relative z-10 grid grid-cols-2 rounded-full bg-white/[0.04] border border-white/[0.08] p-1 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 rounded-full text-xs font-normal transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-black font-medium shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Entrar na conta
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`py-2 rounded-full text-xs font-normal transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-black font-medium shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Criar cadastro
          </button>
        </div>

        {/* Formulário Clean */}
        <form onSubmit={handleSubmit} className="relative z-10 space-y-3.5">
          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/25 text-xs text-red-300 font-light text-center">
              {error}
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs text-white/60 font-light mb-1.5 pl-1">
                Como podemos chamar você?
              </label>
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/35 transition-colors font-light"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-white/60 font-light mb-1.5 pl-1">
              Seu e-mail
            </label>
            <input
              type="email"
              placeholder="nome@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/35 transition-colors font-light"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-white/60 font-light mb-1.5 pl-1">
              Sua senha
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/35 transition-colors font-light"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-full bg-white hover:bg-white/90 text-black font-medium text-xs transition-all shadow-[0_4px_25px_rgba(255,255,255,0.18)] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? 'Autenticando...'
                : mode === 'login'
                ? 'Entrar no acervo'
                : 'Concluir cadastro'}
            </button>
          </div>
        </form>

        {/* Divisor Minimalista */}
        <div className="relative z-10 flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/[0.08]" />
          <span className="text-[11px] text-white/35 font-light">ou acesso imediato</span>
          <div className="flex-1 h-px bg-white/[0.08]" />
        </div>

        {/* Botão Convidado (Demo Instantâneo) com Estética Quente */}
        <button
          type="button"
          onClick={handleGuestAccess}
          className="relative z-10 w-full py-3 px-5 rounded-full bg-gradient-to-r from-[#e84c22]/20 via-[#b8280d]/15 to-white/[0.03] hover:from-[#e84c22]/30 hover:to-white/[0.08] border border-[#e84c22]/35 text-white text-xs font-normal flex items-center justify-between transition-all cursor-pointer group"
        >
          <span className="text-white/90">Entrar como convidado (Demo)</span>
          <span className="inline-flex items-center gap-1 text-[#ff7a52] text-[11px] group-hover:translate-x-0.5 transition-transform">
            1 clique <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>

        <p className="relative z-10 text-[11px] text-white/35 font-light text-center mt-6 leading-relaxed">
          Obras em domínio público nos termos do Art. 44 da Lei nº 9.610/98.
        </p>
      </div>
    </div>
  );
}
