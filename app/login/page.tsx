import LoginForm from "./_components/LoginForm";

export default function LoginPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm md:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
          Welcome back
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950 md:text-4xl dark:text-zinc-50">
          Log in to TrakIt
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Access your project workspaces, risk register, requirements, and team
          assignments.
        </p>
        <div className="mt-7">
          <LoginForm />
        </div>
      </section>
      <aside className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900/70 dark:bg-emerald-950/30">
        <h2 className="text-lg font-bold text-emerald-950 dark:text-emerald-100">
          Demo workspace
        </h2>
        <p className="mt-3 text-sm leading-6 text-emerald-900 dark:text-emerald-200">
          Use a seeded account or create a new one. Once inside, the sidebar
          becomes your command center for active project work.
        </p>
      </aside>
    </div>
  );
}
