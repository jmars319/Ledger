"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Brief, RepoAccess } from "@/lib/store/types";

type BrandInstruction = {
  id: string;
  tag: string;
  tone: string;
  hardRules: string;
  doList: string;
  dontList: string;
};

type Props = {
  briefs: Brief[];
  repos: RepoAccess[];
  token?: string;
  aiConfigured: boolean;
};

const storageKey = "ledger_ai_instructions_v1";

const authHeaders = (token?: string) =>
  token ? { "x-admin-token": token } : undefined;

export default function NewDraftClient({ briefs, repos, token, aiConfigured }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [briefId, setBriefId] = useState<string>(briefs[0]?.id ?? "");
  const [platform, setPlatform] = useState<string>("generic");
  const [singleRepoId, setSingleRepoId] = useState<string>(repos[0]?.id ?? "");
  const [multiRepoIds, setMultiRepoIds] = useState<Set<string>>(new Set());
  const [brandOverride, setBrandOverride] = useState<string>("");
  const [state, setState] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const instructions = useMemo(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [] as BrandInstruction[];
      const parsed = JSON.parse(raw) as BrandInstruction[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const brandOptions = useMemo(
    () => Array.from(new Set(instructions.map((item) => item.tag).filter(Boolean))),
    [instructions]
  );

  const selectedRepos = useMemo(() => {
    const ids = mode === "single" ? [singleRepoId] : Array.from(multiRepoIds);
    return repos.filter((repo) => ids.includes(repo.id));
  }, [mode, singleRepoId, multiRepoIds, repos]);

  const selectedTags = useMemo(
    () => Array.from(new Set(selectedRepos.map((repo) => repo.projectTag))),
    [selectedRepos]
  );

  const shouldChooseBrand = mode === "multi" && selectedTags.length > 1;

  const selectedBrandTag = shouldChooseBrand
    ? brandOverride
    : selectedTags[0] ?? brandOverride;

  const selectedInstructions = instructions.find((item) => item.tag === selectedBrandTag);

  const toggleRepo = (id: string) => {
    setMultiRepoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const submit = async () => {
    setState("submitting");
    setError(null);
    if (!briefId) {
      setError("Select a brief.");
      setState("error");
      return;
    }
    if (!aiConfigured) {
      setError("OPENAI_API_KEY is not configured.");
      setState("error");
      return;
    }

    const repoIds = selectedRepos.map((repo) => repo.id);
    if (repoIds.length === 0) {
      setError("Select at least one repo.");
      setState("error");
      return;
    }
    if (shouldChooseBrand && !selectedBrandTag) {
      setError("Select a brand for this draft.");
      setState("error");
      return;
    }

    const res = await fetch("/api/ai/draft", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({
        briefId,
        platform,
        repoIds,
        brandTag: selectedBrandTag || undefined,
        instructions: selectedInstructions || undefined,
      }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload.error ?? "Failed to generate draft.");
      setState("error");
      return;
    }

    const draft = await res.json();
    router.push(`/drafts/${draft.id}`);
  };

  return (
    <div className="grid gap-6">
      {briefs.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-400">
          No briefs available yet.
        </div>
      ) : null}
      {repos.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-400">
          No repos are available. Connect GitHub and select repos first.
        </div>
      ) : null}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="text-sm font-semibold text-slate-200">Draft source</div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-xs text-slate-400">
            Brief
            <select
              value={briefId}
              onChange={(event) => setBriefId(event.target.value)}
              disabled={briefs.length === 0}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100"
            >
              {briefs.map((brief) => (
                <option key={brief.id} value={brief.id}>
                  {brief.summary.slice(0, 80)}...
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-xs text-slate-400">
            Platform
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              disabled={briefs.length === 0}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100"
            >
              <option value="generic">Generic</option>
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">X (Twitter)</option>
              <option value="instagram">Instagram</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-200">Repository context</div>
            <div className="text-xs text-slate-500">
              Choose single or multi-repo context for this draft.
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button
              onClick={() => setMode("single")}
              className={`rounded-full border px-3 py-1 ${
                mode === "single"
                  ? "border-slate-500 text-slate-100"
                  : "border-slate-800 text-slate-400"
              }`}
            >
              Single
            </button>
            <button
              onClick={() => setMode("multi")}
              className={`rounded-full border px-3 py-1 ${
                mode === "multi"
                  ? "border-slate-500 text-slate-100"
                  : "border-slate-800 text-slate-400"
              }`}
            >
              Multi
            </button>
          </div>
        </div>

        {mode === "single" ? (
          <div className="mt-4">
            <select
              value={singleRepoId}
              onChange={(event) => setSingleRepoId(event.target.value)}
              disabled={repos.length === 0}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100"
            >
              {repos.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.repo} ({repo.projectTag})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {repos.map((repo) => (
              <label
                key={repo.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-200"
              >
                <div>
                  <div className="font-semibold text-slate-100">{repo.repo}</div>
                  <div className="text-xs text-slate-500">{repo.projectTag}</div>
                </div>
                <input
                  type="checkbox"
                  checked={multiRepoIds.has(repo.id)}
                  onChange={() => toggleRepo(repo.id)}
                  disabled={repos.length === 0}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                />
              </label>
            ))}
          </div>
        )}

        {shouldChooseBrand ? (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Brand override</div>
            <select
              value={brandOverride}
              onChange={(event) => setBrandOverride(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100"
            >
              <option value="">Select brand</option>
              {brandOptions.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="text-sm font-semibold text-slate-200">AI instructions</div>
        <div className="mt-2 text-xs text-slate-500">
          {selectedBrandTag
            ? `Using ${selectedBrandTag} instructions.`
            : "No brand instructions selected."}
        </div>
        {selectedInstructions ? (
          <div className="mt-3 text-xs text-slate-400">
            <div>Tone: {selectedInstructions.tone || "—"}</div>
            <div>Hard rules: {selectedInstructions.hardRules || "—"}</div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
          <button
          onClick={submit}
          disabled={state === "submitting" || briefs.length === 0 || repos.length === 0}
          className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200"
        >
          {state === "submitting" ? "Generating..." : "Generate draft"}
        </button>
        {error ? <div className="text-xs text-rose-300">{error}</div> : null}
      </div>
    </div>
  );
}
