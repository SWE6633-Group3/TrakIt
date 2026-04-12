"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";
const USER_ID_KEY = "trakItUserId";
const USER_EMAIL_KEY = "trakItUserEmail";

type Project = {
  id: number;
  name: string;
  description: string | null;
  manager_name?: string | null;
  team_members?: string[];
  owner_user_id: number;
  requirements_count?: number;
  risks_count?: number;
  team_count?: number;
  current_user_role?: "Lead" | "Member";
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [managerName, setManagerName] = useState("");
  const [teamMembersText, setTeamMembersText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      });
  }, []);

  const handleCreateProject = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const ownerUserId = window.localStorage.getItem(USER_ID_KEY);
    if (!ownerUserId) {
      setErrorMessage("Please log in to create a project.");
      setIsSubmitting(false);
      return;
    }

    fetch(`${API_BASE}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        managerName,
        teamMembers: teamMembersText
          .split(/\n|,/)
          .map((member) => member.trim())
          .filter(Boolean),
        ownerUserId: Number(ownerUserId),
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.error ?? "Unable to create project.";
          throw new Error(message);
        }
        return response.json();
      })
      .then(() => {
        setName("");
        setDescription("");
        setManagerName("");
        setTeamMembersText("");
        loadProjects(ownerUserId);
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

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
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
          New project
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl dark:text-slate-100">
          Create a project workspace
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-300">
          Start a new project by capturing the project profile information in
          one place, including description, manager name, and team member list.
        </p>
        <form
          onSubmit={handleCreateProject}
          className="mt-6 grid gap-4 lg:grid-cols-2"
        >
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
            <input
              type="text"
              placeholder="Project name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              required
            />
            <textarea
              placeholder="Project description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
            <input
              type="text"
              placeholder="Manager name"
              value={managerName}
              onChange={(event) => setManagerName(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <textarea
              placeholder="Team members list, separated by commas or new lines"
              value={teamMembersText}
              onChange={(event) => setTeamMembersText(event.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create project"}
            </button>
          </div>
        </form>
        {errorMessage ? (
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </p>
        ) : null}
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {projects.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
            No projects yet. Create one to get started.
          </div>
        ) : null}
        {projects.map((project, index) => (
          <article
            key={project.id}
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-slate-100/70 opacity-0 transition group-hover:opacity-100 dark:to-slate-800/40" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Project {index + 1}
                  </p>
                  {editingId === project.id ? (
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <input
                        type="text"
                        value={editingDescription}
                        onChange={(event) =>
                          setEditingDescription(event.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                  ) : (
                    <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {project.name}
                    </h2>
                  )}
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                  Active
                </span>
              </div>
              {editingId === project.id ? null : (
                <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <p>{project.description || "No description provided yet."}</p>
                  <p>
                    Manager:{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {project.manager_name || "Not set"}
                    </span>
                  </p>
                  <p>
                    Team members:{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {project.team_members?.length
                        ? project.team_members.join(", ")
                        : "Not set"}
                    </span>
                  </p>
                </div>
              )}
              <div className="mt-5 grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 sm:grid-cols-3">
                <Link
                  href={`/projects/${project.id}/requirements`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-center transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-500"
                >
                  <span className="block text-base font-semibold">
                    {project.requirements_count ?? 0}
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Requirements
                  </span>
                </Link>
                <Link
                  href={`/projects/${project.id}/risks`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-center transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-500"
                >
                  <span className="block text-base font-semibold">
                    {project.risks_count ?? 0}
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Risks
                  </span>
                </Link>
                <Link
                  href={`/projects/${project.id}/team`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-center transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-500"
                >
                  <span className="block text-base font-semibold">
                    {project.team_count ?? 0}
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Team
                  </span>
                </Link>
              </div>
              <div className="mt-5">
                {editingId === project.id ? (
                  <div className="flex flex-wrap gap-3 text-sm font-semibold">
                    <button
                      type="button"
                      onClick={() => saveEdit(project.id)}
                      className="rounded-full bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                      disabled={isSubmitting}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3 text-sm font-semibold">
                    <Link
                      href={`/projects/${project.id}`}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
                    >
                      View details
                    </Link>
                    {project.current_user_role === "Lead" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(project)}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProject(project.id)}
                          className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700 transition hover:border-rose-300 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200"
                        >
                          Delete
                        </button>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
