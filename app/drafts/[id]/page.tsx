import Link from "next/link";
import PageShell from "@/app/components/PageShell";
import ReviewActions from "@/app/components/ReviewActions";
import { getStore } from "@/lib/store";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DraftPage({
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
  const draft = await store.getDraft(resolvedParams.id);
  if (!draft) {
    notFound();
  }
  const archiveLink = (() => {
    const nextParams = new URLSearchParams();
    if (token) nextParams.set("token", token);
    if (queryParams?.status) nextParams.set("status", queryParams.status);
    return nextParams.toString() ? `/drafts/archive?${nextParams.toString()}` : "/drafts/archive";
  })();
  const backLink = (() => {
    const nextParams = new URLSearchParams();
    if (token) nextParams.set("token", token);
    if (queryParams?.type) nextParams.set("type", queryParams.type);
    return nextParams.toString() ? `/inbox?${nextParams.toString()}` : "/inbox";
  })();

  return (
    <PageShell
      token={token}
      title={draft.title}
      subtitle={`Status: ${draft.status}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href={backLink}
            className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 hover:border-slate-600"
          >
            Back to inbox
          </Link>
          <Link
            href={archiveLink}
            className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 hover:border-slate-600"
          >
            Draft archive
          </Link>
        </div>
      }
    >
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-sm font-semibold text-slate-200">Draft JSON</div>
          <pre className="mt-4 overflow-auto rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-xs text-slate-200">
            {JSON.stringify(draft.draftJson, null, 2)}
          </pre>
          <div className="mt-4 text-sm font-semibold text-slate-200">Claims</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-400">
            {draft.claims.map((claim: string) => (
              <li key={claim}>{claim}</li>
            ))}
          </ul>
        </div>
        <ReviewActions id={draft.id} kind="drafts" token={token} />
      </section>
    </PageShell>
  );
}
