import Link from "next/link";
import PageShell from "@/app/components/PageShell";
import PurposeCard from "@/app/components/PurposeCard";
import ReviewActions from "@/app/components/ReviewActions";
import { getStore } from "@/lib/store";
import { notFound } from "next/navigation";
import type { ScheduleItem } from "@/lib/store/types";

export const dynamic = "force-dynamic";

export default async function SchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ token?: string; status?: string; type?: string }>;
}) {
  const resolvedParams = await params;
  const queryParams = await searchParams;
  const token = queryParams?.token;
  const store = getStore();
  const schedule = await store.getSchedule(resolvedParams.id);
  if (!schedule) {
    notFound();
  }
  const archiveLink = (() => {
    const nextParams = new URLSearchParams();
    if (token) nextParams.set("token", token);
    if (queryParams?.status) nextParams.set("status", queryParams.status);
    return nextParams.toString() ? `/schedules/archive?${nextParams.toString()}` : "/schedules/archive";
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
      title="Schedule proposal"
      subtitle={`Status: ${schedule.status}`}
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
            Schedule archive
          </Link>
        </div>
      }
    >
      <PurposeCard>
        Review a proposed schedule, then approve or request revisions before publishing.
      </PurposeCard>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-sm font-semibold text-slate-200">Proposed items</div>
          <div className="mt-4 grid gap-3">
            {schedule.items.map((item: ScheduleItem) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200"
              >
                <div className="font-semibold text-slate-100">{item.channel}</div>
                <div className="text-xs text-slate-500">Post: {item.postId}</div>
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
