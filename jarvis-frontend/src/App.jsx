/**
 * Main Application Dashboard Component
 * ====================================
 * Serves as the central React interface for the JARVIS AI Assistant.
 * Handles authentication state, active workspace tabs, real chat
 * sessions/history, and Microsoft 365 services (Mail, Calendar, To-Do)
 * data synchronization.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare, Mail, Calendar, CheckSquare, LogOut,
  Send, Bot, RefreshCcw, Sparkles, ShieldCheck, Sun, Moon,
  Plus, Trash2, X, AlertCircle, Pencil, Check, History
} from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import LandingPage from "./LandingPage.jsx";
import Logo from "./Logo.jsx";
import ProfilePanel, { applyStoredAccent } from "./ProfilePanel.jsx";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://jarvis-backend-h38f.onrender.com";

// The browser's IANA timezone — sent with every chat message so "tomorrow
// at 3pm" resolves against the user's real local time, and used for
// manually-created events instead of a hardcoded UTC.
const USER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const TABS = [
  { id: "chat", label: "Agent Assistant", icon: MessageSquare },
  { id: "emails", label: "Mail & Drafts", icon: Mail },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "todos", label: "To-Do List", icon: CheckSquare },
];

const INITIAL_MESSAGE = { sender: "jarvis", text: "Hello! I am Jarvis. Tell me what you'd like to manage across your Outlook Mail, Calendar, or To-Dos." };

function relativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function MarkdownMessage({ text }) {
  return (
    <div className="text-[14.5px] leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ node, ...props }) => <p className="my-2" {...props} />,
          ul: ({ node, ...props }) => <ul className="my-2 ml-5 list-disc space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="my-2 ml-5 list-decimal space-y-1" {...props} />,
          li: ({ node, ...props }) => <li className="pl-0.5" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-semibold text-ink" {...props} />,
          h1: ({ node, ...props }) => <h1 className="font-display text-lg font-bold mt-3 mb-1.5" {...props} />,
          h2: ({ node, ...props }) => <h2 className="font-display text-base font-bold mt-3 mb-1.5" {...props} />,
          h3: ({ node, ...props }) => <h3 className="font-display text-sm font-bold mt-2 mb-1" {...props} />,
          a: ({ node, ...props }) => <a className="text-accent underline underline-offset-2" target="_blank" rel="noreferrer" {...props} />,
          code: ({ node, inline, ...props }) =>
            inline
              ? <code className="px-1.5 py-0.5 rounded-md bg-surface-2 border border-border text-[13px] font-mono" {...props} />
              : <code className="block p-3 rounded-xl bg-surface-2 border border-border text-[13px] font-mono overflow-x-auto" {...props} />,
          blockquote: ({ node, ...props }) => <blockquote className="border-l-2 border-accent/40 pl-3 my-2 text-ink-muted italic" {...props} />,
          table: ({ node, ...props }) => <div className="overflow-x-auto my-2"><table className="w-full text-xs border-collapse" {...props} /></div>,
          th: ({ node, ...props }) => <th className="border border-border px-2 py-1.5 bg-surface-2 text-left font-semibold" {...props} />,
          td: ({ node, ...props }) => <td className="border border-border px-2 py-1.5" {...props} />,
          hr: ({ node, ...props }) => <hr className="my-3 border-border" {...props} />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [actionError, setActionError] = useState("");

  const chatEndRef = useRef(null);

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    applyStoredAccent();
  }, []);

  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [emails, setEmails] = useState([]);
  const [events, setEvents] = useState([]);
  const [todos, setTodos] = useState([]);

  // Real conversation sessions (not a decorative filter of in-memory
  // messages) — each has its own id and its own row of messages in Supabase.
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingSessionText, setEditingSessionText] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get("user_email");

    if (userEmail) {
      localStorage.setItem("jarvis_user_email", userEmail);
      setIsAuthenticated(true);
      window.history.replaceState({}, document.title, "/");
    } else {
      const storedEmail = localStorage.getItem("jarvis_user_email");
      if (storedEmail) setIsAuthenticated(true);
    }
  }, []);

  const currentUserEmailFor = () => localStorage.getItem("jarvis_user_email");

  const refreshSessions = () => {
    const userEmail = currentUserEmailFor();
    return fetch(`${API_BASE_URL}/chat/sessions?user_email=${encodeURIComponent(userEmail)}`)
      .then((res) => res.json())
      .then((data) => {
        setSessions(data.sessions || []);
        return data.sessions || [];
      })
      .catch(() => []);
  };

  const loadSession = async (sessionId) => {
    const userEmail = currentUserEmailFor();
    setCurrentSessionId(sessionId);
    setActiveTab("chat");
    try {
      const res = await fetch(`${API_BASE_URL}/chat/history?user_email=${encodeURIComponent(userEmail)}&session_id=${sessionId}`);
      const data = await res.json();
      const past = (data.history || []).map((h) => ({
        sender: h.role === "user" ? "user" : "jarvis",
        text: h.content,
      }));
      setMessages(past.length > 0 ? past : [INITIAL_MESSAGE]);
    } catch {
      setMessages([INITIAL_MESSAGE]);
    }
  };

  // On login: load past sessions, and open the most recent one if any
  // exist — otherwise start a fresh conversation.
  useEffect(() => {
    if (!isAuthenticated) return;
    refreshSessions().then((list) => {
      if (list.length > 0) {
        loadSession(list[0].session_id);
      } else {
        setCurrentSessionId(crypto.randomUUID());
      }
    });
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "emails") fetchEmails();
      if (activeTab === "calendar") fetchEvents();
      if (activeTab === "todos") fetchTodos();
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    if (activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  const handleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/login`;
  };

  const handleLogout = () => {
    localStorage.removeItem("jarvis_user_email");
    setIsAuthenticated(false);
  };

  const handleNewChat = () => {
    setCurrentSessionId(crypto.randomUUID());
    setMessages([INITIAL_MESSAGE]);
    setActiveTab("chat");
  };

  const deleteSession = async (e, sessionId) => {
    e.stopPropagation();
    const userEmail = currentUserEmailFor();
    await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}?user_email=${encodeURIComponent(userEmail)}`, { method: "DELETE" });
    const list = await refreshSessions();
    if (sessionId === currentSessionId) {
      if (list.length > 0) loadSession(list[0].session_id);
      else handleNewChat();
    }
  };

  const renameSession = async (sessionId, newTitle) => {
    if (!newTitle.trim()) return;
    const userEmail = currentUserEmailFor();
    await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_email: userEmail, title: newTitle }),
    });
    setEditingSessionId(null);
    refreshSessions();
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !isAuthenticated || loading) return;

    const userMsg = inputMessage;
    setInputMessage("");
    setLoading(true);

    // Add the user's message, plus an empty placeholder for Jarvis's reply
    // that we'll fill in as chunks arrive.
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }, { sender: "jarvis", text: "" }]);

    const appendToReply = (chunk) => {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { sender: "jarvis", text: next[next.length - 1].text + chunk };
        return next;
      });
    };

    try {
      const userEmail = currentUserEmailFor();
      const res = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: userEmail,
          message: userMsg,
          timezone: USER_TIMEZONE,
          session_id: currentSessionId,
        }),
      });

      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let gotAnyChunk = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop(); // last part may be incomplete — keep for next read

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          const payload = part.slice(6).replace(/\\n/g, "\n");
          if (payload === "[DONE]") continue;
          gotAnyChunk = true;
          appendToReply(payload);
        }
      }

      if (!gotAnyChunk) {
        appendToReply("Request processed successfully.");
      }
      refreshSessions(); // pick up the new/updated session title + ordering
    } catch (err) {
      appendToReply("Error: Unable to reach JARVIS backend service.");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (endpoint, setter) => {
    try {
      const userEmail = currentUserEmailFor();
      const res = await fetch(`${API_BASE_URL}${endpoint}?user_email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : Array.isArray(data.value) ? data.value : [];
      setter(list);
    } catch (err) {
      setter([]);
    }
  };

  const fetchEmails = () => fetchData("/emails", setEmails);

  const [editingEmailId, setEditingEmailId] = useState(null);
  const [editingEmailSubject, setEditingEmailSubject] = useState("");

  const updateEmailDraft = async (emailId, newSubject) => {
    if (!newSubject.trim()) return;
    const userEmail = currentUserEmailFor();
    const res = await fetch(`${API_BASE_URL}/emails/${emailId}?user_email=${encodeURIComponent(userEmail)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: newSubject }),
    });
    await handleApiResult(res, () => { setEditingEmailId(null); fetchEmails(); });
  };

  const deleteEmailDraft = async (emailId) => {
    const userEmail = currentUserEmailFor();
    const res = await fetch(`${API_BASE_URL}/emails/${emailId}?user_email=${encodeURIComponent(userEmail)}`, { method: "DELETE" });
    await handleApiResult(res, fetchEmails);
  };
  const fetchEvents = () => fetchData("/events", setEvents);
  const fetchTodos = () => fetchData("/todos", setTodos);

  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editingTodoText, setEditingTodoText] = useState("");
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [newEvent, setNewEvent] = useState({ subject: "", start: "", end: "" });

  const handleApiResult = async (res, onSuccess) => {
    if (res.ok) {
      setActionError("");
      onSuccess();
    } else {
      const body = await res.json().catch(() => ({}));
      setActionError(body.detail || `Request failed (${res.status})`);
    }
  };

  const createTodo = async (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    const userEmail = currentUserEmailFor();
    const res = await fetch(`${API_BASE_URL}/todos?user_email=${encodeURIComponent(userEmail)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTodoTitle }),
    });
    await handleApiResult(res, () => { setNewTodoTitle(""); fetchTodos(); });
  };

  const toggleTodo = async (task) => {
    const userEmail = currentUserEmailFor();
    const nextStatus = task.status === "completed" ? "notStarted" : "completed";
    const res = await fetch(`${API_BASE_URL}/todos/${task.id}?user_email=${encodeURIComponent(userEmail)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    await handleApiResult(res, fetchTodos);
  };

  const updateTodoTitle = async (taskId, newTitle) => {
    if (!newTitle.trim()) return;
    const userEmail = currentUserEmailFor();
    const res = await fetch(`${API_BASE_URL}/todos/${taskId}?user_email=${encodeURIComponent(userEmail)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    await handleApiResult(res, () => { setEditingTodoId(null); fetchTodos(); });
  };

  const deleteTodo = async (taskId) => {
    const userEmail = currentUserEmailFor();
    const res = await fetch(`${API_BASE_URL}/todos/${taskId}?user_email=${encodeURIComponent(userEmail)}`, { method: "DELETE" });
    await handleApiResult(res, fetchTodos);
  };

  const submitEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.subject || !newEvent.start || !newEvent.end) return;
    const userEmail = currentUserEmailFor();
    const payload = {
      subject: newEvent.subject,
      start: { dateTime: newEvent.start, timeZone: USER_TIMEZONE },
      end: { dateTime: newEvent.end, timeZone: USER_TIMEZONE },
    };
    const url = editingEventId
      ? `${API_BASE_URL}/events/${editingEventId}?user_email=${encodeURIComponent(userEmail)}`
      : `${API_BASE_URL}/events?user_email=${encodeURIComponent(userEmail)}`;
    const res = await fetch(url, {
      method: editingEventId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await handleApiResult(res, () => {
      setNewEvent({ subject: "", start: "", end: "" });
      setShowEventForm(false);
      setEditingEventId(null);
      fetchEvents();
    });
  };

  const toLocalInputValue = (iso) => (iso ? iso.slice(0, 16) : "");

  const openEditEvent = (evt) => {
    setNewEvent({
      subject: evt.subject || "",
      start: toLocalInputValue(evt.start?.dateTime),
      end: toLocalInputValue(evt.end?.dateTime),
    });
    setEditingEventId(evt.id);
    setShowEventForm(true);
  };

  const closeEventForm = () => {
    setShowEventForm(false);
    setEditingEventId(null);
    setNewEvent({ subject: "", start: "", end: "" });
  };

  const deleteEvent = async (eventId) => {
    const userEmail = currentUserEmailFor();
    const res = await fetch(`${API_BASE_URL}/events/${eventId}?user_email=${encodeURIComponent(userEmail)}`, { method: "DELETE" });
    await handleApiResult(res, fetchEvents);
  };

  const currentUserEmail = localStorage.getItem("jarvis_user_email") || "User";

  const ThemeToggleBtn = () => (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2.5 rounded-2xl bg-surface-2 border border-border text-ink hover:text-accent transition-all active:scale-95 cursor-pointer"
      title="Toggle Light/Dark Theme"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );

  const DataCard = ({ title, subtitle, children, icon: Icon, action }) => (
    <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-3xl p-6 md:p-8 shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between gap-3.5 mb-6 pb-5 border-b border-border/80">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-surface-2 border border-border rounded-2xl text-accent shadow-inner">
            <Icon size={22} />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg md:text-xl text-ink tracking-tight">{title}</h3>
            <p className="text-xs md:text-sm text-ink-muted mt-0.5">{subtitle}</p>
          </div>
        </div>
        {action}
      </div>
      {actionError && (
        <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{actionError}</span>
        </div>
      )}
      {children}
    </div>
  );

  if (!isAuthenticated) {
    return <LandingPage onLogin={handleLogin} isDark={isDark} setIsDark={setIsDark} />;
  }

  return (
    <div className="min-h-screen bg-bg text-ink font-body selection:bg-accent/30 transition-colors duration-300">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-surface/70 backdrop-blur-2xl border-r border-border/80 p-6 flex flex-col justify-between relative z-20 shrink-0">
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/80 shrink-0">
              <div className="flex items-center gap-3">
                <Logo size={38} />
                <h2 className="font-display font-bold text-xl tracking-tight text-ink text-glow">Jarvis</h2>
              </div>
              <ThemeToggleBtn />
            </div>

            <button
              onClick={handleNewChat}
              className="w-full mb-6 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-accent text-accent-ink font-semibold hover:opacity-90 transition-all shadow-lg shadow-accent/20 cursor-pointer active:scale-[0.98] shrink-0"
            >
              <Plus size={18} />
              <span>New Chat</span>
            </button>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1 min-h-0">
              <nav className="space-y-1.5">
                <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-ink-muted">
                  Workspace
                </div>
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                        isActive
                          ? "bg-surface-2 text-ink shadow-md border border-border/90"
                          : "text-ink-muted hover:bg-surface-2/60 hover:text-ink"
                      }`}
                    >
                      <Icon size={19} className={isActive ? "text-accent" : "opacity-70"} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Real conversation history — each item is an actual, separate
                  chat session you can reopen, not a decorative filter. */}
              <div className="space-y-1.5">
                <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-ink-muted flex items-center gap-1.5">
                  <History size={13} />
                  <span>History</span>
                </div>
                {sessions.length === 0 ? (
                  <p className="px-3 text-xs text-ink-muted italic">No past conversations yet.</p>
                ) : (
                  <div className="space-y-1">
                    {sessions.map((s) =>
                      editingSessionId === s.session_id ? (
                        <div key={s.session_id} className="flex items-center gap-1.5 px-2 py-1">
                          <input
                            autoFocus
                            type="text"
                            value={editingSessionText}
                            onChange={(e) => setEditingSessionText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") renameSession(s.session_id, editingSessionText);
                              if (e.key === "Escape") setEditingSessionId(null);
                            }}
                            className="flex-1 bg-surface border border-accent/50 rounded-lg px-2.5 py-1.5 text-xs text-ink focus:outline-none"
                          />
                          <button onClick={() => renameSession(s.session_id, editingSessionText)} className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition cursor-pointer shrink-0">
                            <Check size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          key={s.session_id}
                          onClick={() => loadSession(s.session_id)}
                          className={`w-full group flex items-center gap-2 text-left px-3.5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                            s.session_id === currentSessionId
                              ? "bg-surface-2 text-ink border border-border/90"
                              : "text-ink-muted hover:text-ink hover:bg-surface-2/60"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{s.title}</p>
                            <p className="text-[10px] text-ink-muted mt-0.5">{relativeTime(s.last_at)}</p>
                          </div>
                          <span
                            onClick={(e) => { e.stopPropagation(); setEditingSessionId(s.session_id); setEditingSessionText(s.title); }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-ink-muted hover:text-accent hover:bg-accent/10 transition-all shrink-0"
                          >
                            <Pencil size={13} />
                          </span>
                          <span
                            onClick={(e) => deleteSession(e, s.session_id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-ink-muted hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0"
                          >
                            <Trash2 size={13} />
                          </span>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border/80 space-y-3 relative shrink-0">
            {showProfile && (
              <ProfilePanel
                email={currentUserEmail}
                isDark={isDark}
                setIsDark={setIsDark}
                onLogout={handleLogout}
                onClose={() => setShowProfile(false)}
              />
            )}
            <button
              onClick={() => setShowProfile((v) => !v)}
              className="w-full flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-surface-2/60 transition text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-bold text-sm shrink-0">
                {currentUserEmail[0].toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">Connected</span>
                <span className="text-xs font-medium text-ink truncate">{currentUserEmail}</span>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition-all cursor-pointer"
            >
              <LogOut size={15} /> Disconnect Account
            </button>
          </div>
        </aside>

        {/* Workspace View Area */}
        <main className="flex-1 flex flex-col h-full bg-bg relative overflow-hidden">
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
              <div className="px-8 py-4 border-b border-border/80 bg-surface/40 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
                  <Sparkles size={14} className="text-accent" />
                  <span>Autonomous Microsoft 365 Copilot</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Session
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 space-y-6 pb-36 w-full">
                {messages.map((msg, index) => {
                  const isStreamingPlaceholder = loading && index === messages.length - 1 && msg.sender === "jarvis" && msg.text === "";
                  return (
                    <div key={index} className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`flex gap-3.5 max-w-[88%] ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                          msg.sender === "jarvis"
                            ? "bg-linear-to-tr from-accent to-purple-600 text-white"
                            : "bg-surface-2 border border-border text-ink font-bold text-xs"
                        }`}>
                          {msg.sender === "jarvis" ? <Bot size={18} /> : "You"}
                        </div>
                        <div className={`px-5 py-4 rounded-3xl shadow-sm min-w-0 wrap-break-word ${
                          msg.sender === "user"
                            ? "bg-accent text-accent-ink rounded-tr-none font-medium text-[14.5px] leading-relaxed whitespace-pre-wrap"
                            : "bg-surface text-ink border border-border/80 rounded-tl-none w-full"
                        }`}>
                          {isStreamingPlaceholder ? (
                            <span className="flex items-center gap-2 text-xs font-mono text-ink-muted">
                              <RefreshCcw className="animate-spin" size={13} /> Jarvis is thinking...
                            </span>
                          ) : msg.sender === "jarvis" ? (
                            <MarkdownMessage text={msg.text} />
                          ) : (
                            msg.text
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <div className="absolute bottom-6 left-0 right-0 px-6 max-w-4xl mx-auto w-full z-20">
                <form
                  onSubmit={handleSendMessage}
                  className="bg-surface/90 backdrop-blur-2xl border border-border p-2 rounded-full flex gap-3 shadow-2xl focus-within:border-accent transition-all duration-300"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask Jarvis (e.g. 'Summarize unread emails' or 'Schedule a call tomorrow at 3pm')..."
                    className="flex-1 bg-transparent border-none rounded-full px-5 py-3 text-sm text-ink focus:outline-none placeholder:text-ink-muted/70"
                    disabled={loading || !isAuthenticated}
                  />
                  <button
                    type="submit"
                    className="bg-accent text-accent-ink w-11 h-11 rounded-full flex items-center justify-center hover:opacity-90 transition disabled:opacity-30 active:scale-95 shrink-0 shadow-lg shadow-accent/25 cursor-pointer"
                    disabled={loading || !isAuthenticated || !inputMessage.trim()}
                  >
                    <Send size={18} />
                  </button>
                </form>
                <div className="text-center text-[11px] font-mono text-ink-muted/80 mt-2.5 flex items-center justify-center gap-1">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  All email actions wait in Outlook as drafts for safety · {USER_TIMEZONE}
                </div>
              </div>
            </div>
          )}

          {activeTab !== "chat" && (
            <div className="flex-1 p-8 md:p-12 overflow-y-auto space-y-8 max-w-5xl mx-auto w-full">
              {activeTab === "emails" && (
                <DataCard title="Outlook Mailbox" subtitle="Live view of your recent emails and pending drafts." icon={Mail}>
                  {emails.length === 0 ? (
                    <div className="text-center py-14 text-ink-muted">
                      <Mail size={28} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm italic">No recent emails found in Outlook.</p>
                    </div>
                  ) : (
                    emails.map((m, i) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="bg-surface-2/60 border border-border/80 p-5 rounded-2xl mb-4 last:mb-0 hover:border-accent/30 transition-colors"
                      >
                        <div className="flex justify-between items-center mb-2.5 gap-3">
                          {editingEmailId === m.id ? (
                            <input
                              autoFocus
                              type="text"
                              value={editingEmailSubject}
                              onChange={(e) => setEditingEmailSubject(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") updateEmailDraft(m.id, editingEmailSubject);
                                if (e.key === "Escape") setEditingEmailId(null);
                              }}
                              className="flex-1 bg-surface border border-accent/50 rounded-lg px-3 py-1.5 text-sm text-ink focus:outline-none"
                            />
                          ) : (
                            <strong className="text-ink text-base font-semibold truncate">{m.subject || "(No Subject)"}</strong>
                          )}

                          {m.isDraft ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[11px] px-3 py-1 bg-amber/15 text-amber border border-amber/30 rounded-full font-bold uppercase tracking-wider">Draft</span>
                              {editingEmailId === m.id ? (
                                <button onClick={() => updateEmailDraft(m.id, editingEmailSubject)} className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition cursor-pointer">
                                  <Check size={14} />
                                </button>
                              ) : (
                                <button onClick={() => { setEditingEmailId(m.id); setEditingEmailSubject(m.subject || ""); }} className="p-1.5 text-ink-muted hover:text-accent hover:bg-accent/10 rounded-lg transition cursor-pointer">
                                  <Pencil size={14} />
                                </button>
                              )}
                              <button onClick={() => deleteEmailDraft(m.id)} className="p-1.5 text-ink-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition cursor-pointer">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="shrink-0 text-[11px] px-3 py-1 bg-surface-2 text-ink-muted border border-border rounded-full font-medium truncate max-w-[160px]">
                              {m.from?.emailAddress?.name || "Received"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs md:text-sm text-ink-muted leading-relaxed line-clamp-2">{m.bodyPreview || "No preview available."}</p>
                      </motion.div>
                    ))
                  )}
                </DataCard>
              )}

              {activeTab === "calendar" && (
                <DataCard
                  title="Calendar Agenda"
                  subtitle="Your upcoming scheduled events."
                  icon={Calendar}
                  action={
                    <button
                      onClick={() => (showEventForm ? closeEventForm() : setShowEventForm(true))}
                      className="flex items-center gap-1.5 text-xs font-semibold text-accent bg-accent/10 hover:bg-accent/20 border border-accent/30 px-3.5 py-2 rounded-xl transition shrink-0 cursor-pointer"
                    >
                      {showEventForm ? <X size={14} /> : <Plus size={14} />} {showEventForm ? "Cancel" : "Add Event"}
                    </button>
                  }
                >
                  {showEventForm && (
                    <form onSubmit={submitEvent} className="bg-surface-2/60 border border-border/80 p-5 rounded-2xl mb-4 space-y-3">
                      <input
                        type="text"
                        placeholder="Event title"
                        value={newEvent.subject}
                        onChange={(e) => setNewEvent({ ...newEvent, subject: e.target.value })}
                        className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-accent"
                        required
                      />
                      <div className="flex gap-3">
                        <input
                          type="datetime-local"
                          value={newEvent.start}
                          onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                          className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-accent"
                          required
                        />
                        <input
                          type="datetime-local"
                          value={newEvent.end}
                          onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                          className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-accent"
                          required
                        />
                      </div>
                      <button type="submit" className="bg-accent text-accent-ink text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition cursor-pointer">
                        {editingEventId ? "Save Changes" : "Create Event"}
                      </button>
                    </form>
                  )}
                  {events.length === 0 ? (
                    <div className="text-center py-14 text-ink-muted">
                      <Calendar size={28} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm italic">No events found in calendar.</p>
                    </div>
                  ) : (
                    events.map((e, i) => (
                      <motion.div
                        key={e.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="bg-surface-2/60 border border-border/80 p-5 rounded-2xl mb-3.5 flex justify-between items-center hover:border-accent/30 transition-colors"
                      >
                        <div>
                          <strong className="text-ink text-base font-semibold block">{e.subject}</strong>
                          <p className="text-xs text-ink-muted mt-1 font-mono">
                            {new Date(e.start?.dateTime).toLocaleString()} — {new Date(e.end?.dateTime).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => openEditEvent(e)} className="p-2 text-ink-muted hover:text-accent hover:bg-accent/10 rounded-lg transition cursor-pointer">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => deleteEvent(e.id)} className="p-2 text-ink-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition cursor-pointer">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </DataCard>
              )}

              {activeTab === "todos" && (
                <DataCard title="Microsoft To-Do Tasks" subtitle="Active task list from Microsoft To-Do." icon={CheckSquare}>
                  <form onSubmit={createTodo} className="flex gap-3 mb-5">
                    <input
                      type="text"
                      placeholder="Add a new task..."
                      value={newTodoTitle}
                      onChange={(e) => setNewTodoTitle(e.target.value)}
                      className="flex-1 bg-surface-2/60 border border-border/80 rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-accent"
                    />
                    <button type="submit" className="flex items-center gap-1.5 bg-accent text-accent-ink text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition shrink-0 cursor-pointer">
                      <Plus size={16} /> Add
                    </button>
                  </form>
                  {todos.length === 0 ? (
                    <div className="text-center py-14 text-ink-muted">
                      <CheckSquare size={28} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm italic">To-Do list is currently empty.</p>
                    </div>
                  ) : (
                    todos.map((t, i) => (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="bg-surface-2/60 border border-border/80 p-4 rounded-2xl mb-3 flex items-center justify-between gap-3.5 hover:border-accent/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <button
                            onClick={() => toggleTodo(t)}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                              t.status === "completed" ? "bg-accent border-accent text-accent-ink" : "border-border hover:border-accent"
                            }`}
                          >
                            {t.status === "completed" && <Check size={12} strokeWidth={3} />}
                          </button>

                          {editingTodoId === t.id ? (
                            <input
                              type="text"
                              value={editingTodoText}
                              onChange={(e) => setEditingTodoText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") updateTodoTitle(t.id, editingTodoText);
                                if (e.key === "Escape") setEditingTodoId(null);
                              }}
                              className="flex-1 bg-surface border border-border rounded-lg px-2.5 py-1 text-sm text-ink focus:outline-none focus:border-accent"
                              autoFocus
                            />
                          ) : (
                            <span className={`text-sm ${t.status === "completed" ? "line-through text-ink-muted" : "text-ink font-medium"}`}>
                              {t.title}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {editingTodoId === t.id ? (
                            <button onClick={() => updateTodoTitle(t.id, editingTodoText)} className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition cursor-pointer">
                              <Check size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => { setEditingTodoId(t.id); setEditingTodoText(t.title); }}
                              className="p-1.5 text-ink-muted hover:text-accent hover:bg-accent/10 rounded-lg transition cursor-pointer"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          <button onClick={() => deleteTodo(t.id)} className="p-1.5 text-ink-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition cursor-pointer">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </DataCard>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}