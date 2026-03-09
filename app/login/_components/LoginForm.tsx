"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = email.split("@")[0] || "User";
    fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error ?? "Unable to sign in.";
          throw new Error(message);
        }
        return response.json();
      })
      .then((payload) => {
        const userId = String(payload?.user?.id ?? "");
        window.localStorage.setItem(STORAGE_KEY, "true");
        window.localStorage.setItem(USER_NAME_KEY, payload?.user?.name ?? name);
        window.localStorage.setItem(USER_EMAIL_KEY, email);
        if (userId) {
          window.localStorage.setItem(USER_ID_KEY, userId);
        }
        window.dispatchEvent(new Event(AUTH_EVENT));
        router.push("/projects");
      })
      .catch((error) => {
        setErrorMessage(error.message);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Email
        </span>
        <input
          name="email"
          type="email"
          placeholder="name@company.com"
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          required
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Password
        </span>
        <input
          name="password"
          type="password"
          placeholder="Enter your password"
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          required
        />
      </label>
      {errorMessage ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Log in"}
        </button>
        <Link
          href="/signup"
          className="text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          New here? Create an account
        </Link>
      </div>
    </form>
  );
}
