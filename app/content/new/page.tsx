import PageShell from "@/app/components/PageShell";
import ContentNewClient from "@/app/content/new/ContentNewClient";

export default function ContentNewPage({
  searchParams,
}: {
  searchParams?: { token?: string };
}) {
  const token = searchParams?.token;
  const isDb = process.env.STORAGE_MODE === "db";

  return (
    <PageShell
      token={token}
      title="New content"
      subtitle="Create typed content artifacts for review and scheduling."
    >
      {!isDb ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
          Content Ops requires DB mode. Set `STORAGE_MODE=db` and `DATABASE_URL`.
        </div>
      ) : (
        <ContentNewClient token={token} />
      )}
    </PageShell>
  );
}
