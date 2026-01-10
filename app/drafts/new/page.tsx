import PageShell from "@/app/components/PageShell";
import PurposeCard from "@/app/components/PurposeCard";
import NewDraftClient from "@/app/drafts/new/NewDraftClient";
import { getStore } from "@/lib/store";

export default async function NewDraftPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const token = (await searchParams)?.token;
  const store = getStore();
  const [briefs, repos] = await Promise.all([store.listBriefs(), store.listRepos()]);

  return (
    <PageShell
      token={token}
      title="New draft"
      subtitle="Generate a draft from a brief with repo context."
    >
      <PurposeCard>
        Manually create a new draft by choosing a brief, repo context, and brand instructions before review.
      </PurposeCard>
      <NewDraftClient
        briefs={briefs}
        repos={repos}
        token={token}
        aiConfigured={Boolean(process.env.OPENAI_API_KEY)}
      />
    </PageShell>
  );
}
