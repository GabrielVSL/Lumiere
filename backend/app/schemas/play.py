from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class MediaFileOut(BaseModel):
    id: int
    url: str
    container: str
    codec: str
    height: Optional[int] = None
    duration_s: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class SubtitleOut(BaseModel):
    id: int
    lang: str
    url: str
    origin: str

    model_config = ConfigDict(from_attributes=True)


class SourceOut(BaseModel):
    id: int
    provider: str
    external_id: str
    priority: int
    media_files: List[MediaFileOut] = []
    subtitles: List[SubtitleOut] = []

    model_config = ConfigDict(from_attributes=True)


class LicenseSummary(BaseModel):
    region: str
    status: str
    rule: str
    confidence: str
    evidence: Optional[dict] = None


class WorkOut(BaseModel):
    id: int
    title: str
    original_title: Optional[str] = None
    year: Optional[int] = None
    runtime_min: Optional[int] = None
    kind: str
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    overview_pt: Optional[str] = None
    tagline: Optional[str] = None
    genres: List[str] = []
    directors: List[str] = []
    license: Optional[LicenseSummary] = None

    model_config = ConfigDict(from_attributes=True)


class CatalogResponse(BaseModel):
    items: List[WorkOut]
    total: int
    page: int
    total_pages: int


class StreamOption(BaseModel):
    url: str
    container: str
    codec: str
    height: Optional[int] = None
    provider: str
    priority: int


class StreamManifestOut(BaseModel):
    work_id: int
    title: str
    original_title: Optional[str] = None
    year: Optional[int] = None
    runtime_min: Optional[int] = None
    backdrop_path: Optional[str] = None
    poster_path: Optional[str] = None
    overview_pt: Optional[str] = None
    streams: List[StreamOption]
    subtitles: List[SubtitleOut]
    license_status: str
    license_rule: str
    license_confidence: str = "high"
    license_evidence: Optional[dict] = None


class FacetItem(BaseModel):
    name: str
    count: int


class DecadeFacet(BaseModel):
    decade: str
    label: str
    count: int


class FacetsResponse(BaseModel):
    total_works: int
    genres: List[FacetItem]
    decades: List[DecadeFacet]
