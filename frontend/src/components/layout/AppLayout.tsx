import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, isLoading, openAuthModal } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openAuthModal('login');
    }
  }, [isLoading, isAuthenticated, openAuthModal]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-[#e84c22] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col selection:bg-[#e04f26]/30 selection:text-white">
      {/* Top Navbar Horizontal (Sem Sidebar Lateral) */}
      <Header />

      {/* Conteúdo Principal Full-Width */}
      <div className="flex-1">{children}</div>

      {/* Rodapé Editorial Minimalista */}
      <footer className="border-t border-white/[0.08] py-8 px-6 md:px-12 bg-[#050505] select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/45 font-light">
          <div className="flex items-center gap-2.5">
            <img src="/lumiere_icon.png" alt="Lumière" className="w-4 h-4 object-contain opacity-80" />
            <span className="text-white/70 font-normal">Lumière Cinema</span>
            <span>•</span>
            <span>A Biblioteca Aberta da Sétima Arte</span>
          </div>
          <span>Obras em domínio público nos termos do Art. 44 da Lei nº 9.610/1998</span>
          <span>Matrizes preservadas via Internet Archive &amp; TMDB</span>
        </div>
      </footer>
    </div>
  );
}
