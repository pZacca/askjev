import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, mono, sans } from "../theme";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      name="Outro scene"
      style={{ backgroundColor: colors.bg, padding: 96, justifyContent: "center", alignItems: "center", fontFamily: sans, textAlign: "center" }}
    >
      <Interactive.Div
        name="Name"
        style={{
          fontSize: 150,
          fontWeight: 700,
          color: colors.text,
          letterSpacing: -6,
          lineHeight: 1,
          scale: interpolate(frame, [0, 0.6 * fps], [0.9, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 200 }),
            output: "perceptual-scale",
          }),
          opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        ask<span style={{ color: colors.accent }}>jev</span>
      </Interactive.Div>

      <Interactive.Div
        name="Tagline"
        style={{
          marginTop: 28,
          fontSize: 44,
          fontWeight: 500,
          color: colors.muted,
          lineHeight: 1.3,
          maxWidth: 860,
          opacity: interpolate(frame, [0.4 * fps, 0.8 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        One MCP tool. Jev routes your question and answers with calibrated confidence.
      </Interactive.Div>

      <Interactive.Div
        name="Install"
        style={{
          marginTop: 56,
          fontFamily: mono,
          fontSize: 44,
          color: colors.text,
          backgroundColor: colors.panel,
          border: `2px solid ${colors.line}`,
          borderRadius: 18,
          padding: "20px 36px",
          opacity: interpolate(frame, [0.9 * fps, 1.3 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          translate: interpolate(frame, [0.9 * fps, 1.3 * fps], ["0px 20px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        npx -y askjev
      </Interactive.Div>

      <Interactive.Div
        name="Footer"
        style={{
          marginTop: 48,
          fontFamily: mono,
          fontSize: 28,
          color: colors.muted,
          opacity: interpolate(frame, [1.4 * fps, 1.8 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        github.com/pZacca/askjev · MIT · unofficial
        <br />
        built on Jev by Typesafe AI
      </Interactive.Div>
    </AbsoluteFill>
  );
};
