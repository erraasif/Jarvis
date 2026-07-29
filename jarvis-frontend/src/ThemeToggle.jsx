// src/ThemeToggle.jsx
import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return [isDark, setIsDark];
}

export function ThemeToggle({ isDark, setIsDark }) {
  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2.5 rounded-2xl bg-surface-2 border border-border text-ink hover:text-accent transition-all active:scale-95"
      title="Toggle Light/Dark Theme"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}