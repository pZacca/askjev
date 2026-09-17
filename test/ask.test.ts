import { describe, expect, it } from "vitest";
import { ask } from "../src/ask.js";
import { fakeJev, pick, route } from "./fake-jev.js";

describe("ask pipeline", () => {
  it("routes a yes/no question and answers it in two calls", async () => {
    const { jev, requests } = fakeJev([{ q0: route("noul") }, { q0: { type: "noul", noul: 0.8 } }]);
    const out = await ask(jev, { state: "text", questions: [{ question: "Is it a bug?" }] });

    expect(requests).toHaveLength(2);
    expect(requests[0]?.state).toEqual({ q0: { question: "Is it a bug?" } });
    expect(requests[1]?.state).toBe("text");
    expect(requests[1]?.questions.q0).toMatchObject({ type: "noul", instructions: "Is it a bug?" });
    expect(out.answers[0]).toEqual({
      kind: "noul",
      answer: 0.8,
      probabilities: { yes: 0.8, no: expect.closeTo(0.2, 10) },
      routing: { kind: "noul", confidence: 0.9 },
    });
    expect(out.model).toBe("jev-test");
    expect(out.usage).toEqual({ input_tokens: 20, output_tokens: 2 });
  });

  it("turns options into choice labels when routed to choice", async () => {
    const { jev, requests } = fakeJev([
      { q0: route("choice") },
      { q0: { type: "choice", choice: "b", confidence: 0.7, probabilities: { a: 0.3, b: 0.7 } } },
    ]);
    const out = await ask(jev, {
      state: {},
      questions: [{ question: "Which?", options: ["a", "b"] }],
    });

    expect(requests[0]?.state).toEqual({ q0: { question: "Which?", options: ["a", "b"] } });
    expect(requests[1]?.questions.q0).toEqual({
      type: "choice",
      instructions: "Which?",
      criteria: { a: null, b: null },
    });
    expect(out.answers[0]).toEqual({
      kind: "choice",
      answer: "b",
      probabilities: { a: 0.3, b: 0.7 },
      confidence: 0.7,
      routing: { kind: "choice", confidence: 0.9 },
    });
  });

  it("turns options into an ordered rubric when routed to score, with no rubric field", async () => {
    const { jev, requests } = fakeJev([
      { q0: route("score") },
      {
        q0: {
          type: "score",
          score: 1.5,
          confidence: 0.6,
          legend: { 0: "low", 1: "mid", 2: "high" },
          probabilities: { 0: 0.1, 1: 0.3, 2: 0.6 },
        },
      },
    ]);
    const out = await ask(jev, {
      state: "s",
      questions: [{ question: "How much?", options: ["low", "mid", "high"] }],
    });

    expect(requests[1]?.questions.q0).toEqual({
      type: "score",
      instructions: "How much?",
      criteria: ["low", "mid", "high"],
    });
    expect(out.answers[0]).toEqual({
      kind: "score",
      answer: 1.5,
      legend: { "0": "low", "1": "mid", "2": "high" },
      probabilities: { "0": 0.1, "1": 0.3, "2": 0.6 },
      confidence: 0.6,
      routing: { kind: "score", confidence: 0.9 },
    });
    expect(out.answers[0]).not.toHaveProperty("rubric");
    expect(out.answers[0]).not.toHaveProperty("note");
  });

  it("picks a built-in rubric for a scale without options, using a third call", async () => {
    const { jev, requests } = fakeJev([
      { q0: route("score") },
      { q0: pick("severity", 0.85) },
      {
        q0: {
          type: "score",
          score: 3.2,
          confidence: 0.7,
          legend: { 0: "trivial", 1: "minor", 2: "moderate", 3: "major", 4: "critical" },
          probabilities: { 0: 0, 1: 0, 2: 0.1, 3: 0.6, 4: 0.3 },
        },
      },
    ]);
    const out = await ask(jev, { state: "s", questions: [{ question: "How bad?" }] });

    expect(requests).toHaveLength(3);
    expect(requests[1]?.state).toEqual({ q0: "How bad?" });
    expect(requests[2]?.questions.q0).toMatchObject({
      type: "score",
      criteria: ["trivial", "minor", "moderate", "major", "critical"],
    });
    expect(out.answers[0]).toMatchObject({
      kind: "score",
      answer: 3.2,
      rubric: "severity",
      note: expect.stringContaining("'severity'"),
      routing: { kind: "score", confidence: 0.9, rubric: { name: "severity", confidence: 0.85 } },
    });
    expect(out.usage).toEqual({ input_tokens: 30, output_tokens: 3 });
  });

  it("returns an error entry for a choice without options and still answers the rest", async () => {
    const { jev, requests } = fakeJev([
      { q0: route("choice", 0.95), q1: route("noul") },
      { q1: { type: "noul", noul: 0.4 } },
    ]);
    const out = await ask(jev, {
      state: "s",
      questions: [{ question: "Which product?" }, { question: "Is it urgent?" }],
    });

    expect(requests).toHaveLength(2);
    expect(Object.keys(requests[1]?.questions ?? {})).toEqual(["q1"]);
    expect(out.answers[0]).toEqual({
      kind: "error",
      message: expect.stringContaining("no options were given"),
      routing: { kind: "choice", confidence: 0.95 },
    });
    expect(out.answers[1]).toMatchObject({ kind: "noul", answer: 0.4 });
  });

  it("skips the answer call when every question errored", async () => {
    const { jev, requests } = fakeJev([{ q0: route("choice") }]);
    const out = await ask(jev, { state: "s", questions: [{ question: "Which one?" }] });

    expect(requests).toHaveLength(1);
    expect(out.answers[0]?.kind).toBe("error");
    expect(out.model).toBe("jev-test");
    expect(out.usage).toEqual({ input_tokens: 10, output_tokens: 1 });
  });

  it("keeps answers in input order across a mixed batch and batches every step", async () => {
    const { jev, requests } = fakeJev([
      { q0: route("score"), q1: route("noul"), q2: route("score"), q3: route("choice") },
      { q0: pick("intensity"), q2: pick("quality") },
      {
        q0: {
          type: "score",
          score: 4,
          confidence: 0.9,
          legend: { 0: "a", 1: "b" },
          probabilities: { 0: 0, 1: 1 },
        },
        q1: { type: "noul", noul: 0.5 },
        q2: {
          type: "score",
          score: 1,
          confidence: 0.9,
          legend: { 0: "a", 1: "b" },
          probabilities: { 0: 0, 1: 1 },
        },
        q3: { type: "choice", choice: "x", confidence: 1, probabilities: { x: 1, y: 0 } },
      },
    ]);
    const out = await ask(jev, {
      state: ["item"],
      questions: [
        { question: "How strong?" },
        { question: "Yes?" },
        { question: "How good?" },
        { question: "Which?", options: ["x", "y"] },
      ],
    });

    expect(requests).toHaveLength(3);
    expect(Object.keys(requests[1]?.questions ?? {})).toEqual(["q0", "q2"]);
    expect(out.answers.map((a) => a.kind)).toEqual(["score", "noul", "score", "choice"]);
    expect(out.answers[0]).toMatchObject({ rubric: "intensity" });
    expect(out.answers[2]).toMatchObject({ rubric: "quality" });
  });

  it("fails loudly when Jev omits a routing answer", async () => {
    const { jev } = fakeJev([{}]);
    await expect(ask(jev, { state: "s", questions: [{ question: "?" }] })).rejects.toThrow(
      /routing answer for q0/,
    );
  });
});
