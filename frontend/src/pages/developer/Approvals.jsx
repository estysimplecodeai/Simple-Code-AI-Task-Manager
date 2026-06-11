import { Panel, EmptyState } from "../../components/ui/misc";
import { ProjectTag } from "../../components/ui/pills";
import { Icon } from "../../components/ui/icons";
import Avatar from "../../components/ui/Avatar";
import { useAuth } from "../../auth/AuthContext";
import { useData } from "../../store/DataContext";
import { fmtDate, fmtShort } from "../../lib/format";

// State pill styles matching the dev prototype
const PILL = {
  pending:  { bg: "rgba(210,153,34,0.12)",  fg: "#d29922", bd: "rgba(210,153,34,0.28)" },
  approved: { bg: "rgba(63,185,80,0.12)",   fg: "#3fb950", bd: "rgba(63,185,80,0.25)"  },
  denied:   { bg: "rgba(248,81,73,0.12)",   fg: "#f85149", bd: "rgba(248,81,73,0.28)"  },
};

export default function Approvals({ onOpenTask }) {
  const { user } = useAuth();
  const { tasks, personById } = useData();

  // All tasks this developer has an extension on, pending first
  const reqs = tasks
    .filter((t) => t.ext && t.assignee === user?.id)
    .sort((a, b) => (a.ext.state === "pending" ? -1 : 1));

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
      <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 12 }}>
        {reqs.length === 0 && (
          <Panel>
            <EmptyState
              icon="calendar-clock"
              title="No extension requests"
              sub="When a deadline is too tight, open a task and request more time."
            />
          </Panel>
        )}

        {reqs.map((t) => {
          const e = t.ext;
          const pill = PILL[e.state] || PILL.pending;
          const isPending = e.state === "pending";

          // Try to resolve manager from createdBy
          const manager = t.createdBy ? personById(t.createdBy) : null;
          const managerName = manager?.name || "your manager";
          const managerTitle = manager?.title || "Managing Engineer";

          return (
            <div
              key={t.id}
              style={{
                background: "var(--paper)", border: "1px solid var(--bd-1)",
                borderRadius: "var(--r-2)", padding: "16px 18px",
              }}
            >
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10, flexWrap: "wrap" }}>
                <ProjectTag projectId={t.project} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>{t.key}</span>
                <button
                  onClick={() => onOpenTask(t.id)}
                  style={{
                    fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)",
                    background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left",
                  }}
                >
                  {t.title}
                </button>
                <span style={{
                  marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600,
                  padding: "3px 10px", borderRadius: "var(--r-1)",
                  background: pill.bg, color: pill.fg, border: `1px solid ${pill.bd}`,
                  letterSpacing: "0.06em",
                }}>
                  {isPending ? "PENDING" : e.state.toUpperCase()}
                </span>
              </div>

              {/* Date range */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-2)", marginBottom: 10,
              }}>
                <span style={{
                  textDecoration: e.state === "approved" ? "line-through" : "none",
                  color: "var(--fg-3)",
                }}>
                  {fmtDate(e.originalDeadline)}
                </span>
                <Icon name="arrow-right" size={13} style={{ color: "var(--fg-3)" }} />
                <span style={{
                  color: e.state === "denied" ? "var(--fg-3)" : "var(--scai-teal)",
                  fontWeight: 600,
                }}>
                  {fmtDate(e.grantedDate || e.requestedDate)}
                </span>
                {e.grantedDate && e.grantedDate !== e.requestedDate && (
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--scai-teal)", opacity: 0.8 }}>
                    (adjusted)
                  </span>
                )}
              </div>

              {/* Developer's note */}
              <div style={{
                fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-2)",
                lineHeight: 1.5, paddingLeft: 11, borderLeft: "2px solid var(--bd-1)",
                marginBottom: e.managerNote ? 12 : 0,
              }}>
                "{e.note}"
              </div>

              {/* Requested date */}
              <div style={{
                marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 11,
                color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 5,
              }}>
                <Icon name="calendar" size={11} />
                Requested {fmtShort(e.requestedAt || e.originalDeadline)}
                {e.decidedDate && (
                  <span style={{ marginLeft: 8 }}>
                    · Decided {fmtShort(e.decidedDate)}
                  </span>
                )}
              </div>

              {/* Manager reply */}
              {e.managerNote && (
                <div style={{
                  marginTop: 10, background: "var(--paper-2)", border: "1px solid var(--bd-1)",
                  borderRadius: "var(--r-1)", padding: "10px 12px", display: "flex", gap: 10,
                }}>
                  {manager ? (
                    <Avatar id={t.createdBy} size={26} />
                  ) : (
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", background: "#1e2328",
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, flexShrink: 0,
                    }}>M</div>
                  )}
                  <div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 11.5, fontWeight: 600, color: "var(--fg-1)" }}>
                      {managerName}{" "}
                      <span style={{ fontWeight: 400, color: "var(--fg-3)" }}>· {managerTitle}</span>
                    </div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5, marginTop: 2 }}>
                      {e.managerNote}
                    </div>
                  </div>
                </div>
              )}

              {/* Awaiting review notice */}
              {isPending && (
                <div style={{
                  marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)",
                  display: "flex", alignItems: "center", gap: 6, letterSpacing: "0.02em",
                }}>
                  <Icon name="clock" size={12} /> Awaiting review from {managerName}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
