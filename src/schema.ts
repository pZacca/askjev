import { z } from "zod";

// ---------- input ----------

const jsonValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValue),
    z.record(z.string(), jsonValue),
  ]),
);

export const stateSchema = z
  .union([z.string(), z.array(jsonValue), z.record(z.string(), jsonValue)])
  .describe("The material to judge: text, a JSON object, or a JSON array.");

export const questionInputSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1)
    .describe(
      "A free-text question about the state. Jev decides whether it is yes/no, a scale, or a choice.",
    ),
  options: z
    .array(z.string().trim().min(1))
    .min(2)
    .optional()
    .describe(
      "Named alternatives, when the question has them. Order matters if they form a scale. Omit for yes/no questions or for 'how X' questions that can use a built-in rubric.",
    ),
});

export const askInputShape = {
  state: stateSchema,
  questions: z
    .array(questionInputSchema)
    .min(1)
    .describe("Questions about the same state, answered in one round trip."),
};

export const askInputSchema = z.object(askInputShape);

export type State = z.infer<typeof stateSchema>;
export type QuestionInput = z.infer<typeof questionInputSchema>;
export type AskInput = z.infer<typeof askInputSchema>;

// ---------- output ----------

export const kindSchema = z.enum(["noul", "score", "choice"]);
export type Kind = z.infer<typeof kindSchema>;

const routingSchema = z.object({
  kind: kindSchema.describe("The question type Jev routed this question to."),
  confidence: z.number().describe("Jev's confidence in that routing."),
  rubric: z
    .object({ name: z.string(), confidence: z.number() })
    .optional()
    .describe("Present when a built-in rubric was picked for a scale question without options."),
});

const noulAnswerSchema = z.object({
  kind: z.literal("noul"),
  answer: z.number().describe("Probability that the answer is yes, from 0 to 1."),
  probabilities: z.object({ yes: z.number(), no: z.number() }),
  routing: routingSchema,
});

const scoreAnswerSchema = z.object({
  kind: z.literal("score"),
  answer: z.number().describe("Expected level on the rubric. May fall between integer levels."),
  legend: z.record(z.string(), z.string()).describe("Level index to level description."),
  probabilities: z.record(z.string(), z.number()).describe("Probability per level index."),
  confidence: z.number(),
  rubric: z.string().optional().describe("Name of the built-in rubric, when one was used."),
  note: z
    .string()
    .optional()
    .describe("Advice when a built-in rubric was used instead of caller options."),
  routing: routingSchema,
});

const choiceAnswerSchema = z.object({
  kind: z.literal("choice"),
  answer: z.string().describe("The selected option."),
  probabilities: z.record(z.string(), z.number()).describe("Probability per option."),
  confidence: z.number(),
  routing: routingSchema,
});

const errorAnswerSchema = z.object({
  kind: z.literal("error"),
  message: z.string().describe("Why this question could not be answered, and what to change."),
  routing: routingSchema
    .optional()
    .describe("Present when the question was routed before the error was detected."),
});

export const answerSchema = z.discriminatedUnion("kind", [
  noulAnswerSchema,
  scoreAnswerSchema,
  choiceAnswerSchema,
  errorAnswerSchema,
]);

export const askOutputShape = {
  model: z.string().describe("The Jev model that answered."),
  usage: z
    .object({ input_tokens: z.number(), output_tokens: z.number() })
    .describe("Token usage summed over every Jev call made."),
  answers: z
    .array(answerSchema)
    .describe(
      'One entry per question, in input order. A question that could not be answered has kind "error"; the others are still answered.',
    ),
};

export const askOutputSchema = z.object(askOutputShape);

export type Answer = z.infer<typeof answerSchema>;
export type AskOutput = z.infer<typeof askOutputSchema>;
