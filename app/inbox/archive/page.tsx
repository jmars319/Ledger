import Link from "next/link";
import PageShell from "@/app/components/PageShell";
import { getStore } from "@/lib/store";

const withToken = (href: string, token?: string) => {
  if (!token) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}token=${encodeURIComponent(token)}`;
};

export default async function InboxArchivePage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const token = (await searchParams)?.token;
  const store = getStore();
  const drafts = (await store.listDrafts()).filter((draft) => draft.status !== "NEEDS_REVIEW");
  const schedules = (await store.listSchedules()).filter(
    (schedule) => schedule.status !== "NEEDS_REVIEW"
  );

  return (
    <PageShell
      token={token}
      title="Inbox archive"
      subtitle="Reviewed drafts and schedules."
      actions={
        <Link
          href={withToken("/inbox", token)}
          className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 hover:border-slate-600"
        >
          Back to inbox
        </Link>
      }
    >
      <section className="flex flex-wrap gap-3">
        <span className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300">
          Drafts: {drafts.length}
        </span>
        <span className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300">
          Schedules: {schedules.length}
        </span>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-sm font-semibold text-slate-200">Drafts</div>
          <div className="mt-4 grid gap-3">
            {drafts.length === 0 ? (
              <div className="text-sm text-slate-500">No reviewed drafts yet.</div>
            ) : (
              drafts.map((draft) => (
                <Link
                  key={draft.id}
                  href={withToken(`/drafts/${draft.id}`, token)}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200 hover:border-slate-600"
                >
                  <div className="font-semibold text-slate-100">{draft.title}</div>
                  <div className="text-xs text-slate-500">{draft.platform} · {draft.status}</div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-sm font-semibold text-slate-200">Schedules</div>
          <div className="mt-4 grid gap-3">
            {schedules.length === 0 ? (
              <div className="text-sm text-slate-500">No reviewed schedules yet.</div>
            ) : (
              schedules.map((schedule) => (
                <Link
                  key={schedule.id}
                  href={withToken(`/schedules/${schedule.id}`, token)}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200 hover:border-slate-600"
                >
                  <div className="font-semibold text-slate-100">Schedule proposal</div>
                  <div className="text-xs text-slate-500">{schedule.items.length} items · {schedule.status}</div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
