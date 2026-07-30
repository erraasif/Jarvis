/**
 * Main Application Dashboard Component
 * ====================================
 * Serves as the central React interface for the JARVIS AI Assistant.
 * Handles authentication state, active workspace tabs, SSE/REST message handling,
 * and Microsoft 365 services (Mail, Calendar, To-Do) data synchronization.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare, Mail, Calendar, CheckSquare, LogOut,
  Send, Bot, RefreshCcw, Sparkles, ShieldCheck, Sun, Moon,
  Plus, Trash2, X, AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

import LandingPage from "./LandingPage.jsx";
import Logo from "./Logo.jsx";
import ProfilePanel, { applyStoredAccent } from "./ProfilePanel.jsx";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://jarvis-backend-h38f.onrender.com";

const TABS = [
  { id: "chat", label: "Agent Assistant", icon: MessageSquare },
  { id: "emails", label: "Mail & Drafts", icon: Mail },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "todos", label: "To-Do List", icon: CheckSquare },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [actionError, setActionError] = useState("");

  const chatEndRef = useRef(null);

  // Application theme state initialization with fallback system preferences
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  // Synchronize document theme class whenever isDark updates
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

  // Apply saved color accent preferences on mount
  useEffect(() => {
    applyStoredAccent();
  }, []);

  // Primary data storage states
  const [messages, setMessages] = useState([
    { sender: "jarvis", text: "Hello! I am Jarvis. Tell me what you'd like to manage across your Outlook Mail, Calendar, or To-Dos." }
  ]);
  const [emails, setEmails] = useState([]);
  const [events, setEvents] = useState([]);
  const [todos, setTodos] = useState([]);

  // Handle OAuth redirect URL parameters and session persistence
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

  // Fetch initial chat conversation history on user authentication
  useEffect(() => {
    if (isAuthenticated) {
      const userEmail = localStorage.getItem("jarvis_user_email");
      fetch(`${API_BASE_URL}/chat/history?user_email=${encodeURIComponent(userEmail)}`)
        .then((res) => res.json())
        .then((data) => {
          const past = (data.history || []).map((h) => ({
            sender: h.role === "user" ? "user" : "jarvis",
            text: h.content,
          }));
          if (past.length > 0) setMessages(past);
        })
        .catch(() => {}); // Non-blocking failure recovery
    }
  }, [isAuthenticated]);

  // Synchronize workspace data based on tab selections
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "emails") fetchEmails();
      if (activeTab === "calendar") fetchEvents();
      if (activeTab === "todos") fetchTodos();
    }
  }, [activeTab, isAuthenticated]);

  // Smooth scroll chat viewport on new messages
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

  const currentUserEmailFor = () => localStorage.getItem("jarvis_user_email");

  // Send message handler invoking the backend agent API
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !isAuthenticated || loading) return;

    const userMsg = inputMessage;
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setInputMessage("");
    setLoading(true);

    try {
      const userEmail = currentUserEmailFor();
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: userEmail, message: userMsg }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { sender: "jarvis", text: data.reply || data.response || data.message || "Request processed successfully." }
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: "jarvis", text: "Error: Unable to reach JARVIS backend service." }]);
    } finally {
      setLoading(false);
    }
  };

  // Reusable dataset fetching utility
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
  const fetchEvents = () => fetchData("/events", setEvents);
  const fetchTodos = () => fetchData("/todos", setTodos);

  // Form input and state handlers
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [showEventForm, setShowEventForm] = useState(false);
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

  const deleteTodo = async (taskId) => {
    const userEmail = currentUserEmailFor();
    const res = await fetch(`${API_BASE_URL}/todos/${taskId}?user_email=${encodeURIComponent(userEmail)}`, { method: "DELETE" });
    await handleApiResult(res, fetchTodos);
  };

  const createEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.subject || !newEvent.start || !newEvent.end) return;
    const userEmail = currentUserEmailFor();
    const res = await fetch(`${API_BASE_URL}/events?user_email=${encodeURIComponent(userEmail)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: newEvent.subject,
        start: { dateTime: newEvent.start, timeZone: "UTC" },
        end: { dateTime: newEvent.end, timeZone: "UTC" },
      }),
    });
    await handleApiResult(res, () => { setNewEvent({ subject: "", start: "", end: "" }); setShowEventForm(false); fetchEvents(); });
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
        <aside className="w-80 bg-surface/70 backdrop-blur-2xl border-r border-border/80 p-6 flex flex-col justify-between relative z-20">
          <div>
            <div className="flex items-center justify-between mb-8 pb-5 border-b border-border/80">
              <div className="flex items-center gap-3">
                <Logo size={38} />
                <h2 className="font-display font-bold text-xl tracking-tight text-ink text-glow">
                  Jarvis
                </h2>
              </div>
              <ThemeToggleBtn />
            </div>

            <nav className="space-y-2">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-ink-muted">
                Workspace
              </div>
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] cursor-pointer ${
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
          </div>

          <div className="pt-4 border-t border-border/80 space-y-3 relative">
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
            <div className="flex-1 flex flex-col h-full relative">
              <div className="px-8 py-4 border-b border-border/80 bg-surface/40 backdrop-blur-md flex items-center justify-between z-10">
                <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
                  <Sparkles size={14} className="text-accent" />
                  <span>Autonomous Microsoft 365 Copilot</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Session
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8 space-y-6 pb-36 max-w-4xl mx-auto w-full">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`flex gap-3.5 max-w-[80%] min-w-0 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                        msg.sender === "jarvis"
                          ? "bg-linear-to-tr from-accent to-purple-600 text-white"
                          : "bg-surface-2 border border-border text-ink font-bold text-xs"
                      }`}>
                        {msg.sender === "jarvis" ? <Bot size={18} /> : "You"}
                      </div>
                      <div className={`p-5 rounded-3xl text-[14.5px] leading-relaxed shadow-sm min-w-0 wrap-break-word whitespace-pre-wrap ${
                        msg.sender === "user"
                          ? "bg-accent text-accent-ink rounded-tr-none font-medium"
                          : "bg-surface text-ink border border-border/80 rounded-tl-none"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3.5 items-center">
                      <div className="w-9 h-9 rounded-2xl bg-linear-to-tr from-accent to-purple-600 text-white flex items-center justify-center">
                        <RefreshCcw className="animate-spin" size={17} />
                      </div>
                      <div className="p-4 bg-surface text-ink-muted border border-border/80 rounded-2xl rounded-tl-none text-xs font-mono flex items-center gap-2">
                        <span>Jarvis is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="absolute bottom-6 left-0 right-0 px-6 max-w-3xl mx-auto w-full z-20">
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
                  All email actions wait in Outlook as drafts for safety.
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
                        <div className="flex justify-between items-center mb-2.5">
                          <strong className="text-ink text-base font-semibold">{m.subject || "(No Subject)"}</strong>
                          <span className="text-[11px] px-3 py-1 bg-amber/15 text-amber border border-amber/30 rounded-full font-bold uppercase tracking-wider">Draft</span>
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
                      onClick={() => setShowEventForm((v) => !v)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-accent bg-accent/10 hover:bg-accent/20 border border-accent/30 px-3.5 py-2 rounded-xl transition shrink-0 cursor-pointer"
                    >
                      {showEventForm ? <X size={14} /> : <Plus size={14} />} {showEventForm ? "Cancel" : "Add Event"}
                    </button>
                  }
                >
                  {showEventForm && (
                    <form onSubmit={createEvent} className="bg-surface-2/60 border border-border/80 p-5 rounded-2xl mb-4 space-y-3">
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
                        Create Event
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
                        <button onClick={() => deleteEvent(e.id)} className="p-2 text-ink-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition shrink-0 cursor-pointer">
                          <Trash2 size={16} />
                        </button>
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
                        className="bg-surface-2/60 border border-border/80 p-4 rounded-2xl mb-3 flex items-center gap-3.5 hover:border-accent/30 transition-colors"
                      >
                        <button
                          onClick={() => toggleTodo(t)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer ${
                            t.status === "completed" ? "bg-accent border-accent text-accent-ink" : "border-border"
                          }`}
                        >
                          {t.status === "completed" && <span className="text-xs font-bold">✓</span>}
                        </button>
                        <span className={`text-sm font-medium flex-1 ${t.status === "completed" ? "line-through text-ink-muted" : "text-ink"}`}>
                          {t.title}
                        </span>
                        <button onClick={() => deleteTodo(t.id)} className="p-2 text-ink-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition shrink-0 cursor-pointer">
                          <Trash2 size={16} />
                        </button>
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