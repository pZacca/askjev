import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, mono, sans } from "../theme";

export const Task: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      name="Task scene"
      style={{ backgroundColor: colors.bg, padding: 96, justifyContent: "center", fontFamily: sans }}
    >
      <Interactive.Div
        name="Headline"
        style={{
          fontSize: 84,
          fontWeight: 700,
          color: colors.text,
          lineHeight: 1.05,
          letterSpacing: -2,
          opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [0, 0.5 * fps], ["0px 24px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Before spawning agents,
        <br />
        <span style={{ color: colors.accent }}>ask.</span>
      </Interactive.Div>

      <Interactive.Div
        name="Task card"
        style={{
          marginTop: 56,
          backgroundColor: colors.panel,
          border: `2px solid ${colors.line}`,
          borderRadius: 24,
          padding: 40,
          fontFamily: mono,
          fontSize: 34,
          lineHeight: 1.5,
          color: colors.text,
          opacity: interpolate(frame, [0.6 * fps, 1.1 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [0.6 * fps, 1.1 * fps], ["0px 24px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <div style={{ color: colors.muted, fontSize: 28, marginBottom: 12 }}>state: the task</div>
        <div>Migrate cookie sessions → JWT</div>
        <div>in a Rails monolith.</div>
        <div style={{ color: colors.muted }}>40 controllers · 3 jobs · 220 specs</div>
        <div style={{ color: colors.muted }}>30-day session overlap · zero downtime</div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
