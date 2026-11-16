import argparse
import asyncio
import logging
import os
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, func
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.play import Work, Source, MediaFile, Subtitle, LicenseAssessment, ReviewItem, IngestionRun
from app.clients.internet_archive import InternetArchiveClient
from app.clients.tmdb import TMDBClient
from app.clients.wikidata import WikidataClient
from app.services.license_engine import LicenseEngine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("lumiere_ingest")


async def ingest_catalog(target_count: int = 220, concurrency: int = 4):
    """
    Orquestrador de ingestão em lote do catálogo Lumière Play.
    Descobre obras em domínio público (ano <= 1955) via Wikidata e Internet Archive,
    enriquece metadados e pôsteres via TMDB e armazena no banco de dados.
    """
    start_time = datetime.now(timezone.utc)
    logger.info(f"Iniciando ingestão em lote: Alvo = {target_count} obras publicadas...")

    ia_client = InternetArchiveClient(timeout=20.0)
    tmdb_client = TMDBClient()
    wikidata_client = WikidataClient(timeout=35.0)

    stats = {
        "target": target_count,
        "existing_before": 0,
        "candidates_evaluated": 0,
        "added": 0,
        "updated": 0,
        "skipped_legal": 0,
        "skipped_no_mp4": 0,
        "skipped_duplicate": 0,
        "total_published_after": 0,
    }

    # 1. Cria tabelas se não existirem
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Coleta IDs já existentes no banco para não duplicar
    existing_archive_ids: Set[str] = set()
    existing_tmdb_ids: Set[int] = set()
    existing_imdb_ids: Set[str] = set()

    async with AsyncSessionLocal() as session:
        count_res = await session.execute(select(func.count(Work.id)).where(Work.published.is_(True)))
        current_published = count_res.scalar_one() or 0
        stats["existing_before"] = current_published
        logger.info(f"Obras já cadastradas e publicadas no banco: {current_published}")

        sources_res = await session.execute(select(Source.external_id).where(Source.provider == "archive"))
        for row in sources_res.fetchall():
            existing_archive_ids.add(row[0].strip())

        works_res = await session.execute(select(Work.tmdb_id, Work.imdb_id))
        for t_id, im_id in works_res.fetchall():
            if t_id:
                existing_tmdb_ids.add(t_id)
            if im_id:
                existing_imdb_ids.add(im_id.strip())

    if current_published >= target_count:
        logger.info(f"Meta de {target_count} obras já atingida ({current_published} no banco).")
        return

    # 3. Coleta candidatos via Wikidata SPARQL (pré-1956 com Archive.org ID)
    logger.info("Etapa 1: Consultando Wikidata SPARQL...")
    wikidata_candidates = await wikidata_client.fetch_public_domain_films(min_year=1900, max_year=1955, limit=500)
    logger.info(f"Wikidata retornou {len(wikidata_candidates)} candidatos.")

    # 4. Coleta candidatos diretamente do Internet Archive nas coleções principais
    logger.info("Etapa 2: Consultando Internet Archive Search...")
    ia_candidates: List[Dict[str, Any]] = []
    collections = ["feature_films", "silent_films", "film_noir", "SciFi_Horror"]
    for col in collections:
        for page in (1, 2, 3):
            docs = await ia_client.search_classic_films(collection=col, min_year=1900, max_year=1955, rows=50, page=page)
            for d in docs:
                ia_id = d.get("identifier", "").strip()
                if not ia_id:
                    continue
                year_raw = d.get("year")
                try:
                    year = int(year_raw) if year_raw else None
                except (ValueError, TypeError):
                    year = None

                title = d.get("title") or ia_id
                if isinstance(title, list):
                    title = title[0] if title else ia_id

                ia_candidates.append({
                    "ia_id": ia_id,
                    "title": str(title),
                    "year": year,
                    "imdb_id": None,
                    "tmdb_id": None,
                    "qid": None,
                    "description": d.get("description", ""),
                })
    logger.info(f"Internet Archive search retornou {len(ia_candidates)} candidatos.")

    # Unifica candidatos priorizando os da Wikidata (que já trazem QID e IMDb)
    all_candidates: List[Dict[str, Any]] = []
    seen_candidate_ia_ids: Set[str] = set()

    for c in wikidata_candidates:
        ia_id = c["ia_id"]
        if ia_id and ia_id not in seen_candidate_ia_ids:
            seen_candidate_ia_ids.add(ia_id)
            all_candidates.append(c)

    for c in ia_candidates:
        ia_id = c["ia_id"]
        if ia_id and ia_id not in seen_candidate_ia_ids:
            seen_candidate_ia_ids.add(ia_id)
            all_candidates.append(c)

    logger.info(f"Total de candidatos únicos para validação: {len(all_candidates)}")

    # 5. Processamento concorrente com semáforo
    sem = asyncio.Semaphore(concurrency)
    published_counter = current_published

    async def process_candidate(candidate: Dict[str, Any]):
        nonlocal published_counter
        if published_counter >= target_count:
            return

        archive_id = candidate.get("ia_id")
        if not archive_id or archive_id in existing_archive_ids:
            stats["skipped_duplicate"] += 1
            return

        async with sem:
            stats["candidates_evaluated"] += 1
            raw_year = candidate.get("year")

            # 5a. Metadados do Internet Archive
            meta = await ia_client.get_item_metadata(archive_id)
            if not meta:
                return

            meta_data = meta.get("metadata", {})
            title_meta = meta_data.get("title") or candidate.get("title") or archive_id
            if isinstance(title_meta, list):
                title_meta = title_meta[0]
            title_str = str(title_meta).strip()

            # Descarta itens que contenham 'trailer' ou que sejam episódios de rádio/áudio
            if "trailer" in title_str.lower() or "radio" in title_str.lower():
                return

            year_candidate = raw_year
            if not year_candidate:
                y_str = meta_data.get("year") or meta_data.get("date")
                if y_str:
                    try:
                        year_candidate = int(str(y_str)[:4])
                    except ValueError:
                        pass

            # 5b. Auditoria Jurídica Estrita (Art. 44, Lei 9.610/98)
            if not year_candidate or year_candidate > 1955 or year_candidate < 1890:
                stats["skipped_legal"] += 1
                return

            license_br = LicenseEngine.evaluate(year=year_candidate, region="BR")
            license_us = LicenseEngine.evaluate(year=year_candidate, region="US")
            if license_br.status != "public_domain":
                stats["skipped_legal"] += 1
                return

            # 5c. Seleciona melhor arquivo MP4
            best_mp4 = ia_client.pick_best_mp4(archive_id, meta)
            if not best_mp4:
                stats["skipped_no_mp4"] += 1
                return

            # 5d. Enriquecimento via TMDB
            tmdb_match = None
            imdb_id = candidate.get("imdb_id")
            tmdb_id = candidate.get("tmdb_id")

            if imdb_id:
                tmdb_match = await tmdb_client.find_by_imdb_id(imdb_id)
            
            if not tmdb_match and tmdb_id:
                tmdb_match = await tmdb_client.get_movie_details(tmdb_id)

            if not tmdb_match:
                # Tenta buscar por título e ano
                clean_title = title_str.split("(")[0].strip()
                search_results = await tmdb_client.search_movie(clean_title, year=year_candidate)
                if search_results:
                    tmdb_match = search_results[0]

            final_title = title_str
            original_title = title_str
            overview = None
            tagline = None
            poster_url = None
            backdrop_url = None
            genres: List[str] = ["Clássico", "Cinema"]
            dur_s = best_mp4.get("duration_s") or 0
            runtime_min = candidate.get("runtime_min") or (dur_s // 60 if dur_s > 0 else 80)

            if tmdb_match:
                tmdb_id = tmdb_match.get("id")
                # Se esse TMDB ID já foi cadastrado para outro archive_id, pula para evitar duplicatas
                if tmdb_id in existing_tmdb_ids:
                    stats["skipped_duplicate"] += 1
                    return

                # Pega detalhes completos para ter créditos e sinopse em pt-BR
                details = await tmdb_client.get_movie_details(tmdb_id)
                data_src = details or tmdb_match

                final_title = data_src.get("title") or title_str
                original_title = data_src.get("original_title") or title_str
                overview = data_src.get("overview")
                tagline = data_src.get("tagline")
                if data_src.get("runtime"):
                    runtime_min = data_src["runtime"]

                poster_url = tmdb_client.get_poster_url(data_src.get("poster_path"), size="w500")
                backdrop_url = tmdb_client.get_backdrop_url(data_src.get("backdrop_path"), size="original")

                # Gêneros
                if "genres" in data_src and isinstance(data_src["genres"], list):
                    genres = [g["name"] for g in data_src["genres"] if "name" in g]
                elif "genre_ids" in data_src:
                    genres = tmdb_client.map_genre_ids(data_src["genre_ids"])

            # Fallback de pôster e backdrop se TMDB não tiver
            if not poster_url:
                poster_url = ia_client.get_thumbnail_url(archive_id)
            if not backdrop_url:
                backdrop_url = poster_url

            if not overview:
                desc_raw = meta_data.get("description", "")
                if isinstance(desc_raw, list):
                    desc_raw = " ".join(desc_raw)
                # Remove tags HTML simples
                import re
                clean_desc = re.sub(r"<[^>]+>", "", str(desc_raw)).strip()
                overview = clean_desc[:400] if clean_desc else f"Clássico do cinema lançado em {year_candidate} em domínio público."

            # 5e. Salva no banco de dados
            try:
                async with AsyncSessionLocal() as session:
                    # Verifica de novo dentro da transação
                    check_exist = await session.execute(
                        select(Source.id).where(Source.provider == "archive", Source.external_id == archive_id)
                    )
                    if check_exist.scalar_one_or_none():
                        return

                    work = Work(
                        title=final_title,
                        original_title=original_title,
                        year=year_candidate,
                        runtime_min=runtime_min,
                        kind="feature" if (runtime_min and runtime_min >= 40) else "short",
                        wikidata_qid=candidate.get("qid"),
                        imdb_id=imdb_id,
                        tmdb_id=tmdb_id,
                        poster_path=poster_url,
                        backdrop_path=backdrop_url,
                        overview_pt=overview,
                        tagline=tagline,
                        genres=genres or ["Clássico", "Cinema"],
                        published=True,
                    )
                    session.add(work)
                    await session.flush()

                    source = Source(
                        work_id=work.id,
                        provider="archive",
                        external_id=archive_id,
                        page_url=f"https://archive.org/details/{archive_id}",
                        priority=1,
                        active=True,
                    )
                    session.add(source)
                    await session.flush()

                    media = MediaFile(
                        source_id=source.id,
                        url=best_mp4["url"],
                        container="mp4",
                        codec="h264",
                        height=best_mp4.get("height") or 480,
                        size_bytes=best_mp4.get("size_bytes"),
                        duration_s=best_mp4.get("duration_s") or (runtime_min * 60),
                        last_status=206,
                        fail_count=0,
                    )
                    session.add(media)

                    # Legendas
                    subtitles = ia_client.extract_subtitles(archive_id, meta)
                    for sub in subtitles:
                        session.add(
                            Subtitle(
                                source_id=source.id,
                                lang=sub["lang"],
                                url=sub["url"],
                                origin=sub["origin"],
                            )
                        )

                    # Avaliação de Direitos
                    session.add(
                        LicenseAssessment(
                            work_id=work.id,
                            region="BR",
                            status=license_br.status,
                            rule=license_br.rule,
                            confidence=license_br.confidence,
                            evidence=license_br.evidence,
                        )
                    )
                    session.add(
                        LicenseAssessment(
                            work_id=work.id,
                            region="US",
                            status=license_us.status,
                            rule=license_us.rule,
                            confidence=license_us.confidence,
                            evidence=license_us.evidence,
                        )
                    )

                    # ReviewItem aprovado
                    session.add(
                        ReviewItem(
                            work_id=work.id,
                            state="approved",
                            reason=f"Ingestão automática verificada: Lei 9.610/98 Art. 44 ({year_candidate} <= 1955).",
                            reviewer="lumiere_auto_ingest",
                        )
                    )

                    await session.commit()

                    existing_archive_ids.add(archive_id)
                    if tmdb_id:
                        existing_tmdb_ids.add(tmdb_id)
                    if imdb_id:
                        existing_imdb_ids.add(imdb_id)

                    published_counter += 1
                    stats["added"] += 1
                    logger.info(f"[{published_counter}/{target_count}] + Adicionado: '{final_title}' ({year_candidate}) | IA: {archive_id}")

            except Exception as e:
                logger.error(f"Erro ao salvar obra {archive_id}: {e}")

    # Processa candidatos em lotes
    tasks = [process_candidate(cand) for cand in all_candidates]
    await asyncio.gather(*tasks)

    # 6. Salva IngestionRun
    end_time = datetime.now(timezone.utc)
    stats["total_published_after"] = published_counter

    async with AsyncSessionLocal() as session:
        run_record = IngestionRun(
            job="ingest_catalog_batch",
            started_at=start_time,
            finished_at=end_time,
            stats=stats,
        )
        session.add(run_record)
        await session.commit()

    logger.info(f"Ingestão concluída em {(end_time - start_time).total_seconds():.1f}s.")
    logger.info(f"Resultado: {published_counter} obras publicadas no total (Adicionados nesta rodada: {stats['added']}).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingestão em lote do catálogo Lumière Play")
    parser.add_argument("--target", type=int, default=210, help="Meta de filmes publicados (ex: 210)")
    parser.add_argument("--concurrency", type=int, default=4, help="Número de tarefas simultâneas")
    args = parser.parse_args()

    asyncio.run(ingest_catalog(target_count=args.target, concurrency=args.concurrency))
