import PageShell from "@/app/components/PageShell";
import TaskActions from "@/app/components/TaskActions";
import { getStore } from "@/lib/store";

export default async function TasksPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const token = (await searchParams)?.token;
  const store = getStore();
  const tasks = await store.listTasks();

  return (
    <PageShell token={token} title="Manual tasks" subtitle="Upcoming items that require manual steps.">
      <section className="grid gap-4">
        {tasks.map((task: any) => (
          <div
            key={task.id}
            className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="text-sm font-semibold text-slate-100">{task.title}</div>
              <div className="text-xs text-slate-500">Due {new Date(task.dueAt).toLocaleString()}</div>
              <div className="mt-2 text-xs text-slate-400">Status: {task.status}</div>
            </div>
            <TaskActions taskId={task.id} copyText={task.copyText} token={token} />
          </div>
        ))}
      </section>
    </PageShell>
  );
}
