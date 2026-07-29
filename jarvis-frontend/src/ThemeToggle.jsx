import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function useTheme() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("light", !isDark);
    localStorage.setItem("jarvis_theme", isDark ? "dark" : "light");
  }, [isDark]);

  return [isDark, setIsDark];
}

export function ThemeToggle({ isDark, setIsDark }) {
  return (
    <button
      onClick={() => setIsDark((d) => !d)}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="w-10 h-10 flex items-center justify-center rounded-full border border-border bg-surface text-ink-muted hover:text-ink hover:border-accent/50 transition active:scale-95"
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}