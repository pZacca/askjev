import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, mono, sans } from "./theme";

// Sits behind the terminal; becomes visible when the terminal flips away.
export const Logo: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - from;

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", textAlign: "center", fontFamily: sans, padding: 96 }}
    >
      <div
        style={{
          fontSize: 170,
          fontWeight: 700,
          letterSpacing: -7,
          lineHeight: 1,
          color: "#0F172A",
          transform: `scale(${interpolate(t, [0, 0.5 * fps], [0.85, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          })})`,
          opacity: interpolate(t, [0, 0.3 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        ask<span style={{ color: colors.accent }}>jev</span>
      </div>
      <div
        style={{
          marginTop: 26,
          fontSize: 42,
          fontWeight: 500,
          color: "#475569",
          maxWidth: 860,
          lineHeight: 1.3,
          opacity: interpolate(t, [0.4 * fps, 0.8 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        One MCP tool. Jev routes your question and answers with calibrated confidence.
      </div>
      <div
        style={{
          marginTop: 54,
          fontFamily: mono,
          fontSize: 46,
          color: "#F8FAFC",
          backgroundColor: "#0F172A",
          borderRadius: 18,
          padding: "20px 40px",
          boxShadow: "0 30px 60px -20px rgba(15,23,42,0.45)",
          transform: `scale(${interpolate(t, [0.8 * fps, 1.3 * fps], [0.9, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          })})`,
          opacity: interpolate(t, [0.8 * fps, 1.1 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        npx -y askjev
      </div>
      <div
        style={{
          marginTop: 44,
          fontFamily: mono,
          fontSize: 27,
          color: "#64748B",
          lineHeight: 1.6,
          opacity: interpolate(t, [1.3 * fps, 1.7 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        github.com/pZacca/askjev · MIT · unofficial
        <br />
        built on Jev by Typesafe AI
      </div>
    </AbsoluteFill>
  );
};
