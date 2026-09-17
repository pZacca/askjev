export type Line =
  | { at: number; kind: "typed"; prefix: string; text: string; typeFrames: number; color?: "text" | "muted" }
  | { at: number; kind: "text"; prefix?: string; text: string; color?: "text" | "muted" | "accent" | "warn" }
  | { at: number; kind: "bar"; answer: string; p: number; runner: string; runnerP: number; uncertain: boolean };

// Frame timeline. Every number is from one real askjev call against this task (jev-1.13.0).
const T0 = 12;
const AI0 = 92;
const Q0 = 122;
const Q_EVERY = 82;
export const PLAN_AT = Q0 + 5 * Q_EVERY;
export const FLIP_AT = PLAN_AT + 78;

export const buildScript = (): Line[] => {
  const lines: Line[] = [
    { at: T0, kind: "typed", prefix: "❯ ", text: "plan the workflow for this task: migrate cookie", typeFrames: 30 },
    { at: T0 + 32, kind: "typed", prefix: "  ", text: "sessions → JWT in our Rails monolith, zero downtime", typeFrames: 30 },
    { at: T0 + 66, kind: "text", text: "" },
    { at: AI0, kind: "text", prefix: "⏺ ", text: "Let me ask Jev before I spawn anything." },
    { at: AI0 + 4, kind: "text", text: "" },
  ];

  const turns: {
    ask: string;
    answer: string;
    p: number;
    runner: string;
    runnerP: number;
    uncertain?: boolean;
    then: string;
  }[] = [
    {
      ask: 'ask "Can this run safely in parallel?"',
      answer: "yes",
      p: 0.46,
      runner: "no",
      runnerP: 0.54,
      uncertain: true,
      then: "Split decision. Let's see how many agents it wants.",
    },
    {
      ask: 'ask "How many agents?" [1/2/3/4+]',
      answer: "3",
      p: 0.48,
      runner: "4+",
      runnerP: 0.28,
      then: "Three. Along which axis?",
    },
    {
      ask: 'ask "How to split the work?" [file/layer/feature]',
      answer: "by layer",
      p: 0.62,
      runner: "feature",
      runnerP: 0.35,
      then: "One agent per layer. Which model runs them?",
    },
    {
      ask: 'ask "Which model fits?" [haiku/sonnet/opus/fable]',
      answer: "opus-5",
      p: 0.63,
      runner: "sonnet-5",
      runnerP: 0.31,
      then: "opus-5. How hard should it think?",
    },
    {
      ask: 'ask "How much effort?" [low/medium/high/xhigh/max]',
      answer: "xhigh",
      p: 0.67,
      runner: "high",
      runnerP: 0.2,
      then: "",
    },
  ];

  turns.forEach((t, i) => {
    const at = Q0 + i * Q_EVERY;
    lines.push({ at, kind: "typed", prefix: "⏺ ", text: t.ask, typeFrames: 20 });
    lines.push({ at: at + 26, kind: "bar", answer: t.answer, p: t.p, runner: t.runner, runnerP: t.runnerP, uncertain: !!t.uncertain });
    if (t.then) {
      lines.push({ at: at + 54, kind: "text", text: "" });
      lines.push({ at: at + 56, kind: "text", prefix: "⏺ ", text: t.then });
      lines.push({ at: at + 60, kind: "text", text: "" });
    }
  });

  lines.push({ at: PLAN_AT, kind: "text", text: "" });
  lines.push({ at: PLAN_AT + 2, kind: "text", prefix: "⏺ ", text: "Plan: 3 × claude-opus-5 @ xhigh, split by layer.", color: "accent" });
  lines.push({ at: PLAN_AT + 10, kind: "text", prefix: "  ", text: "Parallel safety came back 0.46, so they run one at", color: "warn" });
  lines.push({ at: PLAN_AT + 14, kind: "text", prefix: "  ", text: "a time unless the jobs don't share the session store.", color: "warn" });
  return lines;
};
