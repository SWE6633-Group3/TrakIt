"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AuthButton from "./AuthButton";

const STORAGE_KEY = "trakItLoggedIn";
const USER_ID_KEY = "trakItUserId";
const AUTH_EVENT = "trakItAuthChanged";
const PROJECTS_EVENT = "trakItProjectsChanged";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

type SidebarProject = {
  id: number;
  name: string;
  risks_count?: number;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", marker: "D" },
  { href: "/projects", label: "Projects", marker: "P" },
  { href: "/projects/new", label: "New Project", marker: "N" },
];

const projectSubnav = [
  { suffix: "", label: "Overview" },
  { suffix: "/requirements", label: "Requirements" },
  { suffix: "/risks", label: "Risks" },
  { suffix: "/team", label: "Team" },
];

export default function MainNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [projects, setProjects] = useState<SidebarProject[]>([]);

  useEffect(() => {
    const syncAuth = () => {
      const storedValue = window.localStorage.getItem(STORAGE_KEY);
      const loggedIn = storedValue === "true";
      setIsLoggedIn(loggedIn);

      if (!loggedIn) {
        setProjects([]);
        return;
      }

      const ownerUserId = window.localStorage.getItem(USER_ID_KEY);
      if (!ownerUserId) {
        setProjects([]);
        return;
      }

      fetch(`${API_BASE}/api/projects-summary?ownerUserId=${ownerUserId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Unable to load sidebar projects.");
          }
          return response.json();
        })
        .then((payload) => {
          setProjects((payload?.projects ?? []).slice(0, 5));
        })
        .catch(() => {
          setProjects([]);
        });
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
    window.addEventListener(PROJECTS_EVENT, handleAuthEvent);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(AUTH_EVENT, handleAuthEvent);
      window.removeEventListener(PROJECTS_EVENT, handleAuthEvent);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const visibleNavItems = isLoggedIn ? navItems : [];
  const hasMoreProjects = projects.length >= 5;
  const activeProject = projects.find((project) => {
    const href = `/projects/${project.id}`;
    return pathname === href || pathname.startsWith(`${href}/`);
  });

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-[#f4f7f5]/95 px-4 py-3 backdrop-blur md:px-6 lg:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-sm font-bold text-white shadow-sm">
              TI
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                TrakIt
              </p>
              <p className="max-w-[150px] truncate text-xs text-zinc-500 dark:text-zinc-400">
                {activeProject?.name ?? "Project control"}
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-800 shadow-sm transition hover:border-emerald-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-emerald-700"
            aria-expanded={isOpen}
            aria-label="Toggle navigation"
          >
            <span className="sr-only">{isOpen ? "Close menu" : "Open menu"}</span>
            <span aria-hidden="true" className="grid gap-1">
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition ${
                  isOpen ? "translate-y-1.5 rotate-45" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition ${
                  isOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition ${
                  isOpen ? "-translate-y-1.5 -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
        {isOpen ? (
          <div className="fixed inset-x-0 top-[65px] z-40 h-[calc(100dvh-65px)]">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-zinc-950/25 backdrop-blur-[2px] dark:bg-black/45"
            />
            <div className="relative mx-3 mt-3 flex max-h-[calc(100dvh-88px)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-950/20 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                  Navigation
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  Jump to your workspace
                </p>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <div className="grid gap-2">
                  {visibleNavItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href === "/projects" &&
                        pathname.startsWith("/projects/") &&
                        pathname !== "/projects/new");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold shadow-sm transition ${
                          isActive
                            ? "border-emerald-700 bg-emerald-700 text-white"
                            : "border-zinc-200 bg-zinc-50 text-zinc-800 hover:border-emerald-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-emerald-700"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs ${
                            isActive
                              ? "bg-white/15 text-white"
                              : "bg-white text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400"
                          }`}
                        >
                          {item.marker}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {projects.length > 0 ? (
                  <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                        Recent projects
                      </p>
                      {hasMoreProjects ? (
                        <Link
                          href="/projects"
                          onClick={() => setIsOpen(false)}
                          className="text-xs font-bold text-emerald-700 dark:text-emerald-300"
                        >
                          View all
                        </Link>
                      ) : null}
                    </div>
                    <div className="mt-3 grid gap-2">
                      {projects.slice(0, 4).map((project) => {
                        const href = `/projects/${project.id}`;
                        const isActive =
                          pathname === href || pathname.startsWith(`${href}/`);
                        return (
                          <Link
                            key={project.id}
                            href={href}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                              isActive
                                ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                                : "bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
                            }`}
                          >
                            <span
                              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                (project.risks_count ?? 0) > 0
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                            />
                            <span className="min-w-0 flex-1 truncate">
                              {project.name}
                            </span>
                            {(project.risks_count ?? 0) > 0 ? (
                              <span
                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                  isActive
                                    ? "bg-amber-400 text-zinc-950"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                                }`}
                              >
                                {project.risks_count}
                              </span>
                            ) : null}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {activeProject ? (
                  <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                      Active project
                    </p>
                    <p className="mt-1 truncate text-sm font-bold text-zinc-950 dark:text-zinc-50">
                      {activeProject.name}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {projectSubnav.map((item) => {
                        const href = `/projects/${activeProject.id}${item.suffix}`;
                        const isActive = pathname === href;
                        return (
                          <Link
                            key={item.label}
                            href={href}
                            onClick={() => setIsOpen(false)}
                            className={`rounded-lg px-3 py-2 text-center text-xs font-bold transition ${
                              isActive
                                ? "bg-emerald-700 text-white"
                                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            }`}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
                <AuthButton menuPlacement="up" />
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-68 border-r border-zinc-200 bg-white/90 px-4 py-5 shadow-[20px_0_80px_rgba(39,39,42,0.06)] backdrop-blur lg:flex lg:flex-col dark:border-zinc-800 dark:bg-zinc-950/90">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-700 text-sm font-bold text-white shadow-sm">
            TI
          </div>
          <div>
            <p className="text-base font-bold text-zinc-950 dark:text-zinc-50">
              TrakIt
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Project control
            </p>
          </div>
        </Link>

        <div className="mt-8">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Workspace
          </p>
          <nav className="mt-3 grid gap-1">
            {visibleNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === "/projects" &&
                  pathname.startsWith("/projects/") &&
                  pathname !== "/projects/new");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-xs ${
                      isActive
                        ? "bg-white/15 text-white"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
                    }`}
                  >
                    {item.marker}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {projects.length > 0 ? (
          <div className="mt-8">
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
              Recent projects
            </p>
            <div className="mt-3 grid gap-1">
              {projects.map((project) => {
                const href = `/projects/${project.id}`;
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <div key={project.id}>
                    <Link
                      href={href}
                      className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          (project.risks_count ?? 0) > 0
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                      />
                    <span className="min-w-0 flex-1 truncate">{project.name}</span>
                    {(project.risks_count ?? 0) > 0 ? (
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? "bg-amber-400 text-zinc-950"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                        }`}
                      >
                        {project.risks_count}
                      </span>
                    ) : null}
                  </Link>

                    {isActive ? (
                      <div className="ml-4 mt-1 grid gap-1 border-l border-zinc-200 pl-3 dark:border-zinc-800">
                        {projectSubnav.map((item) => {
                          const subHref = `${href}${item.suffix}`;
                          const isSubActive = pathname === subHref;
                          return (
                            <Link
                              key={item.label}
                              href={subHref}
                              className={`rounded-md px-2 py-1.5 text-xs font-bold transition ${
                                isSubActive
                                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                              }`}
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {hasMoreProjects ? (
                <Link
                  href="/projects"
                  className="rounded-lg px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                >
                  View all projects
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-auto">
          <AuthButton />
        </div>
      </aside>
    </>
  );
}
