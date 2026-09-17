// Real numbers from one askjev call against the task shown in the first scene (jev-1.13.0).
export type Bar = { label: string; p: number };

export type QuestionData = {
  question: string;
  /** Shorter wording for the terminal line; same question. */
  short: string;
  options?: string[];
  kind: "yes/no" | "scale" | "choice";
  answer: string;
  confidence: number;
  bars: Bar[];
  note?: string;
};

export const QUESTIONS: QuestionData[] = [
  {
    question: "Can this task be safely worked on by several agents in parallel?",
    short: "Can this run safely in parallel?",
    kind: "yes/no",
    answer: "0.46",
    confidence: 0.46,
    bars: [
      { label: "yes", p: 0.46 },
      { label: "no", p: 0.54 },
    ],
    note: "uncertain → planner asks the user instead of guessing",
  },
  {
    question: "How many agents should this task be split across?",
    short: "How many agents?",
    options: ["1", "2", "3", "4+"],
    kind: "scale",
    answer: "3",
    confidence: 0.48,
    bars: [
      { label: "1", p: 0.05 },
      { label: "2", p: 0.19 },
      { label: "3", p: 0.48 },
      { label: "4+", p: 0.28 },
    ],
  },
  {
    question: "How should the work be split between agents?",
    short: "How to split the work?",
    options: ["by file", "by layer", "by feature"],
    kind: "choice",
    answer: "by layer",
    confidence: 0.62,
    bars: [
      { label: "by file", p: 0.03 },
      { label: "by layer", p: 0.62 },
      { label: "by feature", p: 0.35 },
    ],
  },
  {
    question: "Which model is the right fit to implement this task?",
    short: "Which model fits?",
    options: ["claude-haiku-4-5", "claude-sonnet-5", "claude-opus-5", "claude-fable-5-1"],
    kind: "choice",
    answer: "claude-opus-5",
    confidence: 0.63,
    bars: [
      { label: "haiku-4-5", p: 0.03 },
      { label: "sonnet-5", p: 0.31 },
      { label: "opus-5", p: 0.63 },
      { label: "fable-5-1", p: 0.03 },
    ],
  },
  {
    question: "How much reasoning effort does this task need?",
    short: "How much effort?",
    options: ["low", "medium", "high", "xhigh", "max"],
    kind: "scale",
    answer: "xhigh",
    confidence: 0.67,
    bars: [
      { label: "low", p: 0.0 },
      { label: "medium", p: 0.0 },
      { label: "high", p: 0.2 },
      { label: "xhigh", p: 0.67 },
      { label: "max", p: 0.13 },
    ],
  },
];
