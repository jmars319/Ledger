"use client";

import { useState } from "react";
import type { Brief, Project } from "@/lib/store/types";

type Props = {
  briefs: Brief[];
  projects: Project[];
  token?: string;
};

const authHeaders = (token?: string) =>
  token ? { "x-admin-token": token } : undefined;

export default function BriefsClient({ briefs, projects, token }: Props) {
  const [items, setItems] = useState<Brief[]>(briefs);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [summary, setSummary] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

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
      body: JSON.stringify({ projectId, summary }),
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
    setState("idle");
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="text-sm font-semibold text-slate-200">Create brief</div>
        <div className="mt-4 grid gap-4 md:grid-cols-[0.5fr_1fr]">
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
            Summary
            <textarea
              rows={4}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="What changed, why it matters, constraints, and key notes for review."
            />
          </label>
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
        <div className="text-sm font-semibold text-slate-200">Briefs</div>
        <div className="mt-4 grid gap-3">
          {items.length === 0 ? (
            <div className="text-sm text-slate-500">No briefs yet.</div>
          ) : (
            items.map((brief) => (
              <div
                key={brief.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200"
              >
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Project: {projects.find((p) => p.id === brief.projectId)?.name ?? "Unknown"}
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-slate-100">
                  {brief.summary}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Created: {new Date(brief.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
