import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Mail,
  Calendar,
  CheckSquare,
  ShieldCheck,
  Terminal,
  Sparkles,
  Lock,
  Cpu,
  Mic,
  Zap,
  Globe,
  Bot,
  Volume2,
  Radio,
} from "lucide-react";
import Logo from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://jarvis-backend-h38f.onrender.com";

function getAccentRGB() {
  if (typeof window === "undefined") return [139, 124, 255];
  const probe = document.createElement("div");
  probe.style.color = "var(--color-accent)";
  probe.style.display = "none";
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  const match = resolved.match(/\d+/g);
  return match ? match.slice(0, 3).map(Number) : [139, 124, 255];
}

function Interactive3DCore({ isDark }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -14, y: px * 14 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;

    const dpr = window.devicePixelRatio || 1;
    const displaySize = 340;
    canvas.width = displaySize * dpr;
    canvas.height = displaySize * dpr;
    ctx.scale(dpr, dpr);

    const width = displaySize;
    const height = displaySize;

    const particles = [];
    const numParticles = 125;
    const radius = 95;

    for (let i = 0; i < numParticles; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = 2 * Math.PI * Math.random();
      particles.push({
        x: radius * Math.sin(theta) * Math.cos(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(theta),
      });
    }

    const angleX = 0.012;
    const angleY = 0.018;

    const [ar, ag, ab] = getAccentRGB();

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const centerX = width / 2;
      const centerY = height / 2;

      particles.forEach((p) => {
        const x1 = p.x * Math.cos(angleY) - p.z * Math.sin(angleY);
        const z1 = p.z * Math.cos(angleY) + p.x * Math.sin(angleY);

        const y1 = p.y * Math.cos(angleX) - z1 * Math.sin(angleX);
        const z2 = z1 * Math.cos(angleX) + p.y * Math.sin(angleX);

        p.x = x1;
        p.y = y1;
        p.z = z2;

        const scale = 280 / (280 + p.z);
        const projX = p.x * scale + centerX;
        const projY = p.y * scale + centerY;
        const alpha = (p.z + radius) / (2 * radius);

        ctx.beginPath();
        ctx.arc(projX, projY, Math.max(1, 2.2 * scale), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ar}, ${ag}, ${ab}, ${Math.max(0.25, alpha)})`;
        ctx.fill();
      });

      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        10,
        centerX,
        centerY,
        80
      );
      gradient.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, 0.35)`);
      gradient.addColorStop(0.6, `rgba(${ar}, ${ag}, ${ab}, 0.1)`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isDark]);

  return (
    <div
      ref={wrapperRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 900 }}
      className="relative flex items-center justify-center w-72 h-72 md:w-96 md:h-96 mb-6 select-none"
    >
      <div className="absolute w-[300px] h-[300px] md:w-[380px] md:h-[380px] rounded-full bg-gradient-to-r from-accent/30 via-[color:var(--color-glow-2)]/30 to-accent/20 blur-3xl opacity-80 pointer-events-none -z-10" />
      <div className="absolute w-[270px] h-[270px] md:w-[330px] md:h-[330px] rounded-full orbit-aura-ring opacity-40 pointer-events-none -z-10" />

      <motion.div
        animate={{ rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative w-full h-full flex items-center justify-center"
      >
        <div className="absolute inset-0 rounded-full border border-accent/20 animate-ping opacity-20 pointer-events-none" />
        <div className="absolute inset-6 rounded-full border border-accent/25 blur-[1px]" />

        <canvas ref={canvasRef} className="relative z-10 w-full h-full" />

        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          style={{ transform: "translateZ(50px)" }}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-2xl bg-surface/80 backdrop-blur-xl border border-border/80 shadow-xl text-accent"
        >
          <Mail className="w-4 h-4 md:w-5 md:h-5" />
        </motion.div>

        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          style={{ transform: "translateZ(50px)" }}
          className="absolute bottom-6 left-2 z-20 p-2.5 rounded-2xl bg-surface/80 backdrop-blur-xl border border-border/80 shadow-xl text-accent"
        >
          <Calendar className="w-4 h-4 md:w-5 md:h-5" />
        </motion.div>

        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
          style={{ transform: "translateZ(50px)" }}
          className="absolute top-1/2 left-0 -translate-y-1/2 z-20 p-2.5 rounded-2xl bg-surface/80 backdrop-blur-xl border border-border/80 shadow-xl text-accent"
        >
          <CheckSquare className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
        </motion.div>

        {/* Listening indicator - live waveform, not a static label */}
        <div
          style={{ transform: "translateZ(60px)" }}
          className="absolute bottom-0 right-0 z-20 flex items-center gap-2 pl-2 pr-3 py-2 rounded-full bg-surface/85 backdrop-blur-xl border border-accent/40 shadow-lg"
        >
          <Mic size={11} className="text-accent" />
          <span className="flex items-end gap-[2px] h-3" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="waveform-bar w-[2.5px] rounded-full bg-accent"
                style={{ "--bar-delay": `${i * 0.12}s` }}
              />
            ))}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

const features = [
  {
    icon: Mail,
    label: "Mailbox",
    title: "Reads, never sends without you",
    body: "Ask Jarvis to summarize your inbox or draft a reply. Every draft waits safely in Outlook for your review.",
    color: "from-blue-500/20 to-blue-600/10",
  },
  {
    icon: Calendar,
    label: "Calendar",
    title: "Full control over schedule",
    body: "Create, reschedule, or cancel events by describing them in natural conversational language.",
    color: "from-purple-500/20 to-purple-600/10",
  },
  {
    icon: CheckSquare,
    label: "Tasks",
    title: "Your Microsoft To-Do, spoken",
    body: "Add, complete, or reorganize tasks in a single prompt without manual form filing.",
    color: "from-emerald-500/20 to-emerald-600/10",
  },
];

function FeatureCard({ icon: Icon, label, title, body, index, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, scale: 1.01 }}
      className="card-energy-ring group relative p-6 rounded-3xl bg-surface/60 backdrop-blur-md border border-border/70 overflow-hidden text-left transition-all duration-300 shadow-lg shadow-black/20"
    >
      <div className={`pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500`} />

      <motion.div
        whileHover={{ rotate: [0, -8, 8, 0], scale: 1.08 }}
        transition={{ duration: 0.5 }}
        className="relative w-10 h-10 rounded-2xl bg-accent/15 flex items-center justify-center text-accent mb-4 border border-accent/20"
      >
        <Icon size={20} />
      </motion.div>
      <span className="relative text-[10px] font-mono uppercase tracking-wider font-semibold block mb-1 text-accent">
        {label}
      </span>
      <h3 className="relative font-display text-base font-bold mb-2">{title}</h3>
      <p className="relative text-xs leading-relaxed text-ink-muted">{body}</p>
    </motion.div>
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

function VoiceModePreview() {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal-up ${visible ? "is-visible" : ""} relative mt-16 w-full rounded-3xl border border-border/70 bg-surface/70 backdrop-blur-xl p-8 sm:p-12 overflow-hidden`}
    >
      <div className="console-grid absolute inset-0 pointer-events-none opacity-50" />
      <div className="relative flex flex-col items-center text-center gap-6">
        <span className="text-[10px] uppercase tracking-widest text-ink-muted font-mono">Voice Mode Preview</span>

        <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
          <div
            className="absolute rounded-full voice-preview-pulse"
            style={{
              width: 150,
              height: 150,
              background: "radial-gradient(circle at 35% 30%, var(--color-glow-2), var(--color-accent) 55%, transparent 78%)",
            }}
          />
          <div className="absolute rounded-full border border-accent/40" style={{ width: 180, height: 180 }} />
          <Mic size={22} className="relative z-10 text-bg" />
        </div>

        <p className="max-w-md text-sm text-ink-muted">
          A full-screen presence that listens and reacts in real time — mail, calendar, and to-dos are one sentence
          away. This is a preview; the real thing runs after you sign in.
        </p>
      </div>
    </div>
  );
}

export default function LandingPage({ onLogin, isDark, setIsDark }) {
  const [activeTab, setActiveTab] = useState("mail");
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);
  const [terminalRef, terminalVisible] = useReveal();

  useEffect(() => {
    // Check if browser supports WebRTC
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
      emoji: "📧",
    },
    calendar: {
      prompt: "Schedule a 30-min sync with Alex tomorrow at 3 PM.",
      status: "Resolving 'tomorrow 3pm' against your local timezone...",
      action: "Calendar event created on your Outlook calendar.",
      emoji: "📅",
    },
    tasks: {
      prompt: "Add 'Review Q3 financial roadmap' to my priority tasks.",
      status: "Syncing with Microsoft To-Do...",
      action: "Task added to your Microsoft To-Do list.",
      emoji: "✅",
    },
  };

  return (
    <div className="relative min-h-screen bg-bg text-ink transition-colors duration-300 flex flex-col items-center justify-between overflow-hidden selection:bg-accent/30">
      
      {/* Background Glow Effect */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-40%] left-[-20%] w-[600px] h-[600px] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute bottom-[-40%] right-[-20%] w-[600px] h-[600px] rounded-full bg-[color:var(--color-glow-2)]/10 blur-[120px]" />
        <div className="console-grid absolute inset-0" />
      </div>

      {/* Header */}
      <header className="relative z-20 max-w-5xl w-full px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={32} />
          <span className="font-display font-bold text-lg tracking-tight text-glow">Jarvis</span>
          <span className="ml-2 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[9px] font-mono font-bold tracking-wider border border-accent/30">
            v2.0
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isVoiceSupported && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
              <Mic size={11} />
              <span className="hidden sm:inline">Voice Ready</span>
            </div>
          )}
          <ThemeToggle isDark={isDark} setIsDark={setIsDark} />
        </div>
      </header>

      {/* Main Content Hero */}
      <main className="relative z-10 max-w-4xl w-full px-6 pt-4 pb-20 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/30 bg-accent/15 text-accent text-xs uppercase tracking-widest mb-6 backdrop-blur-md shadow-sm"
        >
          <Sparkles size={13} className="animate-pulse" />
          <span>Autonomous Assistant for M365</span>
          <span className="w-1 h-1 rounded-full bg-accent/50" />
          <Zap size={11} className="text-accent" />
          <span>LiveKit Voice</span>
        </motion.div>

        {/* 3D Particle Orbit Core Visualizer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <Interactive3DCore isDark={isDark} />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight max-w-2xl leading-tight"
        >
          Your inbox, calendar, and to-dos —{" "}
          <span className="text-glow-gradient bg-linear-to-r from-accent via-accent to-[color:var(--color-glow-2)] bg-clip-text text-transparent">
            one prompt away.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-sm sm:text-base max-w-lg leading-relaxed text-ink-muted"
        >
          Tell Jarvis what you need. It reasons over requests and acts directly on
          Outlook Mail, Calendar, and To-Do with complete precision — now with <span className="text-accent font-semibold">voice</span>.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex justify-center w-full"
        >
          <PipelineTelemetry />
        </motion.div>

        {/* Sign-in Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-7 flex flex-col items-center gap-3"
        >
          <div className="relative">
            <div className="btn-halo absolute -inset-3 rounded-[28px] blur-2xl pointer-events-none" />
            <div className="btn-energy-ring rounded-2xl relative">
              <button
                onClick={handleLogin}
                className="group relative inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-accent text-accent-ink font-semibold text-sm shadow-lg shadow-accent/30 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-accent/50 active:scale-95 cursor-pointer"
              >
                <span>Sign in with Microsoft</span>
                <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-ink-muted">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-400" />
              <span>Microsoft Entra ID</span>
            </div>
            <span className="opacity-30">•</span>
            <div className="flex items-center gap-1.5">
              <Globe size={13} className="text-accent" />
              <span>OAuth 2.0</span>
            </div>
            <span className="opacity-30">•</span>
            <div className="flex items-center gap-1.5">
              <Bot size={13} className="text-purple-400" />
              <span>LLM Powered</span>
            </div>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16 w-full">
          {features.map((f, i) => (
            <FeatureCard key={f.label} index={i} {...f} />
          ))}
        </div>

        <VoiceModePreview />

        {/* Terminal Playground */}
        <div ref={terminalRef} className={`reveal-up ${terminalVisible ? "is-visible" : ""} relative mt-16 w-full`}>
          <div className="absolute -top-12 left-1/4 w-[400px] h-[250px] bg-accent/25 blur-[100px] rounded-full pointer-events-none -z-10" />
          <div className="absolute -bottom-10 right-1/4 w-[400px] h-[250px] bg-[color:var(--color-glow-2)]/20 blur-[110px] rounded-full pointer-events-none -z-10" />

          <div className="relative p-6 sm:p-8 rounded-3xl border border-accent/30 bg-surface/80 backdrop-blur-2xl text-left shadow-2xl shadow-accent/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/80">
              <div>
                <h3 className="font-display text-base font-bold flex items-center gap-2 text-glow">
                  <Terminal size={18} className="text-accent" />
                  <span>See Jarvis in Action</span>
                </h3>
                <p className="text-xs mt-1 text-ink-muted">
                  Select a workflow to preview how a request resolves through Microsoft Graph.
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-border/80 bg-surface-2/90">
                {["mail", "calendar", "tasks"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition duration-200 cursor-pointer ${
                      activeTab === tab ? "bg-accent text-accent-ink shadow-md shadow-accent/30" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {tab === "mail" && "📧"}
                    {tab === "calendar" && "📅"}
                    {tab === "tasks" && "✅"} {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 p-4 sm:p-5 rounded-2xl border border-border/80 bg-surface-2/90 font-mono text-xs overflow-hidden shadow-inner">
              <div className="flex items-center justify-between text-ink-muted mb-3 border-b border-border/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-2 text-[10px] font-sans text-ink-muted/80">jarvis-agent-executor</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-accent font-semibold">
                  <Cpu size={12} className="animate-pulse" />
                  <span>Active</span>
                  <span className="w-1 h-1 rounded-full bg-accent/50" />
                  <span className="text-emerald-400">● Live</span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-2.5"
                >
                  <p className="text-accent">
                    <span className="text-ink-muted">$</span> prompt --input{" "}
                    <span className="text-ink font-sans font-medium">"{samplePrompts[activeTab].prompt}"</span>
                  </p>
                  <div className="mt-2.5 space-y-2 pl-3 border-l-2 border-accent/50">
                    <p className="text-emerald-400 flex items-center gap-2">
                      <span>✓</span> Intent parsed and entities resolved.
                    </p>
                    <p className="text-ink-muted flex items-center gap-2">
                      <span className="animate-pulse text-amber-400">⚡</span> {samplePrompts[activeTab].status}
                    </p>
                    <p className="text-accent font-semibold flex items-center gap-2">
                      <span>→</span> {samplePrompts[activeTab].action}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-mono text-ink-muted">
          <div className="flex items-center gap-1.5">
            <Lock size={13} className="text-accent" />
            <span>Tokens Encrypted at Rest</span>
          </div>
          <span className="opacity-40">•</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>OAuth2 Encrypted Session</span>
          </div>
          <span className="opacity-40">•</span>
          <div className="flex items-center gap-1.5">
            <Globe size={13} className="text-accent" />
            <span>Microsoft Graph Native</span>
          </div>
          <span className="opacity-40">•</span>
          <div className="flex items-center gap-1.5">
            <Mic size={13} className="text-purple-400" />
            <span>LiveKit Voice</span>
          </div>
        </div>
      </main>
    </div>
  );
}