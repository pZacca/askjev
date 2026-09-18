import type { AskOutput } from "./schema.js";

/** Optional parts of the result. The operator picks them once, in configuration. */
export const INCLUDE_FIELDS = ["model", "usage", "routing"] as const;
export type IncludeField = (typeof INCLUDE_FIELDS)[number];

/** What goes out when nothing is configured: the answers, plus how each was interpreted. */
export const DEFAULT_INCLUDE: readonly IncludeField[] = ["routing"];

/** Environment variable that overrides the default, as a comma-separated list. */
export const INCLUDE_ENV = "ASKJEV_INCLUDE";

/**
 * Parses `ASKJEV_INCLUDE`. Unset keeps the default; an empty string strips everything
 * optional; unknown names are a startup error, not a silent no-op.
 */
export function parseInclude(raw: string | undefined): IncludeField[] {
  if (raw === undefined) return [...DEFAULT_INCLUDE];
  const fields = new Set<IncludeField>();
  for (const part of raw.split(",")) {
    const name = part.trim().toLowerCase();
    if (name === "") continue;
    if (!isIncludeField(name)) {
      throw new Error(
        `${INCLUDE_ENV}: unknown field "${part.trim()}". Valid fields: ${INCLUDE_FIELDS.join(", ")}.`,
      );
    }
    fields.add(name);
  }
  return INCLUDE_FIELDS.filter((f) => fields.has(f));
}

function isIncludeField(name: string): name is IncludeField {
  return (INCLUDE_FIELDS as readonly string[]).includes(name);
}

/** Drops every optional part that is not in `include`. The pipeline always produces them all. */
export function trimOutput(output: AskOutput, include: readonly IncludeField[]): AskOutput {
  const keep = new Set(include);
  const { model, usage, answers } = output;
  return {
    ...(keep.has("model") && model !== undefined ? { model } : {}),
    ...(keep.has("usage") && usage !== undefined ? { usage } : {}),
    answers: keep.has("routing")
      ? answers
      : answers.map((a) => {
          const { routing: _routing, ...rest } = a;
          return rest;
        }),
  };
}
