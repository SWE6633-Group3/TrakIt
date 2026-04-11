/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import PageLayout from "../../../_components/PageLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

type ProjectUser = {
  id: number;
  name: string;
  email: string;
  role: "Lead" | "Member";
};

export default function ProjectTeamPage() {
  const params = useParams<{ projectId?: string }>();
  const projectIdParam = params?.projectId;
  const projectId = useMemo(() => {
    const raw = projectIdParam;
    if (!raw) return NaN;
    return Number.parseInt(raw, 10);
  }, [projectIdParam]);
  const [team, setTeam] = useState<ProjectUser[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ProjectUser["role"]>("Member");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<ProjectUser["role"]>(
    "Member"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<ProjectUser["role"] | null>(
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

  const loadTeam = useCallback(() => {
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
          (currentUser?.role as ProjectUser["role"] | undefined) ?? null
        );
        if (!allowed) {
          throw new Error("You are not on this project team.");
        }
        setTeam(users);
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
      });
  }, [projectId, projectIdParam]);

  useEffect(() => {
    loadProjectName();
    loadTeam();
  }, [loadProjectName, loadTeam]);
  

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
      setErrorMessage("Only the team lead can add users.");
      return;
    }

    fetch(`${API_BASE}/api/users?email=${encodeURIComponent(email.trim())}`)
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error ?? "User not found.";
          throw new Error(message);
        }
        return response.json();
      })
      .then((payload) => {
        const userId = payload?.user?.id;
        if (!userId) {
          throw new Error("User not found.");
        }
        return fetch(`${API_BASE}/api/projects/${projectId}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, role }),
        });
      })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error ?? "Unable to add project user.";
          throw new Error(message);
        }
        return response.json();
      })
      .then(() => {
        setEmail("");
        setRole("Member");
        loadTeam();
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
      });
  };

  const startEdit = (item: ProjectUser) => {
    setEditingId(item.id);
    setEditingRole(item.role);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingRole("Member");
  };

  const saveEdit = (itemId: number) => {
    if (hasAccess === false) {
      setErrorMessage("You are not on this project team.");
      return;
    }
    if (currentRole !== "Lead") {
      setErrorMessage("Only the team lead can update roles.");
      return;
    }
    fetch(`${API_BASE}/api/projects/${projectId}/users/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: editingRole }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error ?? "Unable to update project user.";
          throw new Error(message);
        }
        return response.json();
      })
      .then(() => {
        cancelEdit();
        loadTeam();
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
      setErrorMessage("Only the team lead can remove users.");
      return;
    }
    fetch(`${API_BASE}/api/projects/${projectId}/users/${itemId}`, {
      method: "DELETE",
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error ?? "Unable to remove project user.";
          throw new Error(message);
        }
        return response.json();
      })
      .then(() => {
        loadTeam();
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
      });
  };

  return (
    <PageLayout
      title="Project team"
      description="Manage the project users. Assign a lead and add members by email."
      breadcrumbs={[
        { label: "Projects", href: "/projects" },
        {
          label: projectName ?? `Project ${params?.projectId ?? ""}`,
          href: `/projects/${params?.projectId ?? ""}`,
        },
        { label: "Team", href: `/projects/${params?.projectId ?? ""}/team` },
      ]}
    >
      <div className="space-y-6">
        {hasAccess === false ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            You are not on this project team. Join the team to manage users.
          </div>
        ) : null}
        {hasAccess === false ? null : currentRole === "Lead" ? (
          <form
            onSubmit={handleCreate}
            className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[2fr_1fr_1fr_auto]"
          >
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="User email"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              required
            />
            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value as ProjectUser["role"])
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              required
            >
              <option value="Lead">Lead</option>
              <option value="Member">Member</option>
            </select>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Existing user required
            </div>
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
            {team.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                No project users yet.
              </div>
            ) : null}
            {team.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
              {editingId === item.id ? (
                <div className="grid gap-3 md:grid-cols-[2fr_1fr_auto]">
                  <div className="text-sm text-slate-700 dark:text-slate-200">
                    {item.name} · {item.email}
                  </div>
                  <select
                    value={editingRole}
                    onChange={(event) =>
                      setEditingRole(event.target.value as ProjectUser["role"])
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="Lead">Lead</option>
                    <option value="Member">Member</option>
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
                      {item.name}
                    </p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {item.role} · {item.email}
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
                        Remove
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
