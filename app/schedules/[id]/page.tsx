import PageShell from "@/app/components/PageShell";
import ReviewActions from "@/app/components/ReviewActions";
import { getStore } from "@/lib/store";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ token?: string }>;
}) {
  const resolvedParams = await params;
  const token = (await searchParams)?.token;
  const store = getStore();
  const schedule = await store.getSchedule(resolvedParams.id);
  if (!schedule) {
    notFound();
  }

  return (
    <PageShell token={token} title="Schedule proposal" subtitle={`Status: ${schedule.status}`}>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-sm font-semibold text-slate-200">Proposed items</div>
          <div className="mt-4 grid gap-3">
            {schedule.items.map((item: any) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200"
              >
                <div className="font-semibold text-slate-100">{item.channel}</div>
                <div className="text-xs text-slate-500">Draft: {item.draftId}</div>
                <div className="text-xs text-slate-500">
                  {new Date(item.scheduledFor).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
        <ReviewActions id={schedule.id} kind="schedules" token={token} />
      </section>
    </PageShell>
  );
}
