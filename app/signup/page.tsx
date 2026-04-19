import SignupForm from "./_components/SignupForm";

export default function SignupPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1fr]">
      <aside className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900/70 dark:bg-emerald-950/30">
        <h2 className="text-lg font-bold text-emerald-950 dark:text-emerald-100">
          Build your project hub
        </h2>
        <p className="mt-3 text-sm leading-6 text-emerald-900 dark:text-emerald-200">
          Create a workspace where requirements, risks, and team ownership stay
          connected from kickoff to closeout.
        </p>
        <div className="mt-6 rounded-lg border border-emerald-200 bg-white/70 p-5 dark:border-emerald-900 dark:bg-zinc-950/40">
          <p className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
            Example: Product onboarding rebuild
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Goals, requirements, risks, and members tracked in one place.
          </p>
        </div>
      </aside>
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm md:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
          New account
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950 md:text-4xl dark:text-zinc-50">
          Sign up for TrakIt
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Create a demo account and enter the workspace immediately.
        </p>
        <div className="mt-7">
          <SignupForm />
        </div>
      </section>
    </div>
  );
}
