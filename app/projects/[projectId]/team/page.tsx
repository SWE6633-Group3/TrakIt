/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
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

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

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
  const [filteredUsers, setFilteredUsers] = useState<ProjectUser[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const leadCount = team.filter((member) => member.role === "Lead").length;

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
          (currentUser?.role as ProjectUser["role"] | undefined) ?? null
        );
        if (!allowed) {
          throw new Error("You are not on this project team.");
        }
        setTeam(users);
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
        setFilteredUsers([]);
        setShowSuggestions(false);
        loadTeam();
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
      });
  };

  const searchUsers = (value: string) => {
    setEmail(value);

    if (!value.trim()) {
      setFilteredUsers([]);
      setShowSuggestions(false);
      return;
    }

    fetch(`${API_BASE}/api/users/search?q=${encodeURIComponent(value)}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to search users.");
        }
        return response.json();
      })
      .then((payload) => {
        const users = payload?.users ?? [];
        setFilteredUsers(users);
        setShowSuggestions(users.length > 0);
        setHighlightIndex(0);
      })
      .catch(() => {
        setFilteredUsers([]);
        setShowSuggestions(false);
      });
  };

  const selectUserSuggestion = (user: ProjectUser) => {
    setEmail(user.email);
    setFilteredUsers([]);
    setShowSuggestions(false);
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
    const item = team.find((member) => member.id === itemId);
    if (hasAccess === false) {
      setErrorMessage("You are not on this project team.");
      return;
    }
    if (currentRole !== "Lead") {
      setErrorMessage("Only the team lead can remove users.");
      return;
    }
    if (
      item?.role === "Lead" &&
      team.filter((member) => member.role === "Lead").length <= 1
    ) {
      setErrorMessage(
        "Assign another team lead before removing the current lead."
      );
      return;
    }
    if (!window.confirm("Remove this user from the project?")) {
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
      description="Manage access, leads, and team members for this workspace."
      breadcrumbs={[
        { label: "Projects", href: "/projects" },
        {
          label: projectName ?? `Project ${params?.projectId ?? ""}`,
          href: `/projects/${params?.projectId ?? ""}`,
        },
        { label: "Team", href: `/projects/${params?.projectId ?? ""}/team` },
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
                label === "Team"
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
            You are not on this project team. Join the team to manage users.
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
                ["Members", team.length],
                ["Leads", leadCount],
                ["Role", currentRole ?? "None"],
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
                className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 md:grid-cols-[2fr_1fr_auto]"
              >
                <div className="relative">
                  <input
                    value={email}
                    onChange={(event) => searchUsers(event.target.value)}
                    onKeyDown={(event) => {
                      if (!showSuggestions || filteredUsers.length === 0) {
                        return;
                      }

                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        setHighlightIndex((prev) =>
                          prev + 1 < filteredUsers.length ? prev + 1 : prev
                        );
                      }

                      if (event.key === "ArrowUp") {
                        event.preventDefault();
                        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : 0));
                      }

                      if (event.key === "Enter") {
                        event.preventDefault();
                        const selected = filteredUsers[highlightIndex];
                        if (selected) {
                          selectUserSuggestion(selected);
                        }
                      }

                      if (event.key === "Escape") {
                        setShowSuggestions(false);
                      }
                    }}
                    placeholder="Search user email"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-emerald-950"
                    required
                  />

                  {showSuggestions && filteredUsers.length > 0 ? (
                    <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl shadow-zinc-950/10 dark:border-zinc-800 dark:bg-zinc-950">
                      {filteredUsers.map((user, index) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => selectUserSuggestion(user)}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                            index === highlightIndex
                              ? "bg-emerald-50 dark:bg-emerald-950/40"
                              : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                          }`}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-950">
                            {initials(user.name)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-bold text-zinc-950 dark:text-zinc-50">
                              {user.name}
                            </span>
                            <span className="block truncate text-xs text-zinc-500">
                              {user.email}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <select
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value as ProjectUser["role"])
                  }
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                  required
                >
                  <option value="Lead">Lead</option>
                  <option value="Member">Member</option>
                </select>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
                >
                  Add user
                </button>
              </form>
            ) : null}

            {errorMessage ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
                {errorMessage}
              </p>
            ) : null}

            <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              <div className="grid grid-cols-[1.2fr_1.2fr_0.6fr_0.8fr] gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                <span>User</span>
                <span>Email</span>
                <span>Role</span>
                <span className="text-right">Actions</span>
              </div>
              {team.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">
                  No project users yet.
                </div>
              ) : null}
              {team.map((item) => (
                <div key={item.id} className="grid grid-cols-[1.2fr_1.2fr_0.6fr_0.8fr] items-center gap-3 border-b border-zinc-100 px-4 py-3 last:border-b-0 dark:border-zinc-800">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-950">
                      {initials(item.name)}
                    </div>
                    <p className="truncate text-sm font-bold text-zinc-950 dark:text-zinc-50">{item.name}</p>
                  </div>
                  <p className="truncate text-sm text-zinc-600 dark:text-zinc-300">{item.email}</p>
                  <div>
                    {editingId === item.id ? (
                      <select value={editingRole} onChange={(event) => setEditingRole(event.target.value as ProjectUser["role"])} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
                        <option value="Lead">Lead</option>
                        <option value="Member">Member</option>
                      </select>
                    ) : (
                      <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                        {item.role}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    {editingId === item.id ? (
                      <>
                        <button type="button" onClick={() => saveEdit(item.id)} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Save</button>
                        <button type="button" onClick={cancelEdit} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">Cancel</button>
                      </>
                    ) : currentRole === "Lead" ? (
                      <>
                        <button type="button" onClick={() => startEdit(item)} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-700 hover:border-emerald-300 dark:border-zinc-800 dark:text-zinc-200">Edit</button>
                        <button type="button" onClick={() => deleteItem(item.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">Remove</button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
