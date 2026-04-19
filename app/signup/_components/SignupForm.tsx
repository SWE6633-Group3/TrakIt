"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const STORAGE_KEY = "trakItLoggedIn";
const USER_NAME_KEY = "trakItUserName";
const USER_EMAIL_KEY = "trakItUserEmail";
const USER_ID_KEY = "trakItUserId";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";
const AUTH_EVENT = "trakItAuthChanged";

export default function SignupForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    fetch(`${API_BASE}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message =
            payload?.error ?? "Unable to create an account right now.";
          throw new Error(message);
        }
        return response.json();
      })
      .then((payload) => {
        const userId = String(payload?.user?.id ?? "");
        window.localStorage.setItem(STORAGE_KEY, "true");
        window.localStorage.setItem(USER_NAME_KEY, name);
        window.localStorage.setItem(USER_EMAIL_KEY, email);
        if (userId) {
          window.localStorage.setItem(USER_ID_KEY, userId);
        }
        window.dispatchEvent(new Event(AUTH_EVENT));
        router.push("/dashboard");
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <form onSubmit={handleSignup} className="space-y-5">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Full name
        </span>
        <input
          name="name"
          type="text"
          placeholder="Jane Cooper"
          className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-emerald-950"
          required
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Email
        </span>
        <input
          name="email"
          type="email"
          placeholder="name@company.com"
          className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-emerald-950"
          required
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Password
        </span>
        <input
          name="password"
          type="password"
          placeholder="Create a password"
          className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-emerald-950"
          required
        />
      </label>
      {errorMessage ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create account"}
        </button>
        <Link
          href="/login"
          className="text-sm font-semibold text-zinc-600 hover:text-emerald-700 dark:text-zinc-300 dark:hover:text-emerald-300"
        >
          Already have an account? Log in
        </Link>
      </div>
    </form>
  );
}
