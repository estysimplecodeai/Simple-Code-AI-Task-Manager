import { Fragment } from "react";

export default function TopBar({ crumbs, title, lead, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "13px 24px", borderBottom: "1px solid var(--bd-1)", background: "#ffffff", gap: 16, flexShrink: 0 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {crumbs && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", marginBottom: 3, letterSpacing: "0.02em" }}>
            {crumbs.map((c, i) => (
              <Fragment key={i}>
                <span style={{ color: i === crumbs.length - 1 ? "var(--scai-teal)" : "var(--fg-3)", fontWeight: i === crumbs.length - 1 ? 600 : 400 }}>{c}</span>
                {i < crumbs.length - 1 && <span style={{ color: "var(--bd-3)", margin: "0 1px" }}>/</span>}
              </Fragment>
            ))}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--fg-1)", whiteSpace: "nowrap" }}>{title}</div>
          {lead && <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lead}</div>}
        </div>
      </div>
      {right}
    </div>
  );
}
