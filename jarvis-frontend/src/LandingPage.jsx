/**
 * Refactored Production Landing Page Component
 * ===========================================
 * Fixes:
 * - Dynamic theme accent sync inside requestAnimationFrame loop
 * - Corrected responsive Tailwind arbitrary dimensions
 * - Enhanced mobile viewport stacking & accessibility focus states
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Calendar, CheckSquare, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import Logo from './Logo.jsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://jarvis-backend-h38f.onrender.com";

function getAccentRGB() {
  if (typeof window === "undefined") return [139, 92, 246];
  const probe = document.createElement('div');
  probe.style.color = 'var(--color-accent)';
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  const match = resolved.match(/\d+/g);
  return match ? match.slice(0, 3).map(Number) : [139, 92, 246];
}

const Interactive3DCore = () => {
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

    const ctx = canvas.getContext('2d');
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
    const numParticles = 130;
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

    const angleX = 0.005;
    const angleY = 0.008;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const centerX = width / 2;
      const centerY = height / 2;

      // Real-time theme accent update inside loop
      const [ar, ag, ab] = getAccentRGB();

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

      const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 80);
      gradient.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, 0.35)`);
      gradient.addColorStop(0.6, `rgba(${ar}, ${ag}, ${ab}, 0.1)`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div
      ref={wrapperRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 900 }}
      className="relative flex items-center justify-center w-72 h-72 md:w-96 md:h-96"
    >
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
          className="absolute top-4 right-4 z-20 p-2.5 rounded-2xl bg-surface/80 backdrop-blur-xl border border-border shadow-xl text-accent"
        >
          <Mail className="w-4 h-4 md:w-5 md:h-5" />
        </motion.div>

        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          style={{ transform: "translateZ(50px)" }}
          className="absolute bottom-6 left-2 z-20 p-2.5 rounded-2xl bg-surface/80 backdrop-blur-xl border border-border shadow-xl text-accent"
        >
          <Calendar className="w-4 h-4 md:w-5 md:h-5" />
        </motion.div>

        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
          style={{ transform: "translateZ(50px)" }}
          className="absolute top-1/2 left-0 -translate-y-1/2 z-20 p-2.5 rounded-2xl bg-surface/80 backdrop-blur-xl border border-border shadow-xl text-accent"
        >
          <CheckSquare className="w-4 h-4 md:w-5 md:h-5" />
        </motion.div>
      </motion.div>
    </div>
  );
};

const features = [
  {
    icon: Mail,
    eyebrow: "MAILBOX",
    title: "Reads, never sends without you",
    body: "Ask Jarvis to summarize your inbox or draft a reply. Every draft waits safely in Outlook for your review.",
  },
  {
    icon: Calendar,
    eyebrow: "CALENDAR",
    title: "Full control over schedule",
    body: "Create, reschedule, or cancel events by describing them in natural conversational language.",
  },
  {
    icon: CheckSquare,
    eyebrow: "TASKS",
    title: "Your Microsoft To Do, spoken",
    body: "Add, complete, or reorganize tasks in a single prompt without manual form filing.",
  },
];

function FeatureCard({ icon: Icon, eyebrow, title, body, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="group relative p-6 md:p-8 rounded-3xl bg-surface/70 backdrop-blur-xl border border-border/80 overflow-hidden text-left shadow-xl transition-all duration-300 hover:border-accent/40"
    >
      <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-accent/0 group-hover:bg-accent/5 blur-xl transition-all duration-500" />

      <div className="relative w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-5">
        <Icon className="w-5 h-5" />
      </div>
      <span className="relative font-mono text-[11px] font-bold uppercase tracking-wider text-accent mb-1.5 block">
        {eyebrow}
      </span>
      <h3 className="relative font-display text-lg font-bold mb-2 text-ink">{title}</h3>
      <p className="relative text-xs md:text-sm text-ink-muted leading-relaxed">{body}</p>
    </motion.div>
  );
}

export default function LandingPage({ onLogin, isDark, setIsDark }) {
  const handleLogin = onLogin || (() => {
    window.location.href = `${API_BASE_URL}/api/auth/login`;
  });

  return (
    <div className="min-h-screen bg-bg text-ink transition-colors duration-500 overflow-hidden relative selection:bg-accent/30">
      <div className="absolute inset-0 bg-grid-scan pointer-events-none [mask-image:radial-gradient(ellipse_60%_60%_at_50%_20%,black,transparent)]" />

      {/* Standardized Tailwind Gradient Widths */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-accent/10 blur-[130px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between relative z-30">
        <div className="flex items-center gap-2.5">
          <Logo size={34} />
          <span className="font-display text-xl font-bold tracking-tight text-ink">
            Jarvis
          </span>
        </div>

        <ThemeToggle isDark={isDark} setIsDark={setIsDark} />
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 pt-4 pb-20 relative z-20 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-semibold uppercase tracking-widest mb-6 backdrop-blur-md"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Autonomous Assistant for M365
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <Interactive3DCore />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-display text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight max-w-3xl leading-[1.18] mb-4 text-ink"
        >
          Your inbox, calendar, and to-dos —{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-purple-500 to-accent">
            one prompt away.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-sm md:text-base text-ink-muted max-w-xl font-normal leading-relaxed mb-8"
        >
          Tell Jarvis what you need. It reasons over your requests and acts directly on Outlook Mail, Calendar, and To-Do with complete precision.
        </motion.p>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col items-center gap-3"
        >
          <button
            onClick={handleLogin}
            className="group relative inline-flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-accent text-accent-ink font-semibold text-base shadow-xl shadow-accent/20 hover:opacity-95 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            <span>Sign in with Microsoft</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <span className="font-mono flex items-center gap-1.5 text-[11px] text-ink-muted font-medium mt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Authenticated via Microsoft Entra ID
          </span>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl mt-16">
          {features.map((f, i) => (
            <FeatureCard key={f.title} index={i} {...f} />
          ))}
        </div>
      </main>
    </div>
  );
}