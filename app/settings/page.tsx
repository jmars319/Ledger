import PageShell from "@/app/components/PageShell";
import RepoAccessEditor from "@/app/components/RepoAccessEditor";
import { getStore } from "@/lib/store";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const token = (await searchParams)?.token;
  const store = getStore();
  const repos = await store.listRepos();

  return (
    <PageShell token={token} title="Settings" subtitle="Manage repos and integrations.">
      <section className="grid gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-sm font-semibold text-slate-200">Integrations</div>
          <div className="mt-3 text-sm text-slate-400">
            GitHub: <span className="text-slate-300">Not connected</span>
          </div>
        </div>
        <RepoAccessEditor repos={repos} token={token} />
      </section>
    </PageShell>
  );
}
