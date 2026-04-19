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

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      router.push("/dashboard");
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
      router.push("/dashboard");
      router.refresh();
      
    } catch (error: unknown) {
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
      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email-field" className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Email
        </label>
        <input
          id="email-field"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          onChange={() => setErrorMessage(null)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-emerald-950"
          required
        />
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label htmlFor="password-field" className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Password
        </label>
        <input
          id="password-field"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          onChange={() => setErrorMessage(null)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-emerald-950"
          required
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}

      {/* Bottom Action Area */}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          className="rounded-lg bg-emerald-700 px-8 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Log in"}
        </button>

        {/* Navigation Links Stacked Right - Matched Styles */}
        <div className="flex flex-col items-end gap-1">
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-zinc-600 transition-colors hover:text-emerald-700 dark:text-zinc-300 dark:hover:text-emerald-300"
          >
            Forgot password?
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold text-zinc-600 transition-colors hover:text-emerald-700 dark:text-zinc-300 dark:hover:text-emerald-300"
          >
            Don&apos;t have an account? Sign Up
          </Link>
        </div>
      </div>
    </form>
  );
}
