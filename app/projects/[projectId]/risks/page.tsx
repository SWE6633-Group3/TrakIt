/* eslint-disable react-hooks/set-state-in-effect */
"use client";

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
      title="Project risks"
      description="Create, update, and monitor project risks."
      breadcrumbs={[
        { label: "Projects", href: "/projects" },
        {
          label: projectName ?? `Project ${params?.projectId ?? ""}`,
          href: `/projects/${params?.projectId ?? ""}`,
        },
        { label: "Risks", href: `/projects/${params?.projectId ?? ""}/risks` },
      ]}
    >
      <div className="space-y-6">
        {hasAccess === false ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            You are not on this project team. Join the team to view risks.
          </div>
        ) : null}
        {hasAccess === false ? null : currentRole === "Lead" ? (
          <form
            onSubmit={handleCreate}
            className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[2fr_1fr_1fr_auto]"
          >
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Risk title"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              required
            />
            <select
              value={impact}
              onChange={(event) => setImpact(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option>Open</option>
              <option>Monitoring</option>
              <option>Closed</option>
            </select>
            <button
              type="submit"
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              Add
            </button>
          </form>
        ) : null}
        {errorMessage ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </p>
        ) : null}
        {hasAccess === false ? null : (
          <div className="space-y-4">
            {risks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                No risks yet.
              </div>
            ) : null}
            {risks.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
              {editingId === item.id ? (
                <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
                  <input
                    value={editingTitle}
                    onChange={(event) => setEditingTitle(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <select
                    value={editingImpact}
                    onChange={(event) => setEditingImpact(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                  <select
                    value={editingStatus}
                    onChange={(event) => setEditingStatus(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option>Open</option>
                    <option>Monitoring</option>
                    <option>Closed</option>
                  </select>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(item.id)}
                      className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {item.impact} impact · {item.status}
                    </p>
                  </div>
                  {currentRole === "Lead" ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteItem(item.id)}
                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
