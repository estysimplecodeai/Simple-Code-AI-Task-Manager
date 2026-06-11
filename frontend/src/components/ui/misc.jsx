import { Icon } from "./icons";

export function EmptyState({ icon = "inbox", title, sub }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "52px 24px", textAlign: "center" }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(46,175,183,0.10)", border: "1px solid rgba(46,175,183,0.22)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <Icon name={icon} size={24} style={{ color: "var(--scai-teal)" }} />
      </div>
      <div style={{ fontFamily: "var(--font-body)", fontSize: 17, fontWeight: 600, color: "var(--fg-2)", marginBottom: 5 }}>{title}</div>
      {sub && <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-3)", maxWidth: 360, lineHeight: 1.55 }}>{sub}</div>}
    </div>
  );
}

export function MetaRow({ icon, label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--bd-1)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, width: 116, flexShrink: 0, color: "var(--fg-3)" }}>
        <Icon name={icon} size={13} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

export function Panel({ title, right, children, pad = true, style }) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid var(--bd-1)", borderRadius: "var(--r-2)", overflow: "hidden", ...style }}>
      {title && <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--bd-1)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 600, flex: 1, color: "var(--fg-1)" }}>{title}</div>
        {right}
      </div>}
      <div style={{ padding: pad ? 16 : 0 }}>{children}</div>
    </div>
  );
}

export function Stat({ label, value, tone }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 700, color: tone || "var(--fg-1)", lineHeight: 1, letterSpacing: "-0.03em" }}>{value}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--fg-3)", marginTop: 5 }}>{label}</div>
    </div>
  );
}
