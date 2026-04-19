"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const STORAGE_KEY = "trakItLoggedIn";
const USER_NAME_KEY = "trakItUserName";
const USER_EMAIL_KEY = "trakItUserEmail";
const USER_ID_KEY = "trakItUserId";
const AUTH_EVENT = "trakItAuthChanged";
const AVATAR_STYLES = [
  "bg-cyan-700 text-white",
  "bg-emerald-700 text-white",
  "bg-rose-700 text-white",
  "bg-amber-600 text-white",
  "bg-slate-700 text-white",
  "bg-teal-700 text-white",
];

const getInitials = (label: string) => {
  const value = label.trim();
  if (!value) {
    return "U";
  }

  const [first, second] = value.split(/\s+/);
  if (second) {
    return `${first[0]}${second[0]}`.toUpperCase();
  }

  const [emailName] = value.split("@");
  return emailName.slice(0, 2).toUpperCase();
};

const getAvatarStyle = (value: string) => {
  const total = value
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_STYLES[total % AVATAR_STYLES.length];
};

export default function AuthButton() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userLabel, setUserLabel] = useState<string>("User");
  const [userEmail, setUserEmail] = useState<string>("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const avatarText = getInitials(userLabel);
  const avatarStyle = getAvatarStyle(userEmail || userLabel);

  useEffect(() => {
    const syncFromStorage = () => {
      const storedValue = window.localStorage.getItem(STORAGE_KEY);
      const storedName = window.localStorage.getItem(USER_NAME_KEY);
      const storedEmail = window.localStorage.getItem(USER_EMAIL_KEY);
      setIsLoggedIn(storedValue === "true");
      setUserLabel(storedName || storedEmail || "User");
      setUserEmail(storedEmail || "");
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

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(USER_NAME_KEY);
    window.localStorage.removeItem(USER_EMAIL_KEY);
    window.localStorage.removeItem(USER_ID_KEY);
    setIsLoggedIn(false);
    setUserLabel("User");
    setUserEmail("");
    setIsMenuOpen(false);
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
    <div
      ref={menuRef}
      className="relative"
      onMouseEnter={() => setIsMenuOpen(true)}
      onMouseLeave={() => setIsMenuOpen(false)}
    >
      <button
        type="button"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
      >
        <span
          aria-hidden="true"
          className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${avatarStyle}`}
        >
          {avatarText}
        </span>
        <span>{userLabel}</span>
        <span aria-hidden="true" className="text-xs">
          v
        </span>
      </button>
      {isMenuOpen ? (
        <div
          role="menu"
          className="absolute right-0 z-50 w-64 pt-2"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
              <div
                aria-hidden="true"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarStyle}`}
              >
                {avatarText}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Profile settings
                </p>
                <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                  {userEmail || userLabel}
                </p>
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Theme
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Update your display preference.
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              role="menuitem"
              className="mt-3 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
            >
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
