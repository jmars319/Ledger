import Link from "next/link";
import PageShell from "@/app/components/PageShell";
import { getStore } from "@/lib/store";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params?.token;
  const store = getStore();
  const data = await store.getDashboard();
  const actorFilter = params?.actor ?? "all";
  const archiveLink = (() => {
    const nextParams = new URLSearchParams();
    if (token) nextParams.set("token", token);
    if (actorFilter !== "all") nextParams.set("actor", actorFilter);
    return nextParams.toString() ? `/dashboard/audit?${nextParams.toString()}` : "/dashboard/audit";
  })();
  const filteredAudit = data.recentAudit.filter((entry) => {
    if (actorFilter === "system") return entry.actor?.startsWith("system:");
    if (actorFilter === "admin") return entry.actor === "admin";
    return true;
  });
  const chipClass = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs ${active ? "border-slate-500 bg-slate-800 text-white" : "border-slate-800 text-slate-300"}`;
  const makeFilterLink = (value: string) => {
    const nextParams = new URLSearchParams();
    if (token) nextParams.set("token", token);
    if (value !== "all") nextParams.set("actor", value);
    const query = nextParams.toString();
    return query ? `/dashboard?${query}` : "/dashboard";
  };

  return (
    <PageShell
      token={token}
      title="Dashboard"
      subtitle="Pipeline snapshot with recent audit activity."
      actions={
        <Link
          href={archiveLink}
          className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 hover:border-slate-600"
        >
          View audit archive
        </Link>
      }
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
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: "All", value: "all" },
            { label: "System", value: "system" },
            { label: "Admin", value: "admin" },
          ].map((item) => (
            <Link key={item.value} href={makeFilterLink(item.value)} className={chipClass(actorFilter === item.value)}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="mt-4 grid gap-3">
          {filteredAudit.length === 0 ? (
            <div className="text-sm text-slate-500">No audit activity yet.</div>
          ) : (
            filteredAudit.map((entry: any) => (
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
