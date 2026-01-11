import PageShell from "@/app/components/PageShell";
import PurposeCard from "@/app/components/PurposeCard";
import ProjectsClient from "@/app/projects/ProjectsClient";
import { getStore } from "@/lib/store";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const token = (await searchParams)?.token;
  const store = getStore();
  const projects = await store.listProjects();

  return (
    <PageShell token={token} title="Projects" subtitle="Manage project tags and names.">
      <PurposeCard>
        Keep project tags consistent so briefs, repos, and posts align to the right brand.
      </PurposeCard>
      <ProjectsClient projects={projects} token={token} />
    </PageShell>
  );
}
