"""
Pedestal Backend API
====================
Reinforced Learning Stack – Gen-Z Fintech Micro-Learning Platform

FastAPI application entry point with modular router registration,
CORS middleware, and structured error handling.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Load environment variables before any app imports
load_dotenv()

from app.routes import tracks, lessons, progress, quiz, adaptive, energy, onboarding, auth, admin, leaderboard, portfolio


# ------------------------------------------------------------------
# Lifespan – startup/shutdown events
# ------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    # Startup: validate configuration
    from app.core.config import get_settings
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_key:
        import warnings
        warnings.warn(
            "⚠️  SUPABASE_URL and SUPABASE_KEY are not set. "
            "Database operations will fail. Check your .env file."
        )
    print("🚀 Pedestal Backend starting up...")
    print(f"   Environment: {settings.app_env}")
    print(f"   Debug: {settings.debug}")
    yield
    # Shutdown
    print("👋 Pedestal Backend shutting down...")


# ------------------------------------------------------------------
# FastAPI App
# ------------------------------------------------------------------

app = FastAPI(
    title="Pedestal API",
    description=(
        "Reinforced Learning Stack – Backend API for a Gen-Z fintech "
        "micro-learning platform. Features adaptive learning, energy economy, "
        "gamified progression, and modular micro-lessons."
    ),
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ------------------------------------------------------------------
# CORS Middleware
# ------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# Global Exception Handler
# ------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler for unhandled errors."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred.",
            "type": type(exc).__name__,
        },
    )


# ------------------------------------------------------------------
# Router Registration
# ------------------------------------------------------------------

API_PREFIX = "/api"

app.include_router(tracks.router, prefix=API_PREFIX)
app.include_router(lessons.router, prefix=API_PREFIX)
app.include_router(progress.router, prefix=API_PREFIX)
app.include_router(quiz.router, prefix=API_PREFIX)
app.include_router(adaptive.router, prefix=API_PREFIX)
app.include_router(energy.router, prefix=API_PREFIX)
app.include_router(onboarding.router, prefix=API_PREFIX)
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(admin.router, prefix=API_PREFIX)
app.include_router(leaderboard.router, prefix=API_PREFIX)
app.include_router(portfolio.router, prefix=API_PREFIX)

# ------------------------------------------------------------------
# Health & Root Endpoints
# ------------------------------------------------------------------

@app.get("/", tags=["Health"])
async def root():
    """Root endpoint – API status check."""
    return {
        "status": "ok",
        "service": "Pedestal Backend",
        "version": "2.0.0",
        "docs": "/docs",
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "pedestal-api",
        "version": "2.0.0",
    }
