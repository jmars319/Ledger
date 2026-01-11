import PageShell from "@/app/components/PageShell";
import PurposeCard from "@/app/components/PurposeCard";
import NewPostClient from "@/app/posts/new/NewPostClient";
import { getStore } from "@/lib/store";

export default async function NewPostPage({
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
      title="New post"
      subtitle="Generate a post from a brief with repo context."
    >
      <PurposeCard>
        Manually create a new post by choosing a brief, repo context, and brand instructions before review.
      </PurposeCard>
      <NewPostClient
        briefs={briefs}
        repos={repos}
        token={token}
        aiConfigured={Boolean(process.env.OPENAI_API_KEY)}
      />
    </PageShell>
  );
}
