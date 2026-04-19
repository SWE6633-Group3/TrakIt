/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PageLayout from "../_components/PageLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";
const USER_ID_KEY = "trakItUserId";
const USER_EMAIL_KEY = "trakItUserEmail";

type Project = {
  id: number;
  name: string;
  description: string | null;
  requirements_count?: number;
  risks_count?: number;
  team_count?: number;
  current_user_role?: "Lead" | "Member";
};

type ChartItem = {
  label: string;
  value: number;
  color: string;
};

const formatAverage = (value: number) =>
  Number.isFinite(value) ? value.toFixed(1) : "0.0";

const getProjectHealth = (project: Project) => {
  const requirements = project.requirements_count ?? 0;
  const risks = project.risks_count ?? 0;
  const team = project.team_count ?? 0;

  if (requirements === 0 || team <= 1 || risks >= 3) {
    return {
      label: "At risk",
      className:
        "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-900",
    };
  }

  if (risks > 0 || requirements < 5 || team <= 2) {
    return {
      label: "Watch",
      className:
        "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-900",
    };
  }

  return {
    label: "Healthy",
    className:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-900",
  };
};

const getNextAction = (project: Project) => {
  if ((project.requirements_count ?? 0) === 0) {
    return "Add requirements";
  }

  if ((project.team_count ?? 0) <= 1) {
    return "Add teammates";
  }

  if ((project.risks_count ?? 0) >= 3) {
    return "Review risk load";
  }

  if ((project.risks_count ?? 0) > 0) {
    return "Track open risks";
  }

  return "Continue tracking";
};

const getAttentionScore = (project: Project) => {
  const requirements = project.requirements_count ?? 0;
  const risks = project.risks_count ?? 0;
  const team = project.team_count ?? 0;

  return (
    (requirements === 0 ? 5 : requirements < 5 ? 2 : 0) +
    (team <= 1 ? 4 : team <= 2 ? 2 : 0) +
    risks * 2
  );
};

function StatTile({
  label,
  value,
  color = "text-zinc-950 dark:text-zinc-50",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className={`animate-dashboard-count text-3xl font-bold ${color}`}>{value}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </p>
    </div>
  );
}

function HorizontalBars({ data }: { data: ChartItem[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">
              {item.label}
            </span>
            <span className="font-bold text-zinc-950 dark:text-zinc-50">
              {item.value}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full origin-left rounded-full ${item.color} animate-dashboard-bar`}
              style={{
                width: `${Math.max((item.value / max) * 100, item.value ? 10 : 0)}%`,
                animationDelay: `${index * 90}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RingChart({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  const degrees = Math.max(0, Math.min(value, 100)) * 3.6;

  return (
    <div className="flex items-center gap-4">
      <div
        className="grid h-24 w-24 place-items-center rounded-full animate-dashboard-ring"
        style={{
          background: `conic-gradient(${color} ${degrees}deg, rgb(228 228 231) 0deg)`,
        }}
      >
        <div className="grid h-16 w-16 place-items-center rounded-full bg-white dark:bg-zinc-950">
          <span className="text-xl font-bold text-zinc-950 dark:text-zinc-50">
            {value}%
          </span>
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
          {label}
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Health index
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const totals = useMemo(() => {
    return projects.reduce(
      (summary, project) => ({
        requirements: summary.requirements + (project.requirements_count ?? 0),
        risks: summary.risks + (project.risks_count ?? 0),
        team: summary.team + (project.team_count ?? 0),
        leadProjects:
          summary.leadProjects + (project.current_user_role === "Lead" ? 1 : 0),
        memberProjects:
          summary.memberProjects +
          (project.current_user_role === "Member" ? 1 : 0),
        noRequirements:
          summary.noRequirements + ((project.requirements_count ?? 0) === 0 ? 1 : 0),
        thinTeams:
          summary.thinTeams + ((project.team_count ?? 0) <= 1 ? 1 : 0),
        atRisk: summary.atRisk + ((project.risks_count ?? 0) > 0 ? 1 : 0),
      }),
      {
        requirements: 0,
        risks: 0,
        team: 0,
        leadProjects: 0,
        memberProjects: 0,
        noRequirements: 0,
        thinTeams: 0,
        atRisk: 0,
      }
    );
  }, [projects]);

  const portfolioHealth = useMemo(() => {
    if (projects.length === 0) {
      return 0;
    }

    const issues = totals.noRequirements + totals.thinTeams + totals.atRisk;
    return Math.max(0, Math.round(100 - (issues / (projects.length * 3)) * 100));
  }, [projects.length, totals]);

  const averageRequirements = projects.length
    ? totals.requirements / projects.length
    : 0;
  const averageTeam = projects.length ? totals.team / projects.length : 0;
  const averageRisks = projects.length ? totals.risks / projects.length : 0;
  const openFlags = totals.noRequirements + totals.thinTeams + totals.atRisk;

  const requirementData = useMemo<ChartItem[]>(
    () => [
      {
        label: "No reqs",
        value: totals.noRequirements,
        color: "bg-zinc-500",
      },
      {
        label: "1-4 reqs",
        value: projects.filter((project) => {
          const count = project.requirements_count ?? 0;
          return count > 0 && count < 5;
        }).length,
        color: "bg-cyan-600",
      },
      {
        label: "5+ reqs",
        value: projects.filter((project) => (project.requirements_count ?? 0) >= 5).length,
        color: "bg-emerald-600",
      },
    ],
    [projects, totals.noRequirements]
  );

  const riskData = useMemo<ChartItem[]>(
    () => [
      {
        label: "No risks",
        value: projects.filter((project) => (project.risks_count ?? 0) === 0).length,
        color: "bg-emerald-600",
      },
      {
        label: "1-2 risks",
        value: projects.filter((project) => {
          const count = project.risks_count ?? 0;
          return count > 0 && count < 3;
        }).length,
        color: "bg-amber-500",
      },
      {
        label: "3+ risks",
        value: projects.filter((project) => (project.risks_count ?? 0) >= 3).length,
        color: "bg-rose-600",
      },
    ],
    [projects]
  );

  const roleData = useMemo<ChartItem[]>(
    () => [
      {
        label: "Lead",
        value: totals.leadProjects,
        color: "bg-emerald-600",
      },
      {
        label: "Member",
        value: totals.memberProjects,
        color: "bg-cyan-600",
      },
    ],
    [totals.leadProjects, totals.memberProjects]
  );

  const portfolioAttention = useMemo(() => {
    return [...projects]
      .sort((a, b) => getAttentionScore(b) - getAttentionScore(a))
      .slice(0, 8);
  }, [projects]);

  const loadProjects = (ownerUserId: string) => {
    fetch(`${API_BASE}/api/projects-summary?ownerUserId=${ownerUserId}`)
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error ?? "Unable to load dashboard.");
        }
        return response.json();
      })
      .then((payload) => {
        setProjects(payload?.projects ?? []);
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
      })
      .finally(() => {
        setIsLoading(false);
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
      setErrorMessage("Log in to view your dashboard.");
      setIsLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/users?email=${encodeURIComponent(email)}`)
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error ?? "Unable to load user.");
        }
        return response.json();
      })
      .then((payload) => {
        const userId = String(payload?.user?.id ?? "");
        if (userId) {
          window.localStorage.setItem(USER_ID_KEY, userId);
          loadProjects(userId);
        }
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
        setIsLoading(false);
      });
  }, []);

  return (
    <PageLayout
      title="Dashboard"
      description="Portfolio overview"
    >
      <div className="space-y-5">
        {errorMessage ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !errorMessage && projects.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/70 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950/20">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-sm font-bold text-white">
              P
            </div>
            <h2 className="mt-4 text-xl font-bold text-zinc-950 dark:text-zinc-50">
              No projects yet
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-300">
              Create your first project to start tracking requirements, risks,
              and team members from one dashboard.
            </p>
            <div className="mt-5 flex justify-center">
              <Link
                href="/projects/new"
                className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
              >
                Create first project
              </Link>
            </div>
          </section>
        ) : null}

        {!isLoading ? (
        <section className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
          <StatTile label="Projects" value={projects.length} />
          <StatTile label="Requirements" value={totals.requirements} />
          <StatTile label="Risks" value={totals.risks} color="text-amber-700 dark:text-amber-300" />
          <StatTile label="Team seats" value={totals.team} />
          <StatTile label="Health" value={`${portfolioHealth}%`} color={portfolioHealth >= 70 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"} />
          <StatTile label="Open flags" value={openFlags} color="text-rose-700 dark:text-rose-300" />
          <StatTile label="Avg reqs" value={formatAverage(averageRequirements)} color="text-cyan-700 dark:text-cyan-300" />
          <StatTile label="Avg team" value={formatAverage(averageTeam)} color="text-emerald-700 dark:text-emerald-300" />
        </section>
        ) : null}

        {!isLoading ? (
        <section className="grid gap-5 xl:grid-cols-[0.8fr_1fr_1fr]">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <RingChart
              value={portfolioHealth}
              label="Portfolio health"
              color={portfolioHealth >= 70 ? "rgb(5 150 105)" : portfolioHealth >= 40 ? "rgb(245 158 11)" : "rgb(225 29 72)"}
            />
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-900">
                <p className="text-lg font-bold text-zinc-950 dark:text-zinc-50">{totals.noRequirements}</p>
                <p className="text-[11px] font-semibold text-zinc-500">No reqs</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-900">
                <p className="text-lg font-bold text-zinc-950 dark:text-zinc-50">{totals.thinTeams}</p>
                <p className="text-[11px] font-semibold text-zinc-500">Thin teams</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-900">
                <p className="text-lg font-bold text-zinc-950 dark:text-zinc-50">{totals.atRisk}</p>
                <p className="text-[11px] font-semibold text-zinc-500">At risk</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">Requirements</h2>
              <span className="text-xs font-bold text-zinc-500">{totals.requirements} total</span>
            </div>
            <HorizontalBars data={requirementData} />
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">Risk load</h2>
              <span className="text-xs font-bold text-zinc-500">{formatAverage(averageRisks)} avg</span>
            </div>
            <HorizontalBars data={riskData} />
          </div>
        </section>
        ) : null}

        {!isLoading ? (
        <section className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">Role split</h2>
              <span className="text-xs font-bold text-zinc-500">{projects.length} projects</span>
            </div>
            <HorizontalBars data={roleData} />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link href="/projects/new" className="rounded-lg bg-emerald-700 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-emerald-800">
                New project
              </Link>
              <Link href="/projects" className="rounded-lg border border-zinc-200 px-4 py-3 text-center text-sm font-bold text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-800 dark:text-zinc-200">
                Portfolio
              </Link>
            </div>
          </div>

          <section className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div>
                <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                  Portfolio attention
                </h2>
                <p className="mt-1 text-xs font-semibold text-zinc-500">
                  Health, risk, staffing, and next action in one view.
                </p>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  At risk = missing requirements, a thin team, or 3+ risks.
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
                {portfolioAttention.length} shown
              </span>
            </div>

            <div className="min-w-[820px]">
              <div className="grid grid-cols-[1.5fr_0.75fr_0.45fr_0.45fr_0.45fr_1fr_0.6fr] gap-3 border-b border-zinc-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500 dark:border-zinc-800">
                <span>Project</span>
                <span>Health</span>
                <span>Reqs</span>
                <span>Risks</span>
                <span>Team</span>
                <span>Next action</span>
                <span>Role</span>
              </div>

              {portfolioAttention.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">
                  No projects yet.
                </div>
              ) : null}

              {portfolioAttention.map((project) => {
                const health = getProjectHealth(project);
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="grid grid-cols-[1.5fr_0.75fr_0.45fr_0.45fr_0.45fr_1fr_0.6fr] items-center gap-3 border-b border-zinc-100 px-4 py-3 last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/60"
                  >
                    <span className="truncate text-sm font-bold text-zinc-950 dark:text-zinc-50">
                      {project.name}
                    </span>
                    <span
                      className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${health.className}`}
                    >
                      {health.label}
                    </span>
                    <span
                      className={
                        (project.requirements_count ?? 0) === 0
                          ? "text-sm font-bold text-rose-700 dark:text-rose-300"
                          : "text-sm font-semibold text-zinc-600 dark:text-zinc-300"
                      }
                    >
                      {project.requirements_count ?? 0}
                    </span>
                    <span
                      className={
                        (project.risks_count ?? 0) > 0
                          ? "text-sm font-bold text-amber-700 dark:text-amber-300"
                          : "text-sm font-semibold text-zinc-600 dark:text-zinc-300"
                      }
                    >
                      {project.risks_count ?? 0}
                    </span>
                    <span
                      className={
                        (project.team_count ?? 0) <= 1
                          ? "text-sm font-bold text-rose-700 dark:text-rose-300"
                          : "text-sm font-semibold text-zinc-600 dark:text-zinc-300"
                      }
                    >
                      {project.team_count ?? 0}
                    </span>
                    <span className="truncate text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      {getNextAction(project)}
                    </span>
                    <span className="w-fit rounded-md bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                      {project.current_user_role ?? "Member"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </section>
        ) : null}
      </div>
    </PageLayout>
  );
}
