import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Bot, User, Sparkles, Mail, Calendar, CheckSquare, 
  Plus, LogOut, Sun, Moon, PanelLeft, ArrowUpRight 
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ThemeToggle } from "./ThemeToggle";

export default function ChatInterface({ userEmail, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMessage = { id: Date.now(), role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://jarvis-backend-h38f.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: userEmail, message: query }),
      });

      const data = await response.json();
      const botMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.reply || "Sorry, I couldn't process that request.",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "❌ Connection error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    { icon: Mail, label: "Summarize last 5 emails", query: "Summarize my unread emails from Outlook." },
    { icon: Calendar, label: "Check today's schedule", query: "What events or meetings do I have scheduled for today?" },
    { icon: CheckSquare, label: "List pending to-dos", query: "Show me all my high priority tasks in Microsoft To Do." },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-[#080a0f] text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden">
      
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? "280px" : "0px", opacity: sidebarOpen ? 1 : 0 }}
        className="h-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800/80 flex flex-col z-30 relative overflow-hidden"
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-bold text-base shadow-md shadow-purple-500/20">
              J
            </div>
            <span className="font-bold text-lg tracking-tight">Jarvis AI</span>
          </div>
          <button
            onClick={() => setMessages([])}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
            title="New Chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History List placeholder */}
        <div className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Active Session
          </div>
          <button className="w-full text-left px-3 py-2.5 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-medium text-sm flex items-center justify-between group">
            <span className="truncate">Current Workspace Chat</span>
            <Sparkles className="w-4 h-4 opacity-70" />
          </button>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
              {userEmail ? userEmail[0].toUpperCase() : "U"}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs text-slate-400 font-medium">Connected as</span>
              <span className="text-sm font-semibold truncate">{userEmail}</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </motion.aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Top Header */}
        <header className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/30 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <PanelLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Microsoft 365 Copilot Mode
            </span>
          </div>
          <ThemeToggle />
        </header>

        {/* Messages / Welcome View */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 max-w-4xl mx-auto w-full">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center my-auto">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-2xl shadow-purple-500/30 mb-6">
                <Bot className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-2">
                How can I assist your workflow today?
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm mb-10">
                I can manage your Microsoft Outlook inbox, schedule calendar events, and organize your tasks seamlessly.
              </p>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-2xl">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.query)}
                    className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 dark:hover:border-purple-500/50 text-left transition-all duration-300 group shadow-sm hover:shadow-md"
                  >
                    <item.icon className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-slate-400 block mb-1">
                      {item.label}
                    </span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                      "{item.query}"
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-md">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-3xl p-5 shadow-sm text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white rounded-br-none"
                      : "bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 rounded-bl-none"
                  }`}
                >
                  <ReactMarkdown className="prose dark:prose-invert max-w-none">
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {msg.role === "user" && (
                  <div className="w-9 h-9 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 font-bold text-xs">
                    You
                  </div>
                )}
              </motion.div>
            ))
          )}

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shrink-0">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl rounded-bl-none p-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Glass Input Area */}
        <div className="p-4 md:p-6 max-w-4xl mx-auto w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-center rounded-3xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2 transition-all focus-within:border-purple-500/50"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Jarvis to draft an email, schedule a meeting..."
              className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 disabled:opacity-40 disabled:hover:opacity-40 transition-all shadow-md shadow-purple-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}