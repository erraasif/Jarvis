import React from 'react';

export function JarvisLogo() {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Futuristic non-alphabetic quantum core icon */}
      <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600/30 via-purple-600/30 to-pink-600/30 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)] backdrop-blur-md">
        <div className="absolute inset-0 rounded-xl bg-purple-500/10 animate-pulse" />
        <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" style={{ animationDuration: '6s' }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
      </div>
      
      {/* Gradient wordmark */}
      <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent font-mono">
        JARVIS
      </span>
    </div>
  );
}