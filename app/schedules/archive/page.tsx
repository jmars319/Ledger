import Link from "next/link";
import PageShell from "@/app/components/PageShell";
import { getStore } from "@/lib/store";

const withToken = (href: string, token?: string) => {
  if (!token) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}token=${encodeURIComponent(token)}`;
};

export default async function ScheduleArchivePage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const token = (await searchParams)?.token;
  const store = getStore();
  const schedules = (await store.listSchedules()).filter(
    (schedule) => schedule.status !== "NEEDS_REVIEW"
  );

  return (
    <PageShell
      token={token}
      title="Schedule archive"
      subtitle="Schedule proposals after review."
      actions={
        <Link
          href={withToken("/inbox", token)}
          className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 hover:border-slate-600"
        >
          Back to inbox
        </Link>
      }
    >
      <section className="grid gap-4">
        {schedules.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-500">
            No archived schedules yet.
          </div>
        ) : (
          schedules.map((schedule) => (
            <Link
              key={schedule.id}
              href={withToken(`/schedules/${schedule.id}`, token)}
              className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-200 hover:border-slate-600"
            >
              <div className="font-semibold text-slate-100">Schedule proposal</div>
              <div className="text-xs text-slate-500">
                {schedule.items.length} items · {schedule.status}
              </div>
            </Link>
          ))
        )}
      </section>
    </PageShell>
  );
}
