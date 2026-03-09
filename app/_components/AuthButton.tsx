"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const STORAGE_KEY = "trakItLoggedIn";
const USER_NAME_KEY = "trakItUserName";
const USER_EMAIL_KEY = "trakItUserEmail";
const USER_ID_KEY = "trakItUserId";
const AUTH_EVENT = "trakItAuthChanged";

export default function AuthButton() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userLabel, setUserLabel] = useState<string>("User");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const syncFromStorage = () => {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    const storedName = window.localStorage.getItem(USER_NAME_KEY);
    const storedEmail = window.localStorage.getItem(USER_EMAIL_KEY);
    setIsLoggedIn(storedValue === "true");
    setUserLabel(storedName || storedEmail || "User");
    };

    syncFromStorage();

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === STORAGE_KEY ||
        event.key === USER_NAME_KEY ||
        event.key === USER_EMAIL_KEY
      ) {
        syncFromStorage();
      }
    };

    const handleAuthEvent = () => {
      syncFromStorage();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(AUTH_EVENT, handleAuthEvent);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(AUTH_EVENT, handleAuthEvent);
    };
  }, []);

  const handleLogout = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(USER_NAME_KEY);
    window.localStorage.removeItem(USER_EMAIL_KEY);
    window.localStorage.removeItem(USER_ID_KEY);
    setIsLoggedIn(false);
    setUserLabel("User");
    window.dispatchEvent(new Event(AUTH_EVENT));
    router.push("/");
  };

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
      >
        Log in
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        className="rounded-full bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
      >
        {userLabel}
      </button>
      {isMenuOpen ? (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            <span>Theme</span>
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
