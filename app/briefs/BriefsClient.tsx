"use client";

import { useMemo, useState } from "react";
import type { Brief, Project, RepoAccess } from "@/lib/store/types";

type Props = {
  briefs: Brief[];
  projects: Project[];
  repos: RepoAccess[];
  token?: string;
};

const authHeaders = (token?: string) =>
  token ? { "x-admin-token": token } : undefined;

export default function BriefsClient({ briefs, projects, repos, token }: Props) {
  const [items, setItems] = useState<Brief[]>(briefs);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [summary, setSummary] = useState("");
  const [sourceRepoId, setSourceRepoId] = useState<string>("");
  const [generalPrompt, setGeneralPrompt] = useState("");
  const [repoId, setRepoId] = useState(repos[0]?.id ?? "");
  const [scopeMode, setScopeMode] = useState<"AUTO" | "FULL" | "DAYS" | "COMMITS">("AUTO");
  const [days, setDays] = useState("30");
  const [commitWindowSize, setCommitWindowSize] = useState("50");
  const [commitWindowPage, setCommitWindowPage] = useState("0");
  const [includeContent, setIncludeContent] = useState(false);
  const [useDocs, setUseDocs] = useState(true);
  const [useCommits, setUseCommits] = useState(true);
  const [usePulls, setUsePulls] = useState(true);
  const [useReleases, setUseReleases] = useState(true);
  const [evidenceBundleId, setEvidenceBundleId] = useState<string | undefined>(undefined);
  const [suggestState, setSuggestState] = useState<"idle" | "loading" | "error">("idle");
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [generalSuggestState, setGeneralSuggestState] = useState<"idle" | "loading" | "error">(
    "idle"
  );
  const [generalSuggestError, setGeneralSuggestError] = useState<string | null>(null);
  const [filterScope, setFilterScope] = useState<"all" | "general" | "repo">("all");
  const [filterRepo, setFilterRepo] = useState<string>("all");
  const [activeSummary, setActiveSummary] = useState<string | null>(null);

  const instructions = useMemo(() => {
    try {
      const raw = localStorage.getItem("ledger_ai_instructions_v1");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const repoBrand = repos.find((repo) => repo.id === repoId)?.projectTag;
  const brandInstructions = instructions.find((item) => item.tag === repoBrand);

  const submit = async () => {
    setState("saving");
    setError(null);
    if (!projectId) {
      setState("error");
      setError("Select a project.");
      return;
    }
    if (!summary.trim()) {
      setState("error");
      setError("Brief summary is required.");
      return;
    }

    const res = await fetch("/api/briefs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({
        projectId,
        summary,
        evidenceBundleId,
        sourceRepoId: sourceRepoId || undefined,
      }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setState("error");
      setError(payload.error ?? "Failed to create brief.");
      return;
    }

    const created = (await res.json()) as Brief;
    setItems((prev) => [created, ...prev]);
    setSummary("");
    setSourceRepoId("");
    setEvidenceBundleId(undefined);
    setState("idle");
  };

  const removeBrief = async (id: string) => {
    setError(null);
    const confirmDelete = window.confirm("Delete this brief? This cannot be undone.");
    if (!confirmDelete) return;
    const res = await fetch(`/api/briefs/${id}`, {
      method: "DELETE",
      headers: {
        ...authHeaders(token),
      },
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload.error ?? "Failed to delete brief.");
      return;
    }

    setItems((prev) => prev.filter((brief) => brief.id !== id));
  };

  const suggestBrief = async () => {
    setSuggestState("loading");
    setSuggestError(null);
    if (!repoId) {
      setSuggestState("error");
      setSuggestError("Select a repo.");
      return;
    }
    if (!useDocs && !useCommits && !usePulls && !useReleases) {
      setSuggestState("error");
      setSuggestError("Select at least one evidence source.");
      return;
    }

    const captureRes = await fetch("/api/evidence/capture", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({
        repoId,
        scope: scopeMode,
        days: Number(days),
        commitWindowSize: Number(commitWindowSize),
        commitWindowPage: Number(commitWindowPage),
        sources: {
          docs: useDocs,
          commits: useCommits,
          pulls: usePulls,
          releases: useReleases,
        },
        includeContent,
      }),
    });

    if (!captureRes.ok) {
      const payload = await captureRes.json().catch(() => ({}));
      setSuggestState("error");
      setSuggestError(payload.error ?? "Failed to capture evidence.");
      return;
    }

    const capturePayload = await captureRes.json();
    const bundleId = capturePayload.bundleId as string;
    setEvidenceBundleId(bundleId);
    setSourceRepoId(repoId);

    const suggestRes = await fetch("/api/ai/brief-suggest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({
        bundleId,
        instructions: brandInstructions ?? undefined,
      }),
    });

    if (!suggestRes.ok) {
      const payload = await suggestRes.json().catch(() => ({}));
      setSuggestState("error");
      setSuggestError(payload.error ?? "Failed to suggest brief.");
      return;
    }

    const payload = await suggestRes.json();
    setSummary(payload.summary ?? "");
    setSuggestState("idle");
  };

  const suggestGeneralBrief = async () => {
    setGeneralSuggestState("loading");
    setGeneralSuggestError(null);
    if (!generalPrompt.trim()) {
      setGeneralSuggestState("error");
      setGeneralSuggestError("Enter a brief prompt.");
      return;
    }

    const suggestRes = await fetch("/api/ai/brief-suggest-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({
        promptText: generalPrompt.trim(),
      }),
    });

    if (!suggestRes.ok) {
      const payload = await suggestRes.json().catch(() => ({}));
      setGeneralSuggestState("error");
      setGeneralSuggestError(payload.error ?? "Failed to suggest brief.");
      return;
    }

    const payload = await suggestRes.json();
    setSummary(payload.summary ?? "");
    setEvidenceBundleId(undefined);
    setSourceRepoId("");
    setGeneralSuggestState("idle");
  };

  const filteredBriefs = items.filter((brief) => {
    const isRepoSpecific = Boolean(brief.sourceRepoId || brief.evidenceBundleId);
    if (filterScope === "general" && isRepoSpecific) return false;
    if (filterScope === "repo" && !isRepoSpecific) return false;
    if (filterRepo !== "all" && brief.sourceRepoId !== filterRepo) return false;
    return true;
  });

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="text-sm font-semibold text-slate-200">Create brief</div>
        <div className="mt-4 grid gap-4 md:grid-cols-[0.45fr_1fr]">
          <div className="grid gap-4">
            <label className="grid gap-2 text-xs text-slate-400">
              Project
              <select
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-xs text-slate-400">
              Source repo (optional)
              <select
                value={sourceRepoId}
                onChange={(event) => setSourceRepoId(event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100"
              >
                <option value="">General (no repo)</option>
                {repos.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.repo} ({repo.projectTag})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="grid gap-2 text-xs text-slate-400">
            Summary
            <textarea
              rows={6}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="What changed, why it matters, constraints, and key notes for review."
            />
          </label>
        </div>
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Suggest from repo</div>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-xs text-slate-400">
              Repo
              <select
                value={repoId}
                onChange={(event) => setRepoId(event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100"
              >
                {repos.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.repo} ({repo.projectTag})
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-xs text-slate-400">
              Scope
              <select
                value={scopeMode}
                onChange={(event) =>
                  setScopeMode(event.target.value as "AUTO" | "FULL" | "DAYS" | "COMMITS")
                }
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100"
              >
                <option value="AUTO">Auto (full once, then recent)</option>
                <option value="FULL">Full history</option>
                <option value="DAYS">Recent days</option>
                <option value="COMMITS">Commit chunks</option>
              </select>
            </label>
            {scopeMode === "DAYS" ? (
              <label className="grid gap-2 text-xs text-slate-400">
                Days
                <input
                  value={days}
                  onChange={(event) => setDays(event.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
              </label>
            ) : null}
            {scopeMode === "COMMITS" ? (
              <>
                <label className="grid gap-2 text-xs text-slate-400">
                  Commits per chunk
                  <input
                    value={commitWindowSize}
                    onChange={(event) => setCommitWindowSize(event.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
                <label className="grid gap-2 text-xs text-slate-400">
                  Chunk index (0 = oldest)
                  <input
                    value={commitWindowPage}
                    onChange={(event) => setCommitWindowPage(event.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
              </>
            ) : null}
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={includeContent}
                onChange={(event) => setIncludeContent(event.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900"
              />
              Include diff content where available
            </label>
          </div>
          <div className="mt-3 grid gap-2 text-xs text-slate-400 md:grid-cols-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useDocs}
                onChange={(event) => setUseDocs(event.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900"
              />
              Docs (README, docs/, CHANGELOG)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useCommits}
                onChange={(event) => setUseCommits(event.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900"
              />
              Commits
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={usePulls}
                onChange={(event) => setUsePulls(event.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900"
              />
              Pull requests
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useReleases}
                onChange={(event) => setUseReleases(event.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900"
              />
              Releases
            </label>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={suggestBrief}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-200"
            >
              {suggestState === "loading" ? "Generating..." : "Suggest brief"}
            </button>
            {suggestError ? <div className="text-xs text-rose-300">{suggestError}</div> : null}
          </div>
          {evidenceBundleId ? (
            <div className="mt-2 text-xs text-slate-500">Evidence bundle: {evidenceBundleId}</div>
          ) : null}
        </div>
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Suggest from text</div>
          <label className="mt-3 grid gap-2 text-xs text-slate-400">
            Prompt
            <textarea
              rows={3}
              value={generalPrompt}
              onChange={(event) => setGeneralPrompt(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="e.g. Brief about the three most important things I have learned in the last month."
            />
          </label>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={suggestGeneralBrief}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-200"
            >
              {generalSuggestState === "loading" ? "Generating..." : "Suggest general brief"}
            </button>
            {generalSuggestError ? (
              <div className="text-xs text-rose-300">{generalSuggestError}</div>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={submit}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200"
          >
            {state === "saving" ? "Saving..." : "Create brief"}
          </button>
          {error ? <div className="text-xs text-rose-300">{error}</div> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-200">Briefs</div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            <select
              value={filterScope}
              onChange={(event) =>
                setFilterScope(event.target.value as "all" | "general" | "repo")
              }
              className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200"
            >
              <option value="all">All briefs</option>
              <option value="general">General briefs</option>
              <option value="repo">Repo-specific</option>
            </select>
            <select
              value={filterRepo}
              onChange={(event) => setFilterRepo(event.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200"
            >
              <option value="all">All repos</option>
              {repos.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.repo}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {filteredBriefs.length === 0 ? (
            <div className="text-sm text-slate-500">No briefs yet.</div>
          ) : (
            filteredBriefs.map((brief) => (
              <div
                key={brief.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Project: {projects.find((p) => p.id === brief.projectId)?.name ?? "Unknown"}
                  </div>
                  <button
                    onClick={() => removeBrief(brief.id)}
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-slate-500"
                  >
                    Delete
                  </button>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {brief.sourceRepoId
                    ? `Repo: ${repos.find((repo) => repo.id === brief.sourceRepoId)?.repo ?? "Unknown"}`
                    : "General brief"}
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-slate-100">
                  {brief.summary}
                </div>
                {brief.summary.length > 280 ? (
                  <button
                    onClick={() => setActiveSummary(brief.summary)}
                    className="mt-2 text-xs text-slate-400 hover:text-slate-200"
                  >
                    View full summary
                  </button>
                ) : null}
                <div className="mt-2 text-xs text-slate-500">
                  Created: {new Date(brief.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {activeSummary ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-6">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-semibold text-slate-200">Brief summary</div>
              <button
                onClick={() => setActiveSummary(null)}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
              >
                Close
              </button>
            </div>
            <div className="mt-4 whitespace-pre-wrap text-sm text-slate-100">
              {activeSummary}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
