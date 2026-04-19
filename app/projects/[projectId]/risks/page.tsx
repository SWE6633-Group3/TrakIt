/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import PageLayout from "../../../_components/PageLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

type Risk = {
  id: number;
  project_id: number;
  title: string;
  impact: string;
  status: string;
};

const impactClass = (impact: string) => {
  if (impact === "High") {
    return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200";
  }
  if (impact === "Medium") {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200";
  }
  return "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-200";
};

const statusClass = (status: string) => {
  if (status === "Closed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200";
  }
  if (status === "Monitoring") {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200";
  }
  return "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200";
};

export default function ProjectRisksPage() {
  const params = useParams<{ projectId?: string }>();
  const projectIdParam = params?.projectId;
  const projectId = useMemo(() => {
    const raw = projectIdParam;
    if (!raw) return NaN;
    return Number.parseInt(raw, 10);
  }, [projectIdParam]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [title, setTitle] = useState("");
  const [impact, setImpact] = useState("Medium");
  const [status, setStatus] = useState("Open");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingImpact, setEditingImpact] = useState("Medium");
  const [editingStatus, setEditingStatus] = useState("Open");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<"Lead" | "Member" | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const openCount = risks.filter((risk) => risk.status !== "Closed").length;
  const highCount = risks.filter((risk) => risk.impact === "High").length;

  const loadProjectName = useCallback(() => {
    if (!Number.isFinite(projectId) || projectId <= 0) {
      setProjectName(null);
      return;
    }
    fetch(`${API_BASE}/api/projects/${projectId}`)
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        const payload = await response.json().catch(() => ({}));
        return payload?.project?.name ?? null;
      })
      .then((name) => {
        setProjectName(name);
      })
      .catch(() => {
        setProjectName(null);
      });
  }, [projectId]);

  const loadRisks = useCallback(() => {
    if (!Number.isFinite(projectId) || projectId <= 0) {
      setErrorMessage(`Invalid project id: ${projectIdParam}`);
      setIsLoading(false);
      return;
    }
    const currentUserId = Number(
      window.localStorage.getItem("trakItUserId") ?? 0
    );
    fetch(`${API_BASE}/api/projects/${projectId}/users`)
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error ?? "Unable to load project users.";
          throw new Error(message);
        }
        return response.json();
      })
      .then((payload) => {
        const users = payload?.users ?? [];
        const currentUser = currentUserId
          ? users.find((user: { id: number; role?: string }) => user.id === currentUserId)
          : null;
        const allowed = Boolean(currentUser);
        setHasAccess(allowed);
        setCurrentRole(
          (currentUser?.role as "Lead" | "Member" | undefined) ?? null
        );
        if (!allowed) {
          throw new Error("You are not on this project team.");
        }
        return fetch(`${API_BASE}/api/projects/${projectId}/risks`);
      })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error ?? "Unable to load risks.";
          throw new Error(message);
        }
        return response.json();
      })
      .then((payload) => {
        setRisks(payload?.risks ?? []);
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [projectId, projectIdParam]);

  useEffect(() => {
    loadProjectName();
    loadRisks();
  }, [loadProjectName, loadRisks]);

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    if (!Number.isFinite(projectId) || projectId <= 0) {
      setErrorMessage(`Invalid project id: ${params?.projectId}`);
      return;
    }
    if (hasAccess === false) {
      setErrorMessage("You are not on this project team.");
      return;
    }
    if (currentRole !== "Lead") {
      setErrorMessage("Only the team lead can add risks.");
      return;
    }

    fetch(`${API_BASE}/api/projects/${projectId}/risks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, impact, status }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error ?? "Unable to create risk.";
          throw new Error(message);
        }
        return response.json();
      })
      .then(() => {
        setTitle("");
        setImpact("Medium");
        setStatus("Open");
        loadRisks();
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
      });
  };

  const startEdit = (item: Risk) => {
    setEditingId(item.id);
    setEditingTitle(item.title);
    setEditingImpact(item.impact);
    setEditingStatus(item.status);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
    setEditingImpact("Medium");
    setEditingStatus("Open");
  };

  const saveEdit = (itemId: number) => {
    if (hasAccess === false) {
      setErrorMessage("You are not on this project team.");
      return;
    }
    if (currentRole !== "Lead") {
      setErrorMessage("Only the team lead can edit risks.");
      return;
    }
    fetch(`${API_BASE}/api/risks/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editingTitle,
        impact: editingImpact,
        status: editingStatus,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error ?? "Unable to update risk.";
          throw new Error(message);
        }
        return response.json();
      })
      .then(() => {
        cancelEdit();
        loadRisks();
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
      });
  };

  const deleteItem = (itemId: number) => {
    if (hasAccess === false) {
      setErrorMessage("You are not on this project team.");
      return;
    }
    if (currentRole !== "Lead") {
      setErrorMessage("Only the team lead can delete risks.");
      return;
    }
    if (!window.confirm("Delete this risk? This cannot be undone.")) {
      return;
    }
    fetch(`${API_BASE}/api/risks/${itemId}`, {
      method: "DELETE",
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error ?? "Unable to delete risk.";
          throw new Error(message);
        }
        return response.json();
      })
      .then(() => {
        loadRisks();
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
      });
  };

  return (
    <PageLayout
      title="Risk register"
      description="Track impact, status, and ownership conversations before risks become delivery surprises."
      breadcrumbs={[
        { label: "Projects", href: "/projects" },
        {
          label: projectName ?? `Project ${params?.projectId ?? ""}`,
          href: `/projects/${params?.projectId ?? ""}`,
        },
        { label: "Risks", href: `/projects/${params?.projectId ?? ""}/risks` },
      ]}
    >
      <div className="space-y-5">
        <nav className="flex flex-wrap gap-2">
          {[
            ["Overview", `/projects/${projectId}`],
            ["Requirements", `/projects/${projectId}/requirements`],
            ["Risks", `/projects/${projectId}/risks`],
            ["Team", `/projects/${projectId}/team`],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                label === "Risks"
                  ? "bg-emerald-700 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {hasAccess === false ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
            You are not on this project team. Join the team to view risks.
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
              />
            ))}
          </div>
        ) : null}

        {hasAccess === false || isLoading ? null : (
          <>
            <section className="grid gap-3 md:grid-cols-3">
              {[
                ["Total risks", risks.length],
                ["Open / monitoring", openCount],
                ["High impact", highCount],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</p>
                </div>
              ))}
            </section>

            {currentRole === "Lead" ? (
              <form
                onSubmit={handleCreate}
                className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 md:grid-cols-[2fr_1fr_1fr_auto]"
              >
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Risk title"
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-emerald-950"
                  required
                />
                <select value={impact} onChange={(event) => setImpact(event.target.value)} className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
                <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
                  <option>Open</option>
                  <option>Monitoring</option>
                  <option>Closed</option>
                </select>
                <button type="submit" className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800">
                  Add risk
                </button>
              </form>
            ) : null}

            {errorMessage ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
                {errorMessage}
              </p>
            ) : null}

            <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              <div className="grid grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr] gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                <span>Risk</span>
                <span>Impact</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>
              {risks.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">
                  No risks yet.
                </div>
              ) : null}
              {risks.map((item) => (
                <div key={item.id} className="grid grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr] gap-3 border-b border-zinc-100 px-4 py-3 last:border-b-0 dark:border-zinc-800">
                  {editingId === item.id ? (
                    <>
                      <input value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50" />
                      <select value={editingImpact} onChange={(event) => setEditingImpact(event.target.value)} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                      <select value={editingStatus} onChange={(event) => setEditingStatus(event.target.value)} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
                        <option>Open</option>
                        <option>Monitoring</option>
                        <option>Closed</option>
                      </select>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => saveEdit(item.id)} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Save</button>
                        <button type="button" onClick={cancelEdit} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-bold text-zinc-950 dark:text-zinc-50">{item.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">Risk #{item.id}</p>
                      </div>
                      <span className={`self-start rounded-md border px-2 py-1 text-xs font-bold ${impactClass(item.impact)}`}>{item.impact}</span>
                      <span className={`self-start rounded-md border px-2 py-1 text-xs font-bold ${statusClass(item.status)}`}>{item.status}</span>
                      <div className="flex justify-end gap-2">
                        {currentRole === "Lead" ? (
                          <>
                            <button type="button" onClick={() => startEdit(item)} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-700 hover:border-emerald-300 dark:border-zinc-800 dark:text-zinc-200">Edit</button>
                            <button type="button" onClick={() => deleteItem(item.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">Delete</button>
                          </>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
