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
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-100 bg-white px-5 py-6 md:px-7 dark:border-zinc-800 dark:bg-zinc-950">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb.href} className="flex items-center gap-2">
                  <Link href={crumb.href} className="hover:text-emerald-700 dark:hover:text-emerald-300">
                    {crumb.label}
                  </Link>
                  {index < breadcrumbs.length - 1 ? (
                    <span className="text-zinc-300 dark:text-zinc-700">/</span>
                  ) : null}
                </span>
              ))}
            </nav>
          ) : (
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
              Workspace
            </p>
          )}
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950 md:text-4xl dark:text-zinc-50">
              {title}
            </h1>
            <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-300">
              {description}
            </p>
          </div>
        </div>
        <div className="px-5 py-5 md:px-7 md:py-7">{children}</div>
      </section>
    </div>
  );
}
