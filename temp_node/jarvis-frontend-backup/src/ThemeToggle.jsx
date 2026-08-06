import React from "react";
import { Sun, Moon } from "lucide-react";

/**
 * ThemeToggle Component
 * =====================
 * Toggles dark and light mode theme across the application.
 * 
 * @param {Object} props
 * @param {boolean} props.isDark - Current dark mode state.
 * @param {Function} props.setIsDark - State handler to switch theme mode.
 */
export function ThemeToggle({ isDark, setIsDark }) {
  return (
    <button
      type="button"
      onClick={() => setIsDark(!isDark)}
      className="p-2.5 rounded-2xl bg-surface-2 border border-border text-ink hover:text-accent transition-all active:scale-95 cursor-pointer flex items-center justify-center"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle Light/Dark Theme"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}