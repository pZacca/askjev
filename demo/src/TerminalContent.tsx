import { interpolate, useCurrentFrame } from "remotion";
import { buildScript } from "./script";
import { colors, mono } from "./theme";

const BAR = 14;
const LINE_PX = 26 * 1.55;
const VISIBLE = 16;
const tone = { text: colors.text, muted: colors.muted, accent: colors.accent, warn: colors.warn };

export const TerminalContent: React.FC = () => {
  const frame = useCurrentFrame();
  const lines = buildScript().filter((l) => l.at <= frame);
  const last = lines[lines.length - 1];
  const typing = last?.kind === "typed" && frame < last.at + last.typeFrames;
  const blink = Math.floor(frame / 15) % 2 === 0;

  return (
    <div style={{ fontFamily: mono, fontSize: 26, lineHeight: 1.55, color: colors.text, whiteSpace: "pre", height: "100%", overflow: "hidden" }}>
      <div style={{ transform: `translateY(${-Math.max(0, (lines.length + 1 - VISIBLE) * LINE_PX)}px)` }}>
        {lines.map((l, i) => {
          if (l.kind === "typed") {
            const n = Math.round(
              interpolate(frame, [l.at, l.at + l.typeFrames], [0, l.text.length], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            );
            const isLast = i === lines.length - 1;
            return (
              <div key={i} style={{ color: tone[l.color ?? "text"] }}>
                <span style={{ color: colors.accent }}>{l.prefix}</span>
                {l.text.slice(0, n)}
                {isLast && typing ? <span style={{ color: colors.accent }}>▌</span> : null}
              </div>
            );
          }
          if (l.kind === "bar") {
            const filled = Math.round(
              interpolate(frame, [l.at, l.at + 16], [0, l.p * BAR], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            );
            const shown = interpolate(frame, [l.at, l.at + 16], [0, l.p], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const c = l.uncertain ? colors.warn : colors.ok;
            const runnerShown = interpolate(frame, [l.at + 10, l.at + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={i}>
                <span style={{ color: colors.muted }}>{"  ⎿  "}</span>
                <span style={{ fontWeight: 600 }}>{l.answer.padEnd(10)}</span>
                <span style={{ color: c }}>{"█".repeat(filled)}</span>
                <span style={{ color: colors.fill }}>{"░".repeat(BAR - filled)}</span>
                {"  "}
                <span style={{ color: c }}>{shown.toFixed(2)}</span>
                <span style={{ color: colors.muted, opacity: runnerShown }}>{`   ${l.runner} ${l.runnerP.toFixed(2)}`}</span>
              </div>
            );
          }
          return (
            <div key={i} style={{ color: tone[l.color ?? "text"], minHeight: "1.55em" }}>
              {l.prefix ? <span style={{ color: l.prefix.trim() ? colors.accent : "inherit" }}>{l.prefix}</span> : null}
              {l.text}
            </div>
          );
        })}
        {!typing ? (
          <div>
            <span style={{ color: colors.accent }}>❯ </span>
            <span style={{ color: colors.accent, opacity: blink ? 1 : 0 }}>▌</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};
