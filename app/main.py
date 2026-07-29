from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, chat, emails, events, todos

app = FastAPI(title="Jarvis Assistant API", version="1.0.0")

# Allow requests from Frontend (Local + Live Vercel)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://jarvis-o1jkubrlf-erraasif1.vercel.app",  # Aapka Vercel URL
        "https://*.vercel.app"  # Tamam Vercel previews ke liye
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(emails.router)
app.include_router(events.router)
app.include_router(todos.router)