import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.seed import seed_database
from app.routers.auth import router as auth_router
from app.routers.orders import router as orders_router
from app.routers.supervisor import router as supervisor_router
from app.routers.ai import router as ai_router
from app.routers.buyer import router as buyer_router
from app.routers.meta import router as meta_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("tiruppur.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting TiruppurTex API Service...")
    await init_db()
    await seed_database()
    logger.info("Initialization complete. Ready to receive requests.")
    yield
    logger.info("Shutting down TiruppurTex API Service.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production order-tracking, run-rate delay warning & buyer view system for Tiruppur knitwear exporters.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Automatic /api path alias middleware (supports both /auth/... and /api/auth/...)
@app.middleware("http")
async def normalize_api_path(request, call_next):
    path = request.url.path
    api_prefixes = ("/auth", "/orders", "/supervisor", "/ai", "/buyer", "/meta")
    if not path.startswith("/api") and any(path.startswith(p) for p in api_prefixes):
        request.scope["path"] = f"/api{path}"
    return await call_next(request)

# Include Routers
app.include_router(auth_router)
app.include_router(orders_router)
app.include_router(supervisor_router)
app.include_router(ai_router)
app.include_router(buyer_router)
app.include_router(meta_router)

@app.get("/")
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "status": "online",
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "database": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)

