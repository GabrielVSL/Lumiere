import logging
import re
from typing import Any, Dict, List, Optional, Tuple
import httpx

logger = logging.getLogger("lumiere.archive")


class InternetArchiveClient:
    BASE_METADATA_URL = "https://archive.org/metadata"
    BASE_DOWNLOAD_URL = "https://archive.org/download"
    BASE_SEARCH_URL = "https://archive.org/advancedsearch.php"
    BASE_IMG_URL = "https://archive.org/services/img"
    USER_AGENT = "LumiereCinema/1.0 (https://lumiere.cinema; mailto:contact@lumiere.cinema) httpx/0.27"

    def __init__(self, timeout: float = 15.0):
        self.timeout = timeout

    def get_thumbnail_url(self, identifier: str) -> str:
        """Retorna a URL da imagem de capa padrão gerada pelo Internet Archive."""
        return f"{self.BASE_IMG_URL}/{identifier}"

    async def get_item_metadata(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Busca metadados completos de um item no Internet Archive."""
        url = f"{self.BASE_METADATA_URL}/{identifier}"
        headers = {"User-Agent": self.USER_AGENT}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    if data and "metadata" in data:
                        return data
                return None
        except Exception as e:
            logger.warning(f"Erro buscando metadados de {identifier}: {e}")
            return None

    async def search_classic_films(
        self,
        collection: Optional[str] = None,
        query: Optional[str] = None,
        max_year: int = 1955,
        min_year: int = 1900,
        rows: int = 50,
        page: int = 1,
    ) -> List[Dict[str, Any]]:
        """
        Pesquisa obras no acervo do Internet Archive com filtro estrito de ano e coleções selecionadas.
        """
        if collection:
            base_query = f"collection:({collection})"
        elif query:
            base_query = query
        else:
            base_query = "(collection:(feature_films) OR collection:(silent_films) OR collection:(film_noir) OR collection:(SciFi_Horror))"

        q = f"{base_query} AND year:[{min_year} TO {max_year}] AND mediatype:(movies)"
        params = {
            "q": q,
            "fl[]": ["identifier", "title", "year", "description", "creator", "runtime", "genre", "downloads"],
            "sort[]": "downloads desc",
            "rows": rows,
            "page": page,
            "output": "json",
        }
        headers = {"User-Agent": self.USER_AGENT}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(self.BASE_SEARCH_URL, params=params, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("response", {}).get("docs", [])
                return []
        except Exception as e:
            logger.error(f"Erro na pesquisa do Internet Archive: {e}")
            return []

    async def verify_media_streamable(self, file_url: str) -> Tuple[bool, int, Optional[int]]:
        """
        Verifica se o arquivo de vídeo responde com HTTP 206 Partial Content
        usando uma requisição com header Range bytes=0-1023.
        Retorna (sucesso, status_code, content_length_total).
        """
        headers = {
            "Range": "bytes=0-1023",
            "User-Agent": self.USER_AGENT,
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                resp = await client.get(file_url, headers=headers)
                if resp.status_code == 206:
                    content_range = resp.headers.get("Content-Range", "")
                    total_bytes = None
                    if "/" in content_range:
                        try:
                            total_bytes = int(content_range.split("/")[-1])
                        except ValueError:
                            pass
                    return True, 206, total_bytes
                elif resp.status_code == 200:
                    accepts = resp.headers.get("Accept-Ranges", "")
                    content_length = resp.headers.get("Content-Length")
                    total = int(content_length) if content_length and content_length.isdigit() else None
                    return (accepts == "bytes"), 200, total
                return False, resp.status_code, None
        except Exception:
            return False, 0, None

    def pick_best_mp4(self, identifier: str, metadata_doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Seleciona o melhor arquivo MP4 disponível para streaming no browser,
        preferindo H.264 e maiores resoluções (1080p, 720p, 480p),
        descartando trailers e clipes de amostra.
        """
        files = metadata_doc.get("files", [])
        mp4_candidates = []

        # Tenta pegar runtime geral dos metadados se existir
        meta_info = metadata_doc.get("metadata", {})
        fallback_runtime = None
        raw_runtime = meta_info.get("runtime")
        if raw_runtime:
            try:
                # Trata formatos como "1:23:45" ou "85 mins" ou "90"
                if isinstance(raw_runtime, str):
                    if ":" in raw_runtime:
                        parts = [int(p) for p in raw_runtime.split(":") if p.isdigit()]
                        if len(parts) == 3:
                            fallback_runtime = parts[0] * 3600 + parts[1] * 60 + parts[2]
                        elif len(parts) == 2:
                            fallback_runtime = parts[0] * 60 + parts[1]
                    else:
                        num = re.findall(r"\d+", raw_runtime)
                        if num:
                            fallback_runtime = int(num[0]) * 60
                elif isinstance(raw_runtime, (int, float)):
                    fallback_runtime = int(raw_runtime) * 60
            except Exception:
                pass

        for f in files:
            name = f.get("name", "")
            format_name = f.get("format", "")
            lower_name = name.lower()

            if not lower_name.endswith(".mp4"):
                continue

            # Descarta trailers, teasers, samples
            if any(bad in lower_name for bad in ["trailer", "sample", "_512kb.mp4_meta", "preview"]):
                continue

            # Altura
            height = None
            if "height" in f:
                try:
                    height = int(f["height"])
                except (ValueError, TypeError):
                    pass
            elif "1080" in lower_name or "1080" in format_name.lower():
                height = 1080
            elif "720" in lower_name or "720" in format_name.lower():
                height = 720
            elif "480" in lower_name:
                height = 480
            else:
                height = 360

            size = None
            if "size" in f:
                try:
                    size = int(f["size"])
                except (ValueError, TypeError):
                    pass

            duration = None
            if "length" in f:
                try:
                    duration = int(float(f["length"]))
                except (ValueError, TypeError):
                    pass
            elif fallback_runtime:
                duration = fallback_runtime

            url = f"{self.BASE_DOWNLOAD_URL}/{identifier}/{name}"

            mp4_candidates.append({
                "name": name,
                "url": url,
                "format": format_name,
                "height": height,
                "size_bytes": size,
                "duration_s": duration,
            })

        if not mp4_candidates:
            # Se não achou nenhum sem 'trailer' ou 'sample', aceita qualquer .mp4 se houver
            for f in files:
                name = f.get("name", "")
                if name.lower().endswith(".mp4"):
                    url = f"{self.BASE_DOWNLOAD_URL}/{identifier}/{name}"
                    return {
                        "name": name,
                        "url": url,
                        "format": f.get("format", ""),
                        "height": 480,
                        "size_bytes": None,
                        "duration_s": fallback_runtime,
                    }
            return None

        # Ordena preferindo altura maior, depois tamanho de arquivo maior
        mp4_candidates.sort(key=lambda x: (x["height"] or 0, x["size_bytes"] or 0), reverse=True)
        return mp4_candidates[0]

    def extract_subtitles(self, identifier: str, metadata_doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extrai legendas (.vtt ou .srt) do item."""
        files = metadata_doc.get("files", [])
        subtitles = []

        for f in files:
            name = f.get("name", "")
            lower_name = name.lower()
            if not (lower_name.endswith(".vtt") or lower_name.endswith(".srt")):
                continue

            lang = "pt" if "_pt" in lower_name or ".pt." in lower_name else "en"
            subtitles.append({
                "lang": lang,
                "url": f"{self.BASE_DOWNLOAD_URL}/{identifier}/{name}",
                "origin": "human",
            })

        return subtitles
