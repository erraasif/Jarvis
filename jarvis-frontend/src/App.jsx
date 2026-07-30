import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CalendarDays, CheckSquare, Settings, LogOut, Bell, MoreVertical, RefreshCw, XCircle, PlusCircle, Search, BrainCircuit, ArrowLeft } from 'lucide-react';
import './App.css';

const mockUser = {
  name: "Anna Gondal",
  email: "anna.g@jarvis-m365.com",
  avatarUrl: "https://api.dicebear.com/8.x/adventurer-neutral/svg?seed=AnnaG" 
};

const mockMail = [
  { id: 1, sender: "Satya Nadella", subject: "Project Jarvis Q3 Review", snippet: "Team, great progress on the autonomous agent...", time: "5m ago", read: false },
  { id: 2, sender: "LinkedIn News", subject: "Top AI developments this week", snippet: "OpenAI announces new models...", time: "2h ago", read: true },
  { id: 3, sender: "HR Portal", subject: "Action Required: Benefits Enrollment", snippet: "Please complete your annual enrollment by...", time: "1d ago", read: false }
];

const mockEvents = [
  { id: 1, title: "Q3 Strategic Planning", time: "10:00 AM - 11:30 AM", location: "Teams Meeting", organizer: "Megan Bowen" },
  { id: 2, title: "Deep Dive: M365 Graph API", time: "2:00 PM - 3:00 PM", location: "Office 12/345", organizer: "You" }
];

const mockTasks = [
  { id: 1, title: "Finalize Frontend Animations", list: "Jarvis Dev", due: "Today" },
  { id: 2, title: "Test Graph API Error Handling", list: "Backend Q4", due: "Tomorrow" },
  { id: 3, title: "Review PR from Alex", list: "Core Team", due: "Oct 28" }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 120, damping: 18 } }
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [data, setData] = useState({ mail: [], events: [], tasks: [] });

  useEffect(() => {
    if (isAuthenticated) {
      setData({ mail: mockMail, events: mockEvents, tasks: mockTasks });
    }
  }, [isAuthenticated]);

  const handleCompleteTask = (taskId) => {
    setData(prev => ({ ...prev, tasks: prev.tasks.filter(task => task.id !== taskId) }));
  };

  const handleRescheduleEvent = (eventId) => {
    console.log(`Rescheduling Event ID: ${eventId}`);
  };

  const handleCancelEvent = (eventId) => {
    setData(prev => ({ ...prev, events: prev.events.filter(ev => ev.id !== eventId) }));
  };

  const Header = () => (
    <header className="jarvis-header">
      <div className="logo-area" onClick={() => setIsAuthenticated(false)} style={{ cursor: 'pointer' }}>
        <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }}>
           <BrainCircuit className="logo-icon" />
        </motion.div>
        <span className="logo-text">JARVIS</span>
        <span className="version-badge">v2.0</span>
      </div>
      
      {isAuthenticated ? (
        <div className="user-controls">
          <motion.button whileHover={{ scale: 1.1 }} className="icon-btn" title="Back to Landing" onClick={() => setIsAuthenticated(false)}>
            <ArrowLeft size={18} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} className="icon-btn"><Bell size={18} /></motion.button>
          <motion.button whileHover={{ scale: 1.1 }} className="icon-btn"><Settings size={18} /></motion.button>
          <div className="profile-pill">
            <img src={mockUser.avatarUrl} alt={mockUser.name} className="avatar" />
            <span className="username">{mockUser.name}</span>
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => setIsAuthenticated(false)} className="icon-btn logout" title="Sign Out">
              <LogOut size={15} />
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="auth-badge">
          PERSONAL AGENT FOR MICROSOFT 365
        </div>
      )}
    </header>
  );

  const LandingPage = () => (
    <motion.div className="landing-container" variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
      <div className="orbit-scene">
        <div className="orbit-center-glow"></div>
        <div className="central-icon-wrapper">
           <motion.div className="central-icon-core" animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}/>
           <div className="central-icon-static"><div className="dot"></div></div>
        </div>
        <div className="orbit-ring ring1"></div>
        <div className="orbit-ring ring2">
           <div className="orbit-item item1"><Mail size={14}/></div>
           <div className="orbit-item item2"><CalendarDays size={14}/></div>
        </div>
        <div className="orbit-ring ring3">
           <div className="orbit-item item3"><CheckSquare size={14}/></div>
        </div>
      </div>

      <motion.h1 variants={itemVariants} className="hero-headline">
        Your inbox, calendar, and to-dos —<br />
        <span className="gradient-text animated-gradient-text">one conversation away.</span>
      </motion.h1>

      <motion.p variants={itemVariants} className="hero-subtext">
        Tell Jarvis what you need. It reasons over your requests and acts directly on
        Outlook, Calendar, and To Do with complete accuracy.
      </motion.p>

      <motion.button
        variants={itemVariants}
        whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(139, 92, 246, 0.4)" }}
        whileTap={{ scale: 0.98 }}
        className="sign-in-btn"
        onClick={() => setIsAuthenticated(true)}
      >
        Sign in with Microsoft <span>→</span>
      </motion.button>

      <motion.p variants={itemVariants} className="auth-security-note">
        Authenticated via Microsoft Entra ID • Secure Token Storage
      </motion.p>
    </motion.div>
  );

  const Dashboard = () => (
    <motion.div className="dashboard-container" variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
      <div className="modules-grid">
        
        <motion.div variants={itemVariants} className="module-card mail-mod">
          <div className="mod-header">
            <div className='title-group'><Mail className="mod-icon mail-icon" /> <h2>Mailbox</h2></div>
            <motion.button whileHover={{ scale: 1.1 }} className="icon-btn"><PlusCircle size={15}/></motion.button>
          </div>
          <div className="mod-content">
            {data.mail.length === 0 && <p className='empty-state'>No unread messages.</p>}
            {data.mail.map(mail => (
              <div key={mail.id} className={`mail-item ${mail.read ? 'read' : 'unread'}`}>
                <div className='mail-dot'></div>
                <div className='mail-details'>
                  <p className='mail-sender'>{mail.sender}</p>
                  <p className='mail-subj'>{mail.subject}</p>
                </div>
                <span className='mail-time'>{mail.time}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="module-card calendar-mod">
          <div className="mod-header">
             <div className='title-group'><CalendarDays className="mod-icon cal-icon" /> <h2>Next Events</h2></div>
            <motion.button whileHover={{ scale: 1.1 }} className="icon-btn"><PlusCircle size={15}/></motion.button>
          </div>
          <div className="mod-content">
             {data.events.length === 0 && <p className='empty-state'>Your calendar is clear.</p>}
             {data.events.map(event => (
              <div key={event.id} className="event-item">
                <div className='event-time-block'>
                  <span className='event-date-num'>{new Date().getDate()}</span>
                  <span className='event-date-mo'>OCT</span>
                </div>
                <div className='event-details'>
                  <p className='event-title'>{event.title}</p>
                  <p className='event-meta'>{event.time} • {event.location}</p>
                </div>
                <div className="crud-actions">
                    <motion.button whileHover={{ scale: 1.2, color: "#60a5fa" }} onClick={() => handleRescheduleEvent(event.id)} title="Reschedule"><RefreshCw size={14} /></motion.button>
                    <motion.button whileHover={{ scale: 1.2, color: "#f87171" }} onClick={() => handleCancelEvent(event.id)} title="Cancel"><XCircle size={14} /></motion.button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="module-card tasks-mod">
          <div className="mod-header">
             <div className='title-group'><CheckSquare className="mod-icon task-icon" /> <h2>Priority Tasks</h2></div>
            <motion.button whileHover={{ scale: 1.1 }} className="icon-btn"><PlusCircle size={15}/></motion.button>
          </div>
          <div className="mod-content">
            {data.tasks.length === 0 && <p className='empty-state'>All tasks completed!</p>}
             {data.tasks.map(task => (
              <div key={task.id} className="task-item">
                <input type="checkbox" className="task-check" onChange={() => handleCompleteTask(task.id)}/>
                <div className='task-details'>
                    <p className='task-title'>{task.title}</p>
                    <p className='task-meta'>{task.list} • Due {task.due}</p>
                </div>
                 <motion.button whileHover={{ scale: 1.2 }} className="icon-btn task-options"><MoreVertical size={14} /></motion.button>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      <motion.div variants={itemVariants} className="chat-interface-wrapper">
        <div className="chat-input-container">
           <div className='chat-prefix'>Jarvis /</div>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask Jarvis to draft an email, reschedule a meeting, or check tasks..."
            className="chat-input-field"
          />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="chat-send-btn">
            <Search size={18}/>
          </motion.button>
        </div>
         <p className='chat-context-hint'>Autonomous M365 Agent active • Connected to Outlook & Graph API</p>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="jarvis-app-layout">
      <Header />
      <AnimatePresence mode="wait">
        {isAuthenticated ? <Dashboard key="dashboard" /> : <LandingPage key="landing" />}
      </AnimatePresence>
    </div>
  );
}

export default App;