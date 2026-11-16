from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DB_PATH = (BACKEND_DIR / "lumiere.db").as_posix()


class Settings(BaseSettings):
    PROJECT_NAME: str = "Lumière Cinema API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/v1"

    # Database: defaults to local async SQLite for zero-config local dev,
    # and supports async PostgreSQL (e.g. postgresql+asyncpg://...) in production.
    DATABASE_URL: str = f"sqlite+aiosqlite:///{DEFAULT_DB_PATH}"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://bhflix.vercel.app",
        "https://lumiere.vercel.app",
    ]

    # External APIs
    TMDB_API_KEY: str = ""
    TMDB_BASE_URL: str = "https://api.themoviedb.org/3"

    # Ingestion settings
    USER_AGENT: str = "LumiereIngest/1.0 (portfolio project; contact: dev@lumiere.local)"
    REGION_POLICY: str = "conservative"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
