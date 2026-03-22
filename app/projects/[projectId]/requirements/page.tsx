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

type ProjectUser = {
  id: number;
  name: string;
  role: "Lead" | "Member";
};

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
      });
  };

  useEffect(() => {
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
        proj_mgmt_hours: projMgmtHours
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
    setEditReqAnalysisHours(item.req_analysis_hours ?? 0 );
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
        proj_mgmt_hours: editProjMgmtHours
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

  const getAssignedTaskName = (requirementId: number): string => {
    const requirement = requirements.find(req => req.id === requirementId);
    if (!requirement || !requirement.assigned_user_id) {
      return "Unassigned";
    }
    const assignedUser = users.find(user => user.id === requirement.assigned_user_id);
    return assignedUser ? assignedUser.name : "Unassigned";
  }

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
            className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2 xl:grid-cols-4"
          >
            <div className="relative xl:col-span-2">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Requirement title"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                required
              />
              <label htmlFor="floating_outlined" className="pointer-events-none absolute top-2 start-1 z-10 -translate-y-4 scale-75 bg-white px-2 text-sm text-slate-500 duration-300 dark:bg-slate-900 dark:text-slate-400">Requirement Title</label>
            </div>
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
            <div className="relative">
              <input
                type="number"
                min={0}
                step="1"
                value={reqAnalysisHours ?? ""}
                onChange={(e) => {
                  const v = e.currentTarget.value;
                  setReqAnalysisHours(Number(v));
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <label htmlFor="floating_outlined" className="pointer-events-none absolute top-2 start-1 z-10 -translate-y-4 scale-75 bg-white px-2 text-sm text-slate-500 duration-300 dark:bg-slate-900 dark:text-slate-400">Requirements Analysis Hours</label>
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                step="1"
                value={designHours ?? ""}
                  onChange={(e) => {
                    const v = e.currentTarget.value;
                    setDesignHours(Number(v));
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <label htmlFor="floating_outlined" className="pointer-events-none absolute top-2 start-1 z-10 -translate-y-4 scale-75 bg-white px-2 text-sm text-slate-500 duration-300 dark:bg-slate-900 dark:text-slate-400">Design Hours</label>
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                step="1"
                value={codingHours ?? ""}
                onChange={(e) => {
                  const v = e.currentTarget.value;
                  setCodingHours(Number(v));
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <label htmlFor="floating_outlined" className="pointer-events-none absolute top-2 start-1 z-10 -translate-y-4 scale-75 bg-white px-2 text-sm text-slate-500 duration-300 dark:bg-slate-900 dark:text-slate-400">Coding Hours</label>
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                step="1"
                value={testingHours ?? ""}
                onChange={(e) => {
                  const v = e.currentTarget.value;
                  setTestingHours(Number(v));
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <label htmlFor="floating_outlined" className="pointer-events-none absolute top-2 start-1 z-10 -translate-y-4 scale-75 bg-white px-2 text-sm text-slate-500 duration-300 dark:bg-slate-900 dark:text-slate-400">Testing Hours</label>
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                step="1"
                value={projMgmtHours ?? ""}
                onChange={(e) => {
                  const v = e.currentTarget.value;
                  setProjMgmtHours(Number(v));
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <label htmlFor="floating_outlined" className="pointer-events-none absolute top-2 start-1 z-10 -translate-y-4 scale-75 bg-white px-2 text-sm text-slate-500 duration-300 dark:bg-slate-900 dark:text-slate-400">Project Management Hours</label>
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
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="relative xl:col-span-2">
                    <input
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <label htmlFor="floating_outlined" className="pointer-events-none absolute top-2 start-1 z-10 -translate-y-4 scale-75 bg-white px-2 text-sm text-slate-500 duration-300 dark:bg-slate-900 dark:text-slate-400">Requirement Title</label>
                  </div>
                  <div className="relative">
                    <select
                      value={editingType}
                      onChange={(event) => setEditingType(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option>Functional</option>
                      <option>Non-functional</option>
                    </select>
                    <label htmlFor="floating_outlined" className="pointer-events-none absolute top-2 start-1 z-10 -translate-y-4 scale-75 bg-white px-2 text-sm text-slate-500 duration-300 dark:bg-slate-900 dark:text-slate-400">Type</label>
                  </div>
                  <div className="relative">
                    <select
                      value={editingStatus}
                      onChange={(event) => setEditingStatus(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option>Draft</option>
                      <option>Approved</option>
                      <option>In review</option>
                    </select>
                    <label htmlFor="floating_outlined" className="pointer-events-none absolute top-2 start-1 z-10 -translate-y-4 scale-75 bg-white px-2 text-sm text-slate-500 duration-300 dark:bg-slate-900 dark:text-slate-400">Status</label>
                  </div>
                  <div className="relative">
                    <select
                      value={editAssignedUserId ?? ""}
                      onChange={(event) =>
                        setEditAssignedUserId(
                          event.target.value
                            ? Number.parseInt(event.target.value, 10)
                            : null
                        )
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="">Unassigned</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="floating_outlined" className="pointer-events-none absolute top-2 start-1 z-10 -translate-y-4 scale-75 bg-white px-2 text-sm text-slate-500 duration-300 dark:bg-slate-900 dark:text-slate-400">Assigned User</label>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={editReqAnalysisHours ?? ""}
                      onChange={(e) => {
                        const v = e.currentTarget.value;
                        setEditReqAnalysisHours(Number(v));
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <label htmlFor="floating_outlined" className="pointer-events-none absolute top-2 start-1 z-10 -translate-y-4 scale-75 bg-white px-2 text-sm text-slate-500 duration-300 dark:bg-slate-900 dark:text-slate-400">Requirements Analysis Hours</label>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={editDesignHours ?? ""}
                      onChange={(e) => {
                        const v = e.currentTarget.value;
                        setEditDesignHours(Number(v));
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <label htmlFor="floating_outlined" className="pointer-events-none absolute top-2 start-1 z-10 -translate-y-4 scale-75 bg-white px-2 text-sm text-slate-500 duration-300 dark:bg-slate-900 dark:text-slate-400">Design Hours</label>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={editCodingHours ?? ""}
                      onChange={(e) => {
                        const v = e.currentTarget.value;
                        setEditCodingHours(Number(v));
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <label htmlFor="floating_outlined" className="pointer-events-none absolute top-2 start-1 z-10 -translate-y-4 scale-75 bg-white px-2 text-sm text-slate-500 duration-300 dark:bg-slate-900 dark:text-slate-400">Coding Hours</label>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={editTestingHours ?? ""}
                      onChange={(e) => {
                        const v = e.currentTarget.value;
                        setEditTestingHours(Number(v));
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <label htmlFor="floating_outlined" className="pointer-events-none absolute top-2 start-1 z-10 -translate-y-4 scale-75 bg-white px-2 text-sm text-slate-500 duration-300 dark:bg-slate-900 dark:text-slate-400">Testing Hours</label>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={editProjMgmtHours ?? ""}
                      onChange={(e) => {
                        const v = e.currentTarget.value;
                        setEditProjMgmtHours(Number(v));
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <label htmlFor="floating_outlined" className="pointer-events-none absolute top-2 start-1 z-10 -translate-y-4 scale-75 bg-white px-2 text-sm text-slate-500 duration-300 dark:bg-slate-900 dark:text-slate-400">Project Management Hours</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(item.id)}
                      disabled={!hasEditChanges(item)}
                      className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:bg-slate-100 dark:text-slate-900 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
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
                      <b >{item.type}</b> · <b>{item.status}</b> · <b>Assigned to: </b>{getAssignedTaskName(item.id)} · <b>Req Analysis Hours:</b> {item.req_analysis_hours ?? 0} · <b>Design Hours:</b> {item.design_hours ?? 0} · <b>Coding Hours:</b> {item.coding_hours ?? 0} · <b>Testing Hours:</b> {item.testing_hours ?? 0} · <b>PM Hours:</b> {item.proj_mgmt_hours ?? 0} 
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
