import { Panel, EmptyState } from "../../components/ui/misc";
import { ProjectTag } from "../../components/ui/pills";
import { Icon } from "../../components/ui/icons";
import { useAuth } from "../../auth/AuthContext";
import { useData } from "../../store/DataContext";
import { isStale } from "../../lib/derive";
import { fmtDate, fmtShort } from "../../lib/format";

// Stat tile matching DevDashboard prototype
function Tile({ label, value, icon, tone, sub, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--paper)", border: "1px solid var(--bd-1)", borderRadius: "var(--r-2)",
        padding: "14px 16px", cursor: onClick ? "pointer" : "default",
        transition: "border-color 120ms var(--ease)",
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.borderColor = "var(--scai-teal)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--bd-1)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <Icon name={icon} size={13} style={{ color: tone || "var(--fg-3)" }} />
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 600,
          letterSpacing: "0.13em", textTransform: "uppercase", color: "var(--fg-3)",
        }}>{label}</span>
      </div>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 34, fontWeight: 700,
        color: tone || "var(--fg-1)", lineHeight: 1, letterSpacing: "-0.03em",
      }}>{value}</div>
      {sub && <div style={{ fontFamily: "var(--font-body)", fontSize: 11.5, color: "var(--fg-3)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard({ onOpenTask, onRequestExt, goTo }) {
  const { user } = useAuth();
  const { tasks, projects } = useData();

  // Filter to tasks assigned to this developer
  const myTasks = tasks.filter((t) => t.assignee === user?.id);
  const staleTasks = myTasks.filter((t) => isStale(t));
  const inReview = myTasks.filter((t) => t.status === "in_review");
  const open = myTasks.filter((t) => t.status !== "done");
  const myReqs = myTasks.filter((t) => t.ext);
  const pending = myReqs.filter((t) => t.ext.state === "pending");

  const firstName = user?.name?.split(" ")[0] || "Developer";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "22px 28px" }}>
      {/* Greeting */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: 18, fontWeight: 600, color: "var(--fg-1)" }}>
          {firstName}'s workspace
        </p>
        <p style={{ margin: "4px 0 0", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)" }}>
          {today} · {projects.length} active space{projects.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Stat tiles — 4 columns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 22 }}>
        <Tile
          label="Open tasks"
          value={open.length}
          icon="circle-dot"
          sub="assigned to you"
          onClick={() => goTo("dashboard")}
        />
        <Tile
          label="Stale"
          value={staleTasks.length}
          icon="alert-triangle"
          tone={staleTasks.length ? "var(--danger)" : undefined}
          sub={staleTasks.length ? "past deadline" : "on track"}
          onClick={() => goTo("dashboard")}
        />
        <Tile
          label="In review"
          value={inReview.length}
          icon="eye"
          tone={inReview.length ? "var(--scai-teal)" : undefined}
          sub="awaiting sign-off"
        />
        <Tile
          label="Ext. requests"
          value={pending.length}
          icon="calendar-clock"
          tone={pending.length ? "var(--scai-teal)" : undefined}
          sub="pending review"
          onClick={() => goTo("requests")}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18, alignItems: "start" }}>
        {/* Stale tasks panel */}
        <Panel
          pad={false}
          title="Stale tasks — need attention"
          right={
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)" }}>
              {staleTasks.length} overdue
            </span>
          }
        >
          {staleTasks.length === 0 ? (
            <div style={{ padding: 8 }}>
              <EmptyState
                icon="check-circle-2"
                title="Nothing stale"
                sub="All your tasks are within their deadlines."
              />
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {staleTasks.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onOpenTask(t.id)}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--bd-1)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <ProjectTag projectId={t.project} />
                        <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "var(--fg-1)" }}>
                          {t.title}
                        </span>
                        {t.ext && t.ext.state === "pending" && (
                          <Icon name="hourglass" size={12} style={{ color: "var(--scai-teal)" }} />
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--bd-1)", whiteSpace: "nowrap" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--danger)", fontWeight: 600 }}>
                        {Math.abs(t.daysLeft)}d overdue
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--bd-1)" }}>
                      {(!t.ext || t.ext.state !== "pending") && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onRequestExt(t); }}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            background: "rgba(46,175,183,0.10)", color: "var(--scai-teal)",
                            border: "1px solid rgba(46,175,183,0.22)", borderRadius: 2,
                            padding: "4px 8px", fontFamily: "var(--font-mono)", fontSize: 10.5,
                            fontWeight: 600, cursor: "pointer", letterSpacing: "0.04em",
                          }}
                        >
                          <Icon name="calendar-plus" size={11} /> Request ext
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        {/* Extension requests feed */}
        <Panel title="Extension requests">
          {myReqs.length === 0 ? (
            <EmptyState
              icon="calendar-clock"
              title="No requests"
              sub="Request more time from any overdue task."
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {myReqs.map((t) => {
                const e = t.ext;
                const isPending = e.state === "pending";
                const dotColor = isPending
                  ? "var(--scai-teal)"
                  : e.state === "approved"
                  ? "var(--success)"
                  : "var(--danger)";
                return (
                  <div
                    key={t.id}
                    onClick={() => onOpenTask(t.id)}
                    style={{
                      padding: "10px 12px", background: "var(--paper-2)",
                      border: "1px solid var(--bd-1)", borderRadius: "var(--r-1)", cursor: "pointer",
                    }}
                    onMouseEnter={(e2) => (e2.currentTarget.style.borderColor = "var(--bd-2)")}
                    onMouseLeave={(e2) => (e2.currentTarget.style.borderColor = "var(--bd-1)")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)" }}>{t.key}</span>
                      <span style={{
                        marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10,
                        fontWeight: 600, color: dotColor, textTransform: "capitalize", letterSpacing: "0.05em",
                      }}>
                        {isPending ? "PENDING" : e.state.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 500, color: "var(--fg-1)", marginBottom: 4, lineHeight: 1.3 }}>
                      {t.title}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>
                      {fmtShort(e.originalDeadline)} → {fmtShort(e.grantedDate || e.requestedDate)}
                    </div>
                    {e.managerNote && (
                      <div style={{ marginTop: 6, fontFamily: "var(--font-body)", fontSize: 11.5, color: "var(--fg-2)", fontStyle: "italic" }}>
                        "{e.managerNote}"
                      </div>
                    )}
                  </div>
                );
              })}
              <button
                onClick={() => goTo("requests")}
                style={{
                  fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--scai-teal)",
                  background: "transparent", border: "none", cursor: "pointer",
                  textAlign: "left", display: "flex", alignItems: "center", gap: 5, letterSpacing: "0.04em",
                }}
              >
                View all <Icon name="arrow-right" size={12} />
              </button>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
