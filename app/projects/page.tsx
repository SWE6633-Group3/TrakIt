/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";
const USER_ID_KEY = "trakItUserId";
const USER_EMAIL_KEY = "trakItUserEmail";
const PROJECTS_EVENT = "trakItProjectsChanged";

type Project = {
  id: number;
  name: string;
  description: string | null;
  owner_user_id: number;
  requirements_count?: number;
  risks_count?: number;
  team_count?: number;
  current_user_role?: "Lead" | "Member";
};

const metricLabel = (count: number, label: string) =>
  `${count} ${label}${count === 1 ? "" : "s"}`;

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const totals = useMemo(() => {
    return projects.reduce(
      (summary, project) => ({
        requirements: summary.requirements + (project.requirements_count ?? 0),
        risks: summary.risks + (project.risks_count ?? 0),
        team: summary.team + (project.team_count ?? 0),
        leads:
          summary.leads + (project.current_user_role === "Lead" ? 1 : 0),
      }),
      { requirements: 0, risks: 0, team: 0, leads: 0 }
    );
  }, [projects]);

  const loadProjects = (ownerUserId: string) => {
    fetch(`${API_BASE}/api/projects-summary?ownerUserId=${ownerUserId}`)
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error ?? "Unable to load projects.";
          throw new Error(message);
        }
        return response.json();
      })
      .then((payload) => {
        setProjects(payload?.projects ?? []);
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    const ownerUserId = window.localStorage.getItem(USER_ID_KEY);
    if (ownerUserId) {
      loadProjects(ownerUserId);
      return;
    }

    const email = window.localStorage.getItem(USER_EMAIL_KEY);
    if (!email) {
      setIsLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/users?email=${encodeURIComponent(email)}`)
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error ?? "Unable to load user.";
          throw new Error(message);
        }
        return response.json();
      })
      .then((payload) => {
        const userId = String(payload?.user?.id ?? "");
        if (userId) {
          window.localStorage.setItem(USER_ID_KEY, userId);
          loadProjects(userId);
        } else {
          setProjects([]);
        }
      })
      .catch(() => {
        setProjects([]);
        setIsLoading(false);
      });
  }, []);

  const startEdit = (project: Project) => {
    setEditingId(project.id);
    setEditingName(project.name);
    setEditingDescription(project.description ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingDescription("");
  };

  const saveEdit = (projectId: number) => {
    const project = projects.find((item) => item.id === projectId);
    if (project?.current_user_role !== "Lead") {
      setErrorMessage("Only the project lead can edit this project.");
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    fetch(`${API_BASE}/api/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editingName,
        description: editingDescription,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error ?? "Unable to update project.";
          throw new Error(message);
        }
        return response.json();
      })
      .then(() => {
        cancelEdit();
        const ownerUserId = window.localStorage.getItem(USER_ID_KEY);
        if (ownerUserId) {
          loadProjects(ownerUserId);
        }
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const deleteProject = (projectId: number) => {
    const project = projects.find((item) => item.id === projectId);
    if (project?.current_user_role !== "Lead") {
      setErrorMessage("Only the project lead can delete this project.");
      return;
    }
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) {
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    fetch(`${API_BASE}/api/projects/${projectId}`, {
      method: "DELETE",
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error ?? "Unable to delete project.";
          throw new Error(message);
        }
        return response.json();
      })
      .then(() => {
        const ownerUserId = window.localStorage.getItem(USER_ID_KEY);
        window.dispatchEvent(new Event(PROJECTS_EVENT));
        if (ownerUserId) {
          loadProjects(ownerUserId);
        }
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="space-y-6">
      <section className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="grid gap-6 border-b border-zinc-100 bg-white px-5 py-6 md:px-7 lg:grid-cols-[1.5fr_1fr] dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
              Command Center
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 md:text-4xl dark:text-zinc-50">
              Projects
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
              Track ownership, requirements, risks, and team capacity from one
              operational workspace.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Active", projects.length],
              ["Requirements", totals.requirements],
              ["Open risks", totals.risks],
              ["Team seats", totals.team],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-white/70 bg-white/75 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70"
              >
                <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">
                  {value}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <section className="p-5 md:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                  Portfolio
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {metricLabel(projects.length, "active project")} under your access.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                  Lead on {totals.leads}
                </span>
                <Link
                  href="/projects/new"
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-800"
                >
                  Create project
                </Link>
              </div>
            </div>

            {errorMessage ? (
              <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-5 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              {isLoading ? (
                <div className="grid gap-3 bg-white p-4 dark:bg-zinc-950">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-20 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900"
                    />
                  ))}
                </div>
              ) : null}

              {!isLoading && projects.length === 0 ? (
                <div className="bg-zinc-50 px-5 py-10 text-center text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  No projects yet. Create one to get started.
                </div>
              ) : null}

              {!isLoading ? projects.map((project) => (
                <article
                  key={project.id}
                  role={editingId === project.id ? undefined : "link"}
                  tabIndex={editingId === project.id ? undefined : 0}
                  onClick={() => {
                    if (editingId !== project.id) {
                      router.push(`/projects/${project.id}`);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (
                      editingId !== project.id &&
                      (event.key === "Enter" || event.key === " ")
                    ) {
                      event.preventDefault();
                      router.push(`/projects/${project.id}`);
                    }
                  }}
                  className="cursor-pointer border-b border-zinc-200 bg-white p-4 last:border-b-0 transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900/70 dark:focus:ring-emerald-950"
                >
                  <div className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr_auto] xl:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                          {project.current_user_role ?? "Member"}
                        </span>
                        <span className="text-xs font-medium text-zinc-400">
                          Project #{project.id}
                        </span>
                      </div>

                      {editingId === project.id ? (
                        <div className="mt-3 grid gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                          />
                          <input
                            type="text"
                            value={editingDescription}
                            onChange={(event) =>
                              setEditingDescription(event.target.value)
                            }
                            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                          />
                        </div>
                      ) : (
                        <>
                          <h3 className="mt-2 truncate text-base font-bold text-zinc-950 dark:text-zinc-50">
                            {project.name}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                            {project.description || "No description provided yet."}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <Link
                        href={`/projects/${project.id}/requirements`}
                        onClick={(event) => event.stopPropagation()}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-center transition hover:border-emerald-300 dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <span className="block text-base font-bold text-zinc-950 dark:text-zinc-50">
                          {project.requirements_count ?? 0}
                        </span>
                        <span className="text-[11px] font-semibold text-zinc-500">
                          Reqs
                        </span>
                      </Link>
                      <Link
                        href={`/projects/${project.id}/risks`}
                        onClick={(event) => event.stopPropagation()}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-center transition hover:border-amber-300 dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <span className="block text-base font-bold text-zinc-950 dark:text-zinc-50">
                          {project.risks_count ?? 0}
                        </span>
                        <span className="text-[11px] font-semibold text-zinc-500">
                          Risks
                        </span>
                      </Link>
                      <Link
                        href={`/projects/${project.id}/team`}
                        onClick={(event) => event.stopPropagation()}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-center transition hover:border-cyan-300 dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <span className="block text-base font-bold text-zinc-950 dark:text-zinc-50">
                          {project.team_count ?? 0}
                        </span>
                        <span className="text-[11px] font-semibold text-zinc-500">
                          Team
                        </span>
                      </Link>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      {editingId === project.id ? (
                        <>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              saveEdit(project.id);
                            }}
                            className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={isSubmitting}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              cancelEdit();
                            }}
                            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            href={`/projects/${project.id}`}
                            onClick={(event) => event.stopPropagation()}
                            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                          >
                            Open
                          </Link>
                          {project.current_user_role === "Lead" ? (
                            <>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  startEdit(project);
                                }}
                                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  deleteProject(project.id);
                                }}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:border-rose-300 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
                              >
                                Delete
                              </button>
                            </>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                </article>
              )) : null}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
