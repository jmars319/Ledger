import PageShell from "@/app/components/PageShell";
import PurposeCard from "@/app/components/PurposeCard";
import SchedulesManageClient from "@/app/schedules/manage/SchedulesManageClient";
import { getStore } from "@/lib/store";

export default async function SchedulesManagePage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const token = (await searchParams)?.token;
  const store = getStore();
  const [drafts, schedules] = await Promise.all([store.listDrafts(), store.listSchedules()]);

  return (
    <PageShell token={token} title="Manage schedules" subtitle="Create schedule proposals.">
      <PurposeCard>
        Manually create schedule proposals for drafts and send them through review.
      </PurposeCard>
      <SchedulesManageClient drafts={drafts} schedules={schedules} token={token} />
    </PageShell>
  );
}
