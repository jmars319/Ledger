export default function SettingsAIIntegrationSummary({
  configured,
}: {
  configured: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="text-sm font-semibold text-slate-200">AI integration</div>
      <div className="mt-2 text-sm text-slate-400">
        OpenAI: <span className="text-slate-300">{configured ? "Configured" : "Not configured"}</span>
      </div>
      <div className="mt-2 text-xs text-slate-500">
        Add `OPENAI_API_KEY` in `.env.local` or Railway env vars to enable manual draft
        generation.
      </div>
    </div>
  );
}
