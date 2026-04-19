"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "../../_components/PageLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";
const USER_ID_KEY = "trakItUserId";
const PROJECTS_EVENT = "trakItProjectsChanged";

export default function NewProjectPage() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [managerName, setManagerName] = useState("");
  const [teamMembers, setTeamMembers] = useState<string[]>([""]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateMember = (index: number, value: string) => {
    setTeamMembers((current) =>
      current.map((member, currentIndex) =>
        currentIndex === index ? value : member
      )
    );
  };

  const addMember = () => {
    setTeamMembers((current) => [...current, ""]);
  };

  const removeMember = (index: number) => {
    setTeamMembers((current) => {
      if (current.length === 1) {
        return [""];
      }

      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const ownerUserId = window.localStorage.getItem(USER_ID_KEY);
    if (!ownerUserId) {
      setErrorMessage("Please log in to create a project.");
      setIsSubmitting(false);
      return;
    }

    const normalizedTeamMembers = teamMembers
      .map((member) => member.trim())
      .filter(Boolean);

    try {
      const response = await fetch(`${API_BASE}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName.trim(),
          description: description.trim(),
          managerName: managerName.trim(),
          teamMembers: normalizedTeamMembers,
          ownerUserId: Number(ownerUserId),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "Unable to create project.");
      }

      const payload = await response.json();
      window.dispatchEvent(new Event(PROJECTS_EVENT));
      const projectId = payload?.project?.id;
      if (projectId) {
        router.push(`/projects/${projectId}`);
        return;
      }

      router.push("/projects");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create project."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout
      title="New project"
      description="Capture the core profile details for a project before moving into requirements, risks, and team management."
      breadcrumbs={[
        { label: "Projects", href: "/projects" },
        { label: "New Project", href: "/projects/new" },
      ]}
    >
      <div className="space-y-8">
        <section className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
              Collection scope
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Project description
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
              Ownership
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Manager name
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
              Staffing
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Team members list
            </p>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <label
                  htmlFor="project-name"
                  className="text-sm font-semibold text-slate-900 dark:text-slate-100"
                >
                  Project name
                </label>
                <input
                  id="project-name"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="project-description"
                  className="text-sm font-semibold text-slate-900 dark:text-slate-100"
                >
                  Project description
                </label>
                <textarea
                  id="project-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={6}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Summarize the project scope, purpose, and expected outcome"
                />
              </div>
            </div>

            <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <label
                  htmlFor="manager-name"
                  className="text-sm font-semibold text-slate-900 dark:text-slate-100"
                >
                  Manager name
                </label>
                <input
                  id="manager-name"
                  value={managerName}
                  onChange={(event) => setManagerName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Enter manager name"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Team members list
                  </label>
                  <button
                    type="button"
                    onClick={addMember}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
                  >
                    Add member
                  </button>
                </div>
                <div className="mt-3 space-y-3">
                  {teamMembers.map((member, index) => (
                    <div
                      key={`member-${index}`}
                      className="flex items-center gap-3"
                    >
                      <input
                        value={member}
                        onChange={(event) =>
                          updateMember(index, event.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        placeholder={`Team member ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeMember(index)}
                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-300 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {errorMessage ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/projects")}
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save project profile"}
            </button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
