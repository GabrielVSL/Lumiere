from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.models.play import Work
from app.api.v1.play import router as play_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Cria as tabelas automaticamente no startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Auto-seed: se a base estiver vazia, popula automaticamente com os clássicos curados
    try:
        async with AsyncSessionLocal() as session:
            count = (await session.execute(select(func.count(Work.id)))).scalar() or 0
            if count == 0:
                from jobs.seed_curated_works import seed
                await seed()
    except Exception as e:
        print(f"[LIFESPAN] Aviso na verificação de catálogo inicial: {e}")

    yield
    # Limpeza no shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


# Monta as rotas da API v1
app.include_router(play_router, prefix=settings.API_V1_STR)
