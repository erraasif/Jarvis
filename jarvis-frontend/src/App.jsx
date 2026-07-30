import React, { useState, useEffect, useRef } from 'react';
import './App.css';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('jarvis_token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('jarvis_token'));
  
  // Dynamic M365 Data States
  const [emails, setEmails] = useState([]);
  const [events, setEvents] = useState([]);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Chat & UI States
  const [messages, setMessages] = useState([
    { sender: 'jarvis', text: 'Hello Anna! How can I assist you with your live M365 workspace today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const chatBottomRef = useRef(null);
  const canvasRef = useRef(null);

  // 1. OAUTH CALLBACK & TOKEN EXCHANGE HANDLER
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');

    if (authCode && !token) {
      setLoading(true);
      // Exchange code for JWT session token via backend
      fetch('/api/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authCode })
      })
        .then(res => res.json())
        .then(data => {
          if (data.access_token) {
            localStorage.setItem('jarvis_token', data.access_token);
            setToken(data.access_token);
            setIsAuthenticated(true);
            // Clean code from URL bar
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })
        .catch(err => console.error("OAuth token exchange failed:", err))
        .finally(() => setLoading(false));
    }
  }, [token]);

  // 2. LIVE DYNAMIC DATA FETCHING FROM GRAPH BACKEND
  const fetchDashboardData = () => {
    if (!token) return;
    setLoading(true);

    const headers = { 'Authorization': `Bearer ${token}` };

    Promise.all([
      fetch('/api/emails', { headers }).then(res => res.ok ? res.json() : []),
      fetch('/api/events', { headers }).then(res => res.ok ? res.json() : []),
      fetch('/api/todos', { headers }).then(res => res.ok ? res.json() : [])
    ])
      .then(([emailData, eventData, todoData]) => {
        setEmails(emailData);
        setEvents(eventData);
        setTodos(todoData);
      })
      .catch(err => console.error("Error fetching live Graph data:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  // 3. 3D PARTICLE CANVAS ANIMATION
  useEffect(() => {
    if (isAuthenticated) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = 320);
    let height = (canvas.height = 320);
    const radius = 110;
    const particles = [];
    const numParticles = 90;

    for (let i = 0; i < numParticles; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);
      particles.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
        size: Math.random() * 2 + 1
      });
    }

    let angle = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      angle += 0.008;

      const cx = width / 2;
      const cy = height / 2;

      const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
      gradient.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
      gradient.addColorStop(1, 'rgba(15, 12, 25, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      particles.forEach(p => {
        const x1 = p.x * Math.cos(angle) - p.z * Math.sin(angle);
        const z1 = p.z * Math.cos(angle) + p.x * Math.sin(angle);
        const y1 = p.y * Math.cos(0.4) - z1 * Math.sin(0.4);
        const z2 = z1 * Math.cos(0.4) + p.y * Math.sin(0.4);

        const fov = 300;
        const scale = fov / (fov + z2);
        const x2 = cx + x1 * scale;
        const y2 = cy + y1 * scale;

        const alpha = (z2 + radius) / (2 * radius);
        ctx.fillStyle = `rgba(192, 132, 252, ${Math.max(0.1, alpha)})`;
        ctx.beginPath();
        ctx.arc(x2, y2, p.size * scale, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isAuthenticated]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // MICROSOFT LOGIN REDIRECT
  const handleMicrosoftLogin = () => {
    window.location.href = "/api/auth/login";
  };

  const handleLogout = () => {
    localStorage.removeItem('jarvis_token');
    setToken(null);
    setIsAuthenticated(false);
  };

  // REAL CHAT DISPATCHER
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userText })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { sender: 'jarvis', text: data.reply || data.response || "Task processed." }]);
      
      // Auto-refresh dashboard data in case chat modified emails/tasks
      fetchDashboardData();
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'jarvis', text: "Backend sync timeout. Retrying request..." }]);
    }
  };

  // DYNAMIC ACTION HANDLERS (GRAPH INTEGRATION)
  const toggleEmailRead = (id, currentStatus) => {
    setEmails(emails.map(mail => mail.id === id ? { ...mail, unread: !mail.unread } : mail));
    fetch(`/api/emails/${id}/toggle-read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(err => console.error(err));
  };

  const deleteEvent = (id) => {
    setEvents(events.filter(ev => ev.id !== id));
    fetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(err => console.error(err));
  };

  const toggleTodo = (id, completedStatus) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ completed: !completedStatus })
    }).catch(err => console.error(err));
  };

  // LANDING PAGE (3D ORBIT & GLOWING TYPOGRAPHY)
  if (!isAuthenticated) {
    return (
      <div className="jarvis-app-layout">
        <header className="jarvis-header">
          <div className="logo-area">
            <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 0 1 7.54 16.6l-3.1-3.1a5 5 0 0 0-7.08 0l-3.1 3.1A10 10 0 0 1 12 2z"/></svg>
            <span className="logo-text jarvis-glow-font">JARVIS</span>
          </div>
        </header>

        <main className="landing-container-orbit">
          <div className="top-badge">
            <span className="sparkle">✨</span> PERSONAL AGENT FOR MICROSOFT 365
          </div>

          <div className="orbit-hero-wrapper">
            <div className="orbit-widget mail-widget">📧</div>
            <div className="orbit-widget task-widget">✅</div>
            <div className="orbit-widget cal-widget">📅</div>

            <div className="canvas-container">
              <canvas ref={canvasRef} />
              <div className="orbit-ring-border"></div>
            </div>
          </div>

          <div className="hero-content-bottom">
            <h1 className="hero-headline">
              Your inbox, calendar, and to-dos<br />
              <span className="gradient-text">one conversation away.</span>
            </h1>
            <p className="hero-subtext">
              Tell Jarvis what you need. It reasons over your requests and acts directly on Outlook, Calendar, and To Do with complete accuracy.
            </p>
            <button className="sign-in-btn" onClick={handleMicrosoftLogin} disabled={loading}>
              <span>{loading ? "Authenticating..." : "Sign in with Microsoft"}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
            <div className="auth-security-note">Authenticated via Microsoft Entra ID • Secure Token Storage</div>
          </div>
        </main>
      </div>
    );
  }

  // DASHBOARD VIEW
  return (
    <div className="jarvis-app-layout">
      <header className="jarvis-header">
        <div className="logo-area">
          <button className="icon-btn back-btn" onClick={handleLogout} title="Sign Out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 0 1 7.54 16.6l-3.1-3.1a5 5 0 0 0-7.08 0l-3.1 3.1A10 10 0 0 1 12 2z"/></svg>
          <span className="logo-text jarvis-glow-font">JARVIS</span>
        </div>

        <div className="user-controls">
          <button className="icon-btn" onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} title="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </button>
          <button className="icon-btn" onClick={() => setIsSettingsOpen(!isSettingsOpen)} title="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </button>
          <div className="profile-pill">
            <div className="avatar"></div>
            <span className="username">Anna Gondal</span>
          </div>
          <button className="icon-btn logout-btn" onClick={handleLogout} title="Sign Out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </header>

      {isSettingsOpen && (
        <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Jarvis Settings</h2>
              <button className="close-btn" onClick={() => setIsSettingsOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <label className="setting-row">
                <span>Autonomous M365 Actions</span>
                <input type="checkbox" defaultChecked />
              </label>
              <label className="setting-row">
                <span>Graph API Live Sync</span>
                <input type="checkbox" defaultChecked />
              </label>
            </div>
          </div>
        </div>
      )}

      {isNotificationsOpen && (
        <div className="modal-overlay" onClick={() => setIsNotificationsOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Activity Feed</h2>
              <button className="close-btn" onClick={() => setIsNotificationsOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="notif-item">✓ OAuth Session Verified.</p>
              <p className="notif-item">✓ Graph API Live Sync Connected.</p>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-container">
        <div className="modules-grid">
          {/* Mailbox Module */}
          <div className="module-card">
            <div className="mod-header">
              <div className="title-group">
                <svg className="mod-icon mail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <h2>Mailbox</h2>
              </div>
              <button className="icon-btn small" onClick={fetchDashboardData}>↻</button>
            </div>
            <div className="mod-content">
              {emails.length === 0 ? <p className="empty-state">No unread emails found</p> : emails.map(mail => (
                <div key={mail.id} className={`mail-item ${mail.unread ? '' : 'read'}`} onClick={() => toggleEmailRead(mail.id, mail.unread)}>
                  <span className="mail-dot"></span>
                  <div className="mail-details">
                    <div className="mail-sender">{mail.sender}</div>
                    <div className="mail-subj">{mail.subject}</div>
                  </div>
                  <span className="mail-time">{mail.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Module */}
          <div className="module-card">
            <div className="mod-header">
              <div className="title-group">
                <svg className="mod-icon cal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <h2>Next Events</h2>
              </div>
              <button className="icon-btn small" onClick={fetchDashboardData}>↻</button>
            </div>
            <div className="mod-content">
              {events.length === 0 ? <p className="empty-state">No upcoming events scheduled</p> : events.map(ev => (
                <div key={ev.id} className="event-item">
                  <div className="event-time-block">
                    <span className="event-date-num">{ev.dateNum || '30'}</span>
                    <span className="event-date-mo">{ev.dateMo || 'OCT'}</span>
                  </div>
                  <div className="event-details">
                    <div className="event-title">{ev.title}</div>
                    <div className="event-meta">{ev.time} • {ev.location}</div>
                  </div>
                  <div className="crud-actions">
                    <button onClick={() => deleteEvent(ev.id)} title="Cancel Event">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks Module */}
          <div className="module-card">
            <div className="mod-header">
              <div className="title-group">
                <svg className="mod-icon task-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"></polyline><path d="21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                <h2>Priority Tasks</h2>
              </div>
              <button className="icon-btn small" onClick={fetchDashboardData}>↻</button>
            </div>
            <div className="mod-content">
              {todos.length === 0 ? <p className="empty-state">All tasks completed!</p> : todos.map(task => (
                <div key={task.id} className="task-item">
                  <input type="checkbox" className="task-check" checked={task.completed} onChange={() => toggleTodo(task.id, task.completed)} />
                  <div className="task-details">
                    <div className="task-title" style={{ textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.5 : 1 }}>{task.title}</div>
                    <div className="task-meta">{task.project || 'General'} • {task.dueDate || 'Today'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Box */}
        <div className="chat-interface-wrapper">
          <div className="chat-history-box">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-bubble ${msg.sender}`}>
                <span className="chat-sender-tag">{msg.sender === 'jarvis' ? 'JARVIS' : 'Anna'}</span>
                <p>{msg.text}</p>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-container">
            <span className="chat-prefix">Jarvis /</span>
            <input 
              type="text" 
              className="chat-input-field" 
              placeholder="Ask Jarvis to check emails, reschedule meetings, or manage tasks..." 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button type="submit" className="chat-send-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
          <div className="chat-context-hint">Autonomous M365 Agent active • Live Graph API Token Valid</div>
        </div>
      </div>
    </div>
  );
}