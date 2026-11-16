from typing import List, Optional
from collections import Counter
import ipaddress
import os
from pathlib import Path
import re
from urllib.parse import urlparse
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy import select, func, cast, String
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings, BACKEND_DIR
from app.core.database import get_db
from app.models.play import Work, Source, MediaFile, Subtitle, LicenseAssessment
from app.schemas.play import (
    CatalogResponse,
    WorkOut,
    StreamManifestOut,
    StreamOption,
    SubtitleOut,
    LicenseSummary,
    FacetsResponse,
    FacetItem,
    DecadeFacet,
)
from app.services.license_engine import LicenseEngine

router = APIRouter(prefix="/play", tags=["Lumière Play"])

# Diretórios autorizados para leitura local de legendas
ALLOWED_SUBTITLE_DIRS = [
    (BACKEND_DIR / "data" / "subtitles").resolve(),
    (BACKEND_DIR / "cache" / "subtitles").resolve(),
]


def escape_like(val: str) -> str:
    """Escapa caracteres especiais do operador LIKE/ILIKE para evitar wildcard injection."""
    return val.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def is_safe_external_url(url: str) -> bool:
    """
    Guarda anti-SSRF: valida que a URL externa não aponta para endereços locais,
    privados ou metadados de nuvem sensíveis.
    """
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
        hostname = parsed.hostname
        if not hostname:
            return False
        hostname_lower = hostname.lower()
        if hostname_lower in ("localhost", "127.0.0.1", "0.0.0.0", "::1", "metadata.google.internal"):
            return False
        try:
            ip = ipaddress.ip_address(hostname)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                return False
        except ValueError:
            pass
        return True
    except Exception:
        return False


def srt_to_vtt(text: str) -> str:
    """Converte conteúdo SubRip (.srt) ou WebVTT em formato WEBVTT válido."""
    cleaned = text.replace("\r\n", "\n").replace("\r", "\n").lstrip("\ufeff").strip()
    if cleaned.startswith("WEBVTT"):
        return cleaned + "\n"
    # Converte timestamps SRT (00:01:23,456 --> 00:01:25,789) para WebVTT (00:01:23.456 --> 00:01:25.789)
    vtt_body = re.sub(
        r"(\d{2}:\d{2}:\d{2}),(\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}),(\d{3})",
        r"\1.\2 --> \3.\4",
        cleaned,
    )
    return "WEBVTT\n\n" + vtt_body + "\n"


def get_request_region(request: Request, override_region: Optional[str] = None) -> str:
    # 1. Parâmetro explícito de query (permitido para testes/dev)
    if override_region:
        return override_region.upper()
    # 2. Header de geolocalização da Vercel / Cloudflare
    header_country = request.headers.get("x-vercel-ip-country") or request.headers.get("cf-ipcountry")
    if header_country and len(header_country) == 2:
        return header_country.upper()
    # 3. Padrão: Brasil
    return "BR"


@router.get("/catalog", response_model=CatalogResponse)
async def get_play_catalog(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    kind: Optional[str] = Query(None, description="'feature' ou 'short'"),
    genre: Optional[str] = Query(None, description="Filtro por gênero"),
    decade: Optional[str] = Query(None, description="Filtro por década (ex: '1920', '1930', '1940', '1950', 'pre-1920')"),
    sort: Optional[str] = Query("popular", description="Ordenação: 'popular', 'year_desc', 'year_asc', 'title'"),
    search: Optional[str] = Query(None, description="Busca textual por título"),
    region: Optional[str] = Query(None, description="Código de país ISO 2 (ex: BR)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Retorna o catálogo de obras em domínio público com filtros estritos no SQL
    e paginação determinística.
    """
    user_region = get_request_region(request, region)

    # Base query: apenas obras publicadas
    query = (
        select(Work)
        .where(Work.published.is_(True))
        .options(
            selectinload(Work.license_assessments),
            selectinload(Work.sources).selectinload(Source.media_files),
        )
    )
    count_query = select(func.count(Work.id)).where(Work.published.is_(True))

    # Filtro por tipo (longa vs curta)
    if kind:
        query = query.where(Work.kind == kind)
        count_query = count_query.where(Work.kind == kind)

    # Filtro textual por título ou título original (com escape contra wildcard injection)
    if search and search.strip():
        search_pattern = f"%{escape_like(search.strip())}%"
        query = query.where((Work.title.ilike(search_pattern)) | (Work.original_title.ilike(search_pattern)))
        count_query = count_query.where((Work.title.ilike(search_pattern)) | (Work.original_title.ilike(search_pattern)))

    # Filtro por gênero diretamente em SQL (com escape contra wildcard injection)
    if genre and genre.strip():
        genre_clean = genre.strip()
        genre_pattern = f"%{escape_like(genre_clean)}%"
        query = query.where(cast(Work.genres, String).ilike(genre_pattern))
        count_query = count_query.where(cast(Work.genres, String).ilike(genre_pattern))

    # Filtro por década
    if decade:
        dec = decade.strip().lower()
        if dec == "1950":
            query = query.where(Work.year >= 1950, Work.year <= 1955)
            count_query = count_query.where(Work.year >= 1950, Work.year <= 1955)
        elif dec == "1940":
            query = query.where(Work.year >= 1940, Work.year <= 1949)
            count_query = count_query.where(Work.year >= 1940, Work.year <= 1949)
        elif dec == "1930":
            query = query.where(Work.year >= 1930, Work.year <= 1939)
            count_query = count_query.where(Work.year >= 1930, Work.year <= 1939)
        elif dec == "1920":
            query = query.where(Work.year >= 1920, Work.year <= 1929)
            count_query = count_query.where(Work.year >= 1920, Work.year <= 1929)
        elif dec == "pre-1920" or dec == "1910":
            query = query.where(Work.year < 1920)
            count_query = count_query.where(Work.year < 1920)

    # Contagem total calculada no SQL ANTES da paginação
    total = (await db.execute(count_query)).scalar() or 0

    # Ordenação
    if sort == "year_desc":
        query = query.order_by(Work.year.desc().nullslast(), Work.title.asc())
    elif sort == "year_asc":
        query = query.order_by(Work.year.asc().nullslast(), Work.title.asc())
    elif sort == "title":
        query = query.order_by(Work.title.asc())
    else:  # "popular" (prioriza os que tem match no TMDB e pôster original)
        query = query.order_by(
            Work.tmdb_id.isnot(None).desc(),
            Work.year.desc().nullslast(),
            Work.title.asc()
        )

    # Paginação em SQL
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    result = await db.execute(query)
    works = result.scalars().all()

    items: List[WorkOut] = []
    for work in works:
        work_genres = work.genres or []

        # Avalia a licença para a região do visitante
        assessment = next(
            (la for la in work.license_assessments if la.region == user_region), None
        )
        if not assessment:
            eval_res = LicenseEngine.evaluate(work.year, region=user_region)
            license_summary = LicenseSummary(
                region=eval_res.region,
                status=eval_res.status,
                rule=eval_res.rule,
                confidence=eval_res.confidence,
                evidence=eval_res.evidence,
            )
        else:
            license_summary = LicenseSummary(
                region=assessment.region,
                status=assessment.status,
                rule=assessment.rule,
                confidence=assessment.confidence,
                evidence=assessment.evidence,
            )

        directors = []
        if work.people and isinstance(work.people, dict):
            directors = work.people.get("directors", [])

        items.append(
            WorkOut(
                id=work.id,
                title=work.title,
                original_title=work.original_title,
                year=work.year,
                runtime_min=work.runtime_min,
                kind=work.kind or "feature",
                poster_path=work.poster_path,
                backdrop_path=work.backdrop_path,
                overview_pt=work.overview_pt,
                tagline=work.tagline,
                genres=work_genres,
                directors=directors,
                license=license_summary,
            )
        )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return CatalogResponse(
        items=items,
        total=total,
        page=page,
        total_pages=total_pages,
    )


@router.get("/facets", response_model=FacetsResponse)
async def get_play_facets(db: AsyncSession = Depends(get_db)):
    """
    Retorna métricas e facetas agregadas de gêneros e décadas presentes no acervo.
    """
    works_res = await db.execute(
        select(Work.genres, Work.year).where(Work.published.is_(True))
    )
    rows = works_res.fetchall()
    total_works = len(rows)

    genre_counter: Counter = Counter()
    decade_counter: Counter = Counter()

    for row_genres, year in rows:
        if row_genres and isinstance(row_genres, list):
            for g in row_genres:
                clean_g = str(g).strip().title()
                if clean_g:
                    genre_counter[clean_g] += 1
        
        if year:
            if year >= 1950:
                decade_counter["1950"] += 1
            elif year >= 1940:
                decade_counter["1940"] += 1
            elif year >= 1930:
                decade_counter["1930"] += 1
            elif year >= 1920:
                decade_counter["1920"] += 1
            else:
                decade_counter["pre-1920"] += 1

    # Formata lista de gêneros mais frequentes
    genres_list = [
        FacetItem(name=name, count=count)
        for name, count in genre_counter.most_common(20)
    ]

    decades_list = [
        DecadeFacet(decade="1950", label="Anos 1950 (1950-1955)", count=decade_counter["1950"]),
        DecadeFacet(decade="1940", label="Anos 1940", count=decade_counter["1940"]),
        DecadeFacet(decade="1930", label="Anos 1930", count=decade_counter["1930"]),
        DecadeFacet(decade="1920", label="Anos 1920", count=decade_counter["1920"]),
        DecadeFacet(decade="pre-1920", label="Cinema Primitivo (Até 1919)", count=decade_counter["pre-1920"]),
    ]

    return FacetsResponse(
        total_works=total_works,
        genres=genres_list,
        decades=decades_list,
    )


@router.get("/stream/{work_id}", response_model=StreamManifestOut)
@router.get("/works/{work_id}/stream", response_model=StreamManifestOut)
async def get_stream_manifest(
    work_id: int,
    request: Request,
    region: Optional[str] = Query(None, description="Código de país ISO 2 (ex: BR)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Retorna o manifesto de reprodução do filme para o player web nativo (HTML5 video).
    Apenas títulos avaliados como 'public_domain' ou 'creative_commons' para a região
    são liberados com status HTTP 200.
    """
    user_region = get_request_region(request, region)

    query = (
        select(Work)
        .where(Work.id == work_id, Work.published.is_(True))
        .options(
            selectinload(Work.license_assessments),
            selectinload(Work.sources).selectinload(Source.media_files),
            selectinload(Work.sources).selectinload(Source.subtitles),
        )
    )
    result = await db.execute(query)
    work = result.scalars().first()

    if not work:
        raise HTTPException(status_code=404, detail="Obra não encontrada ou não publicada.")

    # Verificação estrita de licença
    assessment = next(
        (la for la in work.license_assessments if la.region == user_region), None
    )
    if not assessment:
        eval_res = LicenseEngine.evaluate(work.year, region=user_region)
        status = eval_res.status
        rule = eval_res.rule
        confidence = eval_res.confidence
        evidence = eval_res.evidence
    else:
        status = assessment.status
        rule = assessment.rule
        confidence = assessment.confidence
        evidence = assessment.evidence

    if status not in ("public_domain", "creative_commons"):
        raise HTTPException(
            status_code=403,
            detail=f"Reprodução indisponível para a região {user_region}: obra sob restrição autoral.",
        )

    # Coleta todas as opções de stream de fontes ativas
    stream_options: List[StreamOption] = []
    subtitles_list: List[SubtitleOut] = []

    # Ordena fontes por prioridade crescente (1 = maior prioridade)
    active_sources = sorted(
        [s for s in work.sources if s.active], key=lambda s: s.priority
    )

    base_url = str(request.base_url).rstrip("/")

    for source in active_sources:
        sorted_mfs = sorted(
            [mf for mf in source.media_files if mf.fail_count < 3],
            key=lambda m: (m.height or 0),
            reverse=True,
        )
        for mf in sorted_mfs:
            stream_options.append(
                StreamOption(
                    url=mf.url,
                    container=mf.container,
                    codec=mf.codec,
                    height=mf.height,
                    provider=source.provider,
                    priority=source.priority,
                )
            )

        sorted_subs = sorted(
            source.subtitles,
            key=lambda sb: (0 if sb.lang.startswith("pt") else 1, 0 if sb.origin == "curated" else 1),
        )
        for sub in sorted_subs:
            subtitles_list.append(
                SubtitleOut(
                    id=sub.id,
                    lang=sub.lang,
                    url=f"{base_url}/v1/play/subtitles/{sub.id}.vtt",
                    origin=sub.origin,
                )
            )

    if not stream_options:
        raise HTTPException(
            status_code=503,
            detail="Nenhuma fonte de reprodução ativa disponível no momento para este título.",
        )

    return StreamManifestOut(
        work_id=work.id,
        title=work.title,
        original_title=work.original_title,
        year=work.year,
        runtime_min=work.runtime_min,
        backdrop_path=work.backdrop_path,
        poster_path=work.poster_path,
        overview_pt=work.overview_pt,
        streams=stream_options,
        subtitles=subtitles_list,
        license_status=status,
        license_rule=rule,
        license_confidence=confidence,
        license_evidence=evidence,
    )


@router.get("/subtitles/{subtitle_id}.vtt")
async def get_subtitle_vtt(
    subtitle_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Entrega a legenda em formato WebVTT (text/vtt; charset=utf-8) com validação de segurança:
    - Prevenção contra SSRF para URLs externas (bloqueio de IPs privados e loopback)
    - Verificação estrita de certificados SSL/TLS (verify=True)
    - Prevenção contra Directory Traversal em arquivos locais de legenda
    """
    res = await db.execute(select(Subtitle).where(Subtitle.id == subtitle_id))
    sub = res.scalars().first()
    if not sub:
        raise HTTPException(status_code=404, detail="Legenda não encontrada.")

    raw_text = ""
    if sub.url.startswith(("http://", "https://")):
        if not is_safe_external_url(sub.url):
            raise HTTPException(status_code=400, detail="Origem de legenda externa inválida ou restrita.")
        try:
            async with httpx.AsyncClient(follow_redirects=True, verify=True, timeout=12.0) as client:
                resp = await client.get(sub.url)
                if resp.status_code == 200:
                    try:
                        raw_text = resp.content.decode("utf-8")
                    except UnicodeDecodeError:
                        raw_text = resp.content.decode("latin-1", errors="replace")
        except Exception:
            raw_text = "WEBVTT\n\n"
    else:
        # Validação estrita de Path Traversal para caminhos locais
        try:
            target_path = Path(sub.url).resolve()
            is_authorized = any(target_path.is_relative_to(allowed_dir) for allowed_dir in ALLOWED_SUBTITLE_DIRS)
            if is_authorized and target_path.is_file():
                with open(target_path, "r", encoding="utf-8", errors="replace") as f:
                    raw_text = f.read()
            else:
                raw_text = "WEBVTT\n\n"
        except Exception:
            raw_text = "WEBVTT\n\n"

    vtt_content = srt_to_vtt(raw_text) if raw_text else "WEBVTT\n\n"
    return Response(
        content=vtt_content,
        media_type="text/vtt; charset=utf-8",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600",
            "X-Content-Type-Options": "nosniff",
        },
    )
