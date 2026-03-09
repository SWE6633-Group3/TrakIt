import SignupForm from "./_components/SignupForm";

export default function SignupPage() {
  return (
    <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="rounded-3xl border border-slate-200 bg-slate-50 px-8 py-8 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Build your project hub
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Create an account to organize project details, ownership, and delivery
          decisions from day one.
        </p>
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Example: Product onboarding rebuild
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Centralizes goals, ownership, and milestones in a single workspace.
          </p>
        </div>
      </aside>
      <section className="rounded-3xl border border-slate-200 bg-white px-8 py-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
          New account
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl dark:text-slate-100">
          Sign up for TrakIt
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          This is a mock sign-up screen. Submit the form to preview how a user
          would enter the workspace.
        </p>
        <div className="mt-6">
          <SignupForm />
        </div>
      </section>
    </div>
  );
}
