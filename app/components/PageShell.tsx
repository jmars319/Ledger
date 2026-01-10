import TopNav from "./TopNav";

export default function PageShell({
  token,
  title,
  subtitle,
  children,
}: {
  token?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <TopNav token={token} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <header>
          <h1 className="text-3xl font-semibold text-white">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-slate-400">{subtitle}</p> : null}
        </header>
        {children}
      </main>
    </div>
  );
}
