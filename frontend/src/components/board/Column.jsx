import { useState } from "react";
import { Icon } from "../ui/icons";

const COLUMN_META = {
  todo:        { headColor: "var(--fg-3)",        emptyMsg: "—" },
  in_progress: { headColor: "var(--scai-teal)",   emptyMsg: "—" },
  in_review:   { headColor: "var(--coral-400)",   emptyMsg: "—" },
  stale:       { headColor: "var(--danger)",      emptyMsg: "None overdue." },
  done:        { headColor: "var(--success)",     emptyMsg: "Nothing shipped." },
};

export default function Column({ status, label, count, droppable, onDropTask, children }) {
  const [over, setOver] = useState(false);
  const meta = COLUMN_META[status] || COLUMN_META.todo;
  const isStaleCol = status === "stale";

  function handleDragOver(e) {
    if (!droppable) return;
    e.preventDefault();
    setOver(true);
  }
  function handleDragLeave() {
    setOver(false);
  }
  function handleDrop() {
    setOver(false);
    if (isStaleCol) return; // read-only column
    if (droppable) onDropTask(status);
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        flex: "1 1 0",
        minWidth: 228,
        display: "flex",
        flexDirection: "column",
        background: isStaleCol ? "rgba(248,81,73,0.05)" : "var(--paper-2)",
        border: `1px solid ${over ? "var(--scai-teal)" : isStaleCol ? "rgba(248,81,73,0.30)" : "var(--bd-1)"}`,
        borderRadius: "var(--r-2)",
        transition: "border-color 120ms var(--ease)",
        maxHeight: "100%",
        minHeight: 200,
      }}
    >
      {/* Column header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid var(--bd-1)", flexShrink: 0 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: meta.headColor, flexShrink: 0 }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, fontWeight: 600, color: "var(--fg-1)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {label}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", marginLeft: "auto" }}>{count}</span>
        {isStaleCol && <Icon name="alert-triangle" size={12} style={{ color: "var(--danger)" }} />}
      </div>

      {/* Column body */}
      <div style={{ flex: 1, overflowY: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
        {count === 0 && (
          <div style={{ padding: "16px 8px", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>
            {meta.emptyMsg}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
