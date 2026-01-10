import Link from "next/link";
import PageShell from "@/app/components/PageShell";
import { getStore } from "@/lib/store";

const withToken = (href: string, token?: string) => {
  if (!token) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}token=${encodeURIComponent(token)}`;
};

export default async function AuditArchivePage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const token = (await searchParams)?.token;
  const store = getStore();
  const logs = await store.listAuditLogs(200);

  return (
    <PageShell
      token={token}
      title="Audit archive"
      subtitle="Full audit trail for recent actions."
      actions={
        <Link
          href={withToken("/dashboard", token)}
          className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 hover:border-slate-600"
        >
          Back to dashboard
        </Link>
      }
    >
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="text-sm font-semibold text-slate-200">Audit log</div>
        <div className="mt-4 grid gap-3">
          {logs.length === 0 ? (
            <div className="text-sm text-slate-500">No audit activity yet.</div>
          ) : (
            logs.map((entry) => (
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
