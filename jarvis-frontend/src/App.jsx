import React, { useState, useEffect, useRef } from 'react';
import LandingPage from './LandingPage';

const BACKEND_URL = "https://jarvis-backend-h38f.onrender.com";

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('jarvis_token') || window.location.search.includes('user_email')
  );
  const [activeTab, setActiveTab] = useState('chat');

  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'jarvis',
      text: "Hello! I'm JARVIS. I've synced your workspace. How can I assist you with your schedule, emails, or directives today?",
      time: 'Just now'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef(null);

  const [todos, setTodos] = useState([
    { id: '1', title: 'Deploy Vercel Rewrite Rules', completed: true },
    { id: '2', title: 'Demonstrate Workspace to Evaluators', completed: false }
  ]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMicrosoftLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/login`;
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg = { id: Date.now().toString(), sender: 'user', text: inputMessage, time: 'Now' };
    setMessages((prev) => [...prev, userMsg]);
    const query = inputMessage;
    setInputMessage('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'jarvis',
          text: `Processed directive: "${query}". Graph database updated successfully.`,
          time: 'Now'
        }
      ]);
    }, 500);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTodos([{ id: Date.now().toString(), title: newTask, completed: false }, ...todos]);
    setNewTask('');
  };

  if (!isAuthenticated) {
    return (
      <LandingPage
        onLogin={handleMicrosoftLogin}
        onExploreDemo={() => setIsAuthenticated(true)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] flex flex-col font-sans">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" stroke="var(--color-accent)" strokeWidth="2" strokeDasharray="4 4" />
                <circle cx="16" cy="16" r="6" fill="var(--color-accent)" />
              </svg>
              <span className="font-bold text-lg text-glow-gradient">JARVIS</span>
            </div>

            <nav className="flex bg-[var(--color-surface-2)] p-1 rounded-lg border border-[var(--color-border)]">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'chat'
                    ? 'bg-[var(--color-accent)] text-[var(--color-accent-ink)] shadow-md'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                }`}
              >
                💬 Agent Chat
              </button>
              <button
                onClick={() => setActiveTab('workspace')}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'workspace'
                    ? 'bg-[var(--color-accent)] text-[var(--color-accent-ink)] shadow-md'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                }`}
              >
                ⚡ HUD Dashboard
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-xs font-mono"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-xs font-mono text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] px-3 py-1.5"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col">
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col h-[calc(100vh-140px)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-4 max-w-3xl ${
                    m.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      m.sender === 'user'
                        ? 'bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-ink)]'
                        : 'bg-[var(--color-accent)] text-white shadow-md shadow-[var(--color-accent)]/30'
                    }`}
                  >
                    {m.sender === 'user' ? 'YOU' : 'J'}
                  </div>

                  <div
                    className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-[var(--color-accent)] text-[var(--color-accent-ink)] rounded-tr-none'
                        : 'bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-ink)] rounded-tl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Ask JARVIS anything or trigger a workspace task..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="w-full pl-5 pr-28 py-4 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:border-[var(--color-accent)] transition-all placeholder-[var(--color-ink-muted)]"
                />
                <button
                  type="submit"
                  className="absolute right-2.5 px-5 py-2.5 bg-[var(--color-accent)] text-[var(--color-accent-ink)] rounded-lg text-xs font-semibold hover:opacity-90 transition-all shadow-md"
                >
                  Send ↵
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-up">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
              <h2 className="font-bold text-lg mb-4 flex justify-between items-center">
                <span>⚡ Directives</span>
                <span className="text-xs font-mono text-[var(--color-accent)] bg-[var(--color-surface-2)] px-2.5 py-1 rounded-md border border-[var(--color-border)]">
                  CRUD READY
                </span>
              </h2>

              <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Add new task..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  className="flex-1 bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3.5 py-2 rounded-lg text-sm outline-none focus:border-[var(--color-accent)]"
                />
                <button
                  type="submit"
                  className="bg-[var(--color-accent)] text-[var(--color-accent-ink)] px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
              </form>

              <div className="space-y-2">
                {todos.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm"
                  >
                    <span className={t.completed ? 'line-through text-[var(--color-ink-muted)]' : ''}>
                      {t.title}
                    </span>
                    <button
                      onClick={() => setTodos(todos.filter((x) => x.id !== t.id))}
                      className="text-red-400 hover:text-red-500 text-xs px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
              <h2 className="font-bold text-lg mb-4">📬 Graph Activity</h2>
              <div className="p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] mb-3">
                <div className="text-xs text-[var(--color-accent)] font-mono mb-1">MICROSOFT ENTRA</div>
                <div className="text-sm font-semibold">OAuth Security Token Exchange</div>
                <div className="text-xs text-[var(--color-ink-muted)] mt-1">Status: Active & Validated</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}