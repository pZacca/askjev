import type { Questions, SystemOneRequest, SystemOneResult } from "@typesafe-ai/sdk";
import type { Jev } from "../src/jev.js";

type AnyAnswer = SystemOneResult<Questions>["answers"][string];

/**
 * A scripted Jev. Each call pops the next answer map; requests are recorded for assertions.
 * Answers are looked up by question name, so a script can cover the routing, rubric, and
 * final calls of one `ask` in order.
 */
export function fakeJev(scripts: Record<string, AnyAnswer>[]) {
  const requests: SystemOneRequest[] = [];
  const queue = [...scripts];
  const systemOne = async (request: SystemOneRequest) => {
    requests.push(request);
    const answers = queue.shift();
    if (!answers) throw new Error(`fakeJev: unexpected call #${requests.length}`);
    return { model: "jev-test", answers, usage: { input_tokens: 10, output_tokens: 1 } };
  };
  // The fake cannot be generic over the question map; the pipeline only reads `type`-tagged answers.
  const jev = { systemOne } as unknown as Jev;
  return { jev, requests };
}

export const route = (kind: "noul" | "score" | "choice", confidence = 0.9): AnyAnswer => ({
  type: "choice",
  choice: kind,
  confidence,
  probabilities: { [kind]: confidence },
});

export const pick = (name: string, confidence = 0.8): AnyAnswer => ({
  type: "choice",
  choice: name,
  confidence,
  probabilities: { [name]: confidence },
});
