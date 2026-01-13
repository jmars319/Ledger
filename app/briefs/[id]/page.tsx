import Link from "next/link";
import PageShell from "@/app/components/PageShell";
import PurposeCard from "@/app/components/PurposeCard";
import BriefDetailActions from "@/app/briefs/BriefDetailActions";
import { getStore } from "@/lib/store";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BriefDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ token?: string }>;
}) {
  const resolvedParams = await params;
  const queryParams = await searchParams;
  const token = queryParams?.token;
  const store = getStore();
  const [brief, projects, repos] = await Promise.all([
    store.getBrief(resolvedParams.id),
    store.listProjects(),
    store.listRepos(),
  ]);

  if (!brief) {
    notFound();
  }

  const project = projects.find((item) => item.id === brief.projectId);
  const repo = brief.sourceRepoId ? repos.find((item) => item.id === brief.sourceRepoId) : null;

  return (
    <PageShell
      token={token}
      title="Brief detail"
      subtitle="Saved context for generating posts."
      actions={
        <Link
          href={token ? `/briefs?token=${encodeURIComponent(token)}` : "/briefs"}
          className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 hover:border-slate-600"
        >
          Back to briefs
        </Link>
      }
    >
      <PurposeCard>
        Briefs capture the context and constraints used to generate posts for review.
      </PurposeCard>
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-200">
          <div className="text-xs uppercase tracking-wide text-slate-500">Summary</div>
          <div className="mt-3 whitespace-pre-wrap text-base text-slate-100">{brief.summary}</div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">
            <div className="text-xs uppercase tracking-wide text-slate-500">Brief meta</div>
            <div className="mt-2">Project: {project?.name ?? "Unknown"}</div>
            <div className="mt-1">Repo: {repo?.repo ?? "General brief"}</div>
            <div className="mt-1">Status: saved</div>
            <div className="mt-1">Created: {new Date(brief.createdAt).toLocaleString()}</div>
          </div>
          <BriefDetailActions id={brief.id} token={token} />
        </div>
      </section>
    </PageShell>
  );
}
