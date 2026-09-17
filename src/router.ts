import { type ChoiceResponse, choice } from "@typesafe-ai/sdk";
import { RUBRICS, type RubricName } from "./rubrics.js";
import type { Kind, QuestionInput } from "./schema.js";

/** Name used for question `i` in every Jev request, so answers map back by position. */
export function key(index: number): string {
  return `q${index}`;
}

// ---------- step 1: what kind of question is this? ----------

const WITH_OPTIONS = {
  choice:
    "The options are distinct categories or alternatives with no inherent order between them. The answer is one of the options.",
  score:
    "The options are ordered levels of a single quantity, listed from lowest to highest, such as degrees, ratings, grades, or urgency levels. The answer is a position on that scale.",
} as const;

const WITHOUT_OPTIONS = {
  noul: "A yes/no question. It can be answered with yes or no, true or false, or the probability that something holds.",
  score:
    "A question about how much, how well, how likely, how often, or how strongly something applies. The answer is a degree on a scale.",
  choice:
    "A question that asks to pick one of several named alternatives, such as which, who, or what kind, but the alternatives are not listed.",
} as const;

export type RouteState = Record<string, { question: string; options?: string[] }>;

/** Build the routing request: one choice question per input question, over the questions themselves. */
export function buildRouting(questions: readonly QuestionInput[]) {
  const state: RouteState = {};
  const routing: Record<
    string,
    ReturnType<typeof choice<typeof WITH_OPTIONS | typeof WITHOUT_OPTIONS>>
  > = {};
  questions.forEach((q, i) => {
    const k = key(i);
    state[k] = q.options ? { question: q.question, options: q.options } : { question: q.question };
    routing[k] = choice(
      `What kind of question is \`${k}\`? Judge by what the question asks for${q.options ? " and by the nature of its options" : ""}.`,
      q.options ? WITH_OPTIONS : WITHOUT_OPTIONS,
    );
  });
  return { state, questions: routing };
}

export interface Routed {
  kind: Kind;
  confidence: number;
}

export function readRouting(answer: ChoiceResponse): Routed {
  return { kind: answer.choice as Kind, confidence: answer.confidence };
}

// ---------- step 2: which built-in rubric fits a scale question without options? ----------

const RUBRIC_CRITERIA: Record<RubricName, string> = {
  intensity: `How much, how strongly, or to what extent something applies. Levels: ${RUBRICS.intensity.join(", ")}.`,
  quality: `How good or well done something is. Levels: ${RUBRICS.quality.join(", ")}.`,
  severity: `How serious, harmful, or damaging something is. Levels: ${RUBRICS.severity.join(", ")}.`,
  likelihood: `How probable something is. Levels: ${RUBRICS.likelihood.join(", ")}.`,
  sentiment: `How positive or negative the tone or attitude is. Levels: ${RUBRICS.sentiment.join(", ")}.`,
  frequency: `How often something happens. Levels: ${RUBRICS.frequency.join(", ")}.`,
  agreement: `How much someone agrees with a statement. Levels: ${RUBRICS.agreement.join(", ")}.`,
};

/** Build the rubric-selection request for the given question indexes. */
export function buildRubricPick(questions: readonly QuestionInput[], indexes: readonly number[]) {
  const state: Record<string, string> = {};
  const picks: Record<string, ReturnType<typeof choice<typeof RUBRIC_CRITERIA>>> = {};
  for (const i of indexes) {
    const k = key(i);
    const q = questions[i];
    if (!q) continue;
    state[k] = q.question;
    picks[k] = choice(
      `Which rubric best fits the scale that \`${k}\` asks about? Pick by the quantity being measured, not by the topic.`,
      RUBRIC_CRITERIA,
    );
  }
  return { state, questions: picks };
}

export interface PickedRubric {
  name: RubricName;
  confidence: number;
}

export function readRubricPick(answer: ChoiceResponse): PickedRubric {
  return { name: answer.choice as RubricName, confidence: answer.confidence };
}
