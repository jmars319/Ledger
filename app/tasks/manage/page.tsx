import PageShell from "@/app/components/PageShell";
import PurposeCard from "@/app/components/PurposeCard";
import TasksManageClient from "@/app/tasks/manage/TasksManageClient";
import { getStore } from "@/lib/store";

export default async function TasksManagePage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const token = (await searchParams)?.token;
  const store = getStore();
  const [tasks, projects] = await Promise.all([store.listTasks(), store.listProjects()]);

  return (
    <PageShell token={token} title="Manage tasks" subtitle="Create and review manual tasks.">
      <PurposeCard>
        Create manual tasks tied to projects, then track them through completion.
      </PurposeCard>
      <TasksManageClient tasks={tasks} projects={projects} token={token} />
    </PageShell>
  );
}
