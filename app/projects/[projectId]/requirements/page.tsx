/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
"use client";

import Link from "next/link";
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

type ProjectUser = {
  id: number;
  name: string;
  role: "Lead" | "Member";
};

const inputClass =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-emerald-950";

const statusClass = (status: string) => {
  if (status === "Approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200";
  }
  if (status === "In review") {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200";
  }
  return "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200";
};

const totalHours = (item: Requirement) => 
  (item.req_analysis_hours ?? 0) +
  (item.design_hours ?? 0) +
  (item.coding_hours ?? 0) +
  (item.testing_hours ?? 0) +
  (item.proj_mgmt_hours ?? 0);

export default function ProjectRequirementsPage() {
  const params = useParams<{ projectId?: string }>();
  const projectId = useMemo(() => {
    const raw = params?.projectId;
    if (!raw) return NaN;
    return Number.parseInt(raw, 10);
  }, [params]);
  const [users, setUsers] = useState<ProjectUser[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Functional");
  const [status, setStatus] = useState("Draft");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingType, setEditingType] = useState("Functional");
  const [editingStatus, setEditingStatus] = useState("Draft");
  const [assignedUserId, setAssignedUserId] = useState<number | null>(null);
  const [reqAnalysisHours, setReqAnalysisHours] = useState<number>(0);
  const [designHours, setDesignHours] = useState<number>(0);
  const [codingHours, setCodingHours] = useState<number>(0);
  const [testingHours, setTestingHours] = useState<number>(0);
  const [projMgmtHours, setProjMgmtHours] = useState<number>(0);
  const [editAssignedUserId, setEditAssignedUserId] = useState<number | null>(null);
  const [editReqAnalysisHours, setEditReqAnalysisHours] = useState<number>(0);
  const [editDesignHours, setEditDesignHours] = useState<number>(0);
  const [editCodingHours, setEditCodingHours] = useState<number>(0);
  const [editTestingHours, setEditTestingHours] = useState<number>(0);
  const [editProjMgmtHours, setEditProjMgmtHours] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<"Lead" | "Member" | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const approvedCount = requirements.filter((item) => item.status === "Approved").length;
  const reviewCount = requirements.filter((item) => item.status === "In review").length;
  const effortTotal = requirements.reduce((sum, item) => sum + totalHours(item), 0);

  const loadProjectName = () => {
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
  };

  const loadRequirements = () => {
    if (!Number.isFinite(projectId) || projectId <= 0) {
      setErrorMessage(`Invalid project id: ${params?.projectId}`);
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
        setUsers(users);
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
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadProjectName();
    loadRequirements();
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
      body: JSON.stringify({
        title,
        type,
        status,
        assigned_user_id: assignedUserId,
        req_analysis_hours: reqAnalysisHours,
        design_hours: designHours,
        coding_hours: codingHours,
        testing_hours: testingHours,
        proj_mgmt_hours: projMgmtHours,
      }),
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
        setAssignedUserId(null);
        setReqAnalysisHours(0);
        setDesignHours(0);
        setCodingHours(0);
        setTestingHours(0);
        setProjMgmtHours(0);
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
    setEditAssignedUserId(item.assigned_user_id);
    setEditReqAnalysisHours(item.req_analysis_hours ?? 0);
    setEditDesignHours(item.design_hours ?? 0);
    setEditCodingHours(item.coding_hours ?? 0);
    setEditTestingHours(item.testing_hours ?? 0);
    setEditProjMgmtHours(item.proj_mgmt_hours ?? 0);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
    setEditingType("Functional");
    setEditingStatus("Draft");
    setEditAssignedUserId(null);
    setEditReqAnalysisHours(0);
    setEditDesignHours(0);
    setEditCodingHours(0);
    setEditTestingHours(0);
    setEditProjMgmtHours(0);
  };

  const hasEditChanges = (item: Requirement) => {
    return (
      editingTitle !== item.title ||
      editingType !== item.type ||
      editingStatus !== item.status ||
      editAssignedUserId !== item.assigned_user_id ||
      editReqAnalysisHours !== (item.req_analysis_hours ?? 0) ||
      editDesignHours !== (item.design_hours ?? 0) ||
      editCodingHours !== (item.coding_hours ?? 0) ||
      editTestingHours !== (item.testing_hours ?? 0) ||
      editProjMgmtHours !== (item.proj_mgmt_hours ?? 0)
    );
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
        assigned_user_id: editAssignedUserId,
        req_analysis_hours: editReqAnalysisHours,
        design_hours: editDesignHours,
        coding_hours: editCodingHours,
        testing_hours: editTestingHours,
        proj_mgmt_hours: editProjMgmtHours,
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
    if (!window.confirm("Delete this requirement? This cannot be undone.")) {
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

  const getAssignedTaskName = (requirementId: number): string => {
    const requirement = requirements.find((req) => req.id === requirementId);
    if (!requirement || !requirement.assigned_user_id) {
      return "Unassigned";
    }
    const assignedUser = users.find(
      (user) => user.id === requirement.assigned_user_id
    );
    return assignedUser ? assignedUser.name : "Unassigned";
  };

  return (
    <PageLayout
      title="Requirements register"
      description="Track scope, ownership, approval state, and estimated effort in one structured register."
      breadcrumbs={[
        { label: "Projects", href: "/projects" },
        {
          label: projectName ?? `Project ${params?.projectId ?? ""}`,
          href: `/projects/${params?.projectId ?? ""}`,
        },
        { label: "Requirements", href: `/projects/${params?.projectId ?? ""}/requirements` },
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
                label === "Requirements"
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
            You are not on this project team. Join the team to view requirements.
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
            <section className="grid gap-3 md:grid-cols-4">
              {[
                ["Total", requirements.length],
                ["Approved", approvedCount],
                ["In review", reviewCount],
                ["Effort hours", effortTotal],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</p>
                </div>
              ))}
            </section>

            {currentRole === "Lead" ? (
              <form onSubmit={handleCreate} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="grid gap-3 lg:grid-cols-[1.5fr_0.8fr_0.8fr_0.9fr]">
                  <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Requirement title" className={inputClass} required />
                  <select value={type} onChange={(event) => setType(event.target.value)} className={inputClass}>
                    <option>Functional</option>
                    <option>Non-functional</option>
                  </select>
                  <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
                    <option>Draft</option>
                    <option>Approved</option>
                    <option>In review</option>
                  </select>
                  <select value={assignedUserId ?? ""} onChange={(event) => setAssignedUserId(event.target.value ? Number.parseInt(event.target.value, 10) : null)} className={inputClass}>
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-5">
                  {[
                    ["Analysis", reqAnalysisHours, setReqAnalysisHours],
                    ["Design", designHours, setDesignHours],
                    ["Coding", codingHours, setCodingHours],
                    ["Testing", testingHours, setTestingHours],
                    ["PM", projMgmtHours, setProjMgmtHours],
                  ].map(([label, value, setter]) => (
                    <label key={label as string} className="block">
                      <span className="text-xs font-bold text-zinc-500">{label as string}</span>
                      <input type="number" min={0} step="1" value={value as number} onChange={(event) => (setter as (value: number) => void)(Number(event.currentTarget.value))} className={`${inputClass} mt-1 w-full`} />
                    </label>
                  ))}
                </div>
                <button type="submit" className="mt-4 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800">
                  Add requirement
                </button>
              </form>
            ) : null}

            {errorMessage ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
                {errorMessage}
              </p>
            ) : null}

            <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              <div className="grid grid-cols-[1.4fr_0.7fr_0.7fr_0.8fr_0.6fr_0.8fr] gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                <span>Requirement</span>
                <span>Type</span>
                <span>Status</span>
                <span>Owner</span>
                <span>Hours</span>
                <span className="text-right">Actions</span>
              </div>
              {requirements.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">No requirements yet.</div>
              ) : null}
              {requirements.map((item) => (
                <div key={item.id} className="border-b border-zinc-100 px-4 py-3 last:border-b-0 dark:border-zinc-800">
                  {editingId === item.id ? (
                    <div className="grid gap-3">
                      <div className="grid gap-3 lg:grid-cols-[1.4fr_0.7fr_0.7fr_0.8fr]">
                        <input value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} className={inputClass} />
                        <select value={editingType} onChange={(event) => setEditingType(event.target.value)} className={inputClass}>
                          <option>Functional</option>
                          <option>Non-functional</option>
                        </select>
                        <select value={editingStatus} onChange={(event) => setEditingStatus(event.target.value)} className={inputClass}>
                          <option>Draft</option>
                          <option>Approved</option>
                          <option>In review</option>
                        </select>
                        <select value={editAssignedUserId ?? ""} onChange={(event) => setEditAssignedUserId(event.target.value ? Number.parseInt(event.target.value, 10) : null)} className={inputClass}>
                          <option value="">Unassigned</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-3 md:grid-cols-[repeat(5,1fr)_auto]">
                        {[
                          ["Analysis", editReqAnalysisHours, setEditReqAnalysisHours],
                          ["Design", editDesignHours, setEditDesignHours],
                          ["Coding", editCodingHours, setEditCodingHours],
                          ["Testing", editTestingHours, setEditTestingHours],
                          ["PM", editProjMgmtHours, setEditProjMgmtHours],
                        ].map(([label, value, setter]) => (
                          <label key={label as string} className="block">
                            <span className="text-xs font-bold text-zinc-500">{label as string}</span>
                            <input type="number" min={0} step="1" value={value as number} onChange={(event) => (setter as (value: number) => void)(Number(event.currentTarget.value))} className={`${inputClass} mt-1 w-full`} />
                          </label>
                        ))}
                        <div className="flex items-end justify-end gap-2">
                          <button type="button" onClick={() => saveEdit(item.id)} disabled={!hasEditChanges(item)} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">Save</button>
                          <button type="button" onClick={cancelEdit} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">Cancel</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-[1.4fr_0.7fr_0.7fr_0.8fr_0.6fr_0.8fr] items-center gap-3">
                      <div>
                        <p className="text-sm font-bold text-zinc-950 dark:text-zinc-50">{item.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">Requirement #{item.id}</p>
                      </div>
                      <span className="text-sm text-zinc-600 dark:text-zinc-300">{item.type}</span>
                      <span className={`w-fit rounded-md border px-2 py-1 text-xs font-bold ${statusClass(item.status)}`}>{item.status}</span>
                      <span className="truncate text-sm text-zinc-600 dark:text-zinc-300">{getAssignedTaskName(item.id)}</span>
                      <span className="text-sm font-bold text-zinc-950 dark:text-zinc-50">{totalHours(item)}</span>
                      <div className="flex justify-end gap-2">
                        {currentRole === "Lead" ? (
                          <>
                            <button type="button" onClick={() => startEdit(item)} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-700 hover:border-emerald-300 dark:border-zinc-800 dark:text-zinc-200">Edit</button>
                            <button type="button" onClick={() => deleteItem(item.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">Delete</button>
                          </>
                        ) : null}
                      </div>
                    </div>
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
