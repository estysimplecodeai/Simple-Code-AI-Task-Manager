import { useState } from "react";
import { Icon } from "./icons";
import logo from "../../assets/scai-logo.png";

// top: [{ id, label, icon, badge, danger }]
// spaces: [{ id, name, key, staleCount, hasExt }]
// active: { view, projectId, subView }
// onNavigate: (view, projectId, subView) => void
// footer: ReactNode
export default function Sidebar({ tag, top = [], spaces = [], active = {}, onNavigate, footer, onNewTask }) {
  const [expanded, setExpanded] = useState(() => new Set(spaces.map((s) => s.id)));

  function toggleExpand(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function NavBtn({ id, icon, label, badge, danger }) {
    const active_ = active.view === id;
    return (
      <button onClick={() => onNavigate(id)} style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: active_ ? "8px 10px 8px 8px" : "8px 10px",
        background: active_ ? (danger ? "rgba(207,34,46,0.06)" : "rgba(46,175,183,0.08)") : "transparent",
        borderTop: "none", borderRight: "none", borderBottom: "none",
        borderLeft: `2px solid ${active_ ? (danger ? "var(--danger)" : "var(--scai-teal)") : "transparent"}`,
        borderRadius: active_ ? "0 var(--r-1) var(--r-1) 0" : "var(--r-1)",
        color: active_ ? "var(--fg-1)" : "var(--fg-2)",
        fontFamily: "var(--font-body)", fontSize: 13, fontWeight: active_ ? 500 : 400,
        cursor: "pointer", textAlign: "left", width: "100%", transition: "background 120ms",
      }}
      onMouseEnter={e => { if (!active_) { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = "var(--fg-1)"; }}}
      onMouseLeave={e => { if (!active_) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-2)"; }}}>
        <Icon name={icon} size={15} style={{ color: active_ ? (danger ? "var(--danger)" : "var(--scai-teal)") : (danger && badge > 0 ? "var(--danger)" : "var(--fg-3)") }} />
        <span style={{ flex: 1 }}>{label}</span>
        {badge > 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 9, background: danger ? "var(--danger)" : "var(--scai-teal)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{badge}</span>}
      </button>
    );
  }

  return (
    <aside style={{ width: 234, flexShrink: 0, background: "var(--paper-2)", borderRight: "1px solid var(--bd-1)", display: "flex", flexDirection: "column", padding: "16px 12px", position: "relative", overflow: "hidden" }}>
      {/* decorative radial glow */}
      <div style={{ position: "absolute", top: -30, left: -20, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(46,175,183,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Logo + tag */}
      <div style={{ padding: "6px 8px 16px", position: "relative" }}>
        <img src={logo} alt="Simple Code AI" height="32" style={{ display: "block", mixBlendMode: "multiply", maxWidth: "100%", marginBottom: 6 }} />
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, letterSpacing: "0.22em", color: "var(--scai-teal)", textTransform: "uppercase", opacity: 0.8 }}>{tag}</div>
      </div>

      {/* Top nav items (Dashboard, Extension requests, Stale tasks, etc.) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, position: "relative", marginBottom: 4 }}>
        {top.map((item) => (
          <NavBtn key={item.id} id={item.id} icon={item.icon} label={item.label} badge={item.badge || 0} danger={item.danger} />
        ))}
      </div>

      {/* SPACES section header */}
      <div style={{ margin: "12px 0 6px", fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-3)", padding: "0 10px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ flex: 1 }}>Spaces</span>
        {onNewTask && (
          <button onClick={onNewTask} title="New task" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, background: "transparent", border: "1px solid var(--bd-2)", borderRadius: 3, cursor: "pointer", color: "var(--fg-3)" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--scai-teal)"; e.currentTarget.style.color = "var(--scai-teal)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bd-2)"; e.currentTarget.style.color = "var(--fg-3)"; }}>
            <Icon name="plus" size={11} />
          </button>
        )}
      </div>

      {/* Spaces list — collapsible */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1, overflowY: "auto", flex: 1 }}>
        {spaces.map((space) => {
          const isOpen = expanded.has(space.id);
          const isActiveSpace = active.view === "space" && active.projectId === space.id;
          const currentSubView = active.subView || "board";

          return (
            <div key={space.id}>
              {/* Space row: name + chevron toggle */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <button
                  onClick={() => {
                    onNavigate("space", space.id, currentSubView);
                    if (!isOpen) toggleExpand(space.id);
                  }}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", gap: 8,
                    padding: "7px 8px 7px 10px",
                    background: isActiveSpace ? "rgba(46,175,183,0.06)" : "transparent",
                    borderTop: "none", borderRight: "none", borderBottom: "none",
                    borderLeft: `2px solid ${isActiveSpace ? "var(--scai-teal)" : "transparent"}`,
                    borderRadius: "0 var(--r-1) var(--r-1) 0",
                    cursor: "pointer", textAlign: "left",
                  }}
                  onMouseEnter={e => { if (!isActiveSpace) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={e => { if (!isActiveSpace) e.currentTarget.style.background = "transparent"; }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: isActiveSpace ? "var(--scai-teal)" : "var(--fg-3)" }} />
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: isActiveSpace ? 600 : 400, color: isActiveSpace ? "var(--fg-1)" : "var(--fg-2)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{space.name}</span>
                  {space.staleCount > 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--danger)", background: "rgba(248,81,73,0.12)", border: "1px solid rgba(248,81,73,0.25)", borderRadius: 2, padding: "1px 5px" }}>{space.staleCount}</span>}
                  {space.hasExt && <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--scai-teal)", background: "rgba(46,175,183,0.12)", border: "1px solid rgba(46,175,183,0.25)", borderRadius: 2, padding: "1px 5px" }}>ext</span>}
                </button>
                <button
                  onClick={() => toggleExpand(space.id)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 28, background: "transparent", border: "none", cursor: "pointer", color: "var(--fg-3)", flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--fg-1)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--fg-3)")}>
                  <Icon name={isOpen ? "chevron-down" : "chevron-right"} size={12} />
                </button>
              </div>

              {/* Sub-items: Board + List */}
              {isOpen && (
                <div style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 1, marginBottom: 4 }}>
                  {[["board", "kanban-square", "Board"], ["list", "list", "List"]].map(([sv, icon, label]) => {
                    const subActive = isActiveSpace && active.subView === sv;
                    return (
                      <button key={sv} onClick={() => onNavigate("space", space.id, sv)}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: subActive ? "6px 10px 6px 8px" : "6px 10px",
                          background: subActive ? "rgba(46,175,183,0.10)" : "transparent",
                          borderTop: "none", borderRight: "none", borderBottom: "none",
                          borderLeft: `2px solid ${subActive ? "var(--scai-teal)" : "transparent"}`,
                          borderRadius: "0 var(--r-1) var(--r-1) 0",
                          color: subActive ? "var(--scai-teal)" : "var(--fg-3)",
                          fontFamily: "var(--font-body)", fontSize: 12, fontWeight: subActive ? 600 : 400,
                          cursor: "pointer", textAlign: "left", width: "100%",
                        }}
                        onMouseEnter={e => { if (!subActive) { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "var(--fg-2)"; }}}
                        onMouseLeave={e => { if (!subActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-3)"; }}}>
                        <Icon name={icon} size={13} style={{ color: "currentColor" }} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {footer}
    </aside>
  );
}
