import { describe, expect, it } from "vitest";
import { DEFAULT_INCLUDE, parseInclude, trimOutput } from "../src/include.js";
import type { AskOutput } from "../src/schema.js";

describe("parseInclude", () => {
  it("keeps the default when the variable is unset", () => {
    expect(parseInclude(undefined)).toEqual(DEFAULT_INCLUDE);
    expect(DEFAULT_INCLUDE).toEqual(["routing"]);
  });

  it("strips everything optional on an empty string", () => {
    expect(parseInclude("")).toEqual([]);
    expect(parseInclude(" , ")).toEqual([]);
  });

  it("reads a comma-separated list, ignoring case, spaces, and repeats", () => {
    expect(parseInclude("usage, MODEL ,routing,usage")).toEqual(["model", "usage", "routing"]);
    expect(parseInclude("usage")).toEqual(["usage"]);
  });

  it("refuses unknown names and says which are valid", () => {
    expect(() => parseInclude("routing,tokens")).toThrow(
      'ASKJEV_INCLUDE: unknown field "tokens". Valid fields: model, usage, routing.',
    );
  });
});

describe("trimOutput", () => {
  const full: AskOutput = {
    model: "jev-test",
    usage: { input_tokens: 10, output_tokens: 1 },
    answers: [
      {
        kind: "noul",
        answer: 0.9,
        probabilities: { yes: 0.9, no: 0.1 },
        routing: { kind: "noul", confidence: 0.95 },
      },
      {
        kind: "error",
        message: "needs options",
        routing: { kind: "choice", confidence: 0.8 },
      },
    ],
  };

  it("keeps only the answers and their routing by default", () => {
    const out = trimOutput(full, DEFAULT_INCLUDE);
    expect(out).toEqual({ answers: full.answers });
    expect(out).not.toHaveProperty("model");
    expect(out).not.toHaveProperty("usage");
  });

  it("drops routing from every answer, including error entries, when not included", () => {
    const out = trimOutput(full, []);
    expect(out).toEqual({
      answers: [
        { kind: "noul", answer: 0.9, probabilities: { yes: 0.9, no: 0.1 } },
        { kind: "error", message: "needs options" },
      ],
    });
  });

  it("returns everything when everything is included", () => {
    expect(trimOutput(full, ["model", "usage", "routing"])).toEqual(full);
  });

  it("does not mutate the pipeline's output", () => {
    const copy = structuredClone(full);
    trimOutput(full, []);
    expect(full).toEqual(copy);
  });
});
