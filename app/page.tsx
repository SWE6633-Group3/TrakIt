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
      router.replace("/projects");
    }
  }, [router]);

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">
          TrakIt
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl dark:text-slate-100">
          Build clarity into every project
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-300">
          TrakIt is the lightweight hub for organizing project details,
          decisions, and collaboration from kickoff to delivery.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Get started
          </Link>
          <Link
            href="/projects"
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500"
          >
            View workspace
          </Link>
        </div>
      </section>
    </div>
  );
}
