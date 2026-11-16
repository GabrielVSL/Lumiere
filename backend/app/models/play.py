from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Work(Base):
    __tablename__ = "works"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False, index=True)
    original_title = Column(String(255), nullable=True)
    year = Column(Integer, nullable=True, index=True)
    runtime_min = Column(Integer, nullable=True)
    kind = Column(String(50), default="feature")  # "feature" ou "short"
    
    wikidata_qid = Column(String(50), nullable=True, unique=True, index=True)
    imdb_id = Column(String(50), nullable=True, unique=True, index=True)
    tmdb_id = Column(Integer, nullable=True, unique=True, index=True)
    
    poster_path = Column(String(255), nullable=True)
    backdrop_path = Column(String(255), nullable=True)
    overview_pt = Column(Text, nullable=True)
    tagline = Column(String(255), nullable=True)
    genres = Column(JSON, nullable=True)  # ["Terror", "Mistério", "Clássico"]
    people = Column(JSON, nullable=True)  # {"directors": [...], "writers": [...], "composers": [...]}
    published = Column(Boolean, default=False, index=True)

    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    sources = relationship("Source", back_populates="work", cascade="all, delete-orphan")
    license_assessments = relationship("LicenseAssessment", back_populates="work", cascade="all, delete-orphan")
    review_item = relationship("ReviewItem", back_populates="work", uselist=False, cascade="all, delete-orphan")


class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    work_id = Column(Integer, ForeignKey("works.id", ondelete="CASCADE"), nullable=False, index=True)
    
    provider = Column(String(50), nullable=False)  # "archive", "commons", "blender", "mirror"
    external_id = Column(String(255), nullable=False)
    page_url = Column(Text, nullable=True)
    license_claim = Column(String(255), nullable=True)
    license_url = Column(Text, nullable=True)
    priority = Column(Integer, default=10)  # menor número = maior prioridade
    active = Column(Boolean, default=True, index=True)

    created_at = Column(DateTime(timezone=True), default=utc_now)

    work = relationship("Work", back_populates="sources")
    media_files = relationship("MediaFile", back_populates="source", cascade="all, delete-orphan")
    subtitles = relationship("Subtitle", back_populates="source", cascade="all, delete-orphan")


class MediaFile(Base):
    __tablename__ = "media_files"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_id = Column(Integer, ForeignKey("sources.id", ondelete="CASCADE"), nullable=False, index=True)
    
    url = Column(Text, nullable=False)
    container = Column(String(20), default="mp4")  # "mp4", "webm", "ogv", "m3u8"
    codec = Column(String(20), default="h264")     # "h264", "vp9", "av1"
    height = Column(Integer, nullable=True)        # 1080, 720, 480
    size_bytes = Column(BigInteger, nullable=True)
    duration_s = Column(Integer, nullable=True)
    
    last_check_at = Column(DateTime(timezone=True), nullable=True)
    last_status = Column(Integer, nullable=True)   # HTTP status code (ex: 206)
    fail_count = Column(Integer, default=0)

    source = relationship("Source", back_populates="media_files")


class Subtitle(Base):
    __tablename__ = "subtitles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_id = Column(Integer, ForeignKey("sources.id", ondelete="CASCADE"), nullable=False, index=True)
    
    lang = Column(String(10), nullable=False)      # "pt", "en", "es"
    url = Column(Text, nullable=False)
    origin = Column(String(20), default="human")   # "human" ou "asr"

    source = relationship("Source", back_populates="subtitles")


class LicenseAssessment(Base):
    __tablename__ = "license_assessments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    work_id = Column(Integer, ForeignKey("works.id", ondelete="CASCADE"), nullable=False, index=True)
    
    region = Column(String(10), nullable=False, index=True)  # "BR", "US", "EU", "ALL"
    status = Column(String(50), nullable=False)              # "public_domain", "creative_commons", "protected", "unknown"
    rule = Column(String(100), nullable=False)               # "lei_9610_art_44", "us_pre_1931", etc.
    confidence = Column(String(20), default="medium")        # "high", "medium", "low"
    evidence = Column(JSON, nullable=True)
    assessed_at = Column(DateTime(timezone=True), default=utc_now)

    work = relationship("Work", back_populates="license_assessments")


class ReviewItem(Base):
    __tablename__ = "review_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    work_id = Column(Integer, ForeignKey("works.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    state = Column(String(20), default="candidate", index=True)  # "candidate", "approved", "rejected"
    reason = Column(Text, nullable=True)
    reviewer = Column(String(100), nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)

    work = relationship("Work", back_populates="review_item")


class IngestionRun(Base):
    __tablename__ = "ingestion_runs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    job = Column(String(50), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), default=utc_now)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    stats = Column(JSON, nullable=True)
