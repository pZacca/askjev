import { interpolate, useCurrentFrame } from "remotion";
import { buildScript } from "./script";
import { colors, mono } from "./theme";

const BAR = 18;
const LINE_PX = 27 * 1.55;
const VISIBLE = 15;
const tone = { muted: colors.fill, accent: colors.accent, ok: colors.ok, warn: colors.warn, text: colors.text };

export const TerminalContent: React.FC = () => {
  const frame = useCurrentFrame();
  const lines = buildScript().filter((l) => l.at <= frame);
  const last = lines[lines.length - 1];
  const typingDone = !last || last.kind !== "cmd" || frame >= last.at + last.typeFrames;
  const blink = Math.floor(frame / 15) % 2 === 0;

  return (
    <div
      style={{
        fontFamily: mono,
        fontSize: 27,
        lineHeight: 1.55,
        color: colors.text,
        whiteSpace: "pre",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div style={{ transform: `translateY(${-Math.max(0, (lines.length + 1 - VISIBLE) * LINE_PX)}px)` }}>
      {lines.map((l, i) => {
        if (l.kind === "cmd") {
          const n = Math.round(
            interpolate(frame, [l.at, l.at + l.typeFrames], [0, l.text.length], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          );
          const isLast = i === lines.length - 1;
          return (
            <div key={i}>
              <span style={{ color: colors.accent }}>❯ </span>
              {l.text.slice(0, n)}
              {isLast && !typingDone ? <span style={{ color: colors.accent }}>▌</span> : null}
            </div>
          );
        }
        if (l.kind === "bar") {
          const filled = Math.round(
            interpolate(frame, [l.at, l.at + 16], [0, l.p * BAR], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          );
          const shown = interpolate(frame, [l.at, l.at + 16], [0, l.p], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div key={i} style={{ color: l.color === "muted" ? colors.muted : colors.text }}>
              {"  "}
              {l.label.padEnd(19)}
              <span style={{ color: tone[l.color] }}>{"█".repeat(filled)}</span>
              <span style={{ color: colors.fill }}>{"░".repeat(BAR - filled)}</span>
              {"  "}
              <span style={{ color: l.color === "muted" ? colors.muted : tone[l.color] }}>{shown.toFixed(2)}</span>
            </div>
          );
        }
        return (
          <div key={i} style={{ color: l.color === "muted" ? colors.muted : l.color ? tone[l.color] : colors.text, minHeight: "1.55em" }}>
            {l.text}
          </div>
        );
      })}
      {typingDone ? (
        <div>
          <span style={{ color: colors.accent }}>❯ </span>
          <span style={{ color: colors.accent, opacity: blink ? 1 : 0 }}>▌</span>
        </div>
      ) : null}
      </div>
    </div>
  );
};
