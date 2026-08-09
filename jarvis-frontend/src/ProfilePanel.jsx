/**
 * ProfilePanel Component
 * ======================
 * Flyout/modal panel for user settings, dark mode toggle,
 * accent color customization, and account management.
 */

import React, { useState } from "react";
import { X, Sun, Moon, Check, LogOut, User, Palette } from "lucide-react";

// Predefined accent color options mapping to CSS theme variables
export const ACCENT_PRESETS = [
  { id: "indigo", label: "Indigo", value: "#6366f1", ink: "#ffffff" },
  { id: "emerald", label: "Emerald", value: "#10b981", ink: "#ffffff" },
  { id: "violet", label: "Violet", value: "#8b5cf6", ink: "#ffffff" },
  { id: "rose", label: "Rose", value: "#f43f5e", ink: "#ffffff" },
  { id: "amber", label: "Amber", value: "#f59e0b", ink: "#000000" },
  { id: "cyan", label: "Cyan", value: "#06b6d4", ink: "#000000" },
];

/**
 * Reads local storage for saved accent colors and updates CSS root variables.
 */
export function applyStoredAccent() {
  if (typeof window === "undefined") return;
  const savedAccent = localStorage.getItem("jarvis_accent_color");
  const savedInk = localStorage.getItem("jarvis_accent_ink");

  if (savedAccent) {
    document.documentElement.style.setProperty("--color-accent", savedAccent);
  }
  if (savedInk) {
    document.documentElement.style.setProperty("--color-accent-ink", savedInk);
  }
}

export default function ProfilePanel({ email, isDark, setIsDark, onLogout, onClose, onDisplayNameChange }) {
  const [selectedAccent, setSelectedAccent] = useState(() => {
    return localStorage.getItem("jarvis_accent_id") || "indigo";
  });

  const [displayName, setDisplayName] = useState(() => {
    return localStorage.getItem("jarvis_display_name") || email.split("@")[0];
  });

  const handleAccentChange = (preset) => {
    setSelectedAccent(preset.id);
    localStorage.setItem("jarvis_accent_id", preset.id);
    localStorage.setItem("jarvis_accent_color", preset.value);
    localStorage.setItem("jarvis_accent_ink", preset.ink);

    document.documentElement.style.setProperty("--color-accent", preset.value);
    document.documentElement.style.setProperty("--color-accent-ink", preset.ink);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setDisplayName(val);
    localStorage.setItem("jarvis_display_name", val);
    onDisplayNameChange?.(val);
  };

  return (
    <div className="absolute bottom-16 left-0 right-0 mb-2 w-80 bg-surface/95 backdrop-blur-2xl border border-border shadow-2xl rounded-3xl p-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-border/80">
        <div className="flex items-center gap-2 font-display font-semibold text-sm text-ink">
          <User size={16} className="text-accent" />
          <span>Profile & Preferences</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-2 transition cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4 text-xs">
        {/* User Info & Display Name */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={handleNameChange}
            className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-ink text-xs focus:outline-none focus:border-accent"
          />
          <span className="text-[10px] text-ink-muted mt-1 block truncate">
            {email}
          </span>
        </div>

        {/* Accent Color Picker */}
        <div>
          <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2">
            <Palette size={13} className="text-accent" />
            <span>Accent Theme</span>
          </label>
          <div className="grid grid-cols-6 gap-2">
            {ACCENT_PRESETS.map((preset) => {
              const isSelected = selectedAccent === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleAccentChange(preset)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer relative"
                  style={{ backgroundColor: preset.value }}
                  title={preset.label}
                >
                  {isSelected && (
                    <Check size={14} style={{ color: preset.ink }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Appearance Mode */}
        <div className="pt-2 border-t border-border/80 flex items-center justify-between">
          <span className="font-medium text-ink">Dark Appearance</span>
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-xl bg-surface-2 border border-border text-ink hover:text-accent transition cursor-pointer"
          >
            {isDark ? <Moon size={15} /> : <Sun size={15} />}
          </button>
        </div>

        {/* Account Disconnect */}
        <div className="pt-2 border-t border-border/80">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-red-500 hover:bg-red-500/10 rounded-xl transition font-semibold cursor-pointer"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}