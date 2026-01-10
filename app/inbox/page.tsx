import Link from "next/link";
import PageShell from "@/app/components/PageShell";
import PurposeCard from "@/app/components/PurposeCard";
import { getStore } from "@/lib/store";

const withParams = (href: string, params: Record<string, string | undefined>) => {
  const nextParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) nextParams.set(key, value);
  });
  const query = nextParams.toString();
  return query ? `${href}?${query}` : href;
};

export default async function InboxPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params?.token;
  const store = getStore();
  const data = await store.listInbox();
  const typeFilter = params?.type ?? "all";
  const drafts = typeFilter === "schedules" ? [] : data.drafts;
  const schedules = typeFilter === "drafts" ? [] : data.schedules;
  const archiveLink = withParams("/inbox/archive", {
    token,
    type: typeFilter === "all" ? undefined : typeFilter,
  });
  const newDraftLink = withParams("/drafts/new", { token });
  const manageSchedulesLink = withParams("/schedules/manage", { token });
  const chipClass = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs ${active ? "border-slate-500 bg-slate-800 text-white" : "border-slate-800 text-slate-300"}`;
  const makeFilterLink = (value: string) =>
    withParams("/inbox", { token, type: value === "all" ? undefined : value });

  return (
    <PageShell
      token={token}
      title="Inbox"
      subtitle="Items waiting for review."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href={newDraftLink}
            className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 hover:border-slate-600"
          >
            New draft
          </Link>
          <Link
            href={manageSchedulesLink}
            className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 hover:border-slate-600"
          >
            New schedule
          </Link>
          <Link
            href={archiveLink}
            className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 hover:border-slate-600"
          >
            View archive
          </Link>
        </div>
      }
    >
      <PurposeCard>
        Review drafts and schedule proposals that require a human decision before they move forward.
      </PurposeCard>
      <section className="flex flex-wrap gap-2">
        {[
          { label: "All", value: "all" },
          { label: "Drafts", value: "drafts" },
          { label: "Schedules", value: "schedules" },
        ].map((item) => (
          <Link key={item.value} href={makeFilterLink(item.value)} className={chipClass(typeFilter === item.value)}>
            {item.label}
          </Link>
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-sm font-semibold text-slate-200">Drafts</div>
          <div className="mt-4 grid gap-3">
            {drafts.length === 0 ? (
              <div className="text-sm text-slate-500">No drafts awaiting review.</div>
            ) : (
              drafts.map((draft: any) => (
                <Link
                  key={draft.id}
                  href={withParams(`/drafts/${draft.id}`, {
                    token,
                    type: typeFilter === "all" ? undefined : typeFilter,
                  })}
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
            {schedules.length === 0 ? (
              <div className="text-sm text-slate-500">No schedules awaiting review.</div>
            ) : (
              schedules.map((schedule: any) => (
                <Link
                  key={schedule.id}
                  href={withParams(`/schedules/${schedule.id}`, {
                    token,
                    type: typeFilter === "all" ? undefined : typeFilter,
                  })}
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
