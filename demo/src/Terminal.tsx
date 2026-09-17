import { colors, mono } from "./theme";
import { TerminalContent } from "./TerminalContent";

export const Terminal: React.FC = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: colors.bg,
        border: `1px solid ${colors.line}`,
        boxShadow: "0 0 0 1px rgba(132,255,176,0.08), 0 40px 90px -20px rgba(0,0,0,0.9), 0 0 120px -40px rgba(132,255,176,0.35)",
      }}
    >
      <div
        style={{
          height: 62,
          backgroundColor: colors.bar,
          borderBottom: `1px solid ${colors.line}`,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: "#2a2a2a", border: "1px solid #3a3a3a" }} />
          <div style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: "#2a2a2a", border: "1px solid #3a3a3a" }} />
          <div style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: colors.accent }} />
        </div>
        <div style={{ flex: 1, textAlign: "center", color: colors.muted, fontSize: 24, fontFamily: mono }}>
          planner — askjev
        </div>
        <div style={{ width: 72 }} />
      </div>
      <div style={{ flex: 1, padding: "28px 34px", minHeight: 0 }}>
        <TerminalContent />
      </div>
    </div>
  );
};
