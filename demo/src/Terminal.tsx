import { colors } from "./theme";
import { TerminalContent } from "./TerminalContent";

export const Terminal: React.FC = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 22,
        overflow: "hidden",
        backgroundColor: colors.bg,
        boxShadow: "0 60px 120px -20px rgba(15, 23, 42, 0.55), 0 30px 60px -30px rgba(15, 23, 42, 0.5)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          height: 64,
          backgroundColor: "#161C29",
          borderBottom: `1px solid ${colors.line}`,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: "#ff5f57" }} />
          <div style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: "#febc2e" }} />
          <div style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: "#28c840" }} />
        </div>
        <div style={{ flex: 1, textAlign: "center", color: colors.muted, fontSize: 24, fontFamily: "Inter, system-ui" }}>
          planner — askjev
        </div>
        <div style={{ width: 78 }} />
      </div>
      <div style={{ flex: 1, padding: "28px 34px", minHeight: 0 }}>
        <TerminalContent />
      </div>
    </div>
  );
};
