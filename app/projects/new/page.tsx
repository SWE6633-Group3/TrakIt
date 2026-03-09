import PageLayout from "../../_components/PageLayout";

export default function NewProjectPage() {
  return (
    <PageLayout
      title="Create a project"
      description="This is a mock screen for starting a new project workspace."
      breadcrumbs={[
        { label: "Projects", href: "/projects" },
        { label: "Create", href: "/projects/new" },
      ]}
    >
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
        Project creation form goes here.
      </div>
    </PageLayout>
  );
}
