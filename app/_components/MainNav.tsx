"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthButton from "./AuthButton";

const STORAGE_KEY = "trakItLoggedIn";
const AUTH_EVENT = "trakItAuthChanged";

export default function MainNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const syncAuth = () => {
      const storedValue = window.localStorage.getItem(STORAGE_KEY);
      setIsLoggedIn(storedValue === "true");
    };

    syncAuth();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        syncAuth();
      }
    };

    const handleAuthEvent = () => {
      syncAuth();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(AUTH_EVENT, handleAuthEvent);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(AUTH_EVENT, handleAuthEvent);
    };
  }, []);

  return (
    <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
            TI
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">
              TrakIt
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Project Hub
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
        >
          {isOpen ? "Close" : "Menu"}
        </button>
      </div>
      <div
        className={`flex flex-col gap-3 md:flex md:flex-row md:items-center ${
          isOpen ? "block" : "hidden md:flex"
        }`}
      >
        <nav className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:flex-row md:flex-wrap dark:text-slate-200">
          {isLoggedIn ? (
            <Link
              href="/projects"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500 dark:hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              Projects
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-2 text-sm font-medium">
          <AuthButton />
        </div>
      </div>
    </div>
  );
}
