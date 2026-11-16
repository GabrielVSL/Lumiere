import logging
from typing import Any, Dict, List, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger("lumiere.tmdb")

# Mapeamento oficial de IDs de gêneros de filmes do TMDB para português
TMDB_MOVIE_GENRES: Dict[int, str] = {
    28: "Ação",
    12: "Aventura",
    16: "Animação",
    35: "Comédia",
    80: "Crime",
    99: "Documentário",
    18: "Drama",
    10751: "Família",
    14: "Fantasia",
    36: "História",
    27: "Terror",
    10402: "Música",
    9648: "Mistério",
    10749: "Romance",
    878: "Ficção Científica",
    10770: "Cinema TV",
    53: "Suspense",
    10752: "Guerra",
    37: "Faroeste",
}


class TMDBClient:
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or settings.TMDB_API_KEY or "2dca580c2a14b55200e784d157207b4d"
        self.base_url = (base_url or settings.TMDB_BASE_URL).rstrip("/")
        self.image_base = "https://image.tmdb.org/t/p"

    async def find_by_imdb_id(
        self, imdb_id: str, language: str = "pt-BR"
    ) -> Optional[Dict[str, Any]]:
        """Busca um filme pelo identificador IMDb (ex: 'tt0046876')."""
        if not self.api_key or not imdb_id:
            return None

        url = f"{self.base_url}/find/{imdb_id}"
        params = {
            "api_key": self.api_key,
            "external_source": "imdb_id",
            "language": language,
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    movie_results = data.get("movie_results", [])
                    if movie_results:
                        return movie_results[0]
                return None
        except Exception as e:
            logger.warning(f"Erro no TMDB find_by_imdb_id ({imdb_id}): {e}")
            return None

    async def search_movie(
        self, title: str, year: Optional[int] = None, language: str = "pt-BR"
    ) -> List[Dict[str, Any]]:
        """Pesquisa um filme no TMDB por título e ano com tolerância a variações."""
        if not self.api_key or not title:
            return []

        url = f"{self.base_url}/search/movie"

        # Tentativa 1: Título e ano exato
        params = {
            "api_key": self.api_key,
            "query": title,
            "language": language,
            "include_adult": False,
        }
        if year:
            params["year"] = str(year)

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    results = resp.json().get("results", [])
                    if results:
                        return results

                # Tentativa 2: Ano +- 1 se houver ano especificado
                if year:
                    for delta in (-1, 1):
                        params["year"] = str(year + delta)
                        resp = await client.get(url, params=params)
                        if resp.status_code == 200:
                            results = resp.json().get("results", [])
                            if results:
                                return results

                # Tentativa 3: Busca apenas pelo título sem ano
                params.pop("year", None)
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    return resp.json().get("results", [])
                return []
        except Exception as e:
            logger.warning(f"Erro no TMDB search_movie ({title}): {e}")
            return []

    async def get_movie_details(
        self, tmdb_id: int, language: str = "pt-BR"
    ) -> Optional[Dict[str, Any]]:
        """Busca detalhes completos de um filme no TMDB com fallback para inglês caso a sinopse pt-BR seja vazia."""
        if not self.api_key or not tmdb_id:
            return None

        url = f"{self.base_url}/movie/{tmdb_id}"
        params = {
            "api_key": self.api_key,
            "language": language,
            "append_to_response": "credits,videos",
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json()

                    # Se a sinopse em português estiver vazia, busca a versão em inglês como fallback
                    if not data.get("overview") and language != "en-US":
                        fallback_params = {
                            "api_key": self.api_key,
                            "language": "en-US",
                        }
                        en_resp = await client.get(url, params=fallback_params)
                        if en_resp.status_code == 200:
                            en_data = en_resp.json()
                            if en_data.get("overview"):
                                data["overview"] = en_data["overview"]
                            if not data.get("tagline") and en_data.get("tagline"):
                                data["tagline"] = en_data["tagline"]

                    return data
                return None
        except Exception as e:
            logger.warning(f"Erro no TMDB get_movie_details ({tmdb_id}): {e}")
            return None

    def map_genre_ids(self, genre_ids: List[int]) -> List[str]:
        """Converte lista de IDs de gêneros numéricos em nomes legíveis em português."""
        genres = []
        for gid in genre_ids or []:
            name = TMDB_MOVIE_GENRES.get(gid)
            if name and name not in genres:
                genres.append(name)
        return genres

    def get_poster_url(self, path: Optional[str], size: str = "w500") -> Optional[str]:
        if not path:
            return None
        if path.startswith("http"):
            return path
        return f"{self.image_base}/{size}{path}"

    def get_backdrop_url(self, path: Optional[str], size: str = "original") -> Optional[str]:
        if not path:
            return None
        if path.startswith("http"):
            return path
        return f"{self.image_base}/{size}{path}"
