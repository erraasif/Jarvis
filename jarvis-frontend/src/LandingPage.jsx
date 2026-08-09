import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Mail,
  Calendar,
  CheckSquare,
  ShieldCheck,
  Terminal,
  Lock,
  Cpu,
  Mic,
  Globe,
  Bot,
  Activity,
} from "lucide-react";
import Logo from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import JarvisMascot from "./JarvisMascot";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://jarvis-backend-h38f.onrender.com";

function StatusDot({ tone = "ok" }) {
  const color =
    tone === "ok" ? "bg-emerald-400" : tone === "warn" ? "bg-amber-400" : "bg-accent";
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-60 motion-safe:animate-ping`} />
      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${color}`} />
    </span>
  );
}

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

/* -------------------------------------------------------------------------- */
/* Capability cards -- soft, rounded, glowing on hover                        */
/* -------------------------------------------------------------------------- */

const capabilities = [
  {
    icon: Mail,
    label: "Mailbox",
    title: "Reads, never sends without you",
    body: "Summarize your inbox or draft a reply. Every draft waits in Outlook for your review before anything leaves.",
  },
  {
    icon: Calendar,
    label: "Calendar",
    title: "Full control over schedule",
    body: "Create, reschedule, or cancel events by describing them in natural language. Timezones resolved server-side.",
  },
  {
    icon: CheckSquare,
    label: "Tasks",
    title: "Microsoft To-Do, spoken",
    body: "Add, complete, or reorganize tasks in a single prompt — no manual forms, no context switching.",
  },
];

function CapabilityPanel({ icon: Icon, label, title, body, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-3xl border border-border bg-surface/70 backdrop-blur-xl p-6 text-left transition-all duration-300 hover:border-accent/40 card-pulse-glow"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-2 border border-border text-accent mb-4">
        <Icon size={20} />
      </div>
      <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-1.5">
        {label}
      </span>
      <h3 className="font-display text-base font-bold mb-2 text-balance">{title}</h3>
      <p className="text-xs leading-relaxed text-ink-muted text-pretty">{body}</p>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Mascot stage                                                                */
/* -------------------------------------------------------------------------- */

function FloatingChip({ className = "", delay = 0, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute z-20 float-chip rounded-2xl border border-border/80 bg-surface/70 backdrop-blur-md px-3 py-2 shadow-xl shadow-black/40 ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </motion.div>
  );
}

function MascotStage() {
  return (
    <div className="relative w-full aspect-square max-w-[520px] mx-auto">
      <div className="mascot-aura pointer-events-none absolute inset-[8%] rounded-full" />

      <JarvisMascot className="absolute inset-0 h-full w-full" variant="core" />

      <FloatingChip className="left-0 top-[14%]" delay={0.5}>
        <div className="flex items-center gap-2 font-mono">
          <StatusDot tone="ok" />
          <div className="leading-tight">
            <div className="text-[10px] font-semibold text-ink">Neural core</div>
            <div className="text-[8.5px] uppercase tracking-wider text-emerald-400">online</div>
          </div>
        </div>
      </FloatingChip>

      <FloatingChip className="right-0 top-[22%]" delay={0.75}>
        <div className="font-mono leading-tight text-right">
          <div className="text-[13px] font-bold text-accent">612ms</div>
          <div className="text-[8.5px] uppercase tracking-wider text-ink-muted">voice latency</div>
        </div>
      </FloatingChip>

      <FloatingChip className="left-[4%] bottom-[16%]" delay={1}>
        <div className="flex items-center gap-2 font-mono">
          <Cpu size={13} className="text-accent" />
          <div className="leading-tight">
            <div className="text-[10px] font-semibold text-ink">LiveKit</div>
            <div className="text-[8.5px] uppercase tracking-wider text-ink-muted">streaming</div>
          </div>
        </div>
      </FloatingChip>

      <FloatingChip className="right-[2%] bottom-[24%]" delay={1.25}>
        <div className="flex items-center gap-2 font-mono">
          <div className="flex items-end gap-[2px] h-4">
            {[0, 0.15, 0.3, 0.45, 0.6].map((d, i) => (
              <span
                key={i}
                className="hud-meter-bar w-[3px] rounded-full"
                style={{ "--meter-delay": `${d}s`, height: "100%", backgroundColor: "var(--color-glow-2)" }}
              />
            ))}
          </div>
          <span className="text-[8.5px] uppercase tracking-wider text-ink-muted">listening</span>
        </div>
      </FloatingChip>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Voice pipeline telemetry                                                    */
/* -------------------------------------------------------------------------- */

const PIPELINE_STAGES = [
  { icon: Mic, label: "Voice In" },
  { icon: Activity, label: "Transcribe" },
  { icon: Cpu, label: "Reason" },
  { icon: Bot, label: "Voice Out" },
];

function PipelineTelemetry() {
  const [latency, setLatency] = useState(612);
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let stage = 0;
    const interval = setInterval(() => {
      stage = (stage + 1) % PIPELINE_STAGES.length;
      setActiveStage(stage);
      if (stage === 0) setLatency(420 + Math.floor(Math.random() * 340));
    }, 650);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-md mt-7 p-3.5 rounded-2xl border border-border/70 bg-surface/70 backdrop-blur-xl font-mono shadow-lg">
      <div className="flex items-center justify-between px-1 mb-3">
        <span className="text-[10px] uppercase tracking-widest text-ink-muted">Live Voice Pipeline</span>
        <span className="flex items-center gap-1.5 text-[10px]">
          <span className={`w-1.5 h-1.5 rounded-full ${latency < 800 ? "bg-emerald-400" : "bg-amber-400"}`} />
          <span className={latency < 800 ? "text-emerald-400" : "text-amber-400"}>{latency}ms</span>
          <span className="text-ink-muted/70">/ 800ms target</span>
        </span>
      </div>
      <div className="relative flex items-center justify-between px-1">
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-px bg-border/80" />
        {PIPELINE_STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const isActive = i === activeStage;
          return (
            <div key={stage.label} className="relative z-10 flex flex-col items-center gap-1.5 bg-surface/70 px-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  isActive
                    ? "bg-accent text-accent-ink border-accent shadow-[0_0_16px_var(--color-accent)]"
                    : "bg-surface-2 text-ink-muted border-border"
                }`}
              >
                <Icon size={13} />
              </div>
              <span className={`text-[9px] tracking-wide ${isActive ? "text-accent" : "text-ink-muted"}`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main landing page                                                           */
/* -------------------------------------------------------------------------- */

export default function LandingPage({ onLogin, isDark, setIsDark }) {
  const [activeTab, setActiveTab] = useState("mail");
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);
  const [terminalRef, terminalVisible] = useReveal();

  useEffect(() => {
    setIsVoiceSupported(!!navigator.mediaDevices?.getUserMedia);
  }, []);

  const handleLogin =
    onLogin ||
    (() => {
      window.location.href = `${API_BASE_URL}/api/auth/login`;
    });

  const scrollToCapabilities = () => {
    document.getElementById("capabilities")?.scrollIntoView({ behavior: "smooth" });
  };

  const samplePrompts = {
    mail: {
      prompt: "Draft a follow-up email to Alex regarding yesterday's project review.",
      status: "Reading recent thread context from Outlook...",
      action: "Draft generated and saved in Outlook Drafts.",
    },
    calendar: {
      prompt: "Schedule a 30-min sync with Alex tomorrow at 3 PM.",
      status: "Resolving 'tomorrow 3pm' against your local timezone...",
      action: "Calendar event created on your Outlook calendar.",
    },
    tasks: {
      prompt: "Add 'Review Q3 financial roadmap' to my priority tasks.",
      status: "Syncing with Microsoft To-Do...",
      action: "Task added to your Microsoft To-Do list.",
    },
  };

  return (
    <div className="relative min-h-screen bg-bg text-ink transition-colors duration-300 selection:bg-accent/30">
      {/* Warm glowing backdrop -- lighter base + bigger, brighter blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div
          className="absolute -top-1/4 right-[-15%] h-[80vh] w-[80vh] rounded-full opacity-50 blur-[130px]"
          style={{ backgroundColor: "var(--color-accent)" }}
        />
        <div
          className="absolute bottom-[-25%] left-[-15%] h-[65vh] w-[65vh] rounded-full opacity-35 blur-[130px]"
          style={{ backgroundColor: "var(--color-glow-2)" }}
        />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[50vh] w-[50vh] rounded-full opacity-20 blur-[140px]"
          style={{ backgroundColor: "var(--color-accent)" }}
        />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-border/60 bg-surface/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto w-full px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={30} />
            <span className="font-display font-bold text-lg tracking-tight">Jarvis</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:flex items-center gap-1.5 text-xs text-ink-muted">
              <Globe size={13} className="text-accent" />
              Microsoft Graph
            </span>
            {isVoiceSupported && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs">
                <StatusDot tone="ok" />
                <span className="hidden sm:inline">Voice Ready</span>
              </span>
            )}
            <ThemeToggle isDark={isDark} setIsDark={setIsDark} />
          </div>
        </div>
      </header>

      {/* HERO */}
      <main className="relative z-10 max-w-6xl mx-auto w-full px-5">
        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-10 lg:gap-12 items-center pt-14 lg:pt-20 pb-16">
          <div className="flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex w-fit items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface/60 text-xs text-ink-muted"
            >
              <Bot size={13} className="text-accent" />
              Autonomous assistant for Microsoft 365
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.5 }}
              className="mt-5 font-display text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.05] text-balance"
            >
              Operate your inbox, calendar, and tasks{" "}
              <span className="text-accent text-glow-accent">from one prompt.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.5 }}
              className="mt-5 text-sm sm:text-base leading-relaxed text-ink-muted max-w-md text-pretty"
            >
              Jarvis reasons over your request and acts directly on Outlook Mail,
              Calendar, and Microsoft To-Do through Graph — now driven by{" "}
              <span className="text-ink font-semibold">real-time voice</span>.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.5 }}
              className="mt-8 flex flex-col gap-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleLogin}
                  className="btn-glow btn-pulse-glow group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-ink font-semibold text-sm hover:bg-accent/90 active:translate-y-px cursor-pointer"
                >
                  <span>Sign in with Microsoft</span>
                  <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                </button>
                <button
                  onClick={scrollToCapabilities}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-surface/60 text-ink font-medium text-sm hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  Explore
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  Entra ID
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock size={12} className="text-accent" />
                  OAuth 2.0
                </span>
                <span className="flex items-center gap-1.5">
                  <Bot size={12} className="text-accent" />
                  LLM powered
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <PipelineTelemetry />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <MascotStage />
          </motion.div>
        </section>

        {/* CAPABILITIES */}
        <section id="capabilities" className="pb-16">
          <h2 className="font-display text-xl font-bold mb-6">Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {capabilities.map((c, i) => (
              <CapabilityPanel key={c.label} index={i} {...c} />
            ))}
          </div>
        </section>

        {/* EXECUTION TRACE -- soft, rounded, glassy terminal */}
        <section
          ref={terminalRef}
          className={`reveal-up ${terminalVisible ? "is-visible" : ""} pb-16`}
        >
          <div className="relative rounded-3xl border border-accent/25 bg-surface/70 backdrop-blur-2xl overflow-hidden shadow-2xl shadow-accent/10">
            <div className="absolute -top-16 left-1/4 w-[380px] h-[240px] bg-accent/20 blur-[100px] rounded-full pointer-events-none -z-10" />
            <div className="absolute -bottom-14 right-1/4 w-[380px] h-[240px] bg-[color:var(--color-glow-2)]/15 blur-[110px] rounded-full pointer-events-none -z-10" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-border/70">
              <div>
                <h3 className="font-display text-base font-bold flex items-center gap-2">
                  <Terminal size={17} className="text-accent" />
                  See Jarvis resolve a request
                </h3>
                <p className="text-xs mt-1 text-ink-muted">
                  Select a workflow to trace how it resolves through Microsoft Graph.
                </p>
              </div>
              <div className="flex items-center rounded-xl border border-border bg-surface-2/70 p-1">
                {["mail", "calendar", "tasks"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3.5 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wider transition duration-150 cursor-pointer ${
                      activeTab === tab ? "bg-accent text-accent-ink" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="m-5 rounded-2xl border border-border bg-bg/70 font-mono text-xs overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/70 text-ink-muted">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent/70" />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--color-glow-2)" }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-[10px]">jarvis-agent-executor</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-emerald-400">
                  <StatusDot tone="ok" />
                  live
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="p-4 space-y-2.5"
                >
                  <p className="text-accent">
                    <span className="text-ink-muted">$</span> prompt --input{" "}
                    <span className="text-ink font-sans font-medium">"{samplePrompts[activeTab].prompt}"</span>
                  </p>
                  <div className="mt-2.5 space-y-2 pl-3 border-l-2 border-accent/40">
                    <p className="text-emerald-400">✓ Intent parsed and entities resolved.</p>
                    <p className="text-ink-muted">
                      <span className="text-amber-400">•</span> {samplePrompts[activeTab].status}
                    </p>
                    <p className="text-accent font-semibold">→ {samplePrompts[activeTab].action}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/60 py-6 flex flex-wrap items-center justify-between gap-4 text-[11px] text-ink-muted">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="flex items-center gap-1.5">
              <Lock size={12} className="text-accent" />
              Tokens encrypted at rest
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-emerald-400" />
              OAuth2 session
            </span>
            <span className="flex items-center gap-1.5">
              <Activity size={12} className="text-accent" />
              LiveKit voice
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}