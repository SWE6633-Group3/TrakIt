/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import PageLayout from "../../_components/PageLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

type Project = {
  id: number;
  name: string;
  description: string | null;
  manager_name?: string | null;
  team_members?: string[];
};

type Requirement = {
  id: number;
  title: string;
  type: string;
  status: string;
};

type Risk = {
  id: number;
  title: string;
  impact: string;
  status: string;
};

type ProjectUser = {
  id: number;
  name: string;
  role: string;
  email: string;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join("")
    .toUpperCase();

const statusClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes("approved") || normalized.includes("closed")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200";
  }
  if (normalized.includes("review") || normalized.includes("monitoring")) {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200";
  }
  return "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200";
};

export default function ProjectDetailsPage() {
  const params = useParams<{ projectId?: string }>();
  const projectId = useMemo(() => {
    const raw = params?.projectId;
    if (!raw) return NaN;
    return Number.parseInt(raw, 10);
  }, [params]);
  const [project, setProject] = useState<Project | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [team, setTeam] = useState<ProjectUser[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const approvedRequirements = requirements.filter((item) =>
    item.status.toLowerCase().includes("approved")
  ).length;
  const openRisks = risks.filter(
    (item) => !item.status.toLowerCase().includes("closed")
  ).length;

  useEffect(() => {
    if (!Number.isFinite(projectId) || projectId <= 0) {
      setErrorMessage(`Invalid project id: ${params?.projectId}`);
      setIsLoading(false);
      return;
    }
    Promise.all([
      fetch(`${API_BASE}/api/projects/${projectId}`),
      fetch(`${API_BASE}/api/projects/${projectId}/requirements`),
      fetch(`${API_BASE}/api/projects/${projectId}/risks`),
      fetch(`${API_BASE}/api/projects/${projectId}/users`),
    ])
      .then(async ([projectRes, reqRes, riskRes, teamRes]) => {
        const responses = [projectRes, reqRes, riskRes, teamRes];
        for (const res of responses) {
          if (!res.ok) {
            const payload = await res.json().catch(() => ({}));
            const message = payload?.error ?? "Unable to load project data.";
            throw new Error(message);
          }
        }
        const projectPayload = await projectRes.json();
        const reqPayload = await reqRes.json();
        const riskPayload = await riskRes.json();
        const teamPayload = await teamRes.json();
        setProject(projectPayload?.project ?? null);
        setRequirements(reqPayload?.requirements ?? []);
        setRisks(riskPayload?.risks ?? []);
        const users = teamPayload?.users ?? [];
        setTeam(users);

        const currentUserId = Number(
          window.localStorage.getItem("trakItUserId") ?? 0
        );
        if (currentUserId) {
          setHasAccess(users.some((user: ProjectUser) => user.id === currentUserId));
        } else {
          setHasAccess(false);
        }
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [projectId, params]);

  return (
    <PageLayout
      title={project?.name ?? "Project workspace"}
      description="Overview, requirements, risks, and team activity in one project command view."
      breadcrumbs={[
        { label: "Projects", href: "/projects" },
        {
          label: project?.name ?? `Project ${params?.projectId ?? ""}`,
          href: `/projects/${params?.projectId ?? ""}`,
        },
      ]}
    >
      <div className="space-y-6">
        {errorMessage ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
            {errorMessage}
          </div>
        ) : null}
        {hasAccess === false ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
            You are not on this project team. Join the team to view the project
            workspace.
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
              />
            ))}
          </div>
        ) : null}

        {hasAccess === false || isLoading ? null : (
          <>
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
                    label === "Overview"
                      ? "bg-emerald-700 text-white"
                      : "border border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <section className="grid gap-4 md:grid-cols-4">
              {[
                ["Requirements", requirements.length],
                ["Approved", approvedRequirements],
                ["Open risks", openRisks],
                ["Contributors", team.length],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">
                    {value}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                    {label}
                  </p>
                </div>
              ))}
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                      Project brief
                    </p>
                    <h2 className="mt-3 text-xl font-bold text-zinc-950 dark:text-zinc-50">
                      {project?.name ?? "Project details"}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                      {project?.description || "No description provided yet."}
                    </p>
                  </div>
                  <span className="rounded-md bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                    Active
                  </span>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                      Manager
                    </p>
                    <p className="mt-2 text-sm font-bold text-zinc-950 dark:text-zinc-50">
                      {project?.manager_name || "Not set"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                      Listed team
                    </p>
                    <p className="mt-2 text-sm font-bold text-zinc-950 dark:text-zinc-50">
                      {project?.team_members?.length
                        ? project.team_members.join(", ")
                        : "Not set"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Team
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {team.slice(0, 8).map((member) => (
                    <div
                      key={member.id}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-950"
                      title={member.name}
                    >
                      {getInitials(member.name)}
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
                  {team.length} contributors, including{" "}
                  {team.filter((member) => member.role === "Lead").length} lead.
                </p>
                <Link
                  href={`/projects/${projectId}/team`}
                  className="mt-4 inline-flex rounded-lg border border-zinc-200 px-3 py-2 text-sm font-bold text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-800 dark:text-zinc-200"
                >
                  Manage team
                </Link>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                      Requirements
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Latest scope records.
                    </p>
                  </div>
                  <Link
                    href={`/projects/${projectId}/requirements`}
                    className="rounded-lg bg-zinc-950 px-3 py-2 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-950"
                  >
                    Open
                  </Link>
                </div>
                <div className="mt-4 divide-y divide-zinc-100 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                  {requirements.length === 0 ? (
                    <div className="bg-zinc-50 px-4 py-6 text-sm text-zinc-500 dark:bg-zinc-900">
                      No requirements yet.
                    </div>
                  ) : null}
                  {requirements.slice(0, 5).map((item) => (
                    <div key={item.id} className="bg-white px-4 py-3 dark:bg-zinc-950">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                          {item.title}
                        </p>
                        <span className={`rounded-md border px-2 py-1 text-xs font-bold ${statusClass(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">{item.type}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                      Risks
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Active issues to monitor.
                    </p>
                  </div>
                  <Link
                    href={`/projects/${projectId}/risks`}
                    className="rounded-lg bg-zinc-950 px-3 py-2 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-950"
                  >
                    Open
                  </Link>
                </div>
                <div className="mt-4 divide-y divide-zinc-100 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                  {risks.length === 0 ? (
                    <div className="bg-zinc-50 px-4 py-6 text-sm text-zinc-500 dark:bg-zinc-900">
                      No risks yet.
                    </div>
                  ) : null}
                  {risks.slice(0, 5).map((item) => (
                    <div key={item.id} className="bg-white px-4 py-3 dark:bg-zinc-950">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                          {item.title}
                        </p>
                        <span className={`rounded-md border px-2 py-1 text-xs font-bold ${statusClass(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {item.impact} impact
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </PageLayout>
  );
}
