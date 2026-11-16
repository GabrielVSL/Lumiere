import { FavoriteItem } from '../types';

const STORAGE_KEY = 'lumiere_favorites';
const LEGACY_STORAGE_KEY = 'lumiere_favorites_v1';

/**
 * Busca os favoritos salvos no navegador (com suporte a migração da chave legada)
 */
export const getFavorites = (): FavoriteItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Erro ao ler favoritos do localStorage:', error);
    return [];
  }
};

/**
 * Adiciona ou remove um título dos favoritos.
 * Corrige o bug de tipagem comparando IDs normalizados como número.
 */
export const toggleFavorite = (movie: FavoriteItem): boolean => {
  try {
    let favs = getFavorites();
    const targetId = Number(movie.id);
    const exists = favs.some((m) => Number(m.id) === targetId);

    if (exists) {
      favs = favs.filter((m) => Number(m.id) !== targetId);
    } else {
      favs.unshift({
        ...movie,
        id: targetId,
        added_at: new Date().toISOString(),
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
    return !exists; // true se adicionou, false se removeu
  } catch (error) {
    console.error('Erro ao alternar favorito:', error);
    return false;
  }
};

/**
 * Verifica se um título específico está favoritado.
 * Aceita id tanto como number quanto string (vindo do useParams).
 */
export const isFavorite = (id: string | number | undefined): boolean => {
  if (id === undefined || id === null) return false;
  const targetId = Number(id);
  if (isNaN(targetId)) return false;
  const favs = getFavorites();
  return favs.some((m) => Number(m.id) === targetId);
};

export const addFavorite = (movie: FavoriteItem): FavoriteItem[] => {
  if (!isFavorite(movie.id)) {
    toggleFavorite(movie);
  }
  return getFavorites();
};

export const removeFavorite = (id: string | number): FavoriteItem[] => {
  const favs = getFavorites().filter((m) => Number(m.id) !== Number(id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
  return favs;
};

export interface WatchProgressItem {
  id: number;
  title: string;
  image: string;
  currentTime: number;
  duration: number;
  progressPercent: number;
  updatedAt: string;
}

const PROGRESS_STORAGE_KEY = 'lumiere_watch_progress';

export const getWatchProgress = (): WatchProgressItem[] => {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveWatchProgress = (item: WatchProgressItem): void => {
  try {
    let list = getWatchProgress().filter((p) => Number(p.id) !== Number(item.id));
    if (item.progressPercent > 2 && item.progressPercent < 95) {
      list.unshift(item);
      list = list.slice(0, 10);
    }
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
};

export const clearWatchProgress = (id: number): void => {
  try {
    const list = getWatchProgress().filter((p) => Number(p.id) !== Number(id));
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
};
