import logging
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger("lumiere.wikidata")


class WikidataClient:
    """
    Cliente para consulta SPARQL na Wikidata buscando metadados estruturados
    de filmes clássicos pré-1956 com links para Internet Archive e identificadores externos.
    """
    SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"
    USER_AGENT = "LumiereCinema/1.0 (https://lumiere.cinema; mailto:contact@lumiere.cinema) httpx/0.27"

    def __init__(self, timeout: float = 30.0):
        self.timeout = timeout

    async def fetch_public_domain_films(
        self,
        min_year: int = 1900,
        max_year: int = 1955,
        limit: int = 400,
    ) -> List[Dict[str, Any]]:
        """
        Consulta obras cinematográficas (Q11424) lançadas até max_year (1955)
        com identificador no Internet Archive (P724), IMDb ID (P345) e TMDB ID (P4947).
        """
        sparql = f"""
        SELECT DISTINCT ?item ?title ?iaId ?imdbId ?tmdbId ?year ?runtime WHERE {{
          ?item wdt:P724 ?iaId .
          ?item wdt:P31 wd:Q11424 .
          ?item wdt:P577 ?date .
          BIND(YEAR(?date) AS ?year)
          FILTER(?year >= {min_year} && ?year <= {max_year})
          OPTIONAL {{ ?item rdfs:label ?title FILTER(LANG(?title) = "en") }}
          OPTIONAL {{ ?item wdt:P345 ?imdbId . }}
          OPTIONAL {{ ?item wdt:P4947 ?tmdbId . }}
          OPTIONAL {{ ?item wdt:P2047 ?runtime . }}
        }}
        ORDER BY ?year
        LIMIT {limit}
        """

        headers = {
            "User-Agent": self.USER_AGENT,
            "Accept": "application/sparql-results+json",
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(
                    self.SPARQL_ENDPOINT,
                    params={"query": sparql, "format": "json"},
                    headers=headers,
                )
                if resp.status_code != 200:
                    logger.warning(f"Wikidata SPARQL returned status {resp.status_code}: {resp.text[:200]}")
                    return []

                data = resp.json()
                bindings = data.get("results", {}).get("bindings", [])
                
                results_by_qid: Dict[str, Dict[str, Any]] = {}

                for b in bindings:
                    item_uri = b.get("item", {}).get("value", "")
                    qid = item_uri.split("/")[-1] if "/" in item_uri else ""
                    if not qid:
                        continue

                    ia_id = b.get("iaId", {}).get("value", "").strip()
                    if not ia_id or "/" in ia_id:
                        # Se contiver URLs completas em vez do identificador curto, sanitiza
                        if "archive.org/details/" in ia_id:
                            ia_id = ia_id.split("archive.org/details/")[-1].split("/")[0]

                    title = b.get("title", {}).get("value", "").strip()
                    year_raw = b.get("year", {}).get("value")
                    try:
                        year = int(year_raw) if year_raw else None
                    except ValueError:
                        year = None

                    imdb_id = b.get("imdbId", {}).get("value", "").strip() or None
                    tmdb_raw = b.get("tmdbId", {}).get("value")
                    try:
                        tmdb_id = int(tmdb_raw) if tmdb_raw else None
                    except ValueError:
                        tmdb_id = None

                    runtime_raw = b.get("runtime", {}).get("value")
                    try:
                        runtime_min = int(float(runtime_raw)) if runtime_raw else None
                    except (ValueError, TypeError):
                        runtime_min = None

                    # Ignora se for curta/fragmento curtíssimo (ex: < 15 min com menção de trailer)
                    if title and "trailer" in title.lower():
                        continue

                    # Agrupa ou atualiza campos se o QID já existir
                    if qid not in results_by_qid:
                        results_by_qid[qid] = {
                            "qid": qid,
                            "title": title or qid,
                            "year": year,
                            "ia_id": ia_id,
                            "imdb_id": imdb_id,
                            "tmdb_id": tmdb_id,
                            "runtime_min": runtime_min,
                        }
                    else:
                        existing = results_by_qid[qid]
                        if not existing.get("imdb_id") and imdb_id:
                            existing["imdb_id"] = imdb_id
                        if not existing.get("tmdb_id") and tmdb_id:
                            existing["tmdb_id"] = tmdb_id
                        if not existing.get("runtime_min") and runtime_min:
                            existing["runtime_min"] = runtime_min

                logger.info(f"Wikidata SPARQL returned {len(results_by_qid)} unique film candidates.")
                return list(results_by_qid.values())

        except Exception as e:
            logger.error(f"Erro consultando Wikidata SPARQL: {e}")
            return []
