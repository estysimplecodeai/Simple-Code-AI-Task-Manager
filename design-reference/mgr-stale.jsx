// ============================================================
// Simple Code AI — Stale tasks view (Manager)
// Exports: MgrStaleTasks
// ============================================================
function MgrStaleTasks({ onOpen }) {
  const state = useStore();
  useIcons();
  const [sort, setSort] = useState({ key: "overdue", dir: "desc" });
  const [proj, setProj] = useState("all");

  let tasks = state.tasks.filter((t) => SCAI.isStale(t));
  if (proj !== "all") tasks = tasks.filter((t) => t.project === proj);

  const sorted = [...tasks].sort((a, b) => {
    const dir = sort.dir === "asc" ? 1 : -1;
    if (sort.key === "overdue")   return dir * (SCAI.daysLeft(b) - SCAI.daysLeft(a));
    if (sort.key === "assignee")  return dir * SCAI.personById(a.assignee).name.localeCompare(SCAI.personById(b.assignee).name);
    if (sort.key === "project")   return dir * SCAI.projectById(a.project).key.localeCompare(SCAI.projectById(b.project).key);
    return 0;
  });

  const pendingExtCount = sorted.filter((t) => t.ext && t.ext.state === "pending").length;
  const ctrl = { background: "#fff", border: "1px solid var(--bd-2)", borderRadius: "var(--r-1)", padding: "6px 9px", fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--fg-1)", cursor: "pointer", outline: "none" };

  function Th({ label, k }) {
    const on = sort.key === k;
    return (
      <th onClick={() => setSort((s) => ({ key: k, dir: s.key === k && s.dir === "desc" ? "asc" : "desc" }))}
        style={{ textAlign: "left", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: on ? "var(--scai-teal)" : "var(--fg-3)", padding: "10px 16px", borderBottom: "1px solid var(--bd-2)", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          {label}{on && <Icon name={sort.dir === "asc" ? "arrow-up" : "arrow-down"} size={11} />}
        </span>
      </th>
    );
  }

  function PlainTh({ label }) {
    return (
      <th style={{ textAlign: "left", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-3)", padding: "10px 16px", borderBottom: "1px solid var(--bd-2)", whiteSpace: "nowrap" }}>{label}</th>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
      {sorted.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff8f8", border: "1px solid #faa9a7", borderRadius: "var(--r-1)", padding: "10px 14px", marginBottom: 18 }}>
          <Icon name="alert-triangle" size={15} style={{ color: "var(--danger)", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--danger)", fontWeight: 500 }}>
            {sorted.length} task{sorted.length === 1 ? " is" : "s are"} past deadline and not yet in review.
            {pendingExtCount > 0 && " " + pendingExtCount + " with a pending extension request."}
          </span>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <select value={proj} onChange={(e) => setProj(e.target.value)} style={ctrl}>
          <option value="all">All spaces</option>
          {state.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)" }}>{sorted.length} stale</span>
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--bd-1)", borderRadius: "var(--r-2)", overflow: "hidden" }}>
        {sorted.length === 0 ? (
          <EmptyState icon="check-circle-2" title="Nothing stale" sub="All tasks are within their deadlines, or already in review." />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--paper-2)" }}>
                <Th label="Task" k="task" />
                <Th label="Space" k="project" />
                <Th label="Assignee" k="assignee" />
                <PlainTh label="Status" />
                <PlainTh label="Deadline" />
                <Th label="Overdue" k="overdue" />
                <PlainTh label="Ext. request" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => {
                const overdue = Math.abs(SCAI.daysLeft(t));
                const hasPending = t.ext && t.ext.state === "pending";
                const urgentColor = overdue >= 7 ? "var(--danger)" : "#9a6700";
                return (
                  <tr key={t.id} onClick={() => onOpen(t.id)} style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.025)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "11px 16px", borderBottom: "1px solid var(--bd-1)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", flexShrink: 0 }}>{t.key}</span>
                        <span style={{ fontWeight: 500, color: "var(--fg-1)" }}>{t.title}</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 16px", borderBottom: "1px solid var(--bd-1)" }}><ProjectTag projectId={t.project} /></td>
                    <td style={{ padding: "11px 16px", borderBottom: "1px solid var(--bd-1)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <Avatar id={t.assignee} size={20} />
                        <span style={{ color: "var(--fg-2)", whiteSpace: "nowrap", fontSize: 12.5 }}>{SCAI.personById(t.assignee).name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 16px", borderBottom: "1px solid var(--bd-1)" }}><StatusPill status={t.status} /></td>
                    <td style={{ padding: "11px 16px", borderBottom: "1px solid var(--bd-1)", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-2)" }}>{fmtShort(t.deadline)}</td>
                    <td style={{ padding: "11px 16px", borderBottom: "1px solid var(--bd-1)" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: urgentColor }}>{overdue}d</span>
                    </td>
                    <td style={{ padding: "11px 16px", borderBottom: "1px solid var(--bd-1)" }}>
                      {hasPending ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600, color: "var(--scai-teal)", background: "rgba(46,175,183,0.09)", border: "1px solid rgba(46,175,183,0.25)", borderRadius: 3, padding: "2px 7px", letterSpacing: "0.04em" }}>
                          <Icon name="hourglass" size={11} /> Pending
                        </span>
                      ) : (
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { MgrStaleTasks });
