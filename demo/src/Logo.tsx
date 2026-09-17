import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, mono } from "./theme";

// Sits behind the terminal; becomes visible when the terminal flips away.
export const Logo: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - from;

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", textAlign: "center", fontFamily: mono, padding: 96 }}
    >
      <Img
        src={staticFile("zacca-logo.svg")}
        style={{
          width: 420,
          opacity: interpolate(t, [0, 0.3 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          transform: `scale(${interpolate(t, [0, 0.5 * fps], [0.85, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          })})`,
        }}
      />
      <div
        style={{
          marginTop: 40,
          fontSize: 40,
          color: colors.text,
          opacity: interpolate(t, [0.3 * fps, 0.6 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        move <span style={{ color: colors.accent }}>→</span> build <span style={{ color: colors.accent }}>→</span> ask<span style={{ color: colors.accent, fontWeight: 700 }}>jev</span>
      </div>
      <div
        style={{
          marginTop: 22,
          fontSize: 30,
          color: colors.muted,
          maxWidth: 860,
          lineHeight: 1.5,
          opacity: interpolate(t, [0.5 * fps, 0.9 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        one MCP tool. <span style={{ color: colors.text }}>Jev</span> routes your question
        <br />
        and answers with <span style={{ color: colors.accent }}>calibrated confidence</span>.
      </div>
      <div
        style={{
          marginTop: 54,
          fontSize: 46,
          fontWeight: 700,
          color: colors.page,
          backgroundColor: colors.accent,
          borderRadius: 12,
          padding: "18px 40px",
          transform: `scale(${interpolate(t, [0.9 * fps, 1.4 * fps], [0.9, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          })})`,
          opacity: interpolate(t, [0.9 * fps, 1.2 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        npx -y askjev
      </div>
      <div
        style={{
          marginTop: 44,
          fontSize: 26,
          color: colors.muted,
          lineHeight: 1.7,
          opacity: interpolate(t, [1.4 * fps, 1.8 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <span style={{ color: colors.warn }}>github.com/pZacca/askjev</span> · MIT · unofficial
        <br />
        made with <span style={{ color: colors.accent }}>&lt;3</span> by <span style={{ color: colors.accent, fontWeight: 700 }}>zacca</span> · built on Jev by Typesafe AI
      </div>
    </AbsoluteFill>
  );
};
