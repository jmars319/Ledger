import PageShell from "@/app/components/PageShell";
import PurposeCard from "@/app/components/PurposeCard";
import BriefsClient from "@/app/briefs/BriefsClient";
import { getStore } from "@/lib/store";

export default async function BriefsPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const token = (await searchParams)?.token;
  const store = getStore();
  const [briefs, projects, repos] = await Promise.all([
    store.listBriefs(),
    store.listProjects(),
    store.listRepos(),
  ]);

  return (
    <PageShell token={token} title="Briefs" subtitle="Create and manage review briefs.">
      <PurposeCard>
        Define the context and constraints used to generate posts for review.
      </PurposeCard>
      <BriefsClient briefs={briefs} projects={projects} repos={repos} token={token} />
    </PageShell>
  );
}
