from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import auth, chat, emails, events, todos

app = FastAPI(title="Jarvis Assistant API", version="1.0.0")

# Allow requests from local dev + the deployed Vercel frontend.
# FRONTEND_URL should also be set on Render to your production Vercel URL,
# but we don't rely on that alone — Vercel gives every deploy (including
# previews) its own unique subdomain, e.g. jarvis-<hash>-erraasif1.vercel.app,
# so we also allow any preview URL under that project via regex.
allow_origins = ["http://localhost:5173", "http://localhost:3000", "https://jarvis-five-neon.vercel.app"]
if settings.FRONTEND_URL and settings.FRONTEND_URL not in allow_origins:
    allow_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=r"https://jarvis-[a-z0-9]+-erraasif1\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(emails.router)
app.include_router(events.router)
app.include_router(todos.router)