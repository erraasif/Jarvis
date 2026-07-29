from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import auth, chat, emails, events, todos

app = FastAPI(title="Jarvis Assistant API", version="1.0.0")

# Allow requests from local dev + the deployed Vercel frontend.
# FRONTEND_URL must be set on Render to your actual Vercel URL, e.g.
# https://jarvis-frontend.vercel.app  (no trailing slash)
allow_origins = ["http://localhost:5173", "http://localhost:3000"]
if settings.FRONTEND_URL and settings.FRONTEND_URL not in allow_origins:
    allow_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(emails.router)
app.include_router(events.router)
app.include_router(todos.router)