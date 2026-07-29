import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare, Mail, Calendar, CheckSquare, LogOut,
  Send, Bot, RefreshCcw, Sparkles
} from "lucide-react";
import LandingPage from "./LandingPage.jsx";
import useTheme, { ThemeToggle } from "./ThemeToggle.jsx";

// API Base URL (Deployed backend URL).
// IMPORTANT: set VITE_API_URL in Vercel's project env vars (and redeploy after
// setting it — Vite bakes this in at build time). The fallback below is only a
// safety net for local/staging use.
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://jarvis-backend-h38f.onrender.com";

const tabs = [
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
  const chatEndRef = useRef(null);
  const [isDark, setIsDark] = useTheme();

  // Data States
  const [messages, setMessages] = useState([
    { sender: "jarvis", text: "Hello! I am Jarvis. Sign in with Microsoft and tell me what you'd like to do with your mail, calendar, or to-dos." }
  ]);
  const [emails, setEmails] = useState([]);
  const [events, setEvents] = useState([]);
  const [todos, setTodos] = useState([]);

  // Auth & User Management
  // The backend identifies the signed-in user by user_email (not a bearer
  // token) — see app/api/auth.py's /callback redirect and every other route's
  // `user_email: str` param — so that's what we carry through here.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('user_email');

    if (userEmail) {
      localStorage.setItem("jarvis_user_email", userEmail);
      setIsAuthenticated(true);
      window.history.replaceState({}, document.title, "/"); // Clean URL
    } else {
      const storedEmail = localStorage.getItem("jarvis_user_email");
      if (storedEmail) setIsAuthenticated(true);
    }
  }, []);

  // Fetch Data & Scroll Chat
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "emails") fetchEmails();
      if (activeTab === "calendar") fetchEvents();
      if (activeTab === "todos") fetchTodos();
    }
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTab, isAuthenticated, messages]);

  const handleLogin = () => window.location.href = `${API_BASE_URL}/api/auth/login`;
  const handleLogout = () => { localStorage.removeItem("jarvis_user_email"); setIsAuthenticated(false); };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !isAuthenticated) return;

    const userMsg = inputMessage;
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setInputMessage("");
    setLoading(true);

    try {
      const userEmail = localStorage.getItem("jarvis_user_email");
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: userEmail, message: userMsg }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "jarvis", text: data.reply || data.response || data.message || "Request processed successfully." }]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: "jarvis", text: "Error: Could not connect to Jarvis server." }]);
    } finally {
      setLoading(false);
    }
  };

  // Generic Fetcher
  const fetchData = async (endpoint, setter) => {
    try {
      const userEmail = localStorage.getItem("jarvis_user_email");
      const res = await fetch(`${API_BASE_URL}${endpoint}?user_email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      // /emails and /events return Graph API objects: { value: [...] }
      const list = Array.isArray(data) ? data : Array.isArray(data.value) ? data.value : [];
      setter(list);
    } catch (err) { setter([]); }
  };

  const fetchEmails = () => fetchData('/emails', setEmails);
  const fetchEvents = () => fetchData('/events', setEvents);
  const fetchTodos = () => fetchData('/todos', setTodos);

  // COMMON COMPONENT: Card Wrapper
  const DataCard = ({ title, subtitle, children, icon: Icon }) => (
    <div className="bg-surface border border-border rounded-3xl p-6 shadow-xl transition">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
        <div className="p-2.5 bg-surface-2 border border-border rounded-xl text-accent">
          <Icon size={20} />
        </div>
        <div>
          <h3 className="font-display font-semibold text-ink">{title}</h3>
          <p className="text-xs text-ink-muted">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );

  if (!isAuthenticated) {
    return <LandingPage onLogin={handleLogin} isDark={isDark} setIsDark={setIsDark} />;
  }

  // MAIN RENDER (authenticated)
  return (
    <div className="min-h-screen bg-bg text-ink font-body selection:bg-accent/30">
      <div className="flex h-screen overflow-hidden">

        {/* Sidebar */}
        <aside className="w-72 bg-surface/70 backdrop-blur-xl border-r border-border p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-10 pb-4 border-b border-border">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 bg-surface-2 border border-border rounded-2xl">
                  <Sparkles size={20} className="text-accent" />
                </div>
                <h2 className="font-display font-bold text-xl tracking-tight text-ink">Jarvis<span className="text-accent">.</span></h2>
              </div>
              <ThemeToggle isDark={isDark} setIsDark={setIsDark} />
            </div>

            <nav className="space-y-2.5">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-2xl text-sm font-medium transition active:scale-[0.98] ${isActive ? "bg-surface-2 text-ink shadow border border-border" : "text-ink-muted hover:bg-surface-2/60 hover:text-ink"}`}>
                    <Icon size={19} className={isActive ? "text-accent" : ""} /> {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <button onClick={handleLogout} className="flex items-center justify-center gap-2.5 px-5 py-3 text-sm text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 rounded-xl transition">
            <LogOut size={17} /> Disconnect Account
          </button>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col h-full bg-bg">

          {/* TAB: CHAT AGENT */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col h-full relative">
              <div className="flex-1 overflow-y-auto p-10 space-y-7 pb-40">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`flex gap-3 max-w-[70%] ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.sender === "jarvis" ? "bg-surface-2 border border-border text-accent" : "bg-accent text-accent-ink"}`}>
                        {msg.sender === "jarvis" ? <Bot size={18} /> : "U"}
                      </div>
                      <div className={`p-5 rounded-3xl shadow-lg leading-relaxed text-[15px] ${msg.sender === "user" ? "bg-accent text-accent-ink rounded-br-lg" : "bg-surface text-ink border border-border rounded-bl-lg"}`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-surface-2 border border-border text-accent flex items-center justify-center"><RefreshCcw className="animate-spin" size={17} /></div>
                      <div className="p-4 bg-surface text-ink-muted border border-border rounded-2xl rounded-bl-lg text-sm">Thinking...</div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area (Float) */}
              <div className="absolute bottom-6 left-10 right-10">
                <form onSubmit={handleSendMessage} className="bg-surface/90 backdrop-blur-xl border border-border p-2.5 rounded-full flex gap-3 shadow-2xl focus-within:border-accent transition">
                  <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Type a request (e.g. 'Draft a reply to Sarah' or 'Move tomorrow's meeting to 3pm')..." className="flex-1 bg-transparent border-none rounded-full px-5 py-3 text-[15px] text-ink focus:outline-none placeholder:text-ink-muted" disabled={loading || !isAuthenticated}/>
                  <button type="submit" className="bg-accent text-accent-ink w-12 h-12 rounded-full flex items-center justify-center transition disabled:opacity-40 active:scale-95" disabled={loading || !isAuthenticated}>
                    <Send size={19} />
                  </button>
                </form>
                <div className="text-center text-[11px] font-mono text-ink-muted mt-3">Every mail action stays a draft until you send it yourself</div>
              </div>
            </div>
          )}

          {/* OTHER TABS (Scrollable Data) */}
          {activeTab !== "chat" && (
            <div className="flex-1 p-10 overflow-y-auto space-y-8">
              {activeTab === "emails" && (
                <DataCard title="Email Mailbox" subtitle="Full read/draft access. Emails are created as drafts, never sent." icon={Mail}>
                  {emails.length === 0 ? <p className="text-ink-muted text-sm italic">No recent emails found.</p> : emails.map(m => (
                    <div key={m.id} className="bg-surface-2/60 border border-border p-5 rounded-2xl mb-4 last:mb-0">
                      <div className="flex justify-between items-center mb-2.5"><strong className="text-ink text-base">{m.subject || "(No Subject)"}</strong> <span className="text-xs px-2.5 py-1 bg-amber/10 text-amber border border-amber/30 rounded-full font-medium">Draft Only</span></div>
                      <p className="text-sm text-ink-muted">{m.bodyPreview}...</p>
                    </div>
                  ))}
                </DataCard>
              )}

              {activeTab === "calendar" && (
                <DataCard title="Calendar Agenda" subtitle="Full CRUD over events: create, read, update, delete." icon={Calendar}>
                  {events.length === 0 ? <p className="text-ink-muted text-sm italic">No events found in calendar.</p> : events.map(e => (
                    <div key={e.id} className="bg-surface-2/60 border border-border p-4 rounded-xl mb-3.5 flex justify-between items-center">
                      <div><strong className="text-ink">{e.subject}</strong> <p className="text-xs text-ink-muted mt-1">{new Date(e.start?.dateTime).toLocaleString()} - {new Date(e.end?.dateTime).toLocaleString()}</p></div>
                    </div>
                  ))}
                </DataCard>
              )}

              {activeTab === "todos" && (
                <DataCard title="Microsoft To-Do Tasks" subtitle="Full CRUD over tasks (create, read, update, delete)." icon={CheckSquare}>
                  {todos.length === 0 ? <p className="text-ink-muted text-sm italic">To-Do list is currently empty.</p> : todos.map(t => (
                    <div key={t.id} className="bg-surface-2/60 border border-border p-4 rounded-xl mb-3.5 flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 ${t.status === 'completed' ? 'bg-accent border-accent' : 'border-border'}`}></div>
                      <span className={t.status === 'completed' ? 'line-through text-ink-muted' : 'text-ink'}>{t.title}</span>
                    </div>
                  ))}
                </DataCard>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}