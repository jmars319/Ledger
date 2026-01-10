import Link from "next/link";
import PageShell from "@/app/components/PageShell";
import { getStore } from "@/lib/store";

const withToken = (href: string, token?: string) => {
  if (!token) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}token=${encodeURIComponent(token)}`;
};

export default async function InboxPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const token = (await searchParams)?.token;
  const store = getStore();
  const data = await store.listInbox();

  return (
    <PageShell token={token} title="Inbox" subtitle="Items waiting for review.">
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-sm font-semibold text-slate-200">Drafts</div>
          <div className="mt-4 grid gap-3">
            {data.drafts.length === 0 ? (
              <div className="text-sm text-slate-500">No drafts awaiting review.</div>
            ) : (
              data.drafts.map((draft: any) => (
                <Link
                  key={draft.id}
                  href={withToken(`/drafts/${draft.id}`, token)}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200 hover:border-slate-600"
                >
                  <div className="font-semibold text-slate-100">{draft.title}</div>
                  <div className="text-xs text-slate-500">{draft.platform}</div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-sm font-semibold text-slate-200">Schedules</div>
          <div className="mt-4 grid gap-3">
            {data.schedules.length === 0 ? (
              <div className="text-sm text-slate-500">No schedules awaiting review.</div>
            ) : (
              data.schedules.map((schedule: any) => (
                <Link
                  key={schedule.id}
                  href={withToken(`/schedules/${schedule.id}`, token)}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200 hover:border-slate-600"
                >
                  <div className="font-semibold text-slate-100">Schedule proposal</div>
                  <div className="text-xs text-slate-500">{schedule.items.length} items</div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
