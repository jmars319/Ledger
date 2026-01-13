import "server-only";

export {
  GLOBAL_HARD_RULES,
  type InstructionContext,
  buildInstructionBlock,
} from "@/lib/ai/instructionsCore";

import type { InstructionContext } from "@/lib/ai/instructionsCore";

export type OrgInstructions = InstructionContext["org"];
