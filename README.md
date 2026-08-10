# Jarvis — Voice + Chat AI Assistant for Microsoft 365

Jarvis is a personal assistant that connects to your Microsoft account and
manages your **Mail**, **Calendar**, and **To-Do** list on your behalf —
by text or by **real-time voice**. Ask it in plain language; it reasons
over the request with an LLM agent and calls the right Microsoft Graph API
tools to get it done.

**Live:**
- Frontend: https://jarvis-five-neon.vercel.app
- Backend: https://jarvis-backend-h38f.onrender.com
- Voice agent: hosted on Railway, connects via LiveKit Cloud

## Features

- **Microsoft OAuth sign-in** (Entra ID) with encrypted token storage in Supabase
- **Text chat agent** (LangGraph + Groq/Llama 3.3 70B) that reads your intent
  and picks the right tool
- **Voice Mode** — a full-screen voice interface built on LiveKit's
  `AgentSession` pipeline: Deepgram (speech-to-text) → Groq Llama (reasoning)
  → ElevenLabs (text-to-speech), with a live 3D avatar that reacts to real
  audio levels, not decorative animation
- **Quick actions in Voice Mode** — tapping Mail/Calendar/To-Do sends a real
  message to the agent over a LiveKit data channel and gets a spoken summary,
  not just a UI tab switch
- **Mailbox** — reads and summarizes email, drafts replies/new messages
  - Hard safety constraint: Jarvis **never sends** email. Drafts are created in
    Outlook and wait for you to review and send them yourself.
- **Calendar** — full CRUD (create, read, update, delete) via chat, voice, or the UI
- **To-Do** — full CRUD via chat, voice, or the UI
- **Persistent chat history** — conversations are saved per user and reload on refresh
- **Dark/light theme** with a per-user accent color, saved locally
- **Personalization panel** — editable display name, theme, accent color

## Tech Stack

| Layer | Tech |
|---|---|
| Backend (chat) | FastAPI, LangGraph, LangChain, Groq (`llama-3.3-70b-versatile`), MSAL |
| Voice agent | LiveKit Agents (`AgentSession`), Deepgram STT, ElevenLabs TTS, Silero VAD, Groq LLM |
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion, React Three Fiber + Drei (3D avatar) |
| Real-time | LiveKit Cloud (WebRTC signaling/media) |
| Data | Supabase (Postgres) — encrypted OAuth tokens, chat history |
| Auth | Microsoft Entra ID (OAuth 2.0 / MSAL) |
| Hosting | Backend on Render, frontend on Vercel, voice agent on Railway |

## Architecture

```
jarvis-frontend/            React + Vite SPA
  src/App.jsx                 main dashboard (chat, mail, calendar, todos, voice trigger)
  src/LandingPage.jsx         marketing/sign-in landing page, 3D hero avatar
  src/VoiceMode.jsx           full-screen voice UI, audio-reactive 3D avatar
  src/JarvisMascot.jsx        shared React Three Fiber avatar (color variants per surface)
  src/ProfilePanel.jsx        display name, accent color, theme, disconnect
  src/Logo.jsx                logomark (SVG)

app/                        FastAPI backend (chat + REST)
  main.py                     app entrypoint, CORS
  config.py                   env-driven settings
  api/
    auth.py                   /api/auth/login, /api/auth/callback
    chat.py                   /chat (agent), /chat/history
    voice.py                  /api/voice/token — issues per-user LiveKit room tokens
    emails.py                 /emails (GET)
    events.py                 /events (GET/POST/PATCH/DELETE)
    todos.py                  /todos (GET/POST/PATCH/DELETE)
  agent/
    graph.py                  LangGraph agent + tool binding (the real running prompt)
    tools/                     mail_tools.py, calendar_tools.py, todo_tools.py
  services/
    supabase_client.py         token storage, chat history persistence
    graph_client.py            Microsoft Graph API wrapper

voice_agent/                 LiveKit voice worker (separate deployable, hosted on Railway)
  agent.py                    entrypoint: AgentSession, function_tool wrappers, quick-action handler
  app/agent/tools/             same tool logic mirrored for the voice runtime
```

The backend identifies a signed-in user by **email**, not a bearer token —
every route takes `user_email` as a query param (or body field for `/chat`),
and the OAuth callback redirects to the frontend with `?user_email=...`.
The voice agent identifies the user from LiveKit participant metadata
(embedded in the token issued by `/api/voice/token`), and each user gets
their own LiveKit room so concurrent sessions never cross.

## Local Setup

### Backend (chat)
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
GROQ_API_KEY=
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```

### Voice agent
```bash
cd voice_agent
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python agent.py start
```
Needs the same `GROQ_API_KEY`/`LIVEKIT_*` values above, plus:
```
DEEPGRAM_API_KEY=
ELEVENLABS_API_KEY=
SUPABASE_URL=
SUPABASE_KEY=
TOKEN_ENCRYPTION_KEY=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
AZURE_TENANT_ID=
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
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
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

CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New conversation',
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE
);
```

## Deployment

- **Backend (Render):** root directory is the repo root; start command comes
  from `Procfile`. Set all backend env vars above in Render's Environment tab.
- **Voice agent (Railway):** separate service, same repo. Needs its own copy
  of every env var it uses — Railway and Render do not share variables.
- **Frontend (Vercel):** root directory must be set to `jarvis-frontend` in
  Project Settings. Set `VITE_API_URL` and `VITE_LIVEKIT_URL`, redeploy after
  changing either (Vite bakes env vars in at build time).
- Register both the local and deployed redirect URIs in Entra ID → App
  registrations → Authentication.
- If using LiveKit Cloud's own native agent hosting in addition to a
  self-hosted worker (e.g. Railway), only run one — two workers registered
  under the same project both become eligible to handle sessions, and
  which one wins is not something you control.

## Known constraints / in progress

- Email sending is intentionally not implemented — only drafting. This is a
  hard requirement, not a missing feature.
- Chat history and dashboard data are scoped per signed-in Microsoft account.
- Voice input reliability is sensitive to microphone input level — very quiet
  mic input can fail to trigger voice activity detection even though audio is
  reaching the server correctly.
- Groq's tool-calling occasionally returns a malformed function call
  (`tool_use_failed` / `failed_generation`), a known upstream reliability
  quirk; the agent automatically retries once before falling back to a
  plain-text response.
