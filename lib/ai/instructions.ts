import "server-only";

export {
  GLOBAL_HARD_RULES,
  type InstructionContext,
  buildInstructionBlock,
} from "@/lib/ai/instructionsCore";

import type { InstructionContext } from "@/lib/ai/instructionsCore";
import { getPrismaClient } from "@/lib/prisma";
import { getStylePreset } from "@/lib/content/stylePresets";

export type OrgInstructions = InstructionContext["org"];

type ResolveInstructionInput = {
  workspaceId: string;
  userId?: string;
  stylePresetId?: string;
  orgTag?: string;
  orgOverride?: {
    tone?: string;
    hardRules?: string;
    doList?: string;
    dontList?: string;
  };
  context?: string[];
};

const mergeText = (base?: string, override?: string) => {
  if (!base && !override) return undefined;
  if (base && override) return `${base}\n${override}`;
  return override ?? base;
};

export const resolveInstructionContext = async (
  input: ResolveInstructionInput,
): Promise<InstructionContext> => {
  const prisma = getPrismaClient();
  const [workspace, userInstruction] = await Promise.all([
    prisma.workspaceInstruction.findUnique({ where: { workspaceId: input.workspaceId } }),
    input.userId ? prisma.userInstruction.findUnique({ where: { userId: input.userId } }) : null,
  ]);

  const stylePreset = input.stylePresetId ? getStylePreset(input.stylePresetId) : undefined;

  return {
    org: {
      tag: input.orgTag,
      tone: input.orgOverride?.tone ?? workspace?.tone ?? undefined,
      hardRules: mergeText(workspace?.hardRules ?? undefined, input.orgOverride?.hardRules),
      doList: mergeText(workspace?.doList ?? undefined, input.orgOverride?.doList),
      dontList: mergeText(workspace?.dontList ?? undefined, input.orgOverride?.dontList),
    },
    user: userInstruction
      ? {
          tone: userInstruction.tone ?? undefined,
          notes: userInstruction.notes ?? undefined,
        }
      : undefined,
    style: stylePreset
      ? {
          id: stylePreset.id,
          name: stylePreset.name,
          description: stylePreset.description,
          constraints: stylePreset.constraints,
        }
      : undefined,
    context: input.context,
  };
};
