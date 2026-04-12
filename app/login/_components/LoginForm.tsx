"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const STORAGE_KEY = "trakItLoggedIn";
const USER_NAME_KEY = "trakItUserName";
const USER_EMAIL_KEY = "trakItUserEmail";
const USER_ID_KEY = "trakItUserId";
const AUTH_EVENT = "trakItAuthChanged";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

export default function LoginForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      router.push("/projects");
    }
  }, [router]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = email.split("@")[0] || "User";

    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to sign in. Please check your credentials.");
      }

      const userId = String(payload?.user?.id ?? "");
      window.localStorage.setItem(STORAGE_KEY, "true");
      window.localStorage.setItem(USER_NAME_KEY, payload?.user?.name ?? name);
      window.localStorage.setItem(USER_EMAIL_KEY, email);
      
      if (userId) {
        window.localStorage.setItem(USER_ID_KEY, userId);
      }

      window.dispatchEvent(new Event(AUTH_EVENT));
      router.push("/projects");
      router.refresh(); 
      
    } catch (error: unknown) {
      // FIX: Check instance to avoid 'any' linting error
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unexpected network error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email-field" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Email
        </label>
        <input
          id="email-field"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          onChange={() => setErrorMessage(null)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password-field" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Password
        </label>
        <input
          id="password-field"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          onChange={() => setErrorMessage(null)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          required
        />
      </div>

      {errorMessage && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          className="rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Log in"}
        </button>
        <Link
          href="/signup"
          className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors dark:text-slate-300 dark:hover:text-white"
        >
          New here? Create an account
        </Link>
      </div>
    </form>
  );
}