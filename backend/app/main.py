import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config.database import verify_database_connection
from .config.env import validate_environment
from .modules.documents.http.routes import router as documents_router
from .modules.openrouter.http.routes import router as openrouter_router
from .modules.usage.http.routes import router as usage_router
from .shared.http import register_error_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_environment()
    await verify_database_connection()
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_methods=["*"],
    allow_headers=["*"],
)
register_error_handlers(app)
app.include_router(documents_router)
app.include_router(openrouter_router)
app.include_router(usage_router)


@app.get("/health")
async def health():
    return {"success": True, "data": {"status": "ok"}}
