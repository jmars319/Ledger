import PageShell from "@/app/components/PageShell";
import { listContentItems } from "@/lib/content/service";

export default async function ProjectNotesPage({
  searchParams,
}: {
  searchParams?: { token?: string };
}) {
  const token = searchParams?.token;
  const isDb = process.env.STORAGE_MODE === "db";

  if (!isDb) {
    return (
      <PageShell token={token} title="Project Notes" subtitle="Content Ops requires DB mode.">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
          Set `STORAGE_MODE=db` and `DATABASE_URL`.
        </div>
      </PageShell>
    );
  }

  const items = await listContentItems({ type: "PROJECT_NOTE" });
  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const slug = item.relatedSlugs[0] || "unspecified";
    acc[slug] = acc[slug] ?? [];
    acc[slug].push(item);
    return acc;
  }, {});

  return (
    <PageShell
      token={token}
      title="Project Notes"
      subtitle="Case study deltas grouped by slug."
    >
      <div className="space-y-6">
        {Object.entries(grouped).length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
            No project notes yet.
          </div>
        ) : (
          Object.entries(grouped).map(([slug, rows]) => (
            <div key={slug} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="text-sm font-semibold text-slate-200">{slug}</div>
              <div className="mt-4 grid gap-3 text-sm text-slate-300">
                {rows.map((row) => (
                  <div key={row.id} className="rounded-lg border border-slate-800 px-3 py-2">
                    <div className="text-slate-100">{row.title}</div>
                    <div className="text-slate-400">{row.summary}</div>
                    <div className="text-xs text-slate-500">{row.status}</div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </PageShell>
  );
}
