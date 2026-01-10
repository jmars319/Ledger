import PageShell from "@/app/components/PageShell";
import SettingsClient from "@/app/components/SettingsClient";
import SettingsGitHubSummary from "@/app/components/SettingsGitHubSummary";
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
        <SettingsClient repos={repos} token={token} />
        <SettingsGitHubSummary token={token} />
      </section>
    </PageShell>
  );
}
