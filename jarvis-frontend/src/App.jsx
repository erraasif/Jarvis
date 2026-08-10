/**
 * Jarvis Dashboard - Enterprise Modern UI
 * Features: Persisted pinned sessions, 3-dot dropdown popover, Collapsible Drawer, Voice Mode
 */

import React, { useState, useEffect, useRef, Suspense } from "react";
import {
  MessageSquare, Mail, Calendar, CheckSquare,
  Send, Bot, RefreshCcw, Sparkles, ShieldCheck, Sun, Moon,
  Plus, Trash2, X, AlertCircle, Pencil, Check, History,
  PanelLeftClose, MoreVertical, Pin, PinOff,
  Mic, MicOff, Volume2, Copy, CalendarClock, ListTodo
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Room } from 'livekit-client';
const VoiceMode = React.lazy(() => import('./VoiceMode'));

import LandingPage from "./LandingPage.jsx";
import Logo from "./Logo.jsx";
import ProfilePanel, { applyStoredAccent } from "./ProfilePanel.jsx";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://jarvis-backend-h38f.onrender.com";
const USER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || "wss://jarvis-i1h3f3dn.livekit.cloud";

const TABS = [
  { id: "chat", label: "Agent Assistant", icon: MessageSquare },
  { id: "emails", label: "Mail & Drafts", icon: Mail },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "todos", label: "To-Do List", icon: CheckSquare },
];

const INITIAL_MESSAGE = { sender: "jarvis", text: "Hello! I am Jarvis. How can I assist you with your Outlook Mail, Calendar, or Tasks today?" };

const STARTER_PROMPTS = [
  { icon: Mail, text: "Summarize my recent emails" },
  { icon: CalendarClock, text: "What's on my calendar today?" },
  { icon: ListTodo, text: "Add a task to my to-do list" },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.warn("Copy failed:", e);
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-surface-2 text-ink-muted hover:text-ink cursor-pointer"
      title="Copy message"
    >
      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
    </button>
  );
}

function MarkdownMessage({ text }) {
  return (
    <div className="text-[15px] leading-[1.7] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
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
  // ============ STATE ============
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [actionError, setActionError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenuSessionId, setActiveMenuSessionId] = useState(null);
  const chatEndRef = useRef(null);

  // Voice state
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [voiceConnecting, setVoiceConnecting] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceModeVisible, setVoiceModeVisible] = useState(false);
  const [displayName, setDisplayName] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("jarvis_display_name") : null
  );
  const voiceRoomRef = useRef(null);

  // Theme
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  // Data states
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [emails, setEmails] = useState([]);
  const [events, setEvents] = useState([]);
  const [todos, setTodos] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingSessionText, setEditingSessionText] = useState("");

  // CRUD states
  const [editingEmailId, setEditingEmailId] = useState(null);
  const [editingEmailSubject, setEditingEmailSubject] = useState("");
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editingTodoText, setEditingTodoText] = useState("");
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [newEvent, setNewEvent] = useState({ subject: "", start: "", end: "" });

  // ============ HELPERS ============
  const currentUserEmailFor = () => localStorage.getItem("jarvis_user_email") || "";

  // ============ EFFECTS ============
  // Theme effect
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

  // Accent color
  useEffect(() => {
    applyStoredAccent();
  }, []);

  // Authentication
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

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuSessionId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Load sessions on auth
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

  // Fetch data on tab change
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "emails") fetchEmails();
      if (activeTab === "calendar") fetchEvents();
      if (activeTab === "todos") fetchTodos();
    }
  }, [activeTab, isAuthenticated]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // ============ VOICE CONNECTION ============
  const connectVoice = async () => {
    const userEmail = currentUserEmailFor();
    if (!userEmail) {
      setVoiceError("Please sign in first");
      return;
    }

    if (voiceConnected) {
      if (voiceRoomRef.current) {
        await voiceRoomRef.current.disconnect();
        voiceRoomRef.current = null;
      }
      document.querySelectorAll('audio[data-livekit-audio]').forEach((el) => el.remove());
      setVoiceConnected(false);
      setIsSpeaking(false);
      setVoiceModeVisible(false);
      return;
    }

    setVoiceConnecting(true);
    setVoiceError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/voice/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: userEmail,
          timezone: USER_TIMEZONE
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.status}`);
      }

      const { token } = await response.json();

      const room = new Room({
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        adaptiveStream: true,
        dynacast: true,
      });

      room.on('connected', () => {
        setVoiceConnected(true);
        setVoiceModeVisible(true);
        setVoiceConnecting(false);
        setVoiceError("");
        console.log('🎤 Voice connected!');
      });

      room.on('disconnected', () => {
        setVoiceConnected(false);
        setIsSpeaking(false);
        setVoiceModeVisible(false);
        document.querySelectorAll('audio[data-livekit-audio]').forEach((el) => el.remove());
        console.log('🎤 Voice disconnected');
      });

      room.on('participantConnected', (participant) => {
        if (participant.identity === 'jarvis-agent') {
          setIsSpeaking(true);
        }
      });

      room.on('participantDisconnected', (participant) => {
        if (participant.identity === 'jarvis-agent') {
          setIsSpeaking(false);
        }
      });

      room.on('trackSubscribed', (track) => {
        if (track.kind === 'audio') {
          console.log('🔊 Audio track received');
          const audioEl = track.attach();
          audioEl.dataset.livekitAudio = 'true';
          audioEl.autoplay = true;
          document.body.appendChild(audioEl);
        }
      });

      room.on('trackUnsubscribed', (track) => {
        if (track.kind === 'audio') {
          track.detach().forEach((el) => el.remove());
        }
      });

      await room.connect(LIVEKIT_URL, token);
      voiceRoomRef.current = room;

      try {
        await room.localParticipant.setMicrophoneEnabled(true);
        console.log('🎙️ Microphone enabled and publishing');
      } catch (micError) {
        console.error('Microphone permission error:', micError);
        setVoiceError('Microphone access denied — check your browser permissions.');
      }

    } catch (error) {
      console.error('Voice connection error:', error);
      setVoiceError(error.message || 'Failed to connect voice');
      setVoiceConnecting(false);
    }
  };

  // ============ SESSION MANAGEMENT ============
  const refreshSessions = () => {
    const userEmail = currentUserEmailFor();
    if (!userEmail) return Promise.resolve([]);
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
    if (!userEmail) return;
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

  // ============ AUTH HANDLERS ============
  const handleLogin = () => { window.location.href = `${API_BASE_URL}/api/auth/login`; };
  
  const handleLogout = async () => {
    if (voiceRoomRef.current) {
      try {
        await voiceRoomRef.current.disconnect();
      } catch (e) {
        console.warn("Error disconnecting voice room during logout:", e);
      }
      voiceRoomRef.current = null;
    }
    setVoiceConnected(false);
    setVoiceModeVisible(false);
    localStorage.removeItem("jarvis_user_email");
    setIsAuthenticated(false);
  };

  const handleNewChat = () => {
    setCurrentSessionId(crypto.randomUUID());
    setMessages([INITIAL_MESSAGE]);
    setActiveTab("chat");
  };

  // ============ SESSION CRUD ============
  const deleteSessionOptimistic = async (sessionId) => {
    setActiveMenuSessionId(null);
    const userEmail = currentUserEmailFor();
    const originalSessions = [...sessions];
    const updated = sessions.filter((s) => s.session_id !== sessionId);
    setSessions(updated);

    if (sessionId === currentSessionId) {
      if (updated.length > 0) loadSession(updated[0].session_id);
      else handleNewChat();
    }

    try {
      await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}?user_email=${encodeURIComponent(userEmail)}`, { method: "DELETE" });
    } catch {
      setSessions(originalSessions);
    }
  };

  const renameSessionOptimistic = async (sessionId, newTitle) => {
    if (!newTitle.trim()) return;
    setActiveMenuSessionId(null);
    setEditingSessionId(null);
    const userEmail = currentUserEmailFor();
    const originalSessions = [...sessions];

    setSessions((prev) =>
      prev.map((s) => (s.session_id === sessionId ? { ...s, title: newTitle } : s))
    );

    try {
      await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: userEmail, title: newTitle }),
      });
    } catch {
      setSessions(originalSessions);
    }
  };

  const togglePinOptimistic = async (sessionId) => {
    setActiveMenuSessionId(null);
    const userEmail = currentUserEmailFor();
    const originalSessions = [...sessions];
    const target = sessions.find((s) => s.session_id === sessionId);
    const nextPinned = !target?.isPinned;

    setSessions((prev) =>
      prev.map((s) => (s.session_id === sessionId ? { ...s, isPinned: nextPinned } : s))
    );

    try {
      await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/pin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: userEmail, is_pinned: nextPinned }),
      });
    } catch {
      setSessions(originalSessions);
    }
  };

  // ============ CHAT HANDLER ============
  const handleSendMessage = async (e, overrideText) => {
    if (e) e.preventDefault();
    const userEmail = currentUserEmailFor();
    const userMsg = overrideText ?? inputMessage;
    if (!userMsg.trim() || !userEmail || loading) return;

    setInputMessage("");
    setLoading(true);
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }, { sender: "jarvis", text: "" }]);

    const appendToReply = (chunk) => {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { sender: "jarvis", text: next[next.length - 1].text + chunk };
        return next;
      });
    };

    try {
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
        buffer = parts.pop();

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          const payload = part.slice(6).replace(/\\n/g, "\n");
          if (payload === "[DONE]") continue;
          gotAnyChunk = true;
          appendToReply(payload);
        }
      }

      if (!gotAnyChunk) appendToReply("Request processed successfully.");
      refreshSessions();
    } catch (err) {
      appendToReply("Error: Unable to reach JARVIS backend service.");
    } finally {
      setLoading(false);
    }
  };

  // ============ DATA FETCHING ============
  const fetchData = async (endpoint, setter) => {
    try {
      const userEmail = currentUserEmailFor();
      if (!userEmail) return;
      const res = await fetch(`${API_BASE_URL}${endpoint}?user_email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : Array.isArray(data.value) ? data.value : [];
      setter(list);
    } catch {
      setter([]);
    }
  };

  const fetchEmails = () => fetchData("/emails", setEmails);
  const fetchEvents = () => fetchData("/events", setEvents);
  const fetchTodos = () => fetchData("/todos", setTodos);

  // ============ API HELPERS ============
  const handleApiResult = async (res, onSuccess) => {
    if (res.ok) {
      setActionError("");
      onSuccess();
    } else {
      const body = await res.json().catch(() => ({}));
      setActionError(body.detail || `Request failed (${res.status})`);
    }
  };

  // ============ EMAIL CRUD ============
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

  // ============ TODO CRUD ============
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

  // ============ EVENT CRUD ============
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

  // ============ RENDER HELPERS ============
  const currentUserEmail = currentUserEmailFor() || "Connected Account";
  const pinnedSessions = sessions.filter((s) => s.isPinned);
  const unpinnedSessions = sessions.filter((s) => !s.isPinned);

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

  // ============ RENDER ============
  if (!isAuthenticated) {
    return <LandingPage onLogin={handleLogin} isDark={isDark} setIsDark={setIsDark} />;
  }

  return (
    <div className="min-h-screen bg-bg text-ink font-body selection:bg-accent/30 transition-colors duration-300">
      {voiceConnected && voiceModeVisible && (
        <Suspense fallback={<div className="fixed inset-0 z-[100] bg-bg/98" />}>
          <VoiceMode
            voiceRoomRef={voiceRoomRef}
            isSpeaking={isSpeaking}
            voiceConnecting={voiceConnecting}
            onDisconnect={connectVoice}
            onMinimize={() => setVoiceModeVisible(false)}
            onQuickAction={(tabId) => {
              setActiveTab(tabId);
              setVoiceModeVisible(false);
            }}
          />
        </Suspense>
      )}
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-64 md:w-72" : "w-16"
          } bg-surface/80 backdrop-blur-2xl border-r border-border/70 p-3.5 flex flex-col justify-between relative z-20 shrink-0 transition-all duration-300 ease-in-out`}
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60 shrink-0">
              {sidebarOpen ? (
                <div className="flex items-center gap-2.5 px-1">
                  <Logo size={30} />
                  <span className="font-display font-bold text-lg tracking-tight text-ink">Jarvis</span>
                </div>
              ) : (
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="mx-auto p-1.5 rounded-xl hover:bg-surface-2 transition cursor-pointer"
                  title="Expand sidebar"
                >
                  <Logo size={24} />
                </button>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-2 transition cursor-pointer ${!sidebarOpen ? "hidden" : ""}`}
                title="Collapse sidebar"
              >
                <PanelLeftClose size={18} />
              </button>
            </div>

            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className={`w-full mb-4 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-accent text-accent-ink font-semibold hover:opacity-90 transition-all shadow-md shadow-accent/15 cursor-pointer active:scale-[0.98] shrink-0 btn-pulse-glow ${
                !sidebarOpen ? "px-0" : ""
              }`}
              title="New Chat"
            >
              <Plus size={18} />
              {sidebarOpen && <span className="text-sm">New Chat</span>}
            </button>

            <div className="flex-1 overflow-y-auto space-y-5 pr-0.5 min-h-0 custom-scrollbar">
              {/* Workspace Apps */}
              <nav className="space-y-1">
                {sidebarOpen && (
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                    Workspace
                  </div>
                )}
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      title={!sidebarOpen ? tab.label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer ${
                        isActive
                          ? "bg-surface-2 text-ink shadow-sm border border-border/80"
                          : "text-ink-muted hover:bg-surface-2/60 hover:text-ink"
                      } ${!sidebarOpen ? "justify-center px-0" : ""}`}
                    >
                      <Icon size={18} className={isActive ? "text-accent" : "opacity-75"} />
                      {sidebarOpen && <span className="truncate">{tab.label}</span>}
                    </button>
                  );
                })}
              </nav>

              {/* Chat History */}
              {sidebarOpen && (
                <div className="space-y-4">
                  {pinnedSessions.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-ink-muted flex items-center gap-1.5">
                        <Pin size={11} className="text-accent" />
                        <span>Pinned</span>
                      </div>
                      <div className="space-y-0.5">
                        {pinnedSessions.map((s) =>
                          renderSessionRow(s, currentSessionId, editingSessionId, editingSessionText, activeMenuSessionId, {
                            loadSession, setEditingSessionId, setEditingSessionText, renameSessionOptimistic, togglePinOptimistic, deleteSessionOptimistic, setActiveMenuSessionId
                          })
                        )}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-ink-muted flex items-center gap-1.5">
                      <History size={11} />
                      <span>Recent</span>
                    </div>
                    {unpinnedSessions.length === 0 && pinnedSessions.length === 0 ? (
                      <p className="px-2.5 text-xs text-ink-muted italic">No past chats.</p>
                    ) : (
                      <div className="space-y-0.5">
                        {unpinnedSessions.map((s) =>
                          renderSessionRow(s, currentSessionId, editingSessionId, editingSessionText, activeMenuSessionId, {
                            loadSession, setEditingSessionId, setEditingSessionText, renameSessionOptimistic, togglePinOptimistic, deleteSessionOptimistic, setActiveMenuSessionId
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Profile Section */}
          <div className="pt-3 border-t border-border/60 space-y-2 relative shrink-0">
            {showProfile && (
              <ProfilePanel
                email={currentUserEmail}
                isDark={isDark}
                setIsDark={setIsDark}
                onLogout={handleLogout}
                onClose={() => setShowProfile(false)}
                onDisplayNameChange={setDisplayName}
              />
            )}
            
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowProfile((v) => !v)}
                className={`flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-surface-2/60 transition text-left cursor-pointer ${
                  !sidebarOpen ? "justify-center w-full" : "flex-1 min-w-0"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-bold text-xs shrink-0">
                  {currentUserEmail ? currentUserEmail[0].toUpperCase() : "U"}
                </div>
                {sidebarOpen && (
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-semibold text-ink truncate">{displayName || currentUserEmail}</span>
                    <span className="text-[10px] text-ink-muted truncate">{currentUserEmail}</span>
                  </div>
                )}
              </button>

              {sidebarOpen && (
                <button
                  onClick={() => setIsDark(!isDark)}
                  className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-2 transition cursor-pointer"
                  title="Toggle Theme"
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full bg-bg relative overflow-hidden">
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
              {/* Header */}
              <div className="px-6 py-3 border-b border-border/60 bg-surface/30 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
                  <Sparkles size={14} className="text-accent" />
                  <span>Autonomous M365 Copilot</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-mono bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
                  </div>
                  {/* Voice Button */}
                  <button
                    onClick={connectVoice}
                    disabled={voiceConnecting}
                    className={`
                      relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer
                      ${voiceConnected 
                        ? 'bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30' 
                        : voiceConnecting
                        ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 animate-pulse cursor-wait'
                        : 'bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30'
                      }
                    `}
                    title={voiceConnected ? "Disconnect voice" : "Connect voice"}
                  >
                    {voiceConnecting ? (
                      <>
                        <RefreshCcw size={14} className="animate-spin" />
                        <span className="hidden sm:inline">Connecting...</span>
                      </>
                    ) : voiceConnected ? (
                      <>
                        {isSpeaking ? <Volume2 size={14} className="animate-pulse" /> : <MicOff size={14} />}
                        <span className="hidden sm:inline">{isSpeaking ? 'Jarvis Speaking' : 'Voice On'}</span>
                      </>
                    ) : (
                      <>
                        <Mic size={14} />
                        <span className="hidden sm:inline">Voice Mode</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Voice Error */}
              {voiceError && (
                <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{voiceError}</span>
                  <button onClick={() => setVoiceError('')} className="ml-auto hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 pb-36 w-full max-w-4xl mx-auto custom-scrollbar">
                {messages.length === 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="flex flex-wrap gap-2 justify-center pt-2"
                  >
                    {STARTER_PROMPTS.map((p) => {
                      const Icon = p.icon;
                      return (
                        <button
                          key={p.text}
                          onClick={() => handleSendMessage(null, p.text)}
                          disabled={loading || !isAuthenticated}
                          className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-border bg-surface/70 hover:border-accent/50 hover:bg-surface-2 transition-colors text-xs text-ink-muted hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Icon size={13} className="text-accent" />
                          {p.text}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
                <AnimatePresence initial={false}>
                {messages.map((msg, index) => {
                  const isStreamingPlaceholder = loading && index === messages.length - 1 && msg.sender === "jarvis" && msg.text === "";
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className={`group flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                          msg.sender === "jarvis"
                            ? "bg-linear-to-tr from-accent to-purple-600 text-white"
                            : "bg-surface-2 border border-border text-ink font-bold text-xs"
                        }`}>
                          {msg.sender === "jarvis" ? <Bot size={16} /> : "You"}
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className={`px-4 py-3.5 rounded-2xl shadow-sm min-w-0 ${
                            msg.sender === "user"
                              ? "bg-accent text-accent-ink font-medium text-[15px] leading-[1.7]"
                              : "bg-surface text-ink border border-border/80 w-full"
                          }`}>
                            {isStreamingPlaceholder ? (
                              <span className="flex items-center gap-2 text-xs font-mono text-ink-muted">
                                <RefreshCcw className="animate-spin" size={13} /> Thinking...
                              </span>
                            ) : msg.sender === "jarvis" ? (
                              <MarkdownMessage text={msg.text} />
                            ) : (
                              msg.text
                            )}
                          </div>
                          {!isStreamingPlaceholder && msg.text && (
                            <div className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} px-1`}>
                              <CopyButton text={msg.text} />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="absolute bottom-6 left-0 right-0 px-4 max-w-3xl mx-auto w-full z-20">
                <form
                  onSubmit={handleSendMessage}
                  className="bg-surface/95 backdrop-blur-2xl border border-border/80 p-2 rounded-full flex items-center gap-2 shadow-2xl focus-within:border-accent transition-all duration-300"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={voiceConnected ? "💬 Type or speak to Jarvis..." : "Ask Jarvis to search emails, add tasks, or plan events..."}
                    className="flex-1 bg-transparent border-none rounded-full px-4 py-2.5 text-sm text-ink focus:outline-none placeholder:text-ink-muted/70"
                    disabled={loading || !isAuthenticated}
                  />
                  {voiceConnected && (
                    <button
                      type="button"
                      onClick={() => setVoiceModeVisible(true)}
                      className="flex items-center gap-1 px-1"
                      title="Reopen voice mode"
                    >
                      <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-accent animate-pulse' : 'bg-emerald-500'}`} />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="bg-accent text-accent-ink w-10 h-10 rounded-full flex items-center justify-center hover:opacity-90 transition disabled:opacity-30 active:scale-95 shrink-0 shadow-md cursor-pointer"
                    disabled={loading || !isAuthenticated || !inputMessage.trim()}
                  >
                    <Send size={16} />
                  </button>
                </form>
                <div className="text-center text-[10px] font-mono text-ink-muted/80 mt-2 flex items-center justify-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  Jarvis operates safely on draft mode · {USER_TIMEZONE}
                  {voiceConnected && (
                    <span className="ml-2 text-accent">· 🎤 Voice active</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Other Tabs */}
          {activeTab !== "chat" && (
            <div className="flex-1 p-6 md:p-10 overflow-y-auto space-y-8 max-w-4xl mx-auto w-full">
              {/* Emails */}
              {activeTab === "emails" && (
                <DataCard title="Outlook Mailbox" subtitle="Live view of your recent emails and pending drafts." icon={Mail}>
                  {emails.length === 0 ? (
                    <div className="text-center py-12 text-ink-muted">
                      <Mail size={26} className="mx-auto mb-2 opacity-30" />
                      <p className="text-xs italic">No recent emails found in Outlook.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {emails.map((m) => (
                        <div key={m.id} className="p-3.5 bg-surface-2/40 border border-border/50 rounded-2xl flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-xs text-ink truncate">{m.from?.emailAddress?.name || m.from?.emailAddress?.address || "Unknown sender"}</span>
                              {m.isDraft && (
                                <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-mono font-bold">Draft</span>
                              )}
                            </div>
                            {editingEmailId === m.id ? (
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="text"
                                  value={editingEmailSubject}
                                  onChange={(e) => setEditingEmailSubject(e.target.value)}
                                  className="bg-surface border border-accent rounded-lg px-2.5 py-1 text-xs text-ink flex-1"
                                />
                                <button onClick={() => updateEmailDraft(m.id, editingEmailSubject)} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded">
                                  <Check size={14} />
                                </button>
                                <button onClick={() => setEditingEmailId(null)} className="p-1 text-ink-muted hover:bg-surface-2 rounded">
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs font-medium text-ink/90 truncate">{m.subject || "(No Subject)"}</p>
                            )}
                          </div>
                          {m.isDraft && editingEmailId !== m.id && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => { setEditingEmailId(m.id); setEditingEmailSubject(m.subject || ""); }} className="p-1.5 text-ink-muted hover:text-accent hover:bg-surface-2 rounded-lg">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => deleteEmailDraft(m.id)} className="p-1.5 text-ink-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </DataCard>
              )}

              {/* Calendar */}
              {activeTab === "calendar" && (
                <DataCard
                  title="Outlook Calendar"
                  subtitle="Your upcoming schedule synced directly from Microsoft 365."
                  icon={Calendar}
                  action={
                    <button
                      onClick={() => setShowEventForm(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-accent-ink rounded-xl text-xs font-semibold hover:opacity-90 transition cursor-pointer"
                    >
                      <Plus size={14} /> Add Event
                    </button>
                  }
                >
                  {showEventForm && (
                    <form onSubmit={submitEvent} className="mb-6 p-4 bg-surface-2/80 border border-border rounded-2xl space-y-3">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                          {editingEventId ? "Edit Event" : "New Event"}
                        </h4>
                        <button type="button" onClick={closeEventForm} className="text-ink-muted hover:text-ink">
                          <X size={15} />
                        </button>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-ink-muted mb-1">Subject</label>
                        <input
                          type="text"
                          required
                          value={newEvent.subject}
                          onChange={(e) => setNewEvent({ ...newEvent, subject: e.target.value })}
                          className="w-full bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-accent"
                          placeholder="Team Sync..."
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-ink-muted mb-1">Start Time</label>
                          <input
                            type="datetime-local"
                            required
                            value={newEvent.start}
                            onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                            className="w-full bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-accent"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-ink-muted mb-1">End Time</label>
                          <input
                            type="datetime-local"
                            required
                            value={newEvent.end}
                            onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                            className="w-full bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-accent"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={closeEventForm} className="px-3 py-1 text-xs text-ink-muted hover:bg-surface rounded-lg">
                          Cancel
                        </button>
                        <button type="submit" className="px-3.5 py-1 text-xs font-semibold bg-accent text-accent-ink rounded-lg hover:opacity-90">
                          {editingEventId ? "Save" : "Create"}
                        </button>
                      </div>
                    </form>
                  )}

                  {events.length === 0 ? (
                    <div className="text-center py-12 text-ink-muted">
                      <Calendar size={26} className="mx-auto mb-2 opacity-30" />
                      <p className="text-xs italic">No calendar events found.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {events.map((evt) => (
                        <div key={evt.id} className="p-3.5 bg-surface-2/40 border border-border/50 rounded-2xl flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-xs text-ink truncate">{evt.subject}</h4>
                            <p className="text-[11px] text-ink-muted mt-0.5 font-mono">
                              {evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "N/A"}
                              {" — "}
                              {evt.end?.dateTime ? new Date(evt.end.dateTime).toLocaleString([], { timeStyle: 'short' }) : "N/A"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => openEditEvent(evt)} className="p-1.5 text-ink-muted hover:text-accent hover:bg-surface-2 rounded-lg">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => deleteEvent(evt.id)} className="p-1.5 text-ink-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </DataCard>
              )}

              {/* Todos */}
              {activeTab === "todos" && (
                <DataCard title="Microsoft To-Do" subtitle="Manage your tasks synchronized live with Microsoft To-Do." icon={CheckSquare}>
                  <form onSubmit={createTodo} className="flex gap-2 mb-5">
                    <input
                      type="text"
                      value={newTodoTitle}
                      onChange={(e) => setNewTodoTitle(e.target.value)}
                      placeholder="Add a new task..."
                      className="flex-1 bg-surface-2/50 border border-border rounded-xl px-3.5 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                    />
                    <button type="submit" className="px-3.5 py-2 bg-accent text-accent-ink rounded-xl text-xs font-semibold hover:opacity-90 flex items-center gap-1 cursor-pointer">
                      <Plus size={14} /> Add
                    </button>
                  </form>

                  {todos.length === 0 ? (
                    <div className="text-center py-12 text-ink-muted">
                      <CheckSquare size={26} className="mx-auto mb-2 opacity-30" />
                      <p className="text-xs italic">No tasks in your Microsoft To-Do list.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {todos.map((task) => (
                        <div key={task.id} className="p-3 bg-surface-2/40 border border-border/50 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              onClick={() => toggleTodo(task)}
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
                                task.status === "completed"
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "border-border hover:border-accent"
                              }`}
                            >
                              {task.status === "completed" && <Check size={10} />}
                            </button>
                            {editingTodoId === task.id ? (
                              <div className="flex items-center gap-1 flex-1">
                                <input
                                  type="text"
                                  value={editingTodoText}
                                  onChange={(e) => setEditingTodoText(e.target.value)}
                                  className="bg-surface border border-accent rounded px-2 py-0.5 text-xs text-ink flex-1"
                                />
                                <button onClick={() => updateTodoTitle(task.id, editingTodoText)} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded">
                                  <Check size={12} />
                                </button>
                                <button onClick={() => setEditingTodoId(null)} className="p-1 text-ink-muted hover:bg-surface-2 rounded">
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <span className={`text-xs font-medium truncate ${task.status === "completed" ? "line-through text-ink-muted" : "text-ink"}`}>
                                {task.title}
                              </span>
                            )}
                          </div>
                          {editingTodoId !== task.id && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => { setEditingTodoId(task.id); setEditingTodoText(task.title); }} className="p-1 text-ink-muted hover:text-accent hover:bg-surface-2 rounded">
                                <Pencil size={12} />
                              </button>
                              <button onClick={() => deleteTodo(task.id)} className="p-1 text-ink-muted hover:text-red-500 hover:bg-red-500/10 rounded">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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

// ============ SESSION ROW HELPER ============
function renderSessionRow(
  s,
  currentSessionId,
  editingSessionId,
  editingSessionText,
  activeMenuSessionId,
  { loadSession, setEditingSessionId, setEditingSessionText, renameSessionOptimistic, togglePinOptimistic, deleteSessionOptimistic, setActiveMenuSessionId }
) {
  if (editingSessionId === s.session_id) {
    return (
      <div key={s.session_id} className="flex items-center gap-1 px-1 py-1">
        <input
          autoFocus
          type="text"
          value={editingSessionText}
          onChange={(e) => setEditingSessionText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") renameSessionOptimistic(s.session_id, editingSessionText);
            if (e.key === "Escape") setEditingSessionId(null);
          }}
          className="flex-1 bg-surface border border-accent/60 rounded-lg px-2 py-1 text-xs text-ink focus:outline-none"
        />
        <button onClick={() => renameSessionOptimistic(s.session_id, editingSessionText)} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-lg cursor-pointer shrink-0">
          <Check size={13} />
        </button>
      </div>
    );
  }

  const isMenuOpen = activeMenuSessionId === s.session_id;

  return (
    <div key={s.session_id} className="relative group">
      <button
        onClick={() => loadSession(s.session_id)}
        className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-xl text-xs transition-all duration-200 cursor-pointer ${
          s.session_id === currentSessionId
            ? "bg-surface-2 text-ink font-semibold shadow-xs border border-border/80"
            : "text-ink-muted hover:text-ink hover:bg-surface-2/50"
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px]">{s.title}</p>
        </div>

        <div
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenuSessionId(isMenuOpen ? null : s.session_id);
          }}
          className={`p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-surface transition-opacity duration-150 cursor-pointer shrink-0 ${
            isMenuOpen ? "opacity-100 bg-surface" : "opacity-0 group-hover:opacity-100"
          }`}
          title="More options"
        >
          <MoreVertical size={14} />
        </div>
      </button>

      {isMenuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-9 w-44 bg-surface/95 backdrop-blur-2xl border border-border shadow-2xl rounded-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            onClick={() => togglePinOptimistic(s.session_id)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink hover:bg-surface-2/80 transition text-left cursor-pointer"
          >
            {s.isPinned ? <PinOff size={14} className="text-accent" /> : <Pin size={14} className="text-ink-muted" />}
            <span>{s.isPinned ? "Unpin chat" : "Pin chat"}</span>
          </button>
          
          <button
            onClick={() => {
              setEditingSessionId(s.session_id);
              setEditingSessionText(s.title);
              setActiveMenuSessionId(null);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink hover:bg-surface-2/80 transition text-left cursor-pointer"
          >
            <Pencil size={14} className="text-ink-muted" />
            <span>Rename</span>
          </button>

          <div className="my-1 border-t border-border/50" />

          <button
            onClick={() => deleteSessionOptimistic(s.session_id)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 transition text-left cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}