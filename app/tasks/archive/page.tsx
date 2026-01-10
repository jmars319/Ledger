import Link from "next/link";
import PageShell from "@/app/components/PageShell";
import { getStore } from "@/lib/store";

const withToken = (href: string, token?: string) => {
  if (!token) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}token=${encodeURIComponent(token)}`;
};

export default async function TasksArchivePage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const token = (await searchParams)?.token;
  const store = getStore();
  const tasks = (await store.listTasks()).filter((task) => task.status !== "PENDING");

  return (
    <PageShell
      token={token}
      title="Tasks archive"
      subtitle="Completed or skipped manual tasks."
      actions={
        <Link
          href={withToken("/tasks", token)}
          className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 hover:border-slate-600"
        >
          Back to tasks
        </Link>
      }
    >
      <section className="grid gap-4">
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-500">
            No archived tasks yet.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-200"
            >
              <div className="font-semibold text-slate-100">{task.title}</div>
              <div className="text-xs text-slate-500">Due {new Date(task.dueAt).toLocaleString()}</div>
              <div className="text-xs text-slate-400">Status: {task.status}</div>
            </div>
          ))
        )}
      </section>
    </PageShell>
  );
}
