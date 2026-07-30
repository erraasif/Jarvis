import React from 'react';

export default function LandingPage({ onLogin, onExploreDemo, isDark, onToggleTheme }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] flex flex-col font-[var(--font-body)] transition-colors duration-300">
      
      {/* NAVBAR */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-[var(--color-border)]/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-[var(--color-accent-ink)] font-bold font-[var(--font-display)] text-base shadow-lg shadow-[var(--color-accent)]/30">
            J
          </div>
          <span className="font-[var(--font-display)] text-2xl font-extrabold tracking-tight text-glow-gradient">
            JARVIS AI
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onToggleTheme}
            className="px-4 py-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-[var(--font-mono)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-accent)] transition-all cursor-pointer"
          >
            {isDark ? '☀️ Light HUD' : '🌙 Cyber Dark'}
          </button>
          
          <button
            onClick={onLogin}
            className="hidden sm:inline-flex px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-ink)] font-semibold font-[var(--font-display)] text-sm hover:opacity-90 transition-all shadow-md shadow-[var(--color-accent)]/20 cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto my-12 animate-fade-up">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-[var(--font-mono)] text-[var(--color-accent)] mb-8 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Microsoft 365 Autonomous Agent • Graph API Integrated
        </div>

        <h1 className="text-5xl sm:text-7xl font-black font-[var(--font-display)] tracking-tight mb-8 leading-[1.1]">
          Your inbox, calendar & tasks <br />
          <span className="text-glow-gradient">one conversation away.</span>
        </h1>

        <p className="text-lg sm:text-xl text-[var(--color-ink-muted)] max-w-2xl mb-12 leading-relaxed">
          Tell JARVIS what you need. It reasons over your requests and acts directly on Outlook, Calendar, and To Do with complete accuracy.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
          <button
            onClick={onLogin}
            className="w-full sm:w-auto px-9 py-4 rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-ink)] font-bold font-[var(--font-display)] text-base hover:opacity-95 transform hover:-translate-y-0.5 transition-all shadow-xl shadow-[var(--color-accent)]/25 cursor-pointer flex items-center justify-center gap-2"
          >
            Sign in with Microsoft →
          </button>
          
          <button
            onClick={onExploreDemo}
            className="w-full sm:w-auto px-8 py-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] font-semibold font-[var(--font-display)] text-base hover:bg-[var(--color-surface-2)] transition-all cursor-pointer text-[var(--color-ink)]"
          >
            Explore Interactive Demo
          </button>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mt-20 text-left">
          <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm hover:border-[var(--color-accent)]/50 transition-all">
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="font-[var(--font-display)] font-bold text-lg mb-2">Instant Directives</h3>
            <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
              Create, complete, and delete Microsoft To Do tasks straight from natural language prompts.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm hover:border-[var(--color-accent)]/50 transition-all">
            <div className="text-2xl mb-3">📬</div>
            <h3 className="font-[var(--font-display)] font-bold text-lg mb-2">Mail Intercept</h3>
            <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
              Summarize unread emails, compose responses, and flag high-priority messages automatically.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm hover:border-[var(--color-accent)]/50 transition-all">
            <div className="text-2xl mb-3">📅</div>
            <h3 className="font-[var(--font-display)] font-bold text-lg mb-2">Smart Calendar</h3>
            <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
              Schedule meetings, check free slots, and manage conflict resolutions seamlessly.
            </p>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-[var(--color-border)]/40 text-center text-xs font-[var(--font-mono)] text-[var(--color-ink-muted)]">
        Authenticated via Microsoft Entra ID • Secure Token Storage
      </footer>
    </div>
  );
}