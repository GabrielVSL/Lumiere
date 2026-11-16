import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LandingNavbar() {
  const { user, isAuthenticated, openAuthModal, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Início', href: '#inicio' },
    { label: 'Manifesto', href: '#historia' },
    { label: 'Jornada', href: '#epocas' },
    { label: 'Pilares', href: '#diferenciais' },
    { label: 'Acervo', href: '#acervo' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled
          ? 'bg-[#050505]/80 backdrop-blur-md py-4'
          : 'bg-transparent py-7'
      }`}
    >
      <div className="max-w-7xl mx-auto px-8 md:px-14 flex items-center justify-between">
        {/* Logo discreta à esquerda */}
        <a href="#inicio" className="flex items-center select-none">
          <img
            src="/lumiere_logo.png"
            alt="Lumière"
            className="h-5 md:h-6 w-auto object-contain opacity-95 hover:opacity-100 transition-opacity"
          />
        </a>

        {/* Links em caixa normal (sem Caps Lock), fonte leve e elegante */}
        <nav className="hidden lg:flex items-center gap-9 text-[13px] font-normal tracking-normal text-white/75">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-white transition-colors duration-300"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Botão pill branco minimalista à direita, igual à referência */}
        <div className="hidden sm:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/app')}
                className="px-5 py-2 rounded-full bg-white hover:bg-white/90 text-black font-medium text-[13px] transition-all cursor-pointer"
              >
                Abrir catálogo
              </button>
              <button
                onClick={signOut}
                title={`Sair (${user?.name})`}
                className="p-2 rounded-full text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="px-5 py-2 rounded-full bg-white hover:bg-white/90 text-black text-[13px] font-medium transition-all duration-300 shadow-[0_2px_20px_rgba(255,255,255,0.15)] cursor-pointer"
            >
              Entrar
            </button>
          )}
        </div>

        {/* Botão Menu Mobile */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-white/80 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Menu Mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#050505]/95 backdrop-blur-xl border-b border-white/10 px-8 py-6 space-y-4">
          <nav className="flex flex-col space-y-3 text-sm font-normal text-white/80">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white transition-colors py-1"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="pt-4 border-t border-white/10">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/app');
                }}
                className="w-full py-2.5 rounded-full bg-white text-black font-medium text-xs"
              >
                Abrir catálogo
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('login');
                }}
                className="w-full py-2.5 rounded-full bg-white text-black font-medium text-xs"
              >
                Entrar
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
