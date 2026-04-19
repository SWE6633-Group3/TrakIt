"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "trakItLoggedIn";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = window.localStorage.getItem(STORAGE_KEY) === "true";
    if (isLoggedIn) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="grid min-h-[calc(100vh-3rem)] items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm md:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
          TrakIt
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-zinc-950 md:text-6xl dark:text-zinc-50">
          Project control without the ceremony.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 md:text-lg dark:text-zinc-300">
          Track requirements, risks, ownership, and team access in one clean
          workspace built for delivery conversations.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-800 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          >
            Log in
          </Link>
        </div>
      </section>

      <aside className="grid gap-3">
        {[
          ["Requirements", "Capture scope, type, status, owners, and effort."],
          ["Risks", "Surface impact and status before issues become surprises."],
          ["Team", "Keep leads and members aligned around the same workspace."],
        ].map(([title, description]) => (
          <div
            key={title}
            className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
              {title}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {description}
            </p>
          </div>
        ))}
      </aside>
    </div>
  );
}
