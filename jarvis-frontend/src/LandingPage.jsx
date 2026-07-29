import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Calendar, CheckSquare, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

// --- Interactive 3D Canvas Sphere / Core Visual ---
const Interactive3DCore = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = 400);
    let height = (canvas.height = 400);

    const particles = [];
    const numParticles = 120;
    const radius = 110;

    for (let i = 0; i < numParticles; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = 2 * Math.PI * Math.random();
      particles.push({
        x: radius * Math.sin(theta) * Math.cos(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(theta),
        baseX: radius * Math.sin(theta) * Math.cos(phi),
        baseY: radius * Math.sin(theta) * Math.sin(phi),
        baseZ: radius * Math.cos(theta),
      });
    }

    let angleX = 0.005;
    let angleY = 0.008;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const centerX = width / 2;
      const centerY = height / 2;

      // Rotate Particles in 3D Space
      particles.forEach((p) => {
        // Rotate around Y
        let x1 = p.x * Math.cos(angleY) - p.z * Math.sin(angleY);
        let z1 = p.z * Math.cos(angleY) + p.x * Math.sin(angleY);
        
        // Rotate around X
        let y1 = p.y * Math.cos(angleX) - z1 * Math.sin(angleX);
        let z2 = z1 * Math.cos(angleX) + p.y * Math.sin(angleX);

        p.x = x1;
        p.y = y1;
        p.z = z2;

        // Perspective projection
        const scale = 300 / (300 + p.z);
        const projX = p.x * scale + centerX;
        const projY = p.y * scale + centerY;
        const alpha = (p.z + radius) / (2 * radius);

        ctx.beginPath();
        ctx.arc(projX, projY, Math.max(1, 2.5 * scale), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 51, 234, ${Math.max(0.2, alpha)})`;
        ctx.fill();
      });

      // Draw Glowing Core Center
      const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 90);
      gradient.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
      gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.15)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 90, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="relative flex items-center justify-center w-[320px] h-[320px] md:w-[400px] md:h-[400px]">
      {/* Outer Pulse Rings */}
      <div className="absolute inset-0 rounded-full border border-purple-500/20 dark:border-purple-500/30 animate-ping opacity-20 pointer-events-none" />
      <div className="absolute inset-8 rounded-full border border-indigo-500/30 dark:border-indigo-400/20 blur-[1px]" />
      
      {/* 3D Particle Canvas */}
      <canvas ref={canvasRef} className="relative z-10" />

      {/* Floating Action Badges */}
      <motion.div 
        animate={{ y: [0, -8, 0] }} 
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="absolute top-6 right-6 z-20 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-xl text-purple-600 dark:text-purple-400"
      >
        <Mail className="w-5 h-5" />
      </motion.div>

      <motion.div 
        animate={{ y: [0, 8, 0] }} 
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        className="absolute bottom-10 left-4 z-20 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-xl text-indigo-600 dark:text-indigo-400"
      >
        <Calendar className="w-5 h-5" />
      </motion.div>

      <motion.div 
        animate={{ y: [0, -6, 0] }} 
        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
        className="absolute top-1/2 left-0 -translate-y-1/2 z-20 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-xl text-emerald-600 dark:text-emerald-400"
      >
        <CheckSquare className="w-5 h-5" />
      </motion.div>
    </div>
  );
};

export default function LandingPage({ onLogin, isDark, setIsDark }) {
  const handleLogin = onLogin || (() => {
    window.location.href = "https://jarvis-backend-h38f.onrender.com/api/auth/login";
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-hidden relative selection:bg-purple-500 selection:text-white">
      
      {/* Background Ambient Glow Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-purple-500/15 via-indigo-500/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/10 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-30">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/25">
            J
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400">
            Jarvis.
          </span>
        </div>

        <ThemeToggle isDark={isDark} setIsDark={setIsDark} />
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-8 pb-20 relative z-20 flex flex-col items-center text-center">
        
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 dark:bg-purple-400/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-semibold uppercase tracking-widest mb-8 backdrop-blur-md"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Personal Agent for Microsoft 365
        </motion.div>

        {/* 3D Core Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <Interactive3DCore />
        </motion.div>

        {/* Main Heading */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6"
        >
          Your inbox, calendar, and to-dos —{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 dark:from-purple-400 dark:via-indigo-300 dark:to-blue-400">
            one conversation away.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl font-normal leading-relaxed mb-10"
        >
          Tell Jarvis what you need. It reasons over your requests and acts directly on Outlook, Calendar, and To Do with complete accuracy.
        </motion.p>

        {/* Primary CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center gap-3"
        >
          <button
            onClick={handleLogin}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-lg shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            <span>Sign in with Microsoft</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Authenticated via Microsoft Entra ID
          </span>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-20"
        >
          {/* Card 1 */}
          <div className="group p-8 rounded-3xl bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-500/40 dark:hover:border-purple-500/40 transition-all duration-300 text-left hover:-translate-y-1.5 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2 block">
              Mailbox
            </span>
            <h3 className="text-xl font-bold mb-2">Reads, never sends without you</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Ask Jarvis to summarize your inbox or draft a reply. Every draft waits in Outlook for your review.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group p-8 rounded-3xl bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all duration-300 text-left hover:-translate-y-1.5 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2 block">
              Calendar
            </span>
            <h3 className="text-xl font-bold mb-2">Full control over schedule</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Create, reschedule, or cancel events by describing them in plain conversational language.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group p-8 rounded-3xl bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-300 text-left hover:-translate-y-1.5 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 block">
              Tasks
            </span>
            <h3 className="text-xl font-bold mb-2">Your Microsoft To Do, spoken</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Add, complete, or reorganize tasks in a single sentence without filling out manual forms.
            </p>
          </div>
        </motion.div>

      </main>
    </div>
  );
}