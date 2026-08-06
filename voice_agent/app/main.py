"""
Main FastAPI Application Entrypoint
====================================
Configures the core FastAPI app instance, CORS middleware policies for local 
and Vercel preview deployments, router mounts, and global exception handlers.
"""

import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api import auth, chat, emails, events, todos, voice  # ✅ voice add kiya

logger = logging.getLogger(__name__)

# Initialize core FastAPI application metadata
app = FastAPI(
    title="JARVIS AI Assistant API",
    description="Backend microservices powering JARVIS autonomous Microsoft 365 agent.",
    version="1.0.0",
)

# Define explicit origin whitelist for local development and production Vercel deployment
allow_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://jarvis-five-neon.vercel.app",
]

# Append custom configured frontend URL from settings if defined
if settings.FRONTEND_URL and settings.FRONTEND_URL not in allow_origins:
    allow_origins.append(settings.FRONTEND_URL)

# Configure Cross-Origin Resource Sharing (CORS) security policies
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    # Regex wildcard matching for dynamically generated Vercel preview branch deployments
    allow_origin_regex=r"https://jarvis-[a-z0-9]+-erraasif1\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount application feature API routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(emails.router)
app.include_router(events.router)
app.include_router(todos.router)
app.include_router(voice.router)  # ✅ Voice router add kiya


@app.get("/health", tags=["Health Check"])
async def health_check():
    """
    Health check endpoint for container orchestrators and deployment platforms.
    """
    return {"status": "healthy", "service": "JARVIS Assistant API"}


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    Global unhandled exception handler. Ensures all server side errors return structured 
    JSON payloads to prevent client-side parsing failures (`res.json()`).
    """
    logger.exception(f"Unhandled exception during request processing on {request.url}: {exc}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc)},
    )