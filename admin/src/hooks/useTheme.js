import { useEffect, useState } from "react";

// Tek bir tema state'i — "opencarddark" veya "light"
// localStorage'da saklanır, sonraki ziyarette anında uygulanır.
// Public ve admin AYRI anahtarlar kullanır — biri diğerinin tercihini ezmesin.

const STORAGE_KEY = "opencard-theme-admin";
const DARK = "opencarddark";
const LIGHT = "light";

function readInitial() {
  if (typeof window === "undefined") return DARK;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === DARK || saved === LIGHT) return saved;
  // Henüz bir tercih yok → sistem tercihini kullan
  if (window.matchMedia?.("(prefers-color-scheme: light)").matches) return LIGHT;
  return DARK;
}

export function useTheme() {
  const [theme, setTheme] = useState(readInitial);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { window.localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  const toggle = () => setTheme((t) => (t === DARK ? LIGHT : DARK));
  return { theme, isDark: theme === DARK, setTheme, toggle };
}
