import type { Jev } from "./jev.js";
import type { AskInput, AskOutput } from "./schema.js";

/**
 * The pipeline: route each question, pick built-in rubrics where needed, answer everything
 * in one Jev call, and shape the result. See docs/ARCHITECTURE.md, "Pipeline".
 */
export async function ask(_jev: Jev, _input: AskInput): Promise<AskOutput> {
  throw new Error("jevmcp: the ask pipeline is not implemented yet");
}
