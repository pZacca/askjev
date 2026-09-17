import { QUESTIONS } from "./data";

export type Line =
  | { at: number; kind: "cmd"; text: string; typeFrames: number }
  | { at: number; kind: "text"; text: string; color?: "muted" | "accent" | "ok" | "warn" }
  | { at: number; kind: "bar"; label: string; p: number; color: "ok" | "warn" | "accent" | "muted" };

// Frame timeline of the terminal session. Real numbers from one askjev call (see data.ts).
export const Q_START = 46;
export const Q_EVERY = 84;
export const PLAN_AT = Q_START + QUESTIONS.length * Q_EVERY + 4;
export const FLIP_AT = PLAN_AT + 40;

export const buildScript = (): Line[] => {
  const lines: Line[] = [
    { at: 8, kind: "text", text: "state: cookie sessions → JWT, Rails monolith", color: "muted" },
    { at: 11, kind: "text", text: "       40 controllers · 3 jobs · 220 specs", color: "muted" },
    { at: 14, kind: "text", text: "" },
  ];

  QUESTIONS.forEach((q, i) => {
    const at = Q_START + i * Q_EVERY;
    lines.push({ at, kind: "cmd", text: `ask "${q.short}"`, typeFrames: 22 });
    if (q.options) {
      lines.push({
        at: at + 24,
        kind: "text",
        text: `  options: ${q.options.map((o) => o.replace("claude-", "")).join(" / ")}`,
        color: "muted",
      });
    }
    const sorted = [...q.bars].sort((a, b) => b.p - a.p);
    const winner = sorted[0];
    const runner = sorted[1];
    const uncertain = q.confidence < 0.5;
    lines.push({
      at: at + 28,
      kind: "bar",
      label: `${q.kind.padEnd(7)}${winner.label}`,
      p: winner.p,
      color: uncertain ? "warn" : "ok",
    });
    if (runner) {
      lines.push({ at: at + 31, kind: "bar", label: `${"".padEnd(7)}${runner.label}`, p: runner.p, color: "muted" });
    }
    if (q.note) {
      lines.push({ at: at + 40, kind: "text", text: "         ↳ uncertain → ask the user, don't guess", color: "warn" });
    }
    lines.push({ at: at + 44, kind: "text", text: "" });
  });

  lines.push({ at: PLAN_AT, kind: "text", text: "plan → 3 agents · by layer · opus-5 · xhigh", color: "accent" });
  lines.push({ at: PLAN_AT + 6, kind: "text", text: "       parallel? 0.46 → asking the user first", color: "warn" });
  return lines;
};
