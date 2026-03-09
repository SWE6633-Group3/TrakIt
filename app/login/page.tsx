import LoginForm from "./_components/LoginForm";

export default function LoginPage() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
          Welcome back
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl dark:text-slate-100">
          Log in to TrakIt
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          This is a mock authentication screen. Use any credentials to continue
          and preview the project workspace.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
      <aside className="rounded-3xl border border-slate-200 bg-slate-50 px-8 py-8 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Project tracking starts here
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          TrakIt keeps requirements, risk registers, and team ownership aligned
          in one consistent workspace.
        </p>
        <ul className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <li>Review project goals in seconds.</li>
          <li>Sync requirements with risks.</li>
          <li>Keep every stakeholder in the loop.</li>
        </ul>
      </aside>
    </div>
  );
}
