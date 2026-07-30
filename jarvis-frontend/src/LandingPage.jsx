import React from 'react';
import { JarvisLogo } from './Logo';
import { Mail, CalendarCheck, CheckSquare, ArrowRight, ShieldCheck } from 'lucide-react';

export function LandingPage({ onLogin }) {
  return (
    <div className="min-h-screen bg-[#07070a] text-white flex flex-col items-center justify-between p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-7xl flex items-center justify-between py-4 z-10">
        <JarvisLogo />
        <div className="text-xs font-mono text-purple-400/80 bg-purple-950/40 border border-purple-500/30 px-3 py-1.5 rounded-full backdrop-blur-md">
          PERSONAL AGENT FOR MICROSOFT 365
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-5xl flex flex-col items-center text-center my-auto z-10 py-10">
        {/* 3D Orbit Telemetry Core Visual */}
        <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-purple-500/20 animate-ping" style={{ animationDuration: '4s' }} />
          <div className="absolute inset-4 rounded-full border border-indigo-500/30 border-dashed animate-spin" style={{ animationDuration: '20s' }} />
          <div className="absolute inset-10 rounded-full bg-gradient-to-br from-purple-600/30 to-indigo-600/30 blur-xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.5)]">
            <div className="w-8 h-8 rounded-full bg-white/95 shadow-inner" />
          </div>
          {/* Floating node icons */}
          <div className="absolute -top-2 right-4 p-2 rounded-lg bg-zinc-900/80 border border-purple-500/30 backdrop-blur-md shadow-lg"><Mail className="w-4 h-4 text-purple-400" /></div>
          <div className="absolute bottom-2 -left-2 p-2 rounded-lg bg-zinc-900/80 border border-indigo-500/30 backdrop-blur-md shadow-lg"><CheckSquare className="w-4 h-4 text-indigo-400" /></div>
          <div className="absolute bottom-4 -right-2 p-2 rounded-lg bg-zinc-900/80 border border-cyan-500/30 backdrop-blur-md shadow-lg"><CalendarCheck className="w-4 h-4 text-cyan-400" /></div>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl leading-tight">
          Your inbox, calendar, and to-dos — <br />
          <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            one conversation away.
          </span>
        </h1>
        
        <p className="text-zinc-400 text-base md:text-lg max-w-2xl mb-10">
          Tell Jarvis what you need. It reasons over your requests and acts directly on Outlook, Calendar, and To Do with complete accuracy.
        </p>

        <button 
          onClick={onLogin}
          className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium shadow-[0_0_25px_rgba(147,51,234,0.4)] hover:shadow-[0_0_35px_rgba(147,51,234,0.6)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>Sign in with Microsoft</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="flex items-center gap-2 mt-4 text-xs font-mono text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Authenticated via Microsoft Entra ID • Secure Token Storage</span>
        </div>
      </main>

      {/* Feature Cards Grid */}
      <footer className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 z-10">
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-xl hover:border-purple-500/40 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
            <Mail className="w-5 h-5 text-purple-400" />
          </div>
          <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">Mailbox</span>
          <h3 className="text-lg font-semibold mt-1 mb-2">Reads, never sends without you</h3>
          <p className="text-sm text-zinc-400">Ask Jarvis to summarize your inbox or draft a reply. Every draft waits in Outlook for your review.</p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-xl hover:border-indigo-500/40 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
            <CalendarCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">Calendar</span>
          <h3 className="text-lg font-semibold mt-1 mb-2">Full control over schedule</h3>
          <p className="text-sm text-zinc-400">Create, reschedule, or cancel events by describing them in plain conversational language.</p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-xl hover:border-cyan-500/40 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Tasks</span>
          <h3 className="text-lg font-semibold mt-1 mb-2">Your Microsoft To Do, spoken</h3>
          <p className="text-sm text-zinc-400">Add, complete, or reorganize tasks in a single sentence without filling out manual forms.</p>
        </div>
      </footer>
    </div>
  );
}