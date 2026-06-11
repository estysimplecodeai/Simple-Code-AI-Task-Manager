import { Panel, EmptyState } from "../../components/ui/misc";
import { ProjectTag, StatusPill } from "../../components/ui/pills";
import { Icon } from "../../components/ui/icons";
import Avatar from "../../components/ui/Avatar";
import { useData } from "../../store/DataContext";
import { daysLeft } from "../../lib/derive";
import { fmtShort } from "../../lib/format";

// Stat tile matching MgrDashboard prototype
function MTile({ label, value, unit, tone, icon, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--paper)", border: "1px solid var(--bd-1)", borderRadius: "var(--r-2)",
        padding: "15px 18px", cursor: onClick ? "pointer" : "default",
        transition: "border-color var(--dur-1) var(--ease)",
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.borderColor = "var(--bd-strong, var(--bd-2))"; }}
      onMouseLeave={(e) => { if (onClick) e.currentTarget.style.borderColor = "var(--bd-1)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <Icon name={icon} size={14} style={{ color: tone || "var(--fg-3)" }} />
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600,
          letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--fg-3)",
        }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 38, fontWeight: 700,
          letterSpacing: "-0.02em", color: tone || "var(--fg-1)", lineHeight: 1,
        }}>{value}</span>
        {unit && <span style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--fg-3)" }}>{unit}</span>}
      </div>
    </div>
  );
}

export default function Dashboard({ onOpenTask, goTo }) {
  const { tasks, users, personById } = useData();

  const open = tasks.filter((t) => t.status !== "done");
  const stale = tasks.filter((t) => t.stale).sort((a, b) => daysLeft(a) - daysLeft(b));
  const inReview = tasks.filter((t) => t.status === "in_review");
  const pending = tasks.filter((t) => t.ext && t.ext.state === "pending");

  const developers = users.filter((u) => u.role === "developer");

  // Compute delta days between two ISO dates
  function daysBetween(from, to) {
    if (!from || !to) return 0;
    return Math.round((new Date(to) - new Date(from)) / 86400000);
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
      {/* Lead paragraph */}
      <div style={{ maxWidth: 800, marginBottom: 22 }}>
        <p style={{
          margin: 0, fontFamily: "var(--font-body)", fontSize: 21, fontWeight: 300,
          lineHeight: 1.5, color: "var(--fg-2)",
        }}>
          {stale.length > 0 ? (
            <>
              <span style={{ color: "var(--danger)" }}>
                {stale.length} task{stale.length === 1 ? "" : "s"} {stale.length === 1 ? "has" : "have"} gone stale
              </span>
              {" "}across {new Set(stale.map((t) => t.project)).size} project{new Set(stale.map((t) => t.project)).size === 1 ? "" : "s"}, and{" "}
              <span style={{ color: "var(--scai-teal)" }}>
                {pending.length} extension request{pending.length === 1 ? "" : "s"}
              </span>
              {" "}{pending.length === 1 ? "is" : "are"} waiting on you.
            </>
          ) : (
            <>
              Nothing's overdue right now — <span style={{ color: "var(--fg-1)" }}>{open.length} open tasks</span> across the team, {inReview.length} in review.
            </>
          )}
        </p>
      </div>

      {/* Metric tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
        <MTile
          label="Open tasks"
          value={open.length}
          icon="circle-dot"
          onClick={() => goTo("stale")}
        />
        <MTile
          label="Stale"
          value={stale.length}
          icon="alert-triangle"
          tone={stale.length ? "var(--danger)" : undefined}
          onClick={() => goTo("stale")}
        />
        <MTile
          label="In review"
          value={inReview.length}
          icon="eye"
          tone={inReview.length ? "var(--coral-600, #e05c3a)" : undefined}
        />
        <MTile
          label="Extension requests"
          value={pending.length}
          icon="calendar-clock"
          tone={pending.length ? "var(--coral-600, #e05c3a)" : undefined}
          onClick={() => goTo("requests")}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 18, alignItems: "start" }}>
        {/* Stale tasks panel — red accent treatment */}
        <Panel
          pad={false}
          title={
            <span style={{ color: "var(--danger)", display: "inline-flex", alignItems: "center", gap: 7 }}>
              <Icon name="alert-triangle" size={14} />
              Stale Tasks
            </span>
          }
          right={
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--danger)", fontWeight: 700 }}>
              {stale.length} past deadline
            </span>
          }
        >
          {stale.length === 0 ? (
            <div style={{ padding: 8 }}>
              <EmptyState icon="check-circle-2" title="Nothing stale" sub="Every task is on or ahead of its deadline." />
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--paper-2)" }}>
                  {["Task", "Assignee", "Status", "Overdue"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: h === "Overdue" ? "right" : "left",
                        fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600,
                        letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-3)",
                        padding: "10px 16px", borderBottom: "1px solid var(--bd-2)",
                      }}
                    >{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stale.map((t) => {
                  const assignee = personById(t.assignee);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => onOpenTask(t.id)}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sand-100, #fdf9f4)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "11px 16px", borderBottom: "1px solid var(--bd-1)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <ProjectTag projectId={t.project} />
                          <span style={{ fontWeight: 500 }}>{t.title}</span>
                          {t.ext && t.ext.state === "pending" && (
                            <Icon name="hourglass" size={12} style={{ color: "var(--coral-600, #e05c3a)" }} />
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "11px 16px", borderBottom: "1px solid var(--bd-1)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <Avatar id={t.assignee} size={20} />
                          <span style={{ color: "var(--fg-2)" }}>
                            {assignee ? assignee.name.split(" ")[0] : "—"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "11px 16px", borderBottom: "1px solid var(--bd-1)" }}>
                        <StatusPill status={t.status} />
                      </td>
                      <td style={{
                        padding: "11px 16px", borderBottom: "1px solid var(--bd-1)",
                        textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12,
                        color: "var(--danger)", fontWeight: 600,
                      }}>
                        {Math.abs(daysLeft(t))}d
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Panel>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Extension requests queue */}
          <div style={{
            background: "var(--scai-slate, #1e2328)", border: "1px solid var(--bd-2)",
            borderTop: "1px solid rgba(46,175,183,0.35)", color: "var(--fg-1)",
            borderRadius: "var(--r-2)", padding: "16px 18px",
          }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em",
              textTransform: "uppercase", color: "var(--scai-teal)", marginBottom: 8, opacity: 0.8,
            }}>
              Extension requests
            </div>
            {pending.length === 0 ? (
              <div style={{ fontFamily: "var(--font-body)", fontSize: 13, opacity: 0.8, color: "var(--paper, #fdf9f4)" }}>
                No requests waiting. Developers can ask for more time from any task.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pending.slice(0, 3).map((t) => {
                  const assignee = personById(t.assignee);
                  const addl = daysBetween(t.ext.originalDeadline, t.ext.requestedDate);
                  return (
                    <button
                      key={t.id}
                      onClick={() => onOpenTask(t.id)}
                      style={{
                        textAlign: "left", background: "rgba(0,0,0,0.05)",
                        border: "1px solid rgba(255,255,255,0.14)", borderRadius: "var(--r-1)",
                        padding: "9px 11px", cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.12)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.05)")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                        <Avatar id={t.assignee} size={18} />
                        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--paper, #fdf9f4)", fontWeight: 500 }}>
                          {assignee ? assignee.name.split(" ")[0] : "—"}
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--scai-teal)", marginLeft: "auto" }}>
                          {t.key}
                        </span>
                      </div>
                      <div style={{
                        fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--paper, #fdf9f4)",
                        opacity: 0.92, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {t.title}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--scai-teal)", marginTop: 3 }}>
                        +{addl}d → {fmtShort(t.ext.requestedDate)}
                      </div>
                    </button>
                  );
                })}
                <button
                  onClick={() => goTo("requests")}
                  style={{
                    background: "rgba(46,175,183,0.15)", color: "var(--scai-teal)",
                    border: "1px solid rgba(46,175,183,0.30)", borderRadius: "var(--r-1)",
                    padding: "8px", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(46,175,183,0.25)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(46,175,183,0.15)")}
                >
                  Review all {pending.length} <Icon name="arrow-right" size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Team workload */}
          <Panel title="Team workload">
            {developers.length === 0 ? (
              <EmptyState icon="users" title="No developers yet" sub="Invite developers from the Team page." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {developers.map((d) => {
                  const devTasks = tasks.filter((t) => t.assignee === d.id);
                  const openCount = devTasks.filter((t) => t.status !== "done").length;
                  const staleCount = devTasks.filter((t) => t.stale).length;
                  const max = 6;
                  return (
                    <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar id={d.id} size={26} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--fg-1)", fontWeight: 500 }}>
                            {d.name}
                          </span>
                          {staleCount > 0 && (
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--danger)", marginLeft: "auto" }}>
                              {staleCount} stale
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 3, marginTop: 5 }}>
                          {Array.from({ length: max }).map((_, i) => (
                            <span
                              key={i}
                              style={{
                                height: 5, flex: 1, borderRadius: 2,
                                background: i < openCount
                                  ? (i < staleCount ? "var(--danger)" : "var(--teal-600, #2eb0b9)")
                                  : "var(--sand-300, #e0d9cc)",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", width: 22, textAlign: "right" }}>
                        {openCount}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
