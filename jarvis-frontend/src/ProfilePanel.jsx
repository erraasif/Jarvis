/**
 * Profile Panel Component
 * =======================
 * Floating dropdown interface to manage user preferences:
 * - Display name editing
 * - Accent color selection & persistence
 * - Dark / Light theme toggles
 * - Account disconnect trigger
 */

import React, { useState, useEffect, useRef } from "react";
import { X, Sun, Moon, LogOut, Check } from "lucide-react";

export const ACCENTS = [
  { id: "violet", label: "Violet", light: "#5B3DF5", dark: "#8B7CFF", cssVar: "8B7CFF" },
  { id: "emerald", label: "Emerald", light: "#059669", dark: "#34D399", cssVar: "34D399" },
  { id: "rose", label: "Rose", light: "#E11D48", dark: "#FB7185", cssVar: "FB7185" },
  { id: "sky", label: "Sky", light: "#0284C7", dark: "#38BDF8", cssVar: "38BDF8" },
];

/**
 * Reads local storage preference and sets root document CSS accent variable.
 */
export function applyStoredAccent() {
  const saved = localStorage.getItem("jarvis_accent") || "violet";
  const preset = ACCENTS.find((a) => a.id === saved) || ACCENTS[0];
  const isDarkTheme = document.documentElement.classList.contains("dark");
  
  document.documentElement.style.setProperty(
    "--color-accent",
    isDarkTheme ? preset.dark : preset.light
  );
  return saved;
}

export default function ProfilePanel({ email, isDark, setIsDark, onLogout, onClose }) {
  const [displayName, setDisplayName] = useState(
    () => localStorage.getItem("jarvis_display_name") || (email ? email.split("@")[0] : "User")
  );
  const [accent, setAccent] = useState(() => localStorage.getItem("jarvis_accent") || "violet");
  const panelRef = useRef(null);

  // Sync display name if email prop loads asynchronously
  useEffect(() => {
    if (!localStorage.getItem("jarvis_display_name") && email) {
      setDisplayName(email.split("@")[0]);
    }
  }, [email]);

  // Click outside to close panel listener
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
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
    const preset = ACCENTS.find((a) => a.id === id) || ACCENTS[0];
    document.documentElement.style.setProperty(
      "--color-accent",
      isDark ? preset.dark : preset.light
    );
  };

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full left-0 mb-3 w-full bg-surface border border-border rounded-2xl shadow-2xl p-5 z-30 animate-fade-up"
      style={{ animationDuration: "0.18s" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-display font-semibold text-sm text-ink">Profile</span>
        <button
          onClick={onClose}
          className="text-ink-muted hover:text-ink transition p-1 rounded-lg hover:bg-surface-2 cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* User Info Avatar & Editable Name */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-display font-bold text-lg shrink-0">
          {displayName[0]?.toUpperCase() || "U"}
        </div>
        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={displayName}
            onChange={(e) => saveDisplayName(e.target.value)}
            className="w-full bg-transparent border-b border-transparent hover:border-border focus:border-accent text-sm font-semibold text-ink focus:outline-none transition-colors p-0.5"
            placeholder="Display name"
          />
          <p className="text-xs text-ink-muted truncate px-0.5 mt-0.5">{email}</p>
        </div>
      </div>

      {/* Accent Selector */}
      <div className="mb-5">
        <p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-2.5">Accent color</p>
        <div className="flex gap-2.5">
          {ACCENTS.map((a) => {
            const isSelected = accent === a.id;
            const bgValue = isDark ? a.dark : a.light;
            return (
              <button
                key={a.id}
                onClick={() => chooseAccent(a.id)}
                title={a.label}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition cursor-pointer active:scale-95 ${
                  isSelected ? "border-ink scale-105" : "border-transparent"
                }`}
                style={{ backgroundColor: bgValue }}
              >
                {isSelected && <Check size={13} className="text-white drop-shadow-md" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme Option Selector */}
      <div className="mb-5">
        <p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-2.5">Appearance</p>
        <div className="flex gap-2">
          <button
            onClick={() => setIsDark(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
              !isDark
                ? "bg-surface-2 border-accent/50 text-ink shadow-sm"
                : "border-border text-ink-muted hover:bg-surface-2/40"
            }`}
          >
            <Sun size={14} /> Light
          </button>
          <button
            onClick={() => setIsDark(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
              isDark
                ? "bg-surface-2 border-accent/50 text-ink shadow-sm"
                : "border-border text-ink-muted hover:bg-surface-2/40"
            }`}
          >
            <Moon size={14} /> Dark
          </button>
        </div>
      </div>

      {/* Account Logout Action */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition-all cursor-pointer"
      >
        <LogOut size={15} /> Disconnect Account
      </button>
    </div>
  );
}