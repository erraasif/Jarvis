# Jarvis — AI Assistant for Microsoft 365

Jarvis is a chat-based personal assistant that connects to your Microsoft account
and manages your **Mail**, **Calendar**, and **To-Do** list on your behalf. Ask it
in plain language — it reasons over the request with an LLM agent and calls the
right Microsoft Graph API tools to get it done.

**Live:**
- Frontend: https://jarvis-five-neon.vercel.app
- Backend: https://jarvis-backend-h38f.onrender.com

## Features

- **Microsoft OAuth sign-in** (Entra ID) with encrypted token storage in Supabase
- **Conversational agent** (LangGraph + OpenAI) that reads your intent and picks the right tool
- **Mailbox** — reads and summarizes email, drafts replies/new messages
  - Hard safety constraint: Jarvis **never sends** email. Drafts are created in
    Outlook and wait for you to review and send them yourself.
- **Calendar** — full CRUD (create, read, update, delete) via chat or the UI
- **To-Do** — full CRUD via chat or the UI
- **Persistent chat history** — conversations are saved per user and reload on refresh
- **Dark/light theme** with a per-user accent color, saved locally
- **Personalization panel** — editable display name, theme, accent color

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI, LangGraph, LangChain, OpenAI (`gpt-4o`), MSAL |
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion |
| Data | Supabase (Postgres) — encrypted OAuth tokens, chat history |
| Auth | Microsoft Entra ID (OAuth 2.0 / MSAL) |
| Hosting | Backend on Render, frontend on Vercel |

## Architecture

```
jarvis-frontend/          React + Vite SPA
  src/App.jsx              main dashboard (chat, mail, calendar, todos)
  src/LandingPage.jsx       marketing/sign-in landing page
  src/ProfilePanel.jsx      display name, accent color, theme, disconnect
  src/Logo.jsx              logomark (SVG)

app/                      FastAPI backend
  main.py                  app entrypoint, CORS
  config.py                env-driven settings
  api/
    auth.py                 /api/auth/login, /api/auth/callback
    chat.py                 /chat (agent), /chat/history
    emails.py                /emails (GET)
    events.py                /events (GET/POST/PATCH/DELETE)
    todos.py                 /todos (GET/POST/PATCH/DELETE)
  agent/
    graph.py                 LangGraph agent + tool binding
    tools/                    mail_tools.py, calendar_tools.py, todo_tools.py
  services/
    supabase_client.py        token storage, chat history persistence
    graph_client.py            Microsoft Graph API wrapper
```

The backend identifies a signed-in user by **email**, not a bearer token —
every route takes `user_email` as a query param (or body field for `/chat`),
and the OAuth callback redirects to the frontend with `?user_email=...`.

## Local Setup

### Backend
```bash
cd Jarvis
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Create a `.env` file (see `.env.example`) with:
```
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
AZURE_TENANT_ID=common
AZURE_REDIRECT_URI=http://localhost:8000/api/auth/callback
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=
SUPABASE_KEY=
TOKEN_ENCRYPTION_KEY=
OPENAI_API_KEY=
```

### Frontend
```bash
cd jarvis-frontend
npm install
npm run dev
```

Create `jarvis-frontend/.env`:
```
VITE_API_URL=http://localhost:8000
```

### Supabase schema
```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

## Deployment

- **Backend (Render):** root directory is the repo root; start command comes
  from `Procfile` (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`). Set all
  backend env vars above in Render's Environment tab, with `AZURE_REDIRECT_URI`
  and `FRONTEND_URL` pointing at the deployed URLs.
- **Frontend (Vercel):** root directory must be set to `jarvis-frontend` in
  Project Settings. Set `VITE_API_URL` to the deployed backend URL and
  redeploy after changing it (Vite bakes env vars in at build time).
- Register both the local and deployed redirect URIs in Entra ID → App
  registrations → Authentication.

## Known constraints

- Email sending is intentionally not implemented — only drafting. This is a
  hard requirement, not a missing feature.
- Chat history and dashboard data are scoped per signed-in Microsoft account.