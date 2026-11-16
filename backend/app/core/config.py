import json
from pathlib import Path
from typing import Any, List, Union
from pydantic import field_validator
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

    # CORS: Whitelist explícita de domínios autorizados (sem wildcard *)
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://lumiere.vercel.app",
    ]

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            clean_v = v.strip()
            if not clean_v:
                return [
                    "http://localhost:5173",
                    "http://localhost:3000",
                    "https://lumiere.vercel.app",
                ]
            if clean_v.startswith("[") and clean_v.endswith("]"):
                try:
                    parsed = json.loads(clean_v)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except Exception:
                    pass
            # Suporta formato separado por vírgula: "https://site1.vercel.app, https://site2.vercel.app"
            return [origin.strip() for origin in clean_v.split(",") if origin.strip()]
        elif isinstance(v, (list, tuple)):
            return [str(item).strip() for item in v if str(item).strip()]
        return v

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
