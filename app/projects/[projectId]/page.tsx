/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import PageLayout from "../../_components/PageLayout";
import { getRiskColor, getRiskIcon } from "./riskStyle";

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

  useEffect(() => {
    if (!Number.isFinite(projectId) || projectId <= 0) {
      setErrorMessage(`Invalid project id: ${params?.projectId}`);
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
      });
  }, [projectId, params]);

  return (
    <PageLayout
      title="Project workspace"
      description="Overview, requirements, risks, and team details in one place."
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
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            {errorMessage}
          </div>
        ) : null}
        {hasAccess === false ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            You are not on this project team. Join the team to view the project
            workspace.
          </div>
        ) : null}
        <div className="flex justify-end">
          <Link
            href="/projects"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
          >
            Back to projects
          </Link>
        </div>
        {hasAccess === false ? null : (
          <>
            <section className="grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
                      Project overview
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                      {project?.name ?? "Project details"}
                    </h2>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                      {project?.description || "No description provided yet."}
                    </p>
                    <div className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                          Manager name
                        </p>
                        <p className="mt-2 font-medium text-slate-800 dark:text-slate-100">
                          {project?.manager_name || "Not set"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                          Team members list
                        </p>
                        <p className="mt-2 font-medium text-slate-800 dark:text-slate-100">
                          {project?.team_members?.length
                            ? project.team_members.join(", ")
                            : "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                      Active
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
                  Team spotlight
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {team.slice(0, 5).map((member) => (
                    <div
                      key={member.id}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                    >
                      {member.name
                        .split(" ")
                        .slice(0, 2)
                        .map((chunk) => chunk[0])
                        .join("")}
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                  {team.length} total contributors ·{" "}
                  {team.filter((member) => member.role === "Lead").length} lead
                </p>
                <Link
                  href={`/projects/${projectId}/team`}
                  className="mt-4 inline-flex text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Manage team →
                </Link>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
                      Requirements
                    </p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {requirements.length} total
                    </p>
                  </div>
                  <Link
                    href={`/projects/${projectId}/requirements`}
                    className="text-xs font-semibold text-slate-500 dark:text-slate-300"
                  >
                    Open →
                  </Link>
                </div>
                <div className="mt-5 space-y-3">
                  {requirements.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                      No requirements yet.
                    </div>
                  ) : null}
                  {requirements.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold">{item.title}</span>
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                          {item.type}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Status: {item.status}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
                      Risks
                    </p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {risks.length} total
                    </p>
                  </div>
                  <Link
                    href={`/projects/${projectId}/risks`}
                    className="text-xs font-semibold text-slate-500 dark:text-slate-300"
                  >
                    Open →
                  </Link>
                </div>
                <div className="mt-5 space-y-3">
                  {risks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                      No risks yet.
                    </div>
                  ) : null}
                  {risks.map((item) => {
                    const StatusIcon = getRiskIcon(item.status);
                    const ImpactIcon = getRiskIcon(item.impact);

                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold">{item.title}</span>
                          <span className={`inline-flex items-center gap-1  rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] dark:border-slate-700 dark:bg-slate-900 ${getRiskColor(item.impact)}`}>
                            {item.impact} impact
                            <ImpactIcon size={16} strokeWidth={3} />
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          
                          <span  className={`inline-flex items-center gap-1 ${getRiskColor(item.status)}`}>
                            <StatusIcon size={16} />
                            {item.status}                            
                          </span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </PageLayout>
  );
}
