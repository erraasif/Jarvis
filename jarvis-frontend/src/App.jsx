import React, { useState } from 'react';
import { JarvisLogo } from './Logo';
import { LandingPage } from './LandingPage';
import { MessageSquare, Mail, Calendar, CheckSquare, Sun, Moon, LogOut, Send, AlertCircle } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I am Jarvis. Tell me what you'd like to manage across your Outlook Mail, Calendar, or To-Dos." }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorToast, setErrorToast] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const triggerError = (msg) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 5000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isProcessing) return;

    const userText = inputMessage;
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setIsProcessing(true);

    try {
      // API call to your backend chat/LangGraph endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.message || "Action processed successfully." }]);
    } catch (err) {
      console.error("Chat execution error:", err);
      triggerError(err.message || "Failed to process request through Jarvis backend.");
      setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Sorry, I encountered an issue processing that request. Please check your configuration or API status." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${darkMode ? 'bg-[#07070a] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Error Toast Notification Banner */}
      {errorToast && (
        <div className="absolute top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-950/90 border border-red-500/50 text-red-200 shadow-2xl backdrop-blur-md animate-bounce">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-sm font-medium">{errorToast}</span>
        </div>
      )}

      {/* Sidebar Workspace Navigation */}
      <aside className={`w-72 border-r flex flex-col justify-between p-4 ${darkMode ? 'bg-[#0b0b10] border-zinc-800/80' : 'bg-white border-slate-200'}`}>
        <div>
          <div className="flex items-center justify-between mb-8 px-2">
            <JarvisLogo />
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition-colors ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-black'}`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-3 px-2">Workspace</div>
          <nav className="space-y-1">
            {[
              { id: 'chat', label: 'Agent Assistant', icon: MessageSquare },
              { id: 'mail', label: 'Mail & Drafts', icon: Mail },
              { id: 'calendar', label: 'Calendar', icon: Calendar },
              { id: 'todos', label: 'To-Do List', icon: CheckSquare },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                      : darkMode ? 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Account / Disconnect */}
        <div className={`pt-4 border-t ${darkMode ? 'border-zinc-800/80' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between px-2 mb-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center font-bold text-xs text-purple-300 shrink-0">
                A
              </div>
              <div className="overflow-hidden">
                <div className="text-xs text-zinc-500 font-mono uppercase">Connected</div>
                <div className="text-xs truncate font-medium">annagondal@outlook.com</div>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-500/30 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnect Account</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header Bar */}
        <header className={`h-16 border-b flex items-center justify-between px-6 z-10 ${darkMode ? 'bg-[#07070a]/80 border-zinc-800/80' : 'bg-white/80 border-slate-200'} backdrop-blur-md`}>
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span>Autonomous Microsoft 365 Copilot</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Live Session</span>
          </div>
        </header>

        {/* Dynamic Workspace View */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {activeTab === 'chat' ? (
            <div className="flex-1 flex flex-col justify-between max-w-4xl w-full mx-auto p-6">
              {/* Chat Feed */}
              <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-2">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-1">
                        <MessageSquare className="w-4 h-4 text-purple-400" />
                      </div>
                    )}
                    <div className={`max-w-xl rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-sm' 
                        : darkMode ? 'bg-zinc-900/80 border border-zinc-800 text-zinc-200 rounded-bl-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex gap-4 items-center">
                    <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center animate-pulse">
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-xs font-mono text-purple-400 animate-pulse">Jarvis is reasoning over Microsoft Graph APIs...</div>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="pt-4 pb-2">
                <form onSubmit={handleSendMessage} className={`relative rounded-2xl border p-2 flex items-center shadow-xl ${darkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200'}`}>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask Jarvis (e.g. 'Summarize unread emails' or 'Schedule a call tomorrow at 3pm')..."
                    className="w-full bg-transparent px-4 py-2.5 text-sm focus:outline-none"
                  />
                  <button 
                    type="submit"
                    disabled={isProcessing || !inputMessage.trim()}
                    className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 disabled:opacity-50 transition-opacity shadow-[0_0_15px_rgba(147,51,234,0.3)] shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <div className="text-center mt-3 text-[11px] font-mono text-zinc-500">
                  🔒 All email actions wait in Outlook as drafts for safety.
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2 capitalize">{activeTab} Workspace</h2>
              <p className="text-sm text-zinc-400 max-w-md">
                Manage your Microsoft 365 {activeTab} directly via conversational commands in the Agent Assistant tab, or execute automated CRUD syncs here.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}