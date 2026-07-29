import React from "react";
import { Mail, Calendar, CheckSquare, LogIn, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle.jsx";

function OrbitNode({ size, duration, children }) {
  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 orbit-ring"
      style={{ width: size, height: size, animationDuration: `${duration}s` }}
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 orbit-node"
        style={{ animationDuration: `${duration}s` }}
      >
        <div className="w-11 h-11 rounded-2xl bg-surface border border-border shadow-lg flex items-center justify-center text-accent">
          {children}
        </div>
      </div>
    </div>
  );
}

function OrbitSignature() {
  return (
    <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto mb-10 select-none" aria-hidden="true">
      {[150, 210, 270].map((s) => (
        <div
          key={s}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border"
          style={{ width: s, height: s }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-accent/40 blur-2xl rounded-full animate-glow-pulse" />
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-surface border border-border flex items-center justify-center font-display text-2xl font-semibold text-accent shadow-xl">
            J
          </div>
        </div>
      </div>
      <OrbitNode size={150} duration={16}><Mail size={17} /></OrbitNode>
      <OrbitNode size={210} duration={24}><Calendar size={17} /></OrbitNode>
      <OrbitNode size={270} duration={32}><CheckSquare size={17} /></OrbitNode>
    </div>
  );
}

const features = [
  {
    icon: Mail,
    eyebrow: "MAILBOX",
    title: "Reads, never sends without you",
    body: "Ask Jarvis to summarize your inbox or draft a reply. Every draft waits in Outlook for you to review and send.",
  },
  {
    icon: Calendar,
    eyebrow: "CALENDAR",
    title: "Full control over your schedule",
    body: "Create, reschedule, or cancel events by describing them in plain language.",
  },
  {
    icon: CheckSquare,
    eyebrow: "TASKS",
    title: "Your Microsoft To Do list, spoken",
    body: "Add, complete, or reorganize tasks in a single sentence, no forms to fill in.",
  },
];

export default function LandingPage({ onLogin, isDark, setIsDark }) {
  return (
    <div className="min-h-screen bg-bg text-ink font-body">
      <header className="max-w-5xl mx-auto flex items-center justify-between px-6 sm:px-10 py-7">
        <div className="font-display font-semibold text-lg tracking-tight">
          Jarvis<span className="text-accent">.</span>
        </div>
        <ThemeToggle isDark={isDark} setIsDark={setIsDark} />
      </header>

      <main className="max-w-5xl mx-auto px-6 sm:px-10 pb-24">
        <section className="text-center pt-6 sm:pt-10 animate-fade-up">
          <p className="font-mono text-xs tracking-[0.2em] text-ink-muted mb-8">
            PERSONAL AGENT FOR MICROSOFT 365
          </p>

          <OrbitSignature />

          <h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight mb-5 max-w-2xl mx-auto">
            Your inbox, calendar, and to-dos — one conversation away.
          </h1>
          <p className="text-ink-muted text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Tell Jarvis what you need. It reasons over the request and acts directly
            on Outlook, Calendar, and To Do — nothing leaves your mailbox without your review.
          </p>

          <button
            onClick={onLogin}
            className="inline-flex items-center gap-3 bg-accent text-accent-ink font-medium py-3.5 px-7 rounded-2xl transition hover:opacity-90 active:scale-[0.98] shadow-lg shadow-accent/20"
          >
            <LogIn size={19} /> Sign in with Microsoft
          </button>

          <div className="flex items-center justify-center gap-2 mt-5 font-mono text-[11px] text-ink-muted">
            <ShieldCheck size={13} /> Authenticated via Microsoft Entra ID
          </div>
        </section>

        <section className="grid sm:grid-cols-3 gap-5 mt-24">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="animate-fade-up bg-surface border border-border rounded-3xl p-6 text-left"
              style={{ animationDelay: `${i * 0.1 + 0.1}s` }}
            >
              <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-accent mb-5">
                <f.icon size={18} />
              </div>
              <p className="font-mono text-[11px] tracking-[0.15em] text-ink-muted mb-2">{f.eyebrow}</p>
              <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}