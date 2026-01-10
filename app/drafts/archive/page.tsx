import Link from "next/link";
import PageShell from "@/app/components/PageShell";
import { getStore } from "@/lib/store";

const withParams = (href: string, params: Record<string, string | undefined>) => {
  const nextParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) nextParams.set(key, value);
  });
  const query = nextParams.toString();
  return query ? `${href}?${query}` : href;
};

export default async function DraftArchivePage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params?.token;
  const store = getStore();
  const statusFilter = params?.status ?? "all";
  const drafts = (await store.listDrafts()).filter((draft) => {
    if (draft.status === "NEEDS_REVIEW") return false;
    if (statusFilter === "all") return true;
    return draft.status === statusFilter;
  });
  const statusCounts = drafts.reduce<Record<string, number>>((acc, draft) => {
    acc[draft.status] = (acc[draft.status] ?? 0) + 1;
    return acc;
  }, {});
  const chipClass = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs ${active ? "border-slate-500 bg-slate-800 text-white" : "border-slate-800 text-slate-300"}`;
  const makeFilterLink = (value: string) =>
    withParams("/drafts/archive", { token, status: value === "all" ? undefined : value });

  return (
    <PageShell
      token={token}
      title="Draft archive"
      subtitle="Drafts that have moved past review."
      actions={
        <Link
          href={withParams("/inbox", {
            token,
            status: statusFilter === "all" ? undefined : statusFilter,
          })}
          className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 hover:border-slate-600"
        >
          Back to inbox
        </Link>
      }
    >
      <section className="flex flex-wrap gap-2">
        {[
          { label: "All", value: "all" },
          { label: "Approved", value: "APPROVED" },
          { label: "Revision", value: "REVISION_REQUESTED" },
          { label: "Rejected", value: "REJECTED" },
        ].map((item) => (
          <Link key={item.value} href={makeFilterLink(item.value)} className={chipClass(statusFilter === item.value)}>
            {item.label}
          </Link>
        ))}
      </section>
      <section className="flex flex-wrap gap-3">
        {Object.entries(statusCounts).length === 0 ? (
          <span className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-500">
            No archived drafts yet
          </span>
        ) : (
          Object.entries(statusCounts).map(([status, count]) => (
            <span
              key={status}
              className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300"
            >
              {status}: {count}
            </span>
          ))
        )}
      </section>
      <section className="grid gap-4">
        {drafts.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-500">
            No archived drafts yet.
          </div>
        ) : (
          drafts.map((draft) => (
            <Link
              key={draft.id}
              href={withParams(`/drafts/${draft.id}`, {
                token,
                status: statusFilter === "all" ? undefined : statusFilter,
              })}
              className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-200 hover:border-slate-600"
            >
              <div className="font-semibold text-slate-100">{draft.title}</div>
              <div className="text-xs text-slate-500">{draft.platform} · {draft.status}</div>
            </Link>
          ))
        )}
      </section>
    </PageShell>
  );
}
