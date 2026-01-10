import PageShell from "@/app/components/PageShell";
import { getStore } from "@/lib/store";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const token = (await searchParams)?.token;
  const store = getStore();
  const data = await store.getDashboard();

  return (
    <PageShell
      token={token}
      title="Dashboard"
      subtitle="Pipeline snapshot with recent audit activity."
    >
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Drafts ready", value: data.counts.draftsReady },
          { label: "Schedules ready", value: data.counts.schedulesReady },
          { label: "Tasks due", value: data.counts.tasksDue },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5"
          >
            <div className="text-xs uppercase tracking-widest text-slate-500">{item.label}</div>
            <div className="mt-3 text-3xl font-semibold text-white">{item.value}</div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="text-sm font-semibold text-slate-200">Latest audit logs</div>
        <div className="mt-4 grid gap-3">
          {data.recentAudit.length === 0 ? (
            <div className="text-sm text-slate-500">No audit activity yet.</div>
          ) : (
            data.recentAudit.map((entry: any) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300"
              >
                <div>
                  <span className="font-semibold text-slate-100">{entry.action}</span>
                  <span className="ml-2 text-slate-500">
                    {entry.entityType} - {entry.entityId}
                  </span>
                </div>
                <div className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </section>
    </PageShell>
  );
}
