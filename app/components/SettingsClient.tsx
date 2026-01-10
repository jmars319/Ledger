"use client";

import { useEffect, useMemo, useState } from "react";
import AIInstructions from "@/app/components/AIInstructions";
import RepoAccessEditor from "@/app/components/RepoAccessEditor";
import type { RepoAccess } from "@/lib/store/types";

export type BrandInstruction = {
  id: string;
  tag: string;
  tone: string;
  hardRules: string;
  doList: string;
  dontList: string;
};

type SaveState = "idle" | "saved" | "error";

const storageKey = "ledger_ai_instructions_v1";

const defaultInstructions: BrandInstruction[] = [
  {
    id: "brand-jamarq",
    tag: "JAMARQ",
    tone: "Direct, technical, low-hype.",
    hardRules: "No em dashes. Avoid superlatives.",
    doList: "Use short sentences. Prefer active voice.",
    dontList: "No claims of autonomy. No release language.",
  },
  {
    id: "brand-tenra",
    tag: "TENRA",
    tone: "Concise, pragmatic, product-led.",
    hardRules: "No em dashes. No hashtags.",
    doList: "Highlight workflow clarity. Keep CTAs gentle.",
    dontList: "No trend claims. No external promises.",
  },
];

export default function SettingsClient({
  repos,
  token,
}: {
  repos: RepoAccess[];
  token?: string;
}) {
  const [instructions, setInstructions] = useState<BrandInstruction[]>(defaultInstructions);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as BrandInstruction[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setInstructions(parsed);
      }
    } catch {
      setSaveState("error");
    }
  }, []);

  const save = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(instructions));
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  const reset = () => {
    setInstructions(defaultInstructions);
    setSaveState("idle");
  };

  const brandOptions = useMemo(
    () => Array.from(new Set(instructions.map((item) => item.tag).filter(Boolean))),
    [instructions]
  );

  const usedTags = useMemo(() => new Set(repos.map((repo) => repo.projectTag)), [repos]);

  return (
    <div className="grid gap-6">
      <AIInstructions
        instructions={instructions}
        onChange={setInstructions}
        onSave={save}
        onReset={reset}
        saveState={saveState}
        usedTags={usedTags}
      />
      <RepoAccessEditor repos={repos} token={token} brandOptions={brandOptions} />
    </div>
  );
}
