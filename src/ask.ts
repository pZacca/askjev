import {
  choice,
  type EntryType,
  noul,
  type Question,
  type Questions,
  score,
} from "@typesafe-ai/sdk";
import type { Jev } from "./jev.js";
import {
  buildRouting,
  buildRubricPick,
  key,
  type PickedRubric,
  type Routed,
  readRouting,
  readRubricPick,
} from "./router.js";
import { RUBRICS, type RubricName } from "./rubrics.js";
import type { Answer, AskInput, AskOutput } from "./schema.js";

interface Usage {
  input_tokens: number;
  output_tokens: number;
}

/**
 * The pipeline: route each question, pick built-in rubrics where needed, answer everything
 * in one Jev call, and shape the result. See docs/ARCHITECTURE.md, "Pipeline".
 */
export async function ask(jev: Jev, input: AskInput): Promise<AskOutput> {
  const { questions } = input;
  const usage: Usage = { input_tokens: 0, output_tokens: 0 };
  let model = "";

  // Call 1: route.
  const routingResult = await jev.systemOne(buildRouting(questions));
  addUsage(usage, routingResult.usage);
  model = routingResult.model;
  const routed: Routed[] = questions.map((_, i) => {
    const a = routingResult.answers[key(i)];
    if (a?.type !== "choice")
      throw new Error(`jevmcp: routing answer for ${key(i)} is missing or malformed`);
    return readRouting(a);
  });

  // Call 2: pick a rubric for every scale question that came without options.
  const needRubric = questions.flatMap((q, i) =>
    !q.options && routed[i]?.kind === "score" ? [i] : [],
  );
  const picked = new Map<number, PickedRubric>();
  if (needRubric.length > 0) {
    const pickResult = await jev.systemOne(buildRubricPick(questions, needRubric));
    addUsage(usage, pickResult.usage);
    for (const i of needRubric) {
      const a = pickResult.answers[key(i)];
      if (a?.type !== "choice")
        throw new Error(`jevmcp: rubric answer for ${key(i)} is missing or malformed`);
      picked.set(i, readRubricPick(a));
    }
  }

  // Build the typed questions, or an error entry for questions that cannot be asked.
  const typed: Questions = {};
  const answers: (Answer | null)[] = questions.map((q, i) => {
    const r = routed[i];
    if (!r) return null;
    const routing = { kind: r.kind, confidence: r.confidence };
    if (r.kind === "noul") {
      typed[key(i)] = noul(q.question);
      return null;
    }
    if (r.kind === "choice") {
      if (!q.options) {
        return {
          kind: "error",
          message: `"${q.question}" asks to pick between alternatives, but no options were given. Pass options with the alternatives.`,
          routing,
        };
      }
      typed[key(i)] = choice(q.question, Object.fromEntries(q.options.map((o) => [o, null])));
      return null;
    }
    // score
    if (q.options) {
      typed[key(i)] = score(
        q.question,
        q.options as unknown as readonly [string, string, ...string[]],
      );
      return null;
    }
    const rubric = picked.get(i);
    if (!rubric) throw new Error(`jevmcp: no rubric was picked for ${key(i)}`);
    typed[key(i)] = score(q.question, RUBRICS[rubric.name]);
    return null;
  });

  // Call 3: answer.
  if (Object.keys(typed).length > 0) {
    const result = await jev.systemOne({ state: input.state as EntryType, questions: typed });
    addUsage(usage, result.usage);
    model = result.model;
    questions.forEach((q, i) => {
      if (answers[i]) return;
      const r = routed[i];
      const a = result.answers[key(i)];
      if (!r || !a) throw new Error(`jevmcp: answer for ${key(i)} is missing`);
      answers[i] = shape(a, r, q.options ? undefined : picked.get(i));
    });
  }

  return {
    model,
    usage,
    answers: answers.map((a, i) => {
      if (!a) throw new Error(`jevmcp: no answer was produced for ${key(i)}`);
      return a;
    }),
  };
}

type JevAnswer = Awaited<ReturnType<Jev["systemOne"]>>["answers"][string];

function shape(a: JevAnswer, r: Routed, rubric: PickedRubric | undefined): Answer {
  const routing = rubric
    ? {
        kind: r.kind,
        confidence: r.confidence,
        rubric: { name: rubric.name, confidence: rubric.confidence },
      }
    : { kind: r.kind, confidence: r.confidence };

  switch (a.type) {
    case "noul":
      return {
        kind: "noul",
        answer: a.noul,
        probabilities: { yes: a.noul, no: 1 - a.noul },
        routing,
      };
    case "choice":
      return {
        kind: "choice",
        answer: a.choice,
        probabilities: { ...a.probabilities },
        confidence: a.confidence,
        routing,
      };
    case "score": {
      const legend = Object.fromEntries(Object.entries(a.legend).map(([k, v]) => [k, String(v)]));
      const base = {
        kind: "score" as const,
        answer: a.score,
        legend,
        probabilities: { ...a.probabilities } as Record<string, number>,
        confidence: a.confidence,
        routing,
      };
      return rubric ? { ...base, rubric: rubric.name, note: rubricNote(rubric.name) } : base;
    }
  }
}

function rubricNote(name: RubricName): string {
  return `No options were given, so the built-in '${name}' rubric was used. Pass options for a rubric tailored to your question.`;
}

function addUsage(total: Usage, u: Usage): void {
  total.input_tokens += u.input_tokens;
  total.output_tokens += u.output_tokens;
}

export type { Question };
