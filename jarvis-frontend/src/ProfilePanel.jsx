import React, { useState, useEffect, useRef } from "react";
import { X, Sun, Moon, LogOut, Check } from "lucide-react";

export const ACCENTS = [
  { id: "violet", label: "Violet", value: "light-dark(#5B3DF5, #8B7CFF)" },
  { id: "emerald", label: "Emerald", value: "light-dark(#059669, #34D399)" },
  { id: "rose", label: "Rose", value: "light-dark(#E11D48, #FB7185)" },
  { id: "sky", label: "Sky", value: "light-dark(#0284C7, #38BDF8)" },
];

export function applyStoredAccent() {
  const saved = localStorage.getItem("jarvis_accent") || "violet";
  const preset = ACCENTS.find((a) => a.id === saved) || ACCENTS[0];
  document.documentElement.style.setProperty("--color-accent", preset.value);
  return saved;
}

export default function ProfilePanel({ email, isDark, setIsDark, onLogout, onClose }) {
  const [displayName, setDisplayName] = useState(
    () => localStorage.getItem("jarvis_display_name") || (email ? email.split("@")[0] : "User")
  );
  const [accent, setAccent] = useState(() => localStorage.getItem("jarvis_accent") || "violet");
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const saveDisplayName = (val) => {
    setDisplayName(val);
    localStorage.setItem("jarvis_display_name", val);
  };

  const chooseAccent = (id) => {
    setAccent(id);
    localStorage.setItem("jarvis_accent", id);
    const preset = ACCENTS.find((a) => a.id === id);
    document.documentElement.style.setProperty("--color-accent", preset.value);
  };

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full left-0 mb-3 w-full bg-surface border border-border rounded-2xl shadow-2xl p-5 z-30 animate-fade-up"
      style={{ animationDuration: "0.18s" }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="font-display font-semibold text-sm text-ink">Profile</span>
        <button onClick={onClose} className="text-ink-muted hover:text-ink transition">
          <X size={16} />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-display font-bold text-lg shrink-0">
          {displayName[0]?.toUpperCase() || "U"}
        </div>
        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={displayName}
            onChange={(e) => saveDisplayName(e.target.value)}
            className="w-full bg-transparent border-none text-sm font-semibold text-ink focus:outline-none focus:ring-0 p-0"
            placeholder="Display name"
          />
          <p className="text-xs text-ink-muted truncate">{email}</p>
        </div>
      </div>

      <div className="mb-5">
        <p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-2.5">Accent color</p>
        <div className="flex gap-2.5">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              onClick={() => chooseAccent(a.id)}
              title={a.label}
              className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition"
              style={{ background: a.value, borderColor: accent === a.id ? "var(--color-ink)" : "transparent" }}
            >
              {accent === a.id && <Check size={13} className="text-white drop-shadow" />}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-2.5">Appearance</p>
        <div className="flex gap-2">
          <button
            onClick={() => setIsDark(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium border transition ${!isDark ? "bg-surface-2 border-accent/50 text-ink" : "border-border text-ink-muted"}`}
          >
            <Sun size={14} /> Light
          </button>
          <button
            onClick={() => setIsDark(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium border transition ${isDark ? "bg-surface-2 border-accent/50 text-ink" : "border-border text-ink-muted"}`}
          >
            <Moon size={14} /> Dark
          </button>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition-all"
      >
        <LogOut size={15} /> Disconnect Account
      </button>
    </div>
  );
}