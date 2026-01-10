export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const error = searchParams?.error === "1";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-white">Ledger Admin</h1>
          <p className="text-sm text-slate-400">Enter the admin token to continue.</p>
        </div>
        {error ? (
          <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
            Invalid token. Try again.
          </div>
        ) : null}
        <form method="POST" action="/api/auth/login" className="grid gap-4">
          <label className="grid gap-2 text-sm text-slate-300">
            Admin Token
            <input
              name="token"
              type="password"
              className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"
              required
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-300"
          >
            Sign in
          </button>
        </form>
        <div className="mt-4 text-xs text-slate-500">Need the token? Ask an admin.</div>
      </div>
    </div>
  );
}
