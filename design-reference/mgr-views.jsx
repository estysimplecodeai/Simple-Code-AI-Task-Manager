// ============================================================
// Simple Code AI — Manager (Managing Engineer) views
// ============================================================
function MTile({ label, value, unit, tone, icon, onClick }) {
  return (
    <div onClick={onClick} style={{ background: "var(--paper)", border: "1px solid var(--bd-1)", borderRadius: "var(--r-2)", padding: "15px 18px", cursor: onClick ? "pointer" : "default", transition: "border-color var(--dur-1) var(--ease)" }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.borderColor = "var(--bd-strong)"; }}
      onMouseLeave={(e) => { if (onClick) e.currentTarget.style.borderColor = "var(--bd-1)"; }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <Icon name={icon} size={14} style={{ color: tone || "var(--fg-3)" }} />
        <span className="eyebrow" style={{ fontSize: 10 }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 500, letterSpacing: "-0.02em", color: tone || "var(--fg-1)", lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--fg-3)" }}>{unit}</span>}
      </div>
    </div>
  );
}

// ---- Dashboard -----------------------------------------------------------
function MgrDashboard({ onOpen, goTo }) {
  const state = useStore();
  useIcons();
  const tasks = state.tasks;
  const open = tasks.filter((t) => t.status !== "done");
  const stale = tasks.filter((t) => SCAI.isStale(t)).sort((a, b) => SCAI.daysLeft(a) - SCAI.daysLeft(b));
  const inReview = tasks.filter((t) => t.status === "in_review");
  const pending = SCAI.pendingExtensions();

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
      {/* lead */}
      <div style={{ maxWidth: 800, marginBottom: 22 }}>
        <p className="p-lead" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 300, lineHeight: 1.5, color: "var(--fg-2)" }}>
          {stale.length > 0
            ? <><span style={{ color: "var(--danger)" }}>{stale.length} task{stale.length === 1 ? "" : "s"} {stale.length === 1 ? "has" : "have"} gone stale</span> across {new Set(stale.map((t) => t.project)).size} project{new Set(stale.map((t) => t.project)).size === 1 ? "" : "s"}, and <span style={{ color: "var(--scai-teal)" }}>{pending.length} extension request{pending.length === 1 ? "" : "s"}</span> {pending.length === 1 ? "is" : "are"} waiting on you.</>
            : <>Nothing's overdue right now — <span style={{ color: "var(--fg-1)" }}>{open.length} open tasks</span> across the team, {inReview.length} in review.</>}
        </p>
      </div>

      {/* metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
        <MTile label="Open tasks" value={open.length} icon="circle-dot" onClick={() => goTo("tasks")} />
        <MTile label="Stale" value={stale.length} icon="alert-triangle" tone={stale.length ? "var(--danger)" : undefined} onClick={() => goTo("tasks")} />
        <MTile label="In review" value={inReview.length} icon="eye" tone={inReview.length ? "var(--coral-600)" : undefined} />
        <MTile label="Extension requests" value={pending.length} icon="calendar-clock" tone={pending.length ? "var(--coral-600)" : undefined} onClick={() => goTo("requests")} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 18, alignItems: "start" }}>
        {/* stale table */}
        <Panel pad={false} title={<span style={{ color: "var(--danger)", display: "inline-flex", alignItems: "center", gap: 7 }}><Icon name="alert-triangle" size={14} />Stale Tasks</span>} right={<span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--danger)", fontWeight: 700 }}>{stale.length} past deadline</span>}>
          {stale.length === 0 ? <div style={{ padding: 8 }}><EmptyState icon="check-circle-2" title="Nothing stale" sub="Every task is on or ahead of its deadline." /></div> : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)", fontSize: 13 }}>
              <thead><tr style={{ background: "var(--paper-2)" }}>
                {["Task", "Assignee", "Status", "Overdue"].map((h) => <th key={h} style={{ textAlign: h === "Overdue" ? "right" : "left", fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-3)", padding: "10px 16px", borderBottom: "1px solid var(--bd-2)" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {stale.map((t) => (
                  <tr key={t.id} onClick={() => onOpen(t.id)} style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sand-100)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "11px 16px", borderBottom: "1px solid var(--bd-1)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ProjectTag projectId={t.project} />
                        <span style={{ fontWeight: 500 }}>{t.title}</span>
                        {t.ext && t.ext.state === "pending" && <Icon name="hourglass" size={12} style={{ color: "var(--coral-600)" }} />}
                      </div>
                    </td>
                    <td style={{ padding: "11px 16px", borderBottom: "1px solid var(--bd-1)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Avatar id={t.assignee} size={20} /><span style={{ color: "var(--fg-2)" }}>{SCAI.personById(t.assignee).name.split(" ")[0]}</span></div>
                    </td>
                    <td style={{ padding: "11px 16px", borderBottom: "1px solid var(--bd-1)" }}><StatusPill status={t.status} /></td>
                    <td style={{ padding: "11px 16px", borderBottom: "1px solid var(--bd-1)", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--danger)", fontWeight: 600 }}>{Math.abs(SCAI.daysLeft(t))}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        {/* right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ background: "var(--scai-slate)", border: "1px solid var(--bd-2)", borderTop: "1px solid rgba(46,175,183,0.35)", color: "var(--fg-1)", borderRadius: "var(--r-2)", padding: "16px 18px" }}>
            <div className="eyebrow" style={{ color: "var(--scai-teal)", marginBottom: 8, opacity: 0.8 }}>Extension requests</div>
            {pending.length === 0 ? (
              <div style={{ fontFamily: "var(--font-body)", fontSize: 13, opacity: 0.8 }}>No requests waiting. Developers can ask for more time from any task.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pending.slice(0, 3).map((t) => (
                  <button key={t.id} onClick={() => goTo("requests")} style={{ textAlign: "left", background: "rgba(0,0,0,0.05)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "var(--r-1)", padding: "9px 11px", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                      <Avatar id={t.assignee} size={18} />
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--paper)", fontWeight: 500 }}>{SCAI.personById(t.assignee).name.split(" ")[0]}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--scai-teal)", marginLeft: "auto" }}>{t.key}</span>
                    </div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--paper)", opacity: 0.92, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--scai-teal)", marginTop: 3 }}>+{SCAI.daysBetween(t.ext.originalDeadline, t.ext.requestedDate)}d → {fmtShort(t.ext.requestedDate)}</div>
                  </button>
                ))}
                <button onClick={() => goTo("requests")} style={{ background: "rgba(46,175,183,0.15)", color: "var(--scai-teal)", border: "1px solid rgba(46,175,183,0.30)", borderRadius: "var(--r-1)", padding: "8px", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  Review all {pending.length} <Icon name="arrow-right" size={13} />
                </button>
              </div>
            )}
          </div>

          {/* team workload */}
          <Panel title="Team workload">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {state.developers.map((d) => {
                const ts = SCAI.tasksAssignedTo(d.id);
                const o = ts.filter((t) => t.status !== "done").length;
                const st = ts.filter((t) => SCAI.isStale(t)).length;
                const max = 6;
                return (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar id={d.id} size={26} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--fg-1)", fontWeight: 500 }}>{d.name}</span>
                        {st > 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--danger)", marginLeft: "auto" }}>{st} stale</span>}
                      </div>
                      <div style={{ display: "flex", gap: 3, marginTop: 5 }}>
                        {Array.from({ length: max }).map((_, i) => <span key={i} style={{ height: 5, flex: 1, borderRadius: 2, background: i < o ? (i < st ? "var(--danger)" : "var(--teal-600)") : "var(--sand-300)" }} />)}
                      </div>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", width: 22, textAlign: "right" }}>{o}</span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ---- All tasks (manager) -------------------------------------------------
function MgrTasks({ density, onOpen, onNew, defaultProject }) {
  const state = useStore();
  useIcons();
  const [sort, setSort] = useState({ key: "status", dir: "asc" });
  const [proj, setProj] = useState(defaultProject || "all");
  const [assignee, setAssignee] = useState("all");
  const [stat, setStat] = useState("all");

  let tasks = [...state.tasks];
  if (proj !== "all") tasks = tasks.filter((t) => t.project === proj);
  if (assignee !== "all") tasks = tasks.filter((t) => t.assignee === assignee);
  if (stat !== "all") tasks = tasks.filter((t) => SCAI.columnOf(t) === stat);

  const PRI_RANK = { high: 0, med: 1, low: 2 };
  const STA_RANK = { stale: 0, in_progress: 1, in_review: 2, todo: 3, done: 4 };
  tasks.sort((a, b) => {
    const dir = sort.dir === "asc" ? 1 : -1;
    switch (sort.key) {
      case "assignee": return dir * SCAI.personById(a.assignee).name.localeCompare(SCAI.personById(b.assignee).name);
      case "priority": return dir * (PRI_RANK[a.priority] - PRI_RANK[b.priority]);
      case "deadline": return dir * (new Date(a.deadline) - new Date(b.deadline));
      case "status": return dir * (STA_RANK[SCAI.columnOf(a)] - STA_RANK[SCAI.columnOf(b)]);
      default: return dir * a.key.localeCompare(b.key);
    }
  });

  const pad = density === "compact" ? "7px 16px" : "11px 16px";
  const ctrl = { background: "var(--paper)", border: "1px solid var(--bd-2)", borderRadius: "var(--r-1)", padding: "6px 9px", fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--fg-1)", cursor: "pointer", outline: "none" };
  function Th({ label, k, align }) {
    const on = sort.key === k;
    return (
      <th onClick={() => setSort((s) => ({ key: k, dir: s.key === k && s.dir === "asc" ? "desc" : "asc" }))}
        style={{ textAlign: align || "left", fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: on ? "var(--scai-teal)" : "var(--fg-3)", padding: "10px 16px", borderBottom: "1px solid var(--bd-2)", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{label}{on && <Icon name={sort.dir === "asc" ? "arrow-up" : "arrow-down"} size={11} />}</span>
      </th>
    );
  }
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <select value={proj} onChange={(e) => setProj(e.target.value)} style={ctrl}><option value="all">All projects</option>{state.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} style={ctrl}><option value="all">All assignees</option>{state.developers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <select value={stat} onChange={(e) => setStat(e.target.value)} style={ctrl}><option value="all">All statuses</option>{["todo", "in_progress", "in_review", "stale", "done"].map((s) => <option key={s} value={s}>{SCAI.STATUS[s].label}</option>)}</select>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)" }}>{tasks.length} tasks</span>
        <div style={{ marginLeft: "auto" }}><Btn kind="primary" icon="plus" onClick={onNew}>New task</Btn></div>
      </div>
      <div style={{ background: "var(--paper)", border: "1px solid var(--bd-1)", borderRadius: "var(--r-2)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)", fontSize: 13 }}>
          <thead><tr style={{ background: "var(--paper-2)" }}>
            <Th label="Task" k="key" /><Th label="Assignee" k="assignee" /><Th label="Priority" k="priority" /><Th label="Status" k="status" /><Th label="Deadline" k="deadline" />
          </tr></thead>
          <tbody>
            {tasks.map((t) => {
              const left = SCAI.daysLeft(t);
              return (
                <tr key={t.id} onClick={() => onOpen(t.id)} style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sand-100)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <ProjectTag projectId={t.project} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>{t.key}</span>
                      <span style={{ fontWeight: 500 }}>{t.title}</span>
                      {t.ext && t.ext.state === "pending" && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--scai-teal)", background: "rgba(46,175,183,0.10)", border: "1px solid rgba(46,175,183,0.25)", borderRadius: 2, padding: "1px 6px", letterSpacing: "0.04em" }}><Icon name="hourglass" size={10} /> ext</span>}
                    </div>
                  </td>
                  <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)" }}><div style={{ display: "flex", alignItems: "center", gap: 7 }}><Avatar id={t.assignee} size={20} /><span style={{ color: "var(--fg-2)", whiteSpace: "nowrap" }}>{SCAI.personById(t.assignee).name}</span></div></td>
                  <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)" }}><PriorityTag priority={t.priority} /></td>
                  <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)" }}><StatusPill status={SCAI.columnOf(t)} /></td>
                  <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)", whiteSpace: "nowrap" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: left < 0 && t.status !== "done" ? "var(--danger)" : "var(--fg-2)" }}>{fmtShort(t.deadline)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {tasks.length === 0 && <EmptyState title="No tasks match" sub="Adjust the filters above." />}
      </div>
    </div>
  );
}

// ---- Extension approvals — checklist ------------------------------------
function MgrApprovals({ onDecide }) {
  const state = useStore();
  useIcons();
  const [expanded, setExpanded] = useState(null);
  const [activeAction, setActiveAction] = useState(null); // { id, type:'approve'|'deny' }
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("pending");

  const pending = SCAI.pendingExtensions();
  const resolved = SCAI.resolvedExtensions().sort((a,b) => (b.ext.decidedDate||"").localeCompare(a.ext.decidedDate||""));
  const items = filter === "all" ? [...pending, ...resolved] : pending;

  function toggle(id) {
    setExpanded(p => p === id ? null : id);
    setActiveAction(null);
    setNote("");
  }

  function doQuick(task, action) {
    SCAI.decideExtension(task.id, action, { managerNote: note.trim() });
    toast(action === "approve" ? `Deadline moved to ${fmtShort(task.ext.requestedDate)}` : "Extension denied", action === "deny" ? "danger" : "success");
    setExpanded(null); setActiveAction(null); setNote("");
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{ display: "inline-flex", background: "var(--paper-2)", border: "1px solid var(--bd-2)", borderRadius: "var(--r-1)", padding: 2 }}>
          {[["pending", `Pending  ${pending.length}`], ["all", "All"]].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{ padding: "5px 12px", border: "none", background: filter===v ? "var(--paper)" : "transparent", borderRadius: 2, fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: filter===v ? 600 : 400, color: filter===v ? "var(--fg-1)" : "var(--fg-2)", cursor: "pointer" }}>{l}</button>
          ))}
        </div>
        {pending.length === 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--success)", display: "flex", alignItems: "center", gap: 6 }}><Icon name="check-circle-2" size={14} /> All caught up</span>}
      </div>

      <div style={{ background: "var(--paper)", border: "1px solid var(--bd-1)", borderRadius: "var(--r-2)", overflow: "hidden" }}>
        {items.length === 0 && <EmptyState icon="inbox" title="No requests" sub="Developer extension requests appear here." />}
        {items.map((t, i) => {
          const e = t.ext;
          const isPending = e.state === "pending";
          const isExp = expanded === t.id;
          const isAQ = activeAction?.id === t.id;
          const addl = SCAI.daysBetween(e.originalDeadline, e.requestedDate);
          const dotColor = isPending ? "var(--scai-teal)" : e.state === "approved" ? "var(--success)" : "var(--danger)";
          const last = i === items.length - 1;

          return (
            <React.Fragment key={t.id}>
              {/* ---- row ---- */}
              <div onClick={() => toggle(t.id)}
                style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 16px",
                  borderBottom: (!last || isExp) ? "1px solid var(--bd-1)" : "none",
                  background: isExp ? "rgba(46,175,183,0.04)" : "transparent",
                  cursor: "pointer", transition: "background 100ms" }}
                onMouseEnter={e2 => { if (!isExp) e2.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
                onMouseLeave={e2 => { if (!isExp) e2.currentTarget.style.background = "transparent"; }}>

                <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0, boxShadow: isPending ? "0 0 6px var(--scai-teal)" : "none" }} />
                <Avatar id={t.assignee} size={26} />
                <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "var(--fg-1)", whiteSpace: "nowrap", minWidth: 72 }}>
                  {SCAI.personById(t.assignee).name.split(" ")[0]}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", flexShrink: 0 }}>{t.key}</span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{t.title}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--scai-teal)", background: "rgba(46,175,183,0.10)", border: "1px solid rgba(46,175,183,0.22)", borderRadius: 2, padding: "2px 6px", flexShrink: 0 }}>+{addl}d</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-2)", width: 52, textAlign: "right", flexShrink: 0 }}>{fmtShort(e.grantedDate || e.requestedDate)}</span>

                {isPending ? (
                  <button onClick={ev => { ev.stopPropagation(); setActiveAction({ id: t.id, type: "approve" }); setExpanded(t.id); setNote(""); }}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "rgba(63,185,80,0.12)", color: "#3fb950", border: "1px solid rgba(63,185,80,0.28)", borderRadius: 2, fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600, cursor: "pointer", flexShrink: 0, letterSpacing: "0.04em" }}
                    onMouseEnter={e2 => { e2.currentTarget.style.background = "rgba(63,185,80,0.22)"; }}
                    onMouseLeave={e2 => { e2.currentTarget.style.background = "rgba(63,185,80,0.12)"; }}>
                    <Icon name="check" size={12} /> Approve
                  </button>
                ) : (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 2, textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0,
                    ...(e.state === "approved" ? { background: "rgba(63,185,80,0.10)", color: "#3fb950", border: "1px solid rgba(63,185,80,0.22)" } : { background: "rgba(248,81,73,0.10)", color: "#f85149", border: "1px solid rgba(248,81,73,0.22)" })
                  }}>{e.state}</span>
                )}
                <Icon name={isExp ? "chevron-up" : "chevron-down"} size={13} style={{ color: "var(--fg-3)", flexShrink: 0 }} />
              </div>

              {/* ---- expanded ---- */}
              {isExp && (
                <div style={{ padding: "12px 16px 14px 56px", borderBottom: !last ? "1px solid var(--bd-1)" : "none", background: "rgba(46,175,183,0.04)" }}>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-2)", lineHeight: 1.55, fontStyle: "italic", marginBottom: isPending ? 12 : 0 }}>"{e.note}"</div>

                  {isPending && (
                    <>
                      {isAQ && (
                        <div style={{ marginBottom: 10 }}>
                          <TextArea value={note} onChange={ev => setNote(ev.target.value)}
                            placeholder={activeAction.type === "approve" ? "Reply to developer (optional)…" : "Reason for denial (recommended)…"}
                            style={{ minHeight: 54, fontSize: 13 }} />
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {isAQ && activeAction.type === "approve" ? (
                          <><Btn kind="primary" size="sm" icon="check" onClick={() => doQuick(t, "approve")}>Confirm approve</Btn>
                          <Btn kind="ghost" size="sm" onClick={() => { setActiveAction(null); setNote(""); }}>Cancel</Btn></>
                        ) : isAQ && activeAction.type === "deny" ? (
                          <><Btn kind="danger-solid" size="sm" icon="x" onClick={() => doQuick(t, "deny")}>Confirm deny</Btn>
                          <Btn kind="ghost" size="sm" onClick={() => { setActiveAction(null); setNote(""); }}>Cancel</Btn></>
                        ) : (
                          <><Btn kind="primary" size="sm" icon="check" onClick={() => { setActiveAction({ id: t.id, type: "approve" }); setNote(""); }}>Approve</Btn>
                          <Btn kind="secondary" size="sm" icon="calendar" onClick={() => onDecide(t, "modify")}>Adjust date</Btn>
                          <Btn kind="danger" size="sm" icon="x" onClick={() => { setActiveAction({ id: t.id, type: "deny" }); setNote(""); }}>Deny</Btn></>
                        )}
                      </div>
                    </>
                  )}

                  {!isPending && e.managerNote && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 10, padding: "8px 10px", background: "var(--paper-2)", border: "1px solid var(--bd-1)", borderRadius: "var(--r-1)" }}>
                      <Avatar id="m_dana" size={20} />
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.5 }}>{e.managerNote}</span>
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}


// ---- Spaces (manager) ----------------------------------------------------
function MgrSpaces({ onManage, onNew }) {
  const state = useStore();
  useIcons();
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-3)", maxWidth: 560 }}>Developers only see tasks in spaces they belong to. Add or remove members to grant access.</div>
        <div style={{ marginLeft: "auto" }}><Btn kind="primary" icon="plus" onClick={onNew}>New task</Btn></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 16 }}>
        {state.projects.map((p) => {
          const ts = state.tasks.filter((t) => t.project === p.id);
          const open = ts.filter((t) => t.status !== "done").length;
          const stale = ts.filter((t) => SCAI.isStale(t)).length;
          return (
            <div key={p.id} style={{ background: "var(--paper)", border: "1px solid var(--bd-1)", borderRadius: "var(--r-2)", padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <ProjectTag projectId={p.id} />
                <span style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 500 }}>{p.name}</span>
              </div>
              <div style={{ display: "flex", gap: 22, marginBottom: 16 }}>
                <Stat label="Open" value={open} />
                <Stat label="Stale" value={stale} tone={stale > 0 ? "var(--danger)" : "var(--fg-1)"} />
                <Stat label="Total" value={ts.length} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 14, borderTop: "1px solid var(--bd-1)" }}>
                <div style={{ display: "flex" }}>
                  {p.members.map((m, i) => <span key={m} style={{ marginLeft: i ? -7 : 0 }}><Avatar id={m} size={28} ring /></span>)}
                </div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-3)" }}>{p.members.length} member{p.members.length === 1 ? "" : "s"}</span>
                <div style={{ marginLeft: "auto" }}><Btn kind="secondary" size="sm" icon="user-plus" onClick={() => onManage(p.id)}>Manage</Btn></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Manager board (all tasks kanban, draggable) -------------------------
const MGR_COLUMNS = [
  { id: "todo",        head: "var(--fg-3)" },
  { id: "in_progress", head: "var(--scai-teal)" },
  { id: "in_review",   head: "var(--coral-600)" },
  { id: "stale",       head: "var(--danger)" },
  { id: "done",        head: "var(--success)" },
];

function MgrBoard({ onOpen, defaultProject }) {
  const state = useStore();
  useIcons();
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [proj, setProj] = useState(defaultProject || "all");
  const [dev, setDev] = useState("all");

  let tasks = [...state.tasks];
  if (proj !== "all") tasks = tasks.filter((t) => t.project === proj);
  if (dev !== "all") tasks = tasks.filter((t) => t.assignee === dev);

  const grouped = {};
  MGR_COLUMNS.forEach((c) => (grouped[c.id] = []));
  tasks.forEach((t) => {
    const col = SCAI.columnOf(t);
    if (grouped[col]) grouped[col].push(t);
  });

  function drop(colId) {
    setOverCol(null);
    if (!dragId || colId === "stale") return;
    const t = SCAI.taskById(dragId);
    setDragId(null);
    if (!t || t.status === colId) return;
    SCAI.setTaskStatus(t.id, colId);
    toast(`${t.key} → ${SCAI.STATUS[colId].label}`);
  }

  const ctrl = { background: "var(--paper)", border: "1px solid var(--bd-2)", borderRadius: "var(--r-1)", padding: "6px 9px", fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--fg-1)", cursor: "pointer", outline: "none" };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 28px", borderBottom: "1px solid var(--bd-1)", background: "var(--paper)", flexShrink: 0 }}>
        <select value={proj} onChange={(e) => setProj(e.target.value)} style={ctrl}>
          <option value="all">All projects</option>
          {state.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={dev} onChange={(e) => setDev(e.target.value)} style={ctrl}>
          <option value="all">All developers</option>
          {state.developers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)" }}>{tasks.length} tasks</span>
      </div>
      <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", padding: "16px 28px", display: "flex", gap: 14, alignItems: "stretch" }}>
        {MGR_COLUMNS.map((c) => {
          const meta = SCAI.STATUS[c.id];
          const list = grouped[c.id];
          const isDrop = c.id !== "stale";
          const over = overCol === c.id;
          return (
            <div key={c.id} style={{ flex: "1 1 0", minWidth: 222, display: "flex", flexDirection: "column", background: c.id === "stale" ? "rgba(248,81,73,0.05)" : "var(--paper-2)", border: `1px solid ${over ? "var(--scai-teal)" : c.id === "stale" ? "rgba(248,81,73,0.30)" : "var(--bd-1)"}`, borderRadius: "var(--r-2)", maxHeight: "100%" }}
              onDragOver={(e) => { if (isDrop && dragId) { e.preventDefault(); setOverCol(c.id); } }}
              onDragLeave={() => setOverCol((p) => (p === c.id ? null : p))}
              onDrop={() => drop(c.id)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderBottom: "1px solid var(--bd-1)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.head }} />
                <span style={{ fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, color: "var(--fg-1)" }}>{meta.label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", marginLeft: "auto" }}>{list.length}</span>
                {c.id === "stale" && <Icon name="alert-triangle" size={13} style={{ color: "var(--danger)" }} />}
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 9 }}>
                {list.length === 0 && (
                  <div style={{ padding: "18px 8px", textAlign: "center", fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-3)" }}>
                    {c.id === "stale" ? "Nothing overdue." : "Empty"}
                  </div>
                )}
                {list.map((t) => {
                  const left = SCAI.daysLeft(t);
                  return (
                    <div key={t.id} draggable={isDrop}
                      onDragStart={(e) => { setDragId(t.id); e.dataTransfer.effectAllowed = "move"; }}
                      onDragEnd={() => { setDragId(null); setOverCol(null); }}
                      onClick={() => onOpen(t.id)}
                      style={{ background: "var(--paper)", border: "1px solid var(--bd-1)", borderLeft: SCAI.isStale(t) ? "3px solid var(--danger)" : "1px solid var(--bd-1)", borderRadius: "var(--r-2)", padding: "11px 12px", cursor: "pointer", opacity: dragId === t.id ? 0.5 : 1 }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-1)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                        <ProjectTag projectId={t.project} />
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>{t.key}</span>
                        <span style={{ marginLeft: "auto" }}><PriorityTag priority={t.priority} withLabel={false} /></span>
                      </div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 500, lineHeight: 1.35, marginBottom: 9, textWrap: "pretty" }}>{t.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar id={t.assignee} size={22} />
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: left < 0 && t.status !== "done" ? "var(--danger)" : "var(--fg-3)", marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Icon name={t.status === "done" ? "check" : "clock"} size={11} />
                          {deadlinePhrase(t)}
                        </span>
                      </div>
                      {t.ext && t.ext.state === "pending" && (
                        <div style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--scai-teal)", display: "flex", alignItems: "center", gap: 5 }}>
                          <Icon name="hourglass" size={11} /> Extension requested
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { MgrDashboard, MgrTasks, MgrApprovals, MgrSpaces, MgrBoard, MTile });
