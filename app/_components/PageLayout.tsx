import Link from "next/link";
import type { ReactNode } from "react";

type Breadcrumb = {
  label: string;
  href: string;
};

type PageLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
  breadcrumbs?: Breadcrumb[];
};

export default function PageLayout({
  title,
  description,
  children,
  breadcrumbs,
}: PageLayoutProps) {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
                {breadcrumbs.map((crumb, index) => (
                  <span key={crumb.href} className="flex items-center gap-2">
                    <Link href={crumb.href} className="hover:text-slate-600">
                      {crumb.label}
                    </Link>
                    {index < breadcrumbs.length - 1 ? (
                      <span className="text-slate-300">/</span>
                    ) : null}
                  </span>
                ))}
              </nav>
            ) : (
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                Workspace
              </p>
            )}
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl dark:text-slate-100">
              {title}
            </h1>
            <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300">
              {description}
            </p>
          </div>
        </div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {children}
      </section>
    </div>
  );
}
