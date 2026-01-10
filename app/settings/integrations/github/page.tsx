import PageShell from "@/app/components/PageShell";
import PurposeCard from "@/app/components/PurposeCard";
import GitHubIntegrationClient from "@/app/settings/integrations/github/GitHubIntegrationClient";

export default async function GitHubIntegrationPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const token = (await searchParams)?.token;

  return (
    <PageShell
      token={token}
      title="GitHub integration"
      subtitle="Connect the Ledger GitHub App and select repos."
    >
      <PurposeCard>
        Connect the read-only GitHub App, then select which repos Ledger can read.
      </PurposeCard>
      <GitHubIntegrationClient token={token} />
    </PageShell>
  );
}
