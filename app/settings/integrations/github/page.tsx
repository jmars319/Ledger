import PageShell from "@/app/components/PageShell";
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
      <GitHubIntegrationClient token={token} />
    </PageShell>
  );
}
