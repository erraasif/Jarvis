import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, Mail, Calendar, CheckSquare, LogIn, LogOut, 
  Send, Bot, CornerDownLeft, RefreshCcw, Sparkles 
} from "lucide-react";

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

  // Data States
  const [messages, setMessages] = useState([
    { sender: "jarvis", text: "Hello! I am Jarvis, your LangGraph-powered assistant. Authenticate with Microsoft to manage your agenda." }
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
    <div className="bg-slate-900 border border-slate-800/50 rounded-3xl p-6 shadow-xl transition hover:border-slate-700">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800">
        <div className="p-2.5 bg-blue-950/50 border border-blue-800 rounded-xl text-blue-400">
          <Icon size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );

  // MAIN RENDER
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* 1. LOGIN OVERLAY (Frosted) */}
      {!isAuthenticated && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center max-w-lg shadow-2xl">
            <div className="relative inline-flex mb-6">
              <div className="absolute inset-0 bg-blue-600 rounded-full blur-2xl opacity-40"></div>
              <div className="relative w-20 h-20 bg-slate-800 border-4 border-slate-700 rounded-full flex items-center justify-center">
                <Bot size={40} className="text-blue-400" />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tighter text-white mb-3">Jarvis AI Assistant</h1>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto">Connect your Microsoft account to unleash Jarvis. Chat-based CRUD over your Mail, Calendar, and To-Dos.</p>
            <button onClick={handleLogin} className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 px-6 rounded-2xl transition shadow-lg shadow-blue-600/20 active:scale-[0.98]">
              <LogIn size={20} /> Sign in with Microsoft account
            </button>
            <div className="mt-6 text-xs text-slate-600">AI Team #2 - Project Brief Compliance</div>
          </div>
        </div>
      )}

      {/* 2. MAIN LAYOUT */}
      <div className="flex h-screen overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-72 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3.5 mb-10 pb-4 border-b border-slate-800/80">
              <div className="p-2.5 bg-slate-800 border border-slate-700 rounded-2xl">
                <Sparkles size={20} className="text-blue-400" />
              </div>
              <div>
                <h2 className="font-bold text-xl tracking-tight text-white">Jarvis<span className="text-blue-500">.</span></h2>
                <span className="text-xs px-2 py-0.5 bg-green-950/50 text-green-400 border border-green-800 rounded-full">● Deployed Live</span>
              </div>
            </div>

            <nav className="space-y-2.5">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-2xl text-sm font-medium transition active:scale-[0.98] ${isActive ? "bg-slate-800 text-white shadow border border-slate-700" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                    <Icon size={19} className={isActive ? "text-blue-400" : ""} /> {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {isAuthenticated && (
            <button onClick={handleLogout} className="flex items-center justify-center gap-2.5 px-5 py-3 text-sm text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900 rounded-xl transition">
              <LogOut size={17} /> Disconnect Account
            </button>
          )}
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col h-full bg-slate-950">
          
          {/* TAB: CHAT AGENT (Claude Style) */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col h-full relative">
              <div className="flex-1 overflow-y-auto p-10 space-y-7 pb-40">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`flex gap-3 max-w-[70%] ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${msg.sender === "jarvis" ? "bg-slate-800 border border-slate-700 text-blue-400" : "bg-blue-600 text-white"}`}>
                        {msg.sender === "jarvis" ? <Bot size={18} /> : "U"}
                      </div>
                      <div className={`p-5 rounded-3xl shadow-lg leading-relaxed text-[15px] ${msg.sender === "user" ? "bg-blue-600 text-white rounded-br-lg" : "bg-slate-900 text-slate-200 border border-slate-800/80 rounded-bl-lg"}`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center"><RefreshCcw className="animate-spin" size={17} /></div>
                      <div className="p-4 bg-slate-900 text-slate-400 border border-slate-800/80 rounded-2xl rounded-bl-lg text-sm">Thinking...</div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area (Float) */}
              <div className="absolute bottom-6 left-10 right-10">
                <form onSubmit={handleSendMessage} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-2.5 rounded-full flex gap-3 shadow-2xl focus-within:border-blue-700 focus-within:ring-1 focus-within:ring-blue-700 transition">
                  <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Type prompt (e.g. 'Draft email to Sarah' or 'Schedule synced meeting')..." className="flex-1 bg-transparent border-none rounded-full px-5 py-3 text-[15px] text-white focus:outline-none placeholder:text-slate-600" disabled={loading || !isAuthenticated}/>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center transition disabled:bg-slate-700 active:scale-95" disabled={loading || !isAuthenticated}>
                    <Send size={19} />
                  </button>
                </form>
                <div className="text-center text-[11px] text-slate-700 mt-3">Microsoft OAuth Authenticated • LangGraph Orchestration</div>
              </div>
            </div>
          )}

          {/* OTHER TABS (Scrollable Data) */}
          {activeTab !== "chat" && (
            <div className="flex-1 p-10 overflow-y-auto space-y-8">
              {activeTab === "emails" && (
                <DataCard title="Email Mailbox" subtitle="Full Read/Draft Access. Emails are created as Drafts, never Sent." icon={Mail}>
                  {emails.length === 0 ? <p className="text-slate-500 text-sm italic">No recent emails found.</p> : emails.map(m => (
                    <div key={m.id} className="bg-slate-950/50 border border-slate-800/50 p-5 rounded-2xl mb-4 last:mb-0">
                      <div className="flex justify-between items-center mb-2.5"><strong className="text-white text-base">{m.subject || "(No Subject)"}</strong> <span className="text-xs px-2.5 py-1 bg-amber-950/50 text-amber-300 border border-amber-800 rounded-full font-medium">Draft Only</span></div>
                      <p className="text-sm text-slate-400">{m.bodyPreview}...</p>
                    </div>
                  ))}
                </DataCard>
              )}
              
              {activeTab === "calendar" && (
                <DataCard title="Calendar Agenda" subtitle="Full CRUD over events: Create, Read, Update, Delete." icon={Calendar}>
                  {events.length === 0 ? <p className="text-slate-500 text-sm italic">No events found in calendar.</p> : events.map(e => (
                    <div key={e.id} className="bg-slate-950/50 border border-slate-800/50 p-4 rounded-xl mb-3.5 flex justify-between items-center">
                      <div><strong className="text-white">{e.subject}</strong> <p className="text-xs text-slate-500 mt-1">{new Date(e.start?.dateTime).toLocaleString()} - {new Date(e.end?.dateTime).toLocaleString()}</p></div>
                    </div>
                  ))}
                </DataCard>
              )}

              {activeTab === "todos" && (
                <DataCard title="Microsoft To-Do Tasks" subtitle="Full CRUD over tasks (Create, Read, Update, Delete)." icon={CheckSquare}>
                  {todos.length === 0 ? <p className="text-slate-500 text-sm italic">To-Do list is currently empty.</p> : todos.map(t => (
                    <div key={t.id} className="bg-slate-950/50 border border-slate-800/50 p-4 rounded-xl mb-3.5 flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 ${t.status === 'completed' ? 'bg-blue-600 border-blue-600' : 'border-slate-700'}`}></div>
                      <span className={t.status === 'completed' ? 'line-through text-slate-600' : 'text-slate-200'}>{t.title}</span>
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