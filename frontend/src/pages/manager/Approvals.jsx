import { useState } from "react";
import { EmptyState } from "../../components/ui/misc";
import { Icon } from "../../components/ui/icons";
import Avatar from "../../components/ui/Avatar";
import Btn from "../../components/ui/Btn";
import { TextArea } from "../../components/ui/fields";
import { toast } from "../../components/ui/Toast";
import { useData } from "../../store/DataContext";
import { TasksApi } from "../../api/endpoints";
import { fmtShort } from "../../lib/format";

export default function Approvals({ onOpenTask }) {
  const { tasks, personById, refresh } = useData();

  const [expanded, setExpanded] = useState(null);
  const [activeAction, setActiveAction] = useState(null); // { id, type: 'approve'|'deny'|'modify' }
  const [note, setNote] = useState("");
  const [adjustDate, setAdjustDate] = useState("");
  const [filter, setFilter] = useState("pending");
  const [busy, setBusy] = useState(false);

  const pending = tasks.filter((t) => t.ext && t.ext.state === "pending");
  const resolved = tasks
    .filter((t) => t.ext && t.ext.state !== "pending")
    .sort((a, b) => (b.ext.decidedDate || "").localeCompare(a.ext.decidedDate || ""));
  const items = filter === "all" ? [...pending, ...resolved] : pending;

  function toggle(id) {
    setExpanded((prev) => (prev === id ? null : id));
    setActiveAction(null);
    setNote("");
    setAdjustDate("");
  }

  async function doDecide(task, decision) {
    if (busy) return;
    setBusy(true);
    try {
      const opts = { managerNote: note.trim() };
      if (decision === "modify") {
        if (!adjustDate) {
          toast("Please enter a new date", "danger");
          setBusy(false);
          return;
        }
        opts.newDate = adjustDate;
      }
      await TasksApi.decideExtension(task.id, decision, opts);
      await refresh();
      if (decision === "deny") {
        toast("Extension denied", "danger");
      } else if (decision === "modify") {
        toast(`Deadline adjusted to ${fmtShort(adjustDate)}`);
      } else {
        toast(`Deadline moved to ${fmtShort(task.ext.requestedDate)}`);
      }
      setExpanded(null);
      setActiveAction(null);
      setNote("");
      setAdjustDate("");
    } catch (err) {
      toast(err?.response?.data?.error || "Failed to decide", "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
      {/* Filter tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{
          display: "inline-flex", background: "var(--paper-2)", border: "1px solid var(--bd-2)",
          borderRadius: "var(--r-1)", padding: 2,
        }}>
          {[
            ["pending", `Pending  ${pending.length}`],
            ["all", "All"],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              style={{
                padding: "5px 12px", border: "none",
                background: filter === v ? "var(--paper)" : "transparent",
                borderRadius: 2, fontFamily: "var(--font-body)", fontSize: 12.5,
                fontWeight: filter === v ? 600 : 400,
                color: filter === v ? "var(--fg-1)" : "var(--fg-2)", cursor: "pointer",
              }}
            >{l}</button>
          ))}
        </div>
        {pending.length === 0 && (
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--success, #1a7f37)",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Icon name="check-circle-2" size={14} /> All caught up
          </span>
        )}
      </div>

      {/* Checklist */}
      <div style={{
        background: "var(--paper)", border: "1px solid var(--bd-1)",
        borderRadius: "var(--r-2)", overflow: "hidden",
      }}>
        {items.length === 0 && (
          <EmptyState icon="inbox" title="No requests" sub="Developer extension requests appear here." />
        )}
        {items.map((t, i) => {
          const e = t.ext;
          const isPending = e.state === "pending";
          const isExp = expanded === t.id;
          const isAQ = activeAction?.id === t.id;
          const addl = e.originalDeadline && e.requestedDate
            ? Math.round((new Date(e.requestedDate) - new Date(e.originalDeadline)) / 86400000)
            : 0;
          const dotColor = isPending
            ? "var(--scai-teal)"
            : e.state === "approved"
            ? "var(--success, #1a7f37)"
            : "var(--danger)";
          const last = i === items.length - 1;
          const assignee = personById(t.assignee);

          return (
            <div key={t.id}>
              {/* Row */}
              <div
                onClick={() => toggle(t.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 11, padding: "11px 16px",
                  borderBottom: (!last || isExp) ? "1px solid var(--bd-1)" : "none",
                  background: isExp ? "rgba(46,175,183,0.04)" : "transparent",
                  cursor: "pointer", transition: "background 100ms",
                }}
                onMouseEnter={(ev) => { if (!isExp) ev.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
                onMouseLeave={(ev) => { if (!isExp) ev.currentTarget.style.background = "transparent"; }}
              >
                {/* Status dot */}
                <span style={{
                  width: 7, height: 7, borderRadius: "50%", background: dotColor,
                  flexShrink: 0, boxShadow: isPending ? "0 0 6px var(--scai-teal)" : "none",
                }} />

                <Avatar id={t.assignee} size={26} />

                <span style={{
                  fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500,
                  color: "var(--fg-1)", whiteSpace: "nowrap", minWidth: 72,
                }}>
                  {assignee ? assignee.name.split(" ")[0] : "—"}
                </span>

                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", flexShrink: 0 }}>
                  {t.key}
                </span>

                <span style={{
                  fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-2)",
                  flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0,
                }}>
                  {t.title}
                </span>

                {/* +Nd delta chip */}
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--scai-teal)",
                  background: "rgba(46,175,183,0.10)", border: "1px solid rgba(46,175,183,0.22)",
                  borderRadius: 2, padding: "2px 6px", flexShrink: 0,
                }}>
                  +{addl}d
                </span>

                {/* Date */}
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-2)",
                  width: 52, textAlign: "right", flexShrink: 0,
                }}>
                  {fmtShort(e.grantedDate || e.requestedDate)}
                </span>

                {/* Quick approve or resolved badge */}
                {isPending ? (
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setActiveAction({ id: t.id, type: "approve" });
                      setExpanded(t.id);
                      setNote("");
                    }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px",
                      background: "rgba(63,185,80,0.12)", color: "#3fb950",
                      border: "1px solid rgba(63,185,80,0.28)", borderRadius: 2,
                      fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600,
                      cursor: "pointer", flexShrink: 0, letterSpacing: "0.04em",
                    }}
                    onMouseEnter={(ev) => (ev.currentTarget.style.background = "rgba(63,185,80,0.22)")}
                    onMouseLeave={(ev) => (ev.currentTarget.style.background = "rgba(63,185,80,0.12)")}
                  >
                    <Icon name="check" size={12} /> Approve
                  </button>
                ) : (
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600,
                    padding: "3px 8px", borderRadius: 2, textTransform: "uppercase",
                    letterSpacing: "0.06em", flexShrink: 0,
                    ...(e.state === "approved"
                      ? { background: "rgba(63,185,80,0.10)", color: "#3fb950", border: "1px solid rgba(63,185,80,0.22)" }
                      : { background: "rgba(248,81,73,0.10)", color: "#f85149", border: "1px solid rgba(248,81,73,0.22)" }),
                  }}>
                    {e.state}
                  </span>
                )}

                <Icon
                  name={isExp ? "chevron-up" : "chevron-down"}
                  size={13}
                  style={{ color: "var(--fg-3)", flexShrink: 0 }}
                />
              </div>

              {/* Expanded panel */}
              {isExp && (
                <div style={{
                  padding: "12px 16px 14px 56px",
                  borderBottom: !last ? "1px solid var(--bd-1)" : "none",
                  background: "rgba(46,175,183,0.04)",
                }}>
                  {/* Developer's note */}
                  <div style={{
                    fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-2)",
                    lineHeight: 1.55, fontStyle: "italic", marginBottom: isPending ? 12 : 0,
                  }}>
                    "{e.note}"
                  </div>

                  {isPending && (
                    <>
                      {/* Reply textarea when action is staged */}
                      {isAQ && activeAction.type !== "modify" && (
                        <div style={{ marginBottom: 10 }}>
                          <TextArea
                            value={note}
                            onChange={(ev) => setNote(ev.target.value)}
                            placeholder={
                              activeAction.type === "approve"
                                ? "Reply to developer (optional)…"
                                : "Reason for denial (recommended)…"
                            }
                            style={{ minHeight: 54, fontSize: 13 }}
                          />
                        </div>
                      )}

                      {/* Adjust date: inline date input + note */}
                      {isAQ && activeAction.type === "modify" && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                            <label style={{
                              fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600,
                              letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-3)",
                              flexShrink: 0,
                            }}>New date</label>
                            <input
                              type="date"
                              value={adjustDate}
                              onChange={(ev) => setAdjustDate(ev.target.value)}
                              style={{
                                background: "#fff", border: "1px solid var(--bd-2)",
                                borderRadius: "var(--r-1)", padding: "6px 10px",
                                fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-1)",
                                outline: "none",
                              }}
                              onFocus={(ev) => { ev.target.style.borderColor = "var(--scai-teal)"; }}
                              onBlur={(ev) => { ev.target.style.borderColor = "var(--bd-2)"; }}
                            />
                          </div>
                          <TextArea
                            value={note}
                            onChange={(ev) => setNote(ev.target.value)}
                            placeholder="Note to developer (optional)…"
                            style={{ minHeight: 54, fontSize: 13 }}
                          />
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {isAQ && activeAction.type === "approve" ? (
                          <>
                            <Btn kind="primary" size="sm" icon="check" onClick={() => doDecide(t, "approve")} disabled={busy}>
                              {busy ? "Saving…" : "Confirm approve"}
                            </Btn>
                            <Btn kind="ghost" size="sm" onClick={() => { setActiveAction(null); setNote(""); }}>Cancel</Btn>
                          </>
                        ) : isAQ && activeAction.type === "deny" ? (
                          <>
                            <Btn kind="danger-solid" size="sm" icon="x" onClick={() => doDecide(t, "deny")} disabled={busy}>
                              {busy ? "Saving…" : "Confirm deny"}
                            </Btn>
                            <Btn kind="ghost" size="sm" onClick={() => { setActiveAction(null); setNote(""); }}>Cancel</Btn>
                          </>
                        ) : isAQ && activeAction.type === "modify" ? (
                          <>
                            <Btn kind="primary" size="sm" icon="calendar" onClick={() => doDecide(t, "modify")} disabled={busy || !adjustDate}>
                              {busy ? "Saving…" : "Confirm date"}
                            </Btn>
                            <Btn kind="ghost" size="sm" onClick={() => { setActiveAction(null); setNote(""); setAdjustDate(""); }}>Cancel</Btn>
                          </>
                        ) : (
                          <>
                            <Btn kind="primary" size="sm" icon="check" onClick={() => { setActiveAction({ id: t.id, type: "approve" }); setNote(""); }}>
                              Approve
                            </Btn>
                            <Btn kind="secondary" size="sm" icon="calendar" onClick={() => { setActiveAction({ id: t.id, type: "modify" }); setNote(""); setAdjustDate(""); }}>
                              Adjust date
                            </Btn>
                            <Btn kind="danger" size="sm" icon="x" onClick={() => { setActiveAction({ id: t.id, type: "deny" }); setNote(""); }}>
                              Deny
                            </Btn>
                          </>
                        )}
                      </div>
                    </>
                  )}

                  {/* Manager note for resolved */}
                  {!isPending && e.managerNote && (
                    <div style={{
                      display: "flex", alignItems: "flex-start", gap: 8, marginTop: 10,
                      padding: "8px 10px", background: "var(--paper-2)",
                      border: "1px solid var(--bd-1)", borderRadius: "var(--r-1)",
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%", background: "#1e2328",
                        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 600, flexShrink: 0,
                      }}>M</div>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.5 }}>
                        {e.managerNote}
                      </span>
                    </div>
                  )}

                  {/* View full task link */}
                  <button
                    onClick={() => onOpenTask(t.id)}
                    style={{
                      marginTop: 10, background: "none", border: "none", cursor: "pointer",
                      fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--scai-teal)",
                      display: "flex", alignItems: "center", gap: 4, letterSpacing: "0.04em", padding: 0,
                    }}
                  >
                    Open task <Icon name="arrow-right" size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
