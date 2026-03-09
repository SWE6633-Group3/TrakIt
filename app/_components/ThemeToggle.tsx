"use client";

import { useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "trakItTheme";
const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

type ThemeMode = "light" | "dark";

type Listener = () => void;

const listeners = new Set<Listener>();

const emit = () => {
  listeners.forEach((listener) => listener());
};

const getSnapshot = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "dark";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  const prefersDark = window.matchMedia(THEME_MEDIA_QUERY).matches;
  return prefersDark ? "dark" : "light";
};

const getServerSnapshot = (): ThemeMode => "dark";

const subscribe = (listener: Listener) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  listeners.add(listener);
  const media = window.matchMedia(THEME_MEDIA_QUERY);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      emit();
    }
  };
  const handleMedia = () => {
    emit();
  };

  window.addEventListener("storage", handleStorage);
  media.addEventListener("change", handleMedia);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
    media.removeEventListener("change", handleMedia);
  };
};

export default function ThemeToggle() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const toggleTheme = () => {
    const nextMode: ThemeMode = mode === "dark" ? "light" : "dark";
    window.localStorage.setItem(STORAGE_KEY, nextMode);
    emit();
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative inline-flex h-6 w-10 items-center rounded-full border border-slate-200 bg-white px-0.5 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500"
      aria-label="Toggle dark mode"
      role="switch"
      aria-checked={mode === "dark"}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-semibold transition-transform ${
          mode === "dark"
            ? "translate-x-4 bg-slate-100 text-slate-900"
            : "translate-x-0 bg-slate-900 text-white"
        }`}
      >
        {mode === "dark" ? "D" : "L"}
      </span>
    </button>
  );
}
