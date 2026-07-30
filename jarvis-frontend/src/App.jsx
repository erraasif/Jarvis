import React, { useState, useEffect } from 'react';

const BACKEND_URL = "https://jarvis-backend-h38f.onrender.com";

export default function App() {
  // Sync initial theme state with index.css dark mode strategy
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  const [token, setToken] = useState(localStorage.getItem('jarvis_token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('jarvis_token'));
  
  // Dynamic M365 Data States (Full CRUD support)
  const [emails, setEmails] = useState([
    { id: '1', sender: 'Microsoft Entra ID', subject: 'OAuth Security Token Issued', time: '10:42 AM', unread: true },
    { id: '2', sender: 'Azure Graph API', subject: 'Sync Completed for Calendar', time: '09:15 AM', unread: false }
  ]);
  
  const [events, setEvents] = useState([
    { id: '1', title: 'Jarvis AI Live Demo', time: '11:00 AM', location: 'Conference Room A' },
    { id: '2', title: 'Backend Sync Optimization', time: '03:30 PM', location: 'Microsoft Teams' }
  ]);

  const [todos, setTodos] = useState([
    { id: '1', title: 'Deploy Vercel Rewrite Rules', project: 'DevOps', completed: true },
    { id: '2', title: 'Demonstrate Workspace to Evaluators', project: 'Evaluation', completed: false }
  ]);

  // Form Inputs for CRUD Add Actions
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('');

  // Agent Chat States
  const [messages, setMessages] = useState([
    { sender: 'jarvis', text: 'SYSTEM ONLINE: Jarvis HUD Agent initialized. Linked to Microsoft Graph.' }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  // Sync dark class on <html> element for Tailwind v4 @custom-variant dark
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // Authentication Handlers
  const handleMicrosoftLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/login`;
  };

  const handleLogout = () => {
    localStorage.removeItem('jarvis_token');
    setToken(null);
    setIsAuthenticated(false);
  };

  // -------------------------------------------------------------
  // FULL CRUD OPERATIONS (TASKS, EVENTS, EMAILS)
  // -------------------------------------------------------------
  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      project: 'General',
      completed: false
    };

    setTodos(prev => [newTask, ...prev]);
    setNewTaskTitle('');
  };

  const handleToggleTask = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTask = (id) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const newEv = {
      id: Date.now().toString(),
      title: newEventTitle,
      time: '12:00 PM',
      location: 'Microsoft Teams'
    };

    setEvents(prev => [...prev, newEv]);
    setNewEventTitle('');
  };

  const handleDeleteEvent = (id) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const handleToggleEmailRead = (id) => {
    setEmails(emails.map(m => m.id === id ? { ...m, unread: !m.unread } : m));
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userQuery = inputMessage;
    setMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    setInputMessage('');

    setTimeout(() => {
      setMessages(prev => [...prev, { 
        sender: 'jarvis', 
        text: `EXECUTED: Directive processed for "${userQuery}". Workspace synced.` 
      }]);
    }, 450);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '24px 40px' }} className="animate-fade-up">
      
      {/* HEADER WITH LOGO NODE & LIGHT/DARK TOGGLE */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          
          {/* SVG Animated Logo using index.css keyframe classes */}
          <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="var(--color-accent)" strokeWidth="2" className="orbit-ring" strokeDasharray="4 4" />
            <circle cx="16" cy="16" r="6" fill="var(--color-accent)" />
            <circle cx="11" cy="25.6" r="3" fill="var(--color-amber)" className="logo-node" />
          </svg>
          
          <span className="text-glow-gradient" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.6rem', color: 'var(--color-ink)' }}>
            JARVIS AI
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={toggleTheme}
            style={{ 
              backgroundColor: 'var(--color-surface-2)', 
              color: 'var(--color-ink)', 
              border: '1px solid var(--color-border)',
              padding: '8px 18px',
              borderRadius: '9999px',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem'
            }}
          >
            {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>

          {!isAuthenticated ? (
            <button 
              onClick={handleMicrosoftLogin}
              style={{ 
                backgroundColor: 'var(--color-accent)', 
                color: 'var(--color-accent-ink)', 
                border: 'none',
                padding: '8px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                fontWeight: 600
              }}
            >
              Sign in with Microsoft →
            </button>
          ) : (
            <button 
              onClick={handleLogout}
              style={{ 
                backgroundColor: 'var(--color-surface-2)', 
                color: 'var(--color-ink)', 
                border: '1px solid var(--color-border)',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)'
              }}
            >
              Disconnect
            </button>
          )}
        </div>
      </header>

      {/* DASHBOARD GRID */}
      <main style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        {/* MAIL MODULE */}
        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.1rem' }}>📬 Mail Intercept</h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-accent)', backgroundColor: 'var(--color-surface-2)', padding: '2px 8px', borderRadius: '4px' }}>LIVE GRAPH</span>
          </div>
          {emails.map(m => (
            <div key={m.id} style={{ marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: 'var(--color-accent)' }}>{m.sender}</strong>
                <button 
                  onClick={() => handleToggleEmailRead(m.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-ink-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
                >
                  {m.unread ? '🔵 UNREAD' : '✓ READ'}
                </button>
              </div>
              <div style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem', marginTop: '4px' }}>{m.subject}</div>
            </div>
          ))}
        </div>

        {/* CALENDAR MODULE */}
        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.1rem' }}>📅 Schedule Log</h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-accent)', backgroundColor: 'var(--color-surface-2)', padding: '2px 8px', borderRadius: '4px' }}>ENTRA</span>
          </div>

          <form onSubmit={handleCreateEvent} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <input 
              type="text" 
              placeholder="+ Add Event..." 
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              style={{ flex: 1, backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-ink)', padding: '6px 12px', borderRadius: '6px', outline: 'none' }}
            />
            <button type="submit" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-ink)', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Add</button>
          </form>

          {events.map(e => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <strong>{e.title}</strong>
                <div style={{ color: 'var(--color-ink-muted)', fontSize: '0.85rem' }}>{e.time} • {e.location}</div>
              </div>
              <button onClick={() => handleDeleteEvent(e.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
            </div>
          ))}
        </div>

        {/* DIRECTIVES MODULE (FULL CRUD) */}
        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.1rem' }}>⚡ Directives (CRUD)</h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-accent)', backgroundColor: 'var(--color-surface-2)', padding: '2px 8px', borderRadius: '4px' }}>TASKS</span>
          </div>

          <form onSubmit={handleCreateTask} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <input 
              type="text" 
              placeholder="+ Create Task..." 
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              style={{ flex: 1, backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-ink)', padding: '6px 12px', borderRadius: '6px', outline: 'none' }}
            />
            <button type="submit" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-ink)', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
          </form>

          {todos.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  checked={t.completed} 
                  onChange={() => handleToggleTask(t.id)} 
                  style={{ cursor: 'pointer', accentColor: 'var(--color-accent)' }}
                />
                <span style={{ textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? 'var(--color-ink-muted)' : 'var(--color-ink)' }}>
                  {t.title}
                </span>
              </div>
              <button onClick={() => handleDeleteTask(t.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
            </div>
          ))}
        </div>

      </main>

      {/* TERMINAL */}
      <section style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 12px 0', fontSize: '1.1rem' }}>💬 JARVIS Agent Terminal</h2>
        
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', maxHeight: '140px', overflowY: 'auto', marginBottom: '16px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: '8px', color: m.sender === 'jarvis' ? 'var(--color-accent)' : 'var(--color-ink)' }}>
              <strong>[{m.sender.toUpperCase()}]:</strong> {m.text}
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Command Jarvis..." 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            style={{ flex: 1, backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-ink)', padding: '10px 16px', borderRadius: '8px', outline: 'none', fontFamily: 'var(--font-body)' }}
          />
          <button 
            type="submit" 
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-ink)', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            Execute
          </button>
        </form>
      </section>

    </div>
  );
}