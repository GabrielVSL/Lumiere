import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  Bookmark, 
  Film, 
  Layers,
  LogIn,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  badge?: string;
}

export default function Sidebar() {
  const location = useLocation();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const navItems: NavItem[] = [
    { label: 'Início', to: '/', icon: Home },
    { label: 'Cofre / Catálogo', to: '/app', icon: Layers },
    { label: 'Lumière Play (Grátis)', to: '/play', icon: Film, badge: 'PLAY' },
    { label: 'Guia de Streamings', to: '/explorar', icon: Compass },
    { label: 'Minha Lista', to: '/minha-lista', icon: Bookmark },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <>
      {/* DESKTOP SIDEBAR (Navigation Rail estilo SlothUI sem logo duplicado) */}
      <aside className="hidden md:flex fixed top-20 left-0 bottom-0 w-20 flex-col items-center justify-between py-6 bg-[#07080b]/95 backdrop-blur-xl border-r border-white/5 z-50 select-none">
        
        {/* Navigation Icons List */}
        <nav className="flex flex-col items-center gap-4 w-full px-3 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);

            return (
              <Link
                key={item.label}
                to={item.to}
                className={`group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  active 
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                    : item.badge
                    ? 'text-amber-400/80 hover:text-amber-400 bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title={item.label}
              >
                {/* Active Indicator Bar */}
                {active && (
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-amber-400 rounded-r-full shadow-[0_0_8px_#f59e0b]" />
                )}
                
                <Icon className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />

                {/* Floating Tooltip */}
                <span className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-gray-900 text-xs font-semibold text-gray-200 border border-white/10 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-xl">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: User Profile Avatar ou Botão de Login */}
        <div className="flex flex-col items-center gap-3 w-full px-3">
          {isAuthenticated && user ? (
            <Link
              to="/minha-lista"
              className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400/40 hover:border-amber-400 transition-all duration-300 hover:scale-105 shadow-md group"
              title={`Perfil: ${user.name}`}
            >
              <img 
                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
                alt={user.name} 
                className="w-full h-full object-cover"
              />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="w-10 h-10 rounded-full bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.2)]"
              title="Entrar ou Criar Acesso"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#07080b]/95 backdrop-blur-xl border-t border-white/10 z-50 flex items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);

          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                active ? 'text-amber-400 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
