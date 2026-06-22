import { create } from "zustand";

type Theme = "light" | "dark";

const STORAGE_KEY = "reo-theme";

function applyTheme(theme: Theme) {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  if (meta) meta.content = isDark ? "dark" : "light";
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // storage blocked
  }
}

interface ThemeState {
  theme: Theme;
  toggle: () => void;
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
  toggle() {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    applyTheme(next);
    set({ theme: next });
  },
}));
