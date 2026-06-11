// ============================================================
// Simple Code AI — Developer views (Babel JSX)
// ============================================================
const DEV_COLUMNS = [
  { id: "todo",        head: "var(--fg-3)" },
  { id: "in_progress", head: "var(--scai-teal)" },
  { id: "in_review",   head: "var(--coral-400)" },
  { id: "stale",       head: "var(--danger)" },
  { id: "done",        head: "var(--success)" },
];

// ---- Kanban card ---------------------------------------------------------
function KanbanCard({ task, onOpen, draggable, onDragStart, onDragEnd, dragging, onRequestExt, showAssignee }) {
  const stale = SCAI.isStale(task);
  const left = SCAI.daysLeft(task);
  const me = SCAI.getState().session.devId;
  const mine = task.assignee === me;
  return (
    <div draggable={draggable} onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onOpen}
      style={{
        background: "var(--paper)", border: "1px solid var(--bd-1)", borderRadius: "var(--r-2)",
        padding: "11px 12px", cursor: "pointer",
        boxShadow: dragging ? "var(--shadow-2)" : "none", opacity: dragging ? 0.5 : 1,
        borderLeft: stale ? "2px solid rgba(248,81,73,0.65)" : "1px solid var(--bd-1)",
        transition: "box-shadow var(--dur-1) var(--ease)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-1)"; e.currentTarget.style.borderColor = "var(--bd-2)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = stale ? "rgba(248,81,73,0.65)" : "var(--bd-1)"; }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
        <ProjectTag projectId={task.project} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>{task.key}</span>
        <span style={{ marginLeft: "auto" }}><PriorityTag priority={task.priority} withLabel={false} /></span>
      </div>
      <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 500, color: "var(--fg-1)", lineHeight: 1.35, marginBottom: 9, textWrap: "pretty" }}>{task.title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {showAssignee ? <Avatar id={task.assignee} size={20} /> : <span />}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-mono)", fontSize: 11, color: left < 0 && task.status !== "done" ? "var(--danger)" : "var(--fg-3)", marginLeft: "auto" }}>
          <Icon name={task.status === "done" ? "check" : "clock"} size={11} />
          {deadlinePhrase(task)}
        </span>
      </div>
      {task.ext && task.ext.state === "pending" && (
        <div style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--scai-teal)", display: "flex", alignItems: "center", gap: 5 }}>
          <Icon name="hourglass" size={11} /> Extension requested
        </div>
      )}
      {stale && mine && (!task.ext || task.ext.state !== "pending") && (
        <button onClick={(e) => { e.stopPropagation(); onRequestExt(task); }} style={{
          marginTop: 9, width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
          background: "rgba(46,175,183,0.10)", color: "var(--scai-teal)", border: "1px solid rgba(46,175,183,0.25)",
          borderRadius: "var(--r-1)", padding: "5px 8px", fontFamily: "var(--font-body)", fontSize: 11.5, fontWeight: 500, cursor: "pointer",
        }}>
          <Icon name="calendar-plus" size={12} /> Request extension
        </button>
      )}
    </div>
  );
}

// ---- Shared board renderer -----------------------------------------------
function BoardColumns({ tasks, showStale, onOpen, onRequestExt, showAssignee }) {
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const me = SCAI.getState().session.devId;
  const cols = DEV_COLUMNS.filter((c) => showStale !== false || c.id !== "stale");
  const grouped = {};
  cols.forEach((c) => (grouped[c.id] = []));
  tasks.forEach((t) => {
    let col = SCAI.columnOf(t);
    if (col === "stale" && showStale === false) col = t.status;
    if (grouped[col]) grouped[col].push(t);
  });
  function drop(colId) {
    setOverCol(null);
    if (!dragId || colId === "stale") return;
    const t = SCAI.taskById(dragId);
    setDragId(null);
    if (!t || t.status === colId) return;
    if (t.assignee !== me) { toast("You can only move your own tasks", "danger"); return; }
    SCAI.setTaskStatus(t.id, colId);
    toast(`${t.key} → ${SCAI.STATUS[colId].label}`);
  }
  return (
    <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", padding: "16px 28px", display: "flex", gap: 14, alignItems: "stretch" }}>
      {cols.map((c) => {
        const meta = SCAI.STATUS[c.id];
        const list = grouped[c.id] || [];
        const over = overCol === c.id;
        const isDrop = c.id !== "stale";
        return (
          <div key={c.id} style={{ flex: "1 1 0", minWidth: 228, display: "flex", flexDirection: "column", background: c.id === "stale" ? "rgba(248,81,73,0.05)" : "var(--paper-2)", border: `1px solid ${over ? "var(--scai-teal)" : c.id === "stale" ? "rgba(248,81,73,0.30)" : "var(--bd-1)"}`, borderRadius: "var(--r-2)", maxHeight: "100%" }}
            onDragOver={(e) => { if (isDrop && dragId) { e.preventDefault(); setOverCol(c.id); } }}
            onDragLeave={() => setOverCol((p) => (p === c.id ? null : p))}
            onDrop={() => drop(c.id)}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid var(--bd-1)" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.head, flexShrink: 0 }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, fontWeight: 600, color: "var(--fg-1)", letterSpacing: "0.04em", textTransform: "uppercase" }}>{meta.label}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", marginLeft: "auto" }}>{list.length}</span>
              {c.id === "stale" && <Icon name="alert-triangle" size={12} style={{ color: "var(--danger)" }} />}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              {list.length === 0 && (
                <div style={{ padding: "16px 8px", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>
                  {c.id === "stale" ? "None overdue." : c.id === "done" ? "Nothing shipped." : "—"}
                </div>
              )}
              {list.map((t) => (
                <KanbanCard key={t.id} task={t} showAssignee={showAssignee}
                  draggable={t.assignee === me}
                  dragging={dragId === t.id}
                  onDragStart={(e) => { setDragId(t.id); e.dataTransfer.effectAllowed = "move"; }}
                  onDragEnd={() => { setDragId(null); setOverCol(null); }}
                  onOpen={() => onOpen(t.id)} onRequestExt={onRequestExt || (() => {})} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- My board (assigned to me) -------------------------------------------
function DevBoard({ showStale, onOpen, onRequestExt }) {
  const state = useStore();
  useIcons();
  const tasks = SCAI.tasksAssignedTo(state.session.devId);
  return <BoardColumns tasks={tasks} showStale={showStale} onOpen={onOpen} onRequestExt={onRequestExt} showAssignee={false} />;
}

// ---- Space board (all tasks in a space) ----------------------------------
function SpaceBoard({ projectId, onOpen, onRequestExt }) {
  const state = useStore();
  useIcons();
  const proj = SCAI.projectById(projectId);
  const tasks = state.tasks.filter((t) => t.project === projectId);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "10px 28px", borderBottom: "1px solid var(--bd-1)", display: "flex", alignItems: "center", gap: 10 }}>
        <ProjectTag projectId={projectId} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)" }}>{tasks.filter(t => t.status !== "done").length} open · {tasks.filter(t => SCAI.isStale(t)).length} stale</span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>{proj.members.length} members</span>
        <div style={{ display: "flex" }}>{proj.members.map((m, i) => <span key={m} style={{ marginLeft: i ? -6 : 0 }}><Avatar id={m} size={22} ring /></span>)}</div>
      </div>
      <BoardColumns tasks={tasks} showStale={true} onOpen={onOpen} onRequestExt={onRequestExt} showAssignee={true} />
    </div>
  );
}

// ---- Task list (sortable) ------------------------------------------------
function DevTaskList({ density, onOpen, defaultProject, defaultScope }) {
  const state = useStore();
  useIcons();
  const me = state.session.devId;
  const [sort, setSort] = useState({ key: "assignee", dir: "asc" });
  const [group, setGroup] = useState(true);
  const [proj, setProj] = useState(defaultProject || "all");
  const [scope, setScope] = useState(defaultScope || "team");

  let tasks = SCAI.visibleTasksForDev(me);
  if (proj !== "all") tasks = tasks.filter((t) => t.project === proj);
  if (scope === "mine") tasks = tasks.filter((t) => t.assignee === me);

  const PRI_RANK = { high: 0, med: 1, low: 2 };
  const STA_RANK = { stale: 0, in_progress: 1, in_review: 2, todo: 3, done: 4 };
  const sorted = [...tasks].sort((a, b) => {
    const dir = sort.dir === "asc" ? 1 : -1;
    switch (sort.key) {
      case "assignee": return dir * SCAI.personById(a.assignee).name.localeCompare(SCAI.personById(b.assignee).name);
      case "priority": return dir * (PRI_RANK[a.priority] - PRI_RANK[b.priority]);
      case "deadline": return dir * (new Date(a.deadline) - new Date(b.deadline));
      case "status":   return dir * (STA_RANK[SCAI.columnOf(a)] - STA_RANK[SCAI.columnOf(b)]);
      case "project":  return dir * SCAI.projectById(a.project).key.localeCompare(SCAI.projectById(b.project).key);
      default:         return dir * a.key.localeCompare(b.key);
    }
  });

  const groups = [];
  if (group) {
    const byDev = {};
    sorted.forEach((t) => { (byDev[t.assignee] = byDev[t.assignee] || []).push(t); });
    Object.keys(byDev).sort((a, b) => SCAI.personById(a).name.localeCompare(SCAI.personById(b).name))
      .forEach((dev) => groups.push({ dev, rows: byDev[dev] }));
  } else {
    groups.push({ dev: null, rows: sorted });
  }

  const pad = density === "compact" ? "7px 16px" : "11px 16px";
  function Th({ label, k }) {
    const on = sort.key === k;
    return (
      <th onClick={() => setSort((s) => ({ key: k, dir: s.key === k && s.dir === "asc" ? "desc" : "asc" }))}
        style={{ textAlign: "left", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: on ? "var(--scai-teal)" : "var(--fg-3)", padding: "10px 16px", borderBottom: "1px solid var(--bd-2)", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          {label}{on && <Icon name={sort.dir === "asc" ? "arrow-up" : "arrow-down"} size={11} />}
        </span>
      </th>
    );
  }
  const ctrl = { background: "var(--paper)", border: "1px solid var(--bd-2)", borderRadius: "var(--r-1)", padding: "6px 9px", fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--fg-1)", cursor: "pointer", outline: "none" };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "inline-flex", background: "var(--paper-2)", border: "1px solid var(--bd-2)", borderRadius: "var(--r-1)", padding: 2 }}>
          {[["team", "Team"], ["mine", "Mine"]].map(([v, l]) => (
            <button key={v} onClick={() => setScope(v)} style={{ padding: "5px 12px", border: "none", background: scope === v ? "var(--paper)" : "transparent", borderRadius: 3, fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: scope === v ? 600 : 400, color: scope === v ? "var(--fg-1)" : "var(--fg-2)", cursor: "pointer", boxShadow: scope === v ? "var(--shadow-1)" : "none" }}>{l}</button>
          ))}
        </div>
        <select value={proj} onChange={(e) => setProj(e.target.value)} style={ctrl}>
          <option value="all">All spaces</option>
          {SCAI.projectsForDev(me).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={() => setGroup((g) => !g)} style={{ ...ctrl, display: "inline-flex", alignItems: "center", gap: 6, background: group ? "rgba(46,175,183,0.10)" : "var(--paper)", borderColor: group ? "rgba(46,175,183,0.30)" : "var(--bd-2)", color: group ? "var(--scai-teal)" : "var(--fg-1)" }}>
          <Icon name="users" size={13} /> Group by assignee
        </button>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)" }}>{sorted.length} tasks</span>
      </div>
      <div style={{ background: "var(--paper)", border: "1px solid var(--bd-1)", borderRadius: "var(--r-2)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)", fontSize: 13 }}>
          <thead><tr style={{ background: "var(--paper-2)" }}>
            <Th label="Task" k="key" /><Th label="Project" k="project" /><Th label="Assignee" k="assignee" /><Th label="Priority" k="priority" /><Th label="Status" k="status" /><Th label="Deadline" k="deadline" />
          </tr></thead>
          <tbody>
            {groups.map((g, gi) => (
              <React.Fragment key={gi}>
                {g.dev && (
                  <tr><td colSpan={6} style={{ background: "rgba(46,175,183,0.04)", padding: "7px 16px", borderBottom: "1px solid var(--bd-1)", borderTop: gi > 0 ? "1px solid var(--bd-1)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <Avatar id={g.dev} size={20} />
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--fg-1)" }}>{SCAI.personById(g.dev).name}</span>
                      {g.dev === me && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--scai-teal)", background: "rgba(46,175,183,0.10)", border: "1px solid rgba(46,175,183,0.25)", borderRadius: 2, padding: "1px 6px", letterSpacing: "0.04em" }}>YOU</span>}
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", marginLeft: "auto" }}>{g.rows.length}</span>
                    </div>
                  </td></tr>
                )}
                {g.rows.map((t) => {
                  const left = SCAI.daysLeft(t);
                  return (
                    <tr key={t.id} onClick={() => onOpen(t.id)} style={{ cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", flexShrink: 0 }}>{t.key}</span>
                          <span style={{ fontWeight: 500, color: "var(--fg-1)" }}>{t.title}</span>
                          {t.ext && t.ext.state === "pending" && <Icon name="hourglass" size={12} style={{ color: "var(--scai-teal)" }} />}
                        </div>
                      </td>
                      <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)" }}><ProjectTag projectId={t.project} /></td>
                      <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Avatar id={t.assignee} size={20} /><span style={{ color: "var(--fg-2)", whiteSpace: "nowrap", fontSize: 12.5 }}>{SCAI.personById(t.assignee).name}</span></div>
                      </td>
                      <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)" }}><PriorityTag priority={t.priority} /></td>
                      <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)" }}><StatusPill status={SCAI.columnOf(t)} /></td>
                      <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)", whiteSpace: "nowrap" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-2)" }}>{fmtShort(t.deadline)}</div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: left < 0 && t.status !== "done" ? "var(--danger)" : "var(--fg-3)" }}>{deadlinePhrase(t)}</div>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && <EmptyState title="No tasks here" sub="Try a different space or scope." />}
      </div>
    </div>
  );
}

// ---- Developer dashboard -------------------------------------------------
function DevDashboard({ me, onOpen, onRequestExt, goTo }) {
  const state = useStore();
  useIcons();
  const myTasks = SCAI.tasksAssignedTo(me);
  const stale = myTasks.filter((t) => SCAI.isStale(t));
  const inReview = myTasks.filter((t) => t.status === "in_review");
  const open = myTasks.filter((t) => t.status !== "done");
  const myReqs = myTasks.filter((t) => t.ext);
  const pending = myReqs.filter((t) => t.ext.state === "pending");

  function Tile({ label, value, icon, tone, sub, onClick }) {
    return (
      <div onClick={onClick} style={{ background: "var(--paper)", border: "1px solid var(--bd-1)", borderRadius: "var(--r-2)", padding: "14px 16px", cursor: onClick ? "pointer" : "default", transition: "border-color 120ms var(--ease)" }}
        onMouseEnter={(e) => { if (onClick) e.currentTarget.style.borderColor = "var(--scai-teal)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--bd-1)"; }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
          <Icon name={icon} size={13} style={{ color: tone || "var(--fg-3)" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 600, letterSpacing: "0.13em", textTransform: "uppercase", color: "var(--fg-3)" }}>{label}</span>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 34, fontWeight: 700, color: tone || "var(--fg-1)", lineHeight: 1, letterSpacing: "-0.03em" }}>{value}</div>
        {sub && <div style={{ fontFamily: "var(--font-body)", fontSize: 11.5, color: "var(--fg-3)", marginTop: 6 }}>{sub}</div>}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "22px 28px" }}>
      {/* greeting */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: 18, fontWeight: 600, color: "var(--fg-1)" }}>
          {SCAI.personById(me).name.split(" ")[0]}'s workspace
        </p>
        <p style={{ margin: "4px 0 0", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)" }}>
          {SCAI.todayStr} · {SCAI.projectsForDev(me).length} active spaces
        </p>
      </div>

      {/* stat tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 22 }}>
        <Tile label="Open tasks" value={open.length} icon="circle-dot" sub="assigned to you" onClick={() => goTo("board")} />
        <Tile label="Stale" value={stale.length} icon="alert-triangle" tone={stale.length ? "var(--danger)" : undefined} sub={stale.length ? "past deadline" : "on track"} onClick={() => goTo("board")} />
        <Tile label="In review" value={inReview.length} icon="eye" tone={inReview.length ? "var(--scai-teal)" : undefined} sub="awaiting sign-off" />
        <Tile label="Ext. requests" value={pending.length} icon="calendar-clock" tone={pending.length ? "var(--scai-teal)" : undefined} sub="pending review" onClick={() => goTo("requests")} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18, alignItems: "start" }}>
        {/* stale tasks */}
        <Panel pad={false} title="Stale tasks — need attention"
          right={<span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)" }}>{stale.length} overdue</span>}>
          {stale.length === 0
            ? <div style={{ padding: 8 }}><EmptyState icon="check-circle-2" title="Nothing stale" sub="All your tasks are within their deadlines." /></div>
            : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {stale.map((t) => (
                    <tr key={t.id} onClick={() => onOpen(t.id)} style={{ cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--bd-1)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <ProjectTag projectId={t.project} />
                          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "var(--fg-1)" }}>{t.title}</span>
                          {t.ext && t.ext.state === "pending" && <Icon name="hourglass" size={12} style={{ color: "var(--scai-teal)" }} />}
                        </div>
                      </td>
                      <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--bd-1)", whiteSpace: "nowrap" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--danger)", fontWeight: 600 }}>{Math.abs(SCAI.daysLeft(t))}d overdue</span>
                      </td>
                      <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--bd-1)" }}>
                        {(!t.ext || t.ext.state !== "pending") && (
                          <button onClick={(e) => { e.stopPropagation(); onRequestExt(t); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(46,175,183,0.10)", color: "var(--scai-teal)", border: "1px solid rgba(46,175,183,0.22)", borderRadius: 2, padding: "4px 8px", fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600, cursor: "pointer", letterSpacing: "0.04em" }}>
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

        {/* extension requests */}
        <Panel title="Extension requests">
          {myReqs.length === 0
            ? <EmptyState icon="calendar-clock" title="No requests" sub="Request more time from any overdue task." />
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {myReqs.map((t) => {
                  const e = t.ext;
                  const isPending = e.state === "pending";
                  const dotColor = isPending ? "var(--scai-teal)" : e.state === "approved" ? "var(--success)" : "var(--danger)";
                  return (
                    <div key={t.id} onClick={() => onOpen(t.id)} style={{ padding: "10px 12px", background: "var(--paper-2)", border: "1px solid var(--bd-1)", borderRadius: "var(--r-1)", cursor: "pointer" }}
                      onMouseEnter={(e2) => (e2.currentTarget.style.borderColor = "var(--bd-2)")}
                      onMouseLeave={(e2) => (e2.currentTarget.style.borderColor = "var(--bd-1)")}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)" }}>{t.key}</span>
                        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: dotColor, textTransform: "capitalize", letterSpacing: "0.05em" }}>{isPending ? "PENDING" : e.state.toUpperCase()}</span>
                      </div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 500, color: "var(--fg-1)", marginBottom: 4, lineHeight: 1.3 }}>{t.title}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>
                        {fmtShort(e.originalDeadline)} → {fmtShort(e.grantedDate || e.requestedDate)}
                      </div>
                      {e.managerNote && <div style={{ marginTop: 6, fontFamily: "var(--font-body)", fontSize: 11.5, color: "var(--fg-2)", fontStyle: "italic" }}>"{e.managerNote}"</div>}
                    </div>
                  );
                })}
                <button onClick={() => goTo("requests")} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--scai-teal)", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 5, letterSpacing: "0.04em" }}>
                  View all <Icon name="arrow-right" size={12} />
                </button>
              </div>
            )}
        </Panel>
      </div>
    </div>
  );
}

// ---- My extension requests -----------------------------------------------
function DevRequests({ onOpen }) {
  const state = useStore();
  useIcons();
  const me = state.session.devId;
  const reqs = state.tasks.filter((t) => t.ext && t.assignee === me)
    .sort((a, b) => (a.ext.state === "pending" ? -1 : 1));
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
      <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 12 }}>
        {reqs.length === 0 && <Panel><EmptyState icon="calendar-clock" title="No extension requests" sub="When a deadline is too tight, open a task and request more time." /></Panel>}
        {reqs.map((t) => {
          const e = t.ext;
          const tone = e.state === "pending" ? "warning" : e.state === "approved" ? "success" : "danger";
          const s = PILL_DEV[tone];
          return (
            <div key={t.id} style={{ background: "var(--paper)", border: "1px solid var(--bd-1)", borderRadius: "var(--r-2)", padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10, flexWrap: "wrap" }}>
                <ProjectTag projectId={t.project} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>{t.key}</span>
                <button onClick={() => onOpen(t.id)} style={{ fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>{t.title}</button>
                <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600, padding: "3px 10px", borderRadius: "var(--r-1)", background: s.bg, color: s.fg, border: `1px solid ${s.bd}`, letterSpacing: "0.06em" }}>{e.state === "pending" ? "PENDING" : e.state.toUpperCase()}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-2)", marginBottom: 10 }}>
                <span style={{ textDecoration: e.state === "approved" ? "line-through" : "none", color: "var(--fg-3)" }}>{fmtDate(e.originalDeadline)}</span>
                <Icon name="arrow-right" size={13} style={{ color: "var(--fg-3)" }} />
                <span style={{ color: e.state === "denied" ? "var(--fg-3)" : "var(--scai-teal)", fontWeight: 600 }}>{fmtDate(e.grantedDate || e.requestedDate)}</span>
                {e.grantedDate && e.grantedDate !== e.requestedDate && <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--scai-teal)", opacity: 0.8 }}>(adjusted)</span>}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5, paddingLeft: 11, borderLeft: "2px solid var(--bd-1)", marginBottom: e.managerNote ? 12 : 0 }}>"{e.note}"</div>
              {e.managerNote && (
                <div style={{ marginTop: 4, background: "var(--paper-2)", border: "1px solid var(--bd-1)", borderRadius: "var(--r-1)", padding: "10px 12px", display: "flex", gap: 10 }}>
                  <Avatar id="m_dana" size={26} />
                  <div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 11.5, fontWeight: 600, color: "var(--fg-1)" }}>Dana Okafor <span style={{ fontWeight: 400, color: "var(--fg-3)" }}>· Managing Engineer</span></div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5, marginTop: 2 }}>{e.managerNote}</div>
                  </div>
                </div>
              )}
              {e.state === "pending" && <div style={{ marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 6, letterSpacing: "0.02em" }}><Icon name="clock" size={12} /> Awaiting review from Dana Okafor</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PILL_DEV = {
  warning: { bg: "rgba(210,153,34,0.12)",  fg: "#d29922", bd: "rgba(210,153,34,0.28)" },
  success: { bg: "rgba(63,185,80,0.12)",   fg: "#3fb950", bd: "rgba(63,185,80,0.25)"  },
  danger:  { bg: "rgba(248,81,73,0.12)",   fg: "#f85149", bd: "rgba(248,81,73,0.28)" },
};

// ---- Spaces (with drill-in) ----------------------------------------------
function DevProjects({ onOpenSpace }) {
  const state = useStore();
  useIcons();
  const me = state.session.devId;
  const mine = SCAI.projectsForDev(me);
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", marginBottom: 18, letterSpacing: "0.02em" }}>
        You have access to {mine.length} space{mine.length === 1 ? "" : "s"}. Click a space to view its full task board.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {mine.map((p) => {
          const tasks = state.tasks.filter((t) => t.project === p.id);
          const open = tasks.filter((t) => t.status !== "done").length;
          const stale = tasks.filter((t) => SCAI.isStale(t)).length;
          return (
            <div key={p.id} style={{ background: "var(--paper)", border: "1px solid var(--bd-1)", borderRadius: "var(--r-2)", padding: 18, transition: "border-color 120ms var(--ease)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--scai-teal)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--bd-1)")}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <ProjectTag projectId={p.id} />
                <span style={{ fontFamily: "var(--font-body)", fontSize: 17, fontWeight: 600, color: "var(--fg-1)" }}>{p.name}</span>
              </div>
              <div style={{ display: "flex", gap: 22, marginBottom: 14 }}>
                <Stat label="Open" value={open} />
                <Stat label="Stale" value={stale} tone={stale > 0 ? "var(--danger)" : "var(--fg-1)"} />
                <Stat label="Members" value={p.members.length} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 12, borderTop: "1px solid var(--bd-1)" }}>
                <div style={{ display: "flex" }}>
                  {p.members.map((m, i) => <span key={m} style={{ marginLeft: i ? -6 : 0 }}><Avatar id={m} size={24} ring /></span>)}
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <Btn kind="secondary" size="sm" icon="kanban-square" onClick={() => onOpenSpace(p.id)}>Open board</Btn>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { DevBoard, SpaceBoard, DevTaskList, DevDashboard, DevRequests, DevProjects, KanbanCard, BoardColumns });
