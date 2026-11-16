import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Trash2 } from 'lucide-react';
import { getFavorites, removeFavorite } from '../utils/storage';
import { FavoriteItem, PlayStreamManifest } from '../types';
import { getPlayStream } from '../services/api';
import LumierePlayerModal from './player/LumierePlayerModal';

export default function MyList() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [activeManifest, setActiveManifest] = useState<PlayStreamManifest | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setFavorites(getFavorites());
    window.scrollTo(0, 0);
  }, []);

  const handlePlay = async (workId: number) => {
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

  const handleRemove = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeFavorite(id);
    setFavorites(updated);
  };

  return (
    <main className="min-h-screen bg-[#050505] pt-28 pb-20 px-6 md:px-12 text-white select-none">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho Editorial */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-6 border-b border-white/[0.08]">
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl text-white font-normal">
              Minha <span className="italic">lista</span>
            </h1>
            <p className="text-xs sm:text-[13px] text-white/55 font-light mt-1">
              Obras clássicas separadas para assistir na sua próxima sessão.
            </p>
          </div>

          {favorites.length > 0 && (
            <span className="text-xs text-white/55 font-light px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 self-start sm:self-auto">
              {favorites.length} {favorites.length === 1 ? 'obra salva' : 'obras salvas'}
            </span>
          )}
        </div>

        {/* Grade de Favoritos */}
        {favorites.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                onClick={() => handlePlay(fav.id)}
                className="group flex flex-col cursor-pointer"
              >
                <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#101116] border border-white/10 group-hover:border-[#ff6738]/60 transition-all duration-300">
                  <img
                    src={fav.image || '/hero.jpg'}
                    alt={fav.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />

                  <button
                    type="button"
                    onClick={(e) => handleRemove(fav.id, e)}
                    title="Remover da lista"
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/65 hover:bg-red-500 hover:text-white border border-white/15 flex items-center justify-center text-white/80 opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <h3 className="mt-2.5 font-serif text-base text-white group-hover:text-[#ff7a52] truncate transition-colors">
                  {fav.title}
                </h3>
                <span className="text-[11px] text-white/45 font-light">{fav.rating}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 rounded-3xl bg-white/[0.02] border border-white/[0.07] max-w-lg mx-auto p-8">
            <h3 className="font-serif text-3xl text-white font-normal mb-2">
              Sua lista está <span className="italic">vazia</span>
            </h3>
            <p className="text-xs text-white/55 font-light mb-6 leading-relaxed">
              Navegue pelas obras em domínio público e adicione seus clássicos favoritos para assistir quando quiser.
            </p>
            <Link
              to="/play"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-white/90 text-black text-xs font-medium transition-all"
            >
              Explorar acervo clássico
            </Link>
          </div>
        )}
      </div>

      <LumierePlayerModal
        manifest={activeManifest}
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
      />
    </main>
  );
}
