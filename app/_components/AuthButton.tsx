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

type AuthButtonProps = {
  menuPlacement?: "down" | "up" | "responsive";
};

export default function AuthButton({
  menuPlacement = "responsive",
}: AuthButtonProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userLabel, setUserLabel] = useState<string>("User");
  const [userEmail, setUserEmail] = useState<string>("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const avatarText = getInitials(userLabel);
  const avatarStyle = getAvatarStyle(userEmail || userLabel);
  const menuPlacementClass =
    menuPlacement === "up"
      ? "bottom-full pb-2"
      : menuPlacement === "down"
        ? "top-full pt-2"
        : "top-full pt-2 lg:top-auto lg:bottom-full lg:pt-0 lg:pb-2";

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
        className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-700"
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
        className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left text-zinc-900 shadow-sm transition hover:border-emerald-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-emerald-700"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
      >
        <span
          aria-hidden="true"
          className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${avatarStyle}`}
        >
          {avatarText}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{userLabel}</span>
        <span aria-hidden="true" className="text-xs text-zinc-400">
          v
        </span>
      </button>
      {isMenuOpen ? (
        <div
          role="menu"
          className={`absolute right-0 z-50 w-64 ${menuPlacementClass}`}
        >
          <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-xl shadow-zinc-950/10 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div
                aria-hidden="true"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarStyle}`}
              >
                {avatarText}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  Profile settings
                </p>
                <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {userEmail || userLabel}
                </p>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                    Theme
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
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
              className="mt-3 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-rose-300 hover:text-rose-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-rose-700 dark:hover:text-rose-300"
            >
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
