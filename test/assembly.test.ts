import { describe, expect, it } from "vitest";
import { ask } from "../src/ask.js";
import { createJev } from "../src/jev.js";

/**
 * Runs the real Typesafe SDK against an injected fetch, so what reaches the wire is what
 * the SDK serializes, not what the pipeline thinks it sends.
 */
function wire(responses: unknown[]) {
  const bodies: Record<string, unknown>[] = [];
  const queue = [...responses];
  const fetch = async (_url: string, init?: RequestInit) => {
    bodies.push(JSON.parse(String(init?.body)));
    const body = queue.shift();
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  const jev = createJev({ apiKey: "test-key", fetch, retry: { maxRetries: 0 } });
  return { jev, bodies };
}

const usage = { input_tokens: 1, output_tokens: 1 };

describe("request assembly on the wire", () => {
  it("sends the routing call over the questions, then the answer call over the caller's state", async () => {
    const { jev, bodies } = wire([
      {
        model: "jev-1",
        usage,
        answers: {
          q0: {
            type: "choice",
            choice: "score",
            confidence: 0.9,
            probabilities: { score: 0.9, choice: 0.1 },
          },
          q1: { type: "choice", choice: "noul", confidence: 0.9, probabilities: { noul: 0.9 } },
        },
      },
      {
        model: "jev-1",
        usage,
        answers: {
          q0: {
            type: "score",
            score: 2,
            confidence: 0.9,
            legend: { 0: "low", 1: "mid", 2: "high" },
            probabilities: { 0: 0, 1: 0, 2: 1 },
          },
          q1: { type: "noul", noul: 0.2 },
        },
      },
    ]);

    const state = { ticket: { id: 4411, text: "charged twice" } };
    await ask(jev, {
      state,
      questions: [
        { question: "How urgent?", options: ["low", "mid", "high"] },
        { question: "Is it billing?" },
      ],
    });

    expect(bodies).toHaveLength(2);

    const routing = bodies[0] as {
      model: string;
      state: unknown;
      questions: Record<string, { type: string; criteria: unknown; instructions: string }>;
    };
    expect(routing.model).toBe("jev-latest");
    expect(routing.state).toEqual({
      q0: { question: "How urgent?", options: ["low", "mid", "high"] },
      q1: { question: "Is it billing?" },
    });
    expect(routing.questions.q0?.type).toBe("choice");
    expect(Object.keys(routing.questions.q0?.criteria as object)).toEqual(["choice", "score"]);
    expect(Object.keys(routing.questions.q1?.criteria as object)).toEqual([
      "noul",
      "score",
      "choice",
    ]);
    expect(routing.questions.q0?.instructions).toContain("`q0`");

    const answer = bodies[1] as { state: unknown; questions: Record<string, unknown> };
    expect(answer.state).toEqual(state);
    expect(answer.questions).toEqual({
      q0: { type: "score", instructions: "How urgent?", criteria: ["low", "mid", "high"] },
      q1: { type: "noul", instructions: "Is it billing?" },
    });
  });

  it("sends the rubric pick with the question text as state and every rubric as a criterion", async () => {
    const { jev, bodies } = wire([
      {
        model: "jev-1",
        usage,
        answers: {
          q0: { type: "choice", choice: "score", confidence: 1, probabilities: { score: 1 } },
        },
      },
      {
        model: "jev-1",
        usage,
        answers: {
          q0: {
            type: "choice",
            choice: "frequency",
            confidence: 1,
            probabilities: { frequency: 1 },
          },
        },
      },
      {
        model: "jev-1",
        usage,
        answers: {
          q0: {
            type: "score",
            score: 3,
            confidence: 1,
            legend: { 0: "never", 1: "rarely", 2: "sometimes", 3: "often", 4: "always" },
            probabilities: { 3: 1 },
          },
        },
      },
    ]);

    await ask(jev, { state: "log", questions: [{ question: "How often does it crash?" }] });

    const pickBody = bodies[1] as {
      state: unknown;
      questions: Record<string, { criteria: Record<string, string> }>;
    };
    expect(pickBody.state).toEqual({ q0: "How often does it crash?" });
    expect(Object.keys(pickBody.questions.q0?.criteria ?? {})).toEqual([
      "intensity",
      "quality",
      "severity",
      "likelihood",
      "sentiment",
      "frequency",
      "agreement",
    ]);
    expect(pickBody.questions.q0?.criteria.frequency).toContain(
      "never, rarely, sometimes, often, always",
    );

    const answerBody = bodies[2] as { questions: Record<string, { criteria: unknown }> };
    expect(answerBody.questions.q0?.criteria).toEqual([
      "never",
      "rarely",
      "sometimes",
      "often",
      "always",
    ]);
  });
});
