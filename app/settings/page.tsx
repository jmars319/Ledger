import PageShell from "@/app/components/PageShell";
import PurposeCard from "@/app/components/PurposeCard";
import SettingsAIIntegrationSummary from "@/app/components/SettingsAIIntegrationSummary";
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
        <PurposeCard>
          Configure repo access, brand instructions, and integrations that power the review workflow.
        </PurposeCard>
        <SettingsClient repos={repos} token={token} />
        <SettingsGitHubSummary token={token} />
        <SettingsAIIntegrationSummary configured={Boolean(process.env.OPENAI_API_KEY)} />
      </section>
    </PageShell>
  );
}
