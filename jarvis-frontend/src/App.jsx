import React, { useState, useEffect, useRef } from "react";

// API Base URL (Aapka deployed Vercel Backend)
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://jarvis-five-neon.vercel.app";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Data States
  const [messages, setMessages] = useState([
    { sender: "jarvis", text: "Hello! I am Jarvis, your AI Assistant. Connect your Microsoft account to manage emails, calendar, and tasks via prompt." }
  ]);
  const [emails, setEmails] = useState([]);
  const [events, setEvents] = useState([]);
  const [todos, setTodos] = useState([]);

  // Auth & Token Check
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      localStorage.setItem("jarvis_token", token);
      setIsAuthenticated(true);
      window.history.replaceState({}, document.title, "/");
    } else {
      const storedToken = localStorage.getItem("jarvis_token");
      if (storedToken) setIsAuthenticated(true);
    }
  }, []);

  // Auto-scroll chat & Fetch tab data
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "emails") fetchEmails();
      if (activeTab === "calendar") fetchEvents();
      if (activeTab === "todos") fetchTodos();
    }
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTab, isAuthenticated, messages]);

  const handleLogin = () => window.location.href = `${API_BASE_URL}/api/auth/login`;
  
  const handleLogout = () => { 
    localStorage.removeItem("jarvis_token"); 
    setIsAuthenticated(false); 
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg = inputMessage;
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setInputMessage("");
    setLoading(true);

    try {
      const token = localStorage.getItem("jarvis_token");
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "jarvis", text: data.response || data.message || "Request completed." }]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: "jarvis", text: "Error connecting to Jarvis server." }]);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (endpoint, setter) => {
    try {
      const token = localStorage.getItem("jarvis_token");
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setter(Array.isArray(data) ? data : []);
    } catch (err) { setter([]); }
  };

  const fetchEmails = () => fetchData('/emails', setEmails);
  const fetchEvents = () => fetchData('/events', setEvents);
  const fetchTodos = () => fetchData('/todos', setTodos);

  // 1. LOGIN OVERLAY
  if (!isAuthenticated) {
    return (
      <div style={{ height: "100vh", backgroundColor: "#020617", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", padding: "2.5rem", borderRadius: "1.5rem", textAlign: "center", maxWidth: "420px", width: "100%", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
          <div style={{ width: "70px", height: "70px", backgroundColor: "#2563eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", fontSize: "2rem" }}>
            🤖
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem", color: "#ffffff" }}>Jarvis AI</h1>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "2rem", lineHeight: "1.5" }}>
            Microsoft Entra ID OAuth & LangGraph Powered Personal Assistant
          </p>
          <button
            onClick={handleLogin}
            style={{ width: "100%", padding: "0.85rem", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "0.75rem", fontWeight: "bold", cursor: "pointer", fontSize: "1rem", transition: "0.2s" }}
          >
            Sign in with Microsoft
          </button>
        </div>
      </div>
    );
  }

  // 2. MAIN DASHBOARD
  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#020617", color: "#f8fafc", overflow: "hidden" }}>
      
      {/* Sidebar */}
      <aside style={{ width: "260px", backgroundColor: "#0f172a", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "1.5rem 1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2.5rem", paddingLeft: "0.5rem" }}>
            <span style={{ fontSize: "1.8rem" }}>⚡</span>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0, color: "#fff" }}>Jarvis AI</h2>
              <span style={{ fontSize: "0.75rem", color: "#4ade80", border: "1px solid #166534", padding: "0.1rem 0.4rem", borderRadius: "1rem" }}>● Connected</span>
            </div>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              { id: "chat", label: "💬 Agent Chat" },
              { id: "emails", label: "✉️ Mail & Drafts" },
              { id: "calendar", label: "📅 Calendar" },
              { id: "todos", label: "☑️ To-Do List" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  textAlign: "left",
                  padding: "0.85rem 1rem",
                  borderRadius: "0.75rem",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeTab === tab.id ? "#2563eb" : "transparent",
                  color: activeTab === tab.id ? "#ffffff" : "#94a3b8",
                  fontWeight: "600",
                  fontSize: "0.95rem"
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          style={{ padding: "0.75rem", backgroundColor: "transparent", color: "#f87171", border: "1px solid #7f1d1d", borderRadius: "0.75rem", cursor: "pointer", fontWeight: "600" }}
        >
          Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* TAB 1: CHAT */}
        {activeTab === "chat" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
            <header style={{ padding: "1rem 2rem", borderBottom: "1px solid #1e293b", backgroundColor: "#0f172a" }}>
              <h1 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0, color: "#fff" }}>Jarvis Agent</h1>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>LangGraph Orchestration over Microsoft Graph API</p>
            </header>

            <div style={{ flex: 1, overflowY: "auto", padding: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem", paddingBottom: "100px" }}>
              {messages.map((msg, index) => (
                <div key={index} style={{ display: "flex", justifyContent: msg.sender === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "65%",
                    padding: "1rem 1.25rem",
                    borderRadius: "1.25rem",
                    backgroundColor: msg.sender === "user" ? "#2563eb" : "#0f172a",
                    color: "#ffffff",
                    fontSize: "0.95rem",
                    lineHeight: "1.5",
                    border: msg.sender === "user" ? "none" : "1px solid #1e293b",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ color: "#94a3b8", fontSize: "0.85rem", italic: "true" }}>Jarvis is reasoning...</div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Prompt Bar */}
            <form onSubmit={handleSendMessage} style={{ position: "absolute", bottom: "1.5rem", left: "2rem", right: "2rem", backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "2rem", padding: "0.5rem", display: "flex", gap: "0.5rem", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)" }}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask Jarvis (e.g. 'Draft email to boss', 'Add meeting tomorrow at 4 PM')..."
                style={{ flex: 1, padding: "0.75rem 1.25rem", backgroundColor: "transparent", border: "none", color: "#fff", outline: "none", fontSize: "0.95rem" }}
              />
              <button type="submit" style={{ padding: "0.75rem 1.5rem", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "1.5rem", cursor: "pointer", fontWeight: "bold" }}>
                Send
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: EMAILS */}
        {activeTab === "emails" && (
          <div style={{ padding: "2rem", overflowY: "auto" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Emails & Drafts</h1>
            {emails.length === 0 ? <p style={{ color: "#64748b" }}>No emails or drafts found.</p> : emails.map((m) => (
              <div key={m.id} style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", padding: "1.25rem", borderRadius: "1rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <strong style={{ fontSize: "1.1rem" }}>{m.subject || "(No Subject)"}</strong>
                  <span style={{ fontSize: "0.75rem", backgroundColor: "#7c2d12", color: "#fdba74", padding: "0.2rem 0.6rem", borderRadius: "1rem", fontWeight: "bold" }}>Draft Only (Never Sent)</span>
                </div>
                <p style={{ fontSize: "0.9rem", color: "#94a3b8" }}>{m.bodyPreview}</p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: CALENDAR */}
        {activeTab === "calendar" && (
          <div style={{ padding: "2rem", overflowY: "auto" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Calendar Events (Full CRUD)</h1>
            {events.length === 0 ? <p style={{ color: "#64748b" }}>No calendar events found.</p> : events.map((e) => (
              <div key={e.id} style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", padding: "1.25rem", borderRadius: "1rem", marginBottom: "1rem" }}>
                <h3 style={{ margin: "0 0 0.5rem 0" }}>{e.subject}</h3>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>{new Date(e.start?.dateTime).toLocaleString()} - {new Date(e.end?.dateTime).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: TODOS */}
        {activeTab === "todos" && (
          <div style={{ padding: "2rem", overflowY: "auto" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Microsoft To-Do Tasks (Full CRUD)</h1>
            {todos.length === 0 ? <p style={{ color: "#64748b" }}>No tasks added yet.</p> : todos.map((t) => (
              <div key={t.id} style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", padding: "1.25rem", borderRadius: "1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: t.status === "completed" ? "#4ade80" : "#64748b" }}></div>
                <span style={{ textDecoration: t.status === "completed" ? "line-through" : "none", color: t.status === "completed" ? "#64748b" : "#fff" }}>{t.title}</span>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}