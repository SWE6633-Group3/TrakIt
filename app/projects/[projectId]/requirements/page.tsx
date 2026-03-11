/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import PageLayout from "../../../_components/PageLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

type Requirement = {
  id: number;
  project_id: number;
  title: string;
  type: string;
  assigned_user_id: number | null;
  req_analysis_hours: number | null;
  design_hours: number | null;
  coding_hours: number | null;
  testing_hours: number | null;
  proj_mgmt_hours: number | null;
  status: string;
};

export default function ProjectRequirementsPage() {
  const params = useParams<{ projectId?: string }>();
  const projectId = useMemo(() => {
    const raw = params?.projectId;
    if (!raw) return NaN;
    return Number.parseInt(raw, 10);
  }, [params]);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Functional");
  const [status, setStatus] = useState("Draft");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingType, setEditingType] = useState("Functional");
  const [editingStatus, setEditingStatus] = useState("Draft");
  const [assignedUserId, setAssignedUserId] = useState<number | null>(null);
  const [reqAnalysisHours, setReqAnalysisHours] = useState<number | null>(null);
  const [designHours, setDesignHours] = useState<number | null>(null);
  const [codingHours, setCodingHours] = useState<number | null>(null);
  const [testingHours, setTestingHours] = useState<number | null>(null);
  const [projMgmtHours, setProjMgmtHours] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [currentRole, setCurrentRole] = useState<"Lead" | "Member" | null>(
    null
  );

  const loadRequirements = () => {
    if (!Number.isFinite(projectId) || projectId <= 0) {
      setErrorMessage(`Invalid project id: ${params?.projectId}`);
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
        return fetch(`${API_BASE}/api/projects/${projectId}/requirements`);
      })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error ?? "Unable to load requirements.";
          throw new Error(message);
        }
        return response.json();
      })
      .then((payload) => {
        setRequirements(payload?.requirements ?? []);
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
      });
  };

  const loadUsers = () => {
    return fetch(`${API_BASE}/api/users`)
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error ?? "Unable to load users.";
          throw new Error(message);
        }
        return response.json();
      })
      .then((payload) => {
        setUsers(payload?.users ?? []);
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
        return [];
      });
  }

  useEffect(() => {
    loadRequirements();
    loadUsers();
  }, [projectId]);

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
      setErrorMessage("Only the team lead can add requirements.");
      return;
    }

    fetch(`${API_BASE}/api/projects/${projectId}/requirements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, type, status }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error ?? "Unable to create requirement.";
          throw new Error(message);
        }
        return response.json();
      })
      .then(() => {
        setTitle("");
        setType("Functional");
        setStatus("Draft");
        loadRequirements();
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
      });
  };

  const startEdit = (item: Requirement) => {
    setEditingId(item.id);
    setEditingTitle(item.title);
    setEditingType(item.type);
    setEditingStatus(item.status);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
    setEditingType("Functional");
    setEditingStatus("Draft");
  };

  const saveEdit = (itemId: number) => {
    if (hasAccess === false) {
      setErrorMessage("You are not on this project team.");
      return;
    }
    if (currentRole !== "Lead") {
      setErrorMessage("Only the team lead can edit requirements.");
      return;
    }
    fetch(`${API_BASE}/api/requirements/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editingTitle,
        type: editingType,
        status: editingStatus,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error ?? "Unable to update requirement.";
          throw new Error(message);
        }
        return response.json();
      })
      .then(() => {
        cancelEdit();
        loadRequirements();
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
      setErrorMessage("Only the team lead can delete requirements.");
      return;
    }
    fetch(`${API_BASE}/api/requirements/${itemId}`, {
      method: "DELETE",
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error ?? "Unable to delete requirement.";
          throw new Error(message);
        }
        return response.json();
      })
      .then(() => {
        loadRequirements();
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
      });
  };

  return (
    <PageLayout
      title="Project requirements"
      description="Create, update, or remove functional and non-functional requirements for this project."
      breadcrumbs={[
        { label: "Projects", href: "/projects" },
        { label: `Project ${params?.projectId ?? ""}`, href: `/projects/${params?.projectId ?? ""}` },
        { label: "Requirements", href: `/projects/${params?.projectId ?? ""}/requirements` },
      ]}
    >
      <div className="space-y-6">
        {hasAccess === false ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            You are not on this project team. Join the team to view
            requirements.
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
              placeholder="Requirement title"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              required
            />
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option>Functional</option>
              <option>Non-functional</option>
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option>Draft</option>
              <option>Approved</option>
              <option>In review</option>
            </select>
            <select
              value={assignedUserId ?? ""}
              onChange={(event) =>
                setAssignedUserId(
                  event.target.value
                    ? Number.parseInt(event.target.value, 10)
                    : null
                )
              }
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              step="0.5"
              value={reqAnalysisHours ?? ""}
              onChange={(e) => {
                const v = e.currentTarget.value;
                setReqAnalysisHours(v === "" ? null : Number(v));
              }}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <input
              type="number"
              min={0}
              step="0.5"
              value={designHours ?? ""}
                onChange={(e) => {
                  const v = e.currentTarget.value;
                  setDesignHours(v === "" ? null : Number(v));
                }}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <input
              type="number"
              min={0}
              step="0.5"
              value={codingHours ?? ""}
              onChange={(e) => {
                const v = e.currentTarget.value;
                setCodingHours(v === "" ? null : Number(v));
              }}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <input
              type="number"
              min={0}
              step="0.5"
              value={testingHours ?? ""}
              onChange={(e) => {
                const v = e.currentTarget.value;
                setTestingHours(v === "" ? null : Number(v));
              }}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <input
              type="number"
              min={0}
              step="0.5"
              value={projMgmtHours ?? ""}
              onChange={(e) => {
                const v = e.currentTarget.value;
                setProjMgmtHours(v === "" ? null : Number(v));
              }}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
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
          {requirements.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
              No requirements yet.
            </div>
          ) : null}
          {requirements.map((item) => (
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
                    value={editingType}
                    onChange={(event) => setEditingType(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option>Functional</option>
                    <option>Non-functional</option>
                  </select>
                  <select
                    value={editingStatus}
                    onChange={(event) => setEditingStatus(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option>Draft</option>
                    <option>Approved</option>
                    <option>In review</option>
                  </select>
                  <select
                    value={assignedUserId ?? ""}
                    onChange={(event) =>
                      setAssignedUserId(
                        event.target.value
                          ? Number.parseInt(event.target.value, 10)
                          : null
                      )
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={reqAnalysisHours ?? ""}
                    onChange={(e) => {
                      const v = e.currentTarget.value;
                      setReqAnalysisHours(v === "" ? null : Number(v));
                    }}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={designHours ?? ""}
                      onChange={(e) => {
                        const v = e.currentTarget.value;
                        setDesignHours(v === "" ? null : Number(v));
                      }}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={codingHours ?? ""}
                    onChange={(e) => {
                      const v = e.currentTarget.value;
                      setCodingHours(v === "" ? null : Number(v));
                    }}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={testingHours ?? ""}
                    onChange={(e) => {
                      const v = e.currentTarget.value;
                      setTestingHours(v === "" ? null : Number(v));
                    }}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={projMgmtHours ?? ""}
                    onChange={(e) => {
                      const v = e.currentTarget.value;
                      setProjMgmtHours(v === "" ? null : Number(v));
                    }}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
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
                      {item.type} · {item.status}
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
