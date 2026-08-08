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
  Volume2,
  Radio,
  Activity,
  ChevronRight,
} from "lucide-react";
import Logo from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import JarvisMascot from "./JarvisMascot";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://jarvis-backend-h38f.onrender.com";

/* -------------------------------------------------------------------------- */
/* Small HUD primitives                                                        */
/* -------------------------------------------------------------------------- */

// Four L-shaped corner brackets — the recurring frame motif for every panel.
function Brackets() {
  return (
    <>
      <span className="hud-bracket tl" />
      <span className="hud-bracket tr" />
      <span className="hud-bracket bl" />
      <span className="hud-bracket br" />
    </>
  );
}

// Section kicker: "01 // LABEL" in mono, the ops-console index style.
function Kicker({ index, children }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
      <span className="text-accent">{index}</span>
      <span className="text-ink-muted/50">//</span>
      <span>{children}</span>
    </div>
  );
}

function StatusDot({ tone = "ok" }) {
  const color =
    tone === "ok"
      ? "bg-emerald-400"
      : tone === "warn"
      ? "bg-amber-400"
      : "bg-accent";
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-60 motion-safe:animate-ping`} />
      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${color}`} />
    </span>
  );
}

// Live HH:MM:SS clock — real state, not decoration.
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now.toLocaleTimeString("en-GB", { hour12: false });
}

/* -------------------------------------------------------------------------- */
/* Agent Console — the centerpiece that replaces the particle orb             */
/* -------------------------------------------------------------------------- */

const SERVICES = [
  {
    icon: Mail,
    name: "outlook.mail",
    endpoint: "/me/messages",
    scope: "Mail.ReadWrite",
    reads: 128,
  },
  {
    icon: Calendar,
    name: "outlook.calendar",
    endpoint: "/me/events",
    scope: "Calendars.ReadWrite",
    reads: 42,
  },
  {
    icon: CheckSquare,
    name: "microsoft.todo",
    endpoint: "/me/todo/lists",
    scope: "Tasks.ReadWrite",
    reads: 17,
  },
];

const LOG_LINES = [
  { verb: "graph.mail.read", detail: "12 threads", code: 200, ms: 142 },
  { verb: "reason.plan", detail: "intent=draft_reply", code: 200, ms: 318 },
  { verb: "graph.mail.draft", detail: "saved → Drafts", code: 201, ms: 96 },
  { verb: "graph.calendar.read", detail: "next 7d", code: 200, ms: 88 },
  { verb: "reason.plan", detail: "intent=schedule", code: 200, ms: 274 },
  { verb: "graph.event.create", detail: "3pm sync", code: 201, ms: 121 },
  { verb: "graph.todo.read", detail: "priority list", code: 200, ms: 64 },
  { verb: "graph.todo.write", detail: "+1 task", code: 201, ms: 73 },
];

function SystemLog() {
  const [lines, setLines] = useState(() =>
    LOG_LINES.slice(0, 4).map((l, i) => ({ ...l, id: i }))
  );

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let cursor = 4;
    const id = setInterval(() => {
      const next = { ...LOG_LINES[cursor % LOG_LINES.length], id: cursor };
      cursor += 1;
      setLines((prev) => [...prev.slice(-3), next]);
    }, 1400);
    return () => clearInterval(id);
  }, []);

  const stamp = (i) => {
    const d = new Date(Date.now() - (lines.length - 1 - i) * 1400);
    return d.toLocaleTimeString("en-GB", { hour12: false });
  };

  return (
    <div className="font-mono text-[10.5px] leading-relaxed">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/70">
        <span className="uppercase tracking-[0.2em] text-ink-muted text-[9px]">
          agent.log
        </span>
        <span className="flex items-center gap-1.5 text-ink-muted text-[9px]">
          <StatusDot tone="ok" />
          streaming
        </span>
      </div>
      <div className="px-3 py-2.5 space-y-1">
        <AnimatePresence initial={false}>
          {lines.map((l, i) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2 whitespace-nowrap overflow-hidden"
            >
              <span className="text-ink-muted/60 shrink-0">{stamp(i)}</span>
              <span className="text-accent shrink-0">{l.verb}</span>
              <span className="text-ink-muted truncate">{l.detail}</span>
              <span className="ml-auto flex items-center gap-2 shrink-0">
                <span className={l.code < 300 ? "text-emerald-400" : "text-accent"}>
                  {l.code}
                </span>
                <span className="text-ink-muted/70">{l.ms}ms</span>
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

const PIPELINE_STAGES = [
  { icon: Mic, label: "Voice In" },
  { icon: Radio, label: "Transcribe" },
  { icon: Cpu, label: "Reason" },
  { icon: Volume2, label: "Voice Out" },
];

function PipelineTelemetry() {
  const [latency, setLatency] = useState(612);
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let stage = 0;
    const interval = setInterval(() => {
      stage = (stage + 1) % PIPELINE_STAGES.length;
      setActiveStage(stage);
      if (stage === 0) {
        setLatency(420 + Math.floor(Math.random() * 340));
      }
    }, 650);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-mono">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/70">
        <span className="text-[9px] uppercase tracking-[0.2em] text-ink-muted">Voice Pipeline</span>
        <span className="flex items-center gap-1.5 text-[10px]">
          <span className={`w-1.5 h-1.5 ${latency < 800 ? "bg-emerald-400" : "bg-amber-400"}`} />
          <span className={latency < 800 ? "text-emerald-400" : "text-amber-400"}>{latency}ms</span>
          <span className="text-ink-muted/60">/ 800 tgt</span>
        </span>
      </div>
      <div className="relative flex items-center justify-between px-3 py-3.5">
        <div className="absolute left-6 right-6 top-1/2 -translate-y-[9px] h-px bg-border/80" />
        {PIPELINE_STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const isActive = i === activeStage;
          const isDone = i < activeStage;
          return (
            <div key={stage.label} className="relative z-10 flex flex-col items-center gap-1.5 bg-surface px-1">
              <div
                className={`w-7 h-7 flex items-center justify-center border transition-all duration-200 ${
                  isActive
                    ? "bg-accent text-accent-ink border-accent"
                    : isDone
                    ? "bg-surface-2 text-accent border-accent/50"
                    : "bg-surface-2 text-ink-muted border-border"
                }`}
              >
                <Icon size={13} />
              </div>
              <span className={`text-[8.5px] tracking-wide uppercase ${isActive ? "text-accent" : "text-ink-muted"}`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ServiceRow({ icon: Icon, name, endpoint, scope, reads }) {
  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 border-b border-border/60 last:border-b-0 transition-colors hover:bg-surface-2/50">
      <div className="flex h-7 w-7 items-center justify-center border border-border bg-surface-2 text-accent">
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 font-mono text-[11px] text-ink">
          <span className="truncate">{name}</span>
          <ChevronRight size={10} className="text-ink-muted/50 shrink-0" />
          <span className="truncate text-ink-muted">{endpoint}</span>
        </div>
        <div className="font-mono text-[9px] uppercase tracking-wider text-ink-muted/70">
          {scope}
        </div>
      </div>
      <div className="hidden sm:flex flex-col items-end gap-0.5 font-mono">
        <span className="text-[10px] text-ink tabular-nums">{reads}</span>
        <span className="text-[8px] uppercase tracking-wider text-ink-muted/60">reads</span>
      </div>
      <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-emerald-400">
        <StatusDot tone="ok" />
        <span className="hidden sm:inline">linked</span>
      </div>
    </div>
  );
}

function AgentConsole() {
  const clock = useClock();
  return (
    <div className="relative w-full border border-border bg-surface/85 backdrop-blur-md shadow-2xl shadow-black/30">
      <Brackets />

      {/* Sweeping scan line */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="hud-sweep absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      </div>

      {/* Console title bar */}
      <div className="relative flex items-center justify-between border-b border-border px-3 py-2.5 bg-surface-2/60">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]">
          <Bot size={13} className="text-accent" />
          <span className="text-ink">jarvis</span>
          <span className="text-ink-muted/50">//</span>
          <span className="text-ink-muted">agent console</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span className="hidden sm:flex items-center gap-1.5 text-emerald-400 uppercase tracking-wider">
            <StatusDot tone="ok" />
            operational
          </span>
          <span className="tabular-nums text-ink-muted">{clock}</span>
        </div>
      </div>

      {/* Connected Graph services */}
      <div className="relative">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/70">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-muted">
            microsoft graph · linked
          </span>
          <span className="font-mono text-[9px] text-ink-muted/70">3 / 3</span>
        </div>
        {SERVICES.map((s) => (
          <ServiceRow key={s.name} {...s} />
        ))}
      </div>

      {/* Voice pipeline telemetry */}
      <PipelineTelemetry />

      {/* Live agent log */}
      <SystemLog />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Reveal-on-scroll hook (kept)                                                */
/* -------------------------------------------------------------------------- */

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
/* Capability panels (replaces soft glass feature cards)                       */
/* -------------------------------------------------------------------------- */

const capabilities = [
  {
    icon: Mail,
    id: "MOD-01",
    label: "Mailbox",
    title: "Reads, never sends without you",
    body: "Summarize your inbox or draft a reply. Every draft waits in Outlook for your review before anything leaves.",
  },
  {
    icon: Calendar,
    id: "MOD-02",
    label: "Calendar",
    title: "Full control over schedule",
    body: "Create, reschedule, or cancel events by describing them in natural language. Timezones resolved server-side.",
  },
  {
    icon: CheckSquare,
    id: "MOD-03",
    label: "Tasks",
    title: "Microsoft To-Do, spoken",
    body: "Add, complete, or reorganize tasks in a single prompt — no manual forms, no context switching.",
  },
];

function CapabilityPanel({ icon: Icon, id, label, title, body, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="relative border border-border bg-surface/70 p-5 text-left transition-colors hover:border-accent/50"
    >
      <Brackets />
      <div className="flex items-center justify-between mb-4">
        <div className="flex h-9 w-9 items-center justify-center border border-border bg-surface-2 text-accent">
          <Icon size={17} />
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-muted/70">
          {id}
        </span>
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
/* Mascot stage — the 3D core is the hero centerpiece                          */
/* -------------------------------------------------------------------------- */

// Small glassy readout that floats around the mascot.
function FloatingChip({ className = "", delay = 0, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute z-20 float-chip border border-border/80 bg-surface/70 backdrop-blur-md px-3 py-2 shadow-xl shadow-black/40 ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </motion.div>
  );
}

function MascotStage() {
  return (
    <div className="relative w-full aspect-square max-w-[520px] mx-auto">
      {/* Ambient glow pool + reticle sit behind the canvas */}
      <div className="mascot-aura pointer-events-none absolute inset-[8%] rounded-full" />
      <div className="mascot-reticle pointer-events-none absolute inset-0 opacity-70" />

      {/* The 3D core */}
      <JarvisMascot className="absolute inset-0 h-full w-full" />

      {/* Floating live readouts around the core */}
      <FloatingChip className="left-0 top-[14%]" delay={0.5}>
        <div className="flex items-center gap-2 font-mono">
          <StatusDot tone="ok" />
          <div className="leading-tight">
            <div className="text-[10px] font-semibold text-ink">Neural core</div>
            <div className="text-[8.5px] uppercase tracking-wider text-emerald-400">
              online
            </div>
          </div>
        </div>
      </FloatingChip>

      <FloatingChip className="right-0 top-[22%]" delay={0.75}>
        <div className="font-mono leading-tight text-right">
          <div className="metric-value text-[13px] font-bold text-accent">612ms</div>
          <div className="text-[8.5px] uppercase tracking-wider text-ink-muted">
            voice latency
          </div>
        </div>
      </FloatingChip>

      <FloatingChip className="left-[4%] bottom-[16%]" delay={1}>
        <div className="flex items-center gap-2 font-mono">
          <Radio size={13} className="text-accent" />
          <div className="leading-tight">
            <div className="text-[10px] font-semibold text-ink">LiveKit</div>
            <div className="text-[8.5px] uppercase tracking-wider text-ink-muted">
              streaming
            </div>
          </div>
        </div>
      </FloatingChip>

      <FloatingChip className="right-[2%] bottom-[24%]" delay={1.25}>
        <div className="flex items-center gap-2 font-mono">
          <div className="flex items-end gap-[2px] h-4">
            {[0, 0.15, 0.3, 0.45, 0.6].map((d, i) => (
              <span
                key={i}
                className="hud-meter-bar w-[3px] bg-glow-2"
                style={{ "--meter-delay": `${d}s`, height: "100%", backgroundColor: "var(--color-glow-2)" }}
              />
            ))}
          </div>
          <span className="text-[8.5px] uppercase tracking-wider text-ink-muted">
            listening
          </span>
        </div>
      </FloatingChip>
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
  const clock = useClock();

  useEffect(() => {
    setIsVoiceSupported(!!navigator.mediaDevices?.getUserMedia);
  }, []);

  const handleLogin =
    onLogin ||
    (() => {
      window.location.href = `${API_BASE_URL}/api/auth/login`;
    });

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
      {/* Backdrop — technical grid grounded by a soft ambient glow */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="hud-grid absolute inset-0 opacity-[0.4]" />
        <div
          className="absolute -top-1/4 right-[-10%] h-[70vh] w-[70vh] rounded-full opacity-40 blur-[120px]"
          style={{ backgroundColor: "var(--color-accent)" }}
        />
        <div
          className="absolute bottom-[-20%] left-[-10%] h-[55vh] w-[55vh] rounded-full opacity-25 blur-[120px]"
          style={{ backgroundColor: "var(--color-glow-2)" }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      </div>

      {/* System top bar */}
      <header className="relative z-20 border-b border-border/70 bg-surface/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto w-full px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={30} />
            <span className="font-display font-bold text-lg tracking-tight">Jarvis</span>
            <span className="ml-1 px-1.5 py-0.5 bg-surface-2 text-ink-muted text-[9px] font-mono font-bold tracking-wider border border-border">
              BUILD 2.0.0
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="hidden md:flex items-center gap-1.5 text-ink-muted uppercase tracking-wider">
              <Globe size={11} className="text-accent" />
              graph.microsoft.com
            </span>
            <span className="hidden md:inline text-border">|</span>
            <span className="hidden sm:inline tabular-nums text-ink-muted">{clock} UTC</span>
            {isVoiceSupported && (
              <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 uppercase tracking-wider">
                <StatusDot tone="ok" />
                <span className="hidden sm:inline">Voice Ready</span>
              </span>
            )}
            <ThemeToggle isDark={isDark} setIsDark={setIsDark} />
          </div>
        </div>
      </header>

      {/* HERO — asymmetric: command copy (left) + agent console (right) */}
      <main className="relative z-10 max-w-6xl mx-auto w-full px-5">
        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-10 lg:gap-12 items-center pt-12 lg:pt-16 pb-16">
          {/* Left column */}
          <div className="flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Kicker index="00">Autonomous assistant for M365</Kicker>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.5 }}
              className="mt-5 font-display text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.05] text-balance"
            >
              Operate your inbox, calendar, and tasks{" "}
              <span className="text-accent">from one prompt.</span>
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

            {/* Sign-in — solid, sharp, no halo */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.5 }}
              className="mt-8 flex flex-col gap-4"
            >
              <button
                onClick={handleLogin}
                className="btn-glow group relative inline-flex w-full sm:w-auto items-center justify-center gap-2.5 px-6 py-3.5 bg-accent text-accent-ink font-semibold text-sm border border-accent hover:bg-accent/90 active:translate-y-px cursor-pointer"
              >
                <span>Sign in with Microsoft</span>
                <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  Entra ID
                </span>
                <span className="text-border">|</span>
                <span className="flex items-center gap-1.5">
                  <Lock size={12} className="text-accent" />
                  OAuth 2.0
                </span>
                <span className="text-border">|</span>
                <span className="flex items-center gap-1.5">
                  <Bot size={12} className="text-accent" />
                  LLM powered
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right column — the 3D mascot centerpiece */}
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
        <section className="pb-16">
          <div className="mb-6">
            <Kicker index="01">Capabilities</Kicker>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {capabilities.map((c, i) => (
              <CapabilityPanel key={c.label} index={i} {...c} />
            ))}
          </div>
        </section>

        {/* LIVE OPERATIONS — the real agent console readout */}
        <section className="pb-16">
          <div className="mb-6">
            <Kicker index="02">Live operations</Kicker>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <AgentConsole />
          </motion.div>
        </section>

        {/* EXECUTION TRACE (terminal playground) */}
        <section
          ref={terminalRef}
          className={`reveal-up ${terminalVisible ? "is-visible" : ""} pb-16`}
        >
          <div className="mb-6">
            <Kicker index="03">Execution trace</Kicker>
          </div>

          <div className="relative border border-border bg-surface/80 backdrop-blur-md">
            <Brackets />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 border-b border-border">
              <div>
                <h3 className="font-display text-base font-bold flex items-center gap-2">
                  <Terminal size={17} className="text-accent" />
                  <span>See Jarvis resolve a request</span>
                </h3>
                <p className="text-xs mt-1 text-ink-muted">
                  Select a workflow to trace how it resolves through Microsoft Graph.
                </p>
              </div>

              <div className="flex items-center border border-border bg-surface-2/80">
                {["mail", "calendar", "tasks"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition duration-150 cursor-pointer ${
                      activeTab === tab
                        ? "bg-accent text-accent-ink"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="m-4 border border-border bg-bg/70 font-mono text-xs">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/70 text-ink-muted">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent/70 inline-block" />
                  <span className="w-2 h-2 inline-block" style={{ backgroundColor: "var(--color-glow-2)" }} />
                  <span className="w-2 h-2 bg-emerald-500/80 inline-block" />
                  <span className="ml-2 text-[10px]">jarvis-agent-executor</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-emerald-400 uppercase tracking-wider">
                  <StatusDot tone="ok" />
                  <span>live</span>
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
                    <span className="hud-caret text-accent">▋</span>
                  </p>
                  <div className="mt-2.5 space-y-2 pl-3 border-l border-accent/50">
                    <p className="text-emerald-400 flex items-center gap-2">
                      <span>[ok]</span> Intent parsed and entities resolved.
                    </p>
                    <p className="text-ink-muted flex items-center gap-2">
                      <span className="text-amber-400">[..]</span> {samplePrompts[activeTab].status}
                    </p>
                    <p className="text-accent font-semibold flex items-center gap-2">
                      <span>[→]</span> {samplePrompts[activeTab].action}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Footer readout */}
        <footer className="border-t border-border/70 py-6 flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="flex items-center gap-1.5">
              <Lock size={12} className="text-accent" />
              Tokens encrypted at rest
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-emerald-400" />
              OAuth2 session
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1.5">
              <Activity size={12} className="text-accent" />
              LiveKit voice
            </span>
          </div>
          <span className="text-ink-muted/60">jarvis // build 2.0.0</span>
        </footer>
      </main>
    </div>
  );
}
