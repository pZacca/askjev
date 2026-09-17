import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { QuestionData } from "../data";
import { colors, mono, sans } from "../theme";

export const Question: React.FC<{ data: QuestionData; index: number; total: number }> = ({
  data,
  index,
  total,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const typed = Math.round(
    interpolate(frame, [0.1 * fps, 0.9 * fps], [0, data.question.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const answerAt = 1.2 * fps;
  const uncertain = data.confidence < 0.5;
  const winner = data.bars.reduce((a, b) => (b.p > a.p ? b : a));

  return (
    <AbsoluteFill
      name="Question scene"
      style={{ backgroundColor: colors.bg, padding: 96, fontFamily: sans, justifyContent: "center" }}
    >
      <Interactive.Div
        name="Step label"
        style={{ fontFamily: mono, fontSize: 28, color: colors.muted, marginBottom: 28 }}
      >
        planner → ask({index + 1}/{total})
      </Interactive.Div>

      <Interactive.Div
        name="Question"
        style={{ fontSize: 56, fontWeight: 700, color: colors.text, lineHeight: 1.15, letterSpacing: -1, minHeight: 130 }}
      >
        {data.question.slice(0, typed)}
        <span
          style={{
            color: colors.accent,
            opacity: interpolate(frame % fps, [0, fps / 2, fps], [1, 0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          |
        </span>
      </Interactive.Div>

      {data.options ? (
        <Interactive.Div
          name="Options"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            marginTop: 24,
            fontFamily: mono,
            fontSize: 28,
            opacity: interpolate(frame, [0.9 * fps, 1.2 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {data.options.map((o) => (
            <div
              key={o}
              style={{
                padding: "8px 18px",
                borderRadius: 12,
                border: `2px solid ${colors.line}`,
                color: colors.muted,
              }}
            >
              {o}
            </div>
          ))}
        </Interactive.Div>
      ) : null}

      <Interactive.Div
        name="Answer panel"
        style={{
          marginTop: 44,
          backgroundColor: colors.panel,
          border: `2px solid ${colors.line}`,
          borderRadius: 24,
          padding: 36,
          opacity: interpolate(frame, [answerAt, answerAt + 0.4 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [answerAt, answerAt + 0.4 * fps], ["0px 24px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 22 }}>
          <div style={{ fontFamily: mono, fontSize: 30, color: colors.muted }}>{data.kind}</div>
          <div style={{ fontFamily: mono, fontSize: 30, color: uncertain ? colors.warn : colors.ok }}>
            confidence {data.confidence.toFixed(2)}
          </div>
        </div>

        {data.bars.map((bar, i) => {
          const start = answerAt + 0.15 * fps + i * 0.08 * fps;
          const isWinner = bar.label === winner.label;
          return (
            <div
              key={bar.label}
              style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 14, fontFamily: mono, fontSize: 32 }}
            >
              <div style={{ width: 200, textAlign: "right", color: isWinner ? colors.text : colors.muted, fontWeight: isWinner ? 700 : 400 }}>
                {bar.label}
              </div>
              <div style={{ flex: 1, height: 34, borderRadius: 10, backgroundColor: colors.bg, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 10,
                    backgroundColor: isWinner ? (uncertain ? colors.warn : colors.accent) : colors.line,
                    width: `${interpolate(frame, [start, start + 0.6 * fps], [0, Math.max(bar.p * 100, 1.5)], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: Easing.spring({ damping: 200 }),
                    })}%`,
                  }}
                />
              </div>
              <div style={{ width: 90, color: isWinner ? colors.text : colors.muted }}>{bar.p.toFixed(2)}</div>
            </div>
          );
        })}

        {data.note ? (
          <div
            style={{
              marginTop: 18,
              fontFamily: mono,
              fontSize: 28,
              color: colors.warn,
              opacity: interpolate(frame, [answerAt + 1.0 * fps, answerAt + 1.3 * fps], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {data.note}
          </div>
        ) : null}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
