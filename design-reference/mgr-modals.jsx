// ============================================================
// Simple Code AI — Manager modals
// ============================================================

// ---- Create task ---------------------------------------------------------
function CreateTaskModal({ presetProject, onClose }) {
  const state = useStore();
  useIcons();
  const [project, setProject] = useState(presetProject || state.projects[0].id);
  const members = SCAI.projectById(project).members;
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [assignee, setAssignee] = useState(members[0] || "");
  const [priority, setPriority] = useState("med");
  const [deadline, setDeadline] = useState(addDays(SCAI.todayStr, 14));
  const [branch, setBranch] = useState("");

  useEffect(() => {
    const m = SCAI.projectById(project).members;
    if (!m.includes(assignee)) setAssignee(m[0] || "");
  }, [project]);

  const valid = title.trim().length >= 3 && assignee && deadline;
  function submit() {
    if (!valid) return;
    SCAI.createTask({ project, title: title.trim(), desc: desc.trim(), assignee, priority, deadline, branch: branch.trim() });
    toast(`Task created and assigned to ${SCAI.personById(assignee).name.split(" ")[0]}`);
    onClose();
  }
  const proj = SCAI.projectById(project);

  return (
    <Modal width={580} onClose={onClose} eyebrow="New task" title="Create a task"
      footer={<><Btn kind="ghost" onClick={onClose}>Cancel</Btn><Btn kind="primary" icon="plus" disabled={!valid} onClick={submit}>Create task</Btn></>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Title" required>
            <TextInput value={title} placeholder="Short, action-first — e.g. 'Add retry backoff to webhooks'" onChange={(e) => setTitle(e.target.value)} autoFocus />
          </Field>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Description">
            <TextArea value={desc} placeholder="What does done look like? Acceptance criteria, links, context." onChange={(e) => setDesc(e.target.value)} />
          </Field>
        </div>
        <Field label="Space / project" required>
          <Select value={project} onChange={(e) => setProject(e.target.value)}>
            {state.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Assignee" hint={`${members.length} in space`} required>
          <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            {members.map((m) => <option key={m} value={m}>{SCAI.personById(m).name}</option>)}
          </Select>
        </Field>
        <Field label="Deadline" required hint="Locked for the developer">
          <TextInput type="date" value={deadline} min={SCAI.todayStr} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
        <Field label="Priority">
          <div style={{ display: "flex", border: "1px solid var(--bd-2)", borderRadius: "var(--r-1)", overflow: "hidden" }}>
            {["low", "med", "high"].map((p, i) => {
              const on = priority === p;
              return <button key={p} onClick={() => setPriority(p)} style={{ flex: 1, padding: "9px 0", border: "none", borderRight: i < 2 ? "1px solid var(--bd-2)" : "none", background: on ? "var(--scai-slate)" : "var(--paper)", color: on ? "var(--fg-1)" : "var(--fg-2)", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: on ? 600 : 400, cursor: "pointer", textTransform: "capitalize" }}>{SCAI.PRIORITY[p].label}</button>;
            })}
          </div>
        </Field>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="GitHub branch" hint="Optional">
            <TextInput value={branch} placeholder={`feature/${proj.key.toLowerCase()}-…`} onChange={(e) => setBranch(e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

// ---- Approve / adjust / deny ---------------------------------------------
function ApprovalModal({ task, initial, onClose }) {
  useIcons();
  const e = task.ext;
  const [decision, setDecision] = useState(initial || "approve");
  const [newDate, setNewDate] = useState(e.requestedDate);
  const [note, setNote] = useState("");
  const valid = decision !== "modify" || (newDate && newDate > e.originalDeadline);

  function submit() {
    if (!valid) return;
    SCAI.decideExtension(task.id, decision, { managerNote: note.trim(), newDate });
    toast(decision === "deny" ? `Extension denied — ${SCAI.personById(task.assignee).name.split(" ")[0]} notified` : `Deadline moved to ${fmtShort(decision === "modify" ? newDate : e.requestedDate)}`);
    onClose();
  }

  const opts = [
    { id: "approve", label: "Approve", icon: "check", sub: `Move to ${fmtShort(e.requestedDate)}` },
    { id: "modify", label: "Adjust date", icon: "calendar", sub: "Grant a different date" },
    { id: "deny", label: "Deny", icon: "x", sub: "Keep current deadline" },
  ];
  return (
    <Modal width={540} onClose={onClose}
      eyebrow={<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><ProjectTag projectId={task.project} /> {task.key}</span>}
      title="Review extension request"
      footer={<><Btn kind="ghost" onClick={onClose}>Cancel</Btn><Btn kind={decision === "deny" ? "danger-solid" : "teal"} icon={decision === "deny" ? "x" : "check"} disabled={!valid} onClick={submit}>{decision === "deny" ? "Deny request" : "Approve & update deadline"}</Btn></>}>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <Avatar id={task.assignee} size={30} />
        <div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600 }}>{task.title}</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-3)" }}>{SCAI.personById(task.assignee).name} · requested {fmtShort(e.requestedAt)}</div>
        </div>
      </div>
      <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-2)", lineHeight: 1.55, paddingLeft: 12, borderLeft: "2px solid var(--bd-1)", marginBottom: 18 }}>“{e.note}”</div>

      <div className="eyebrow" style={{ marginBottom: 8 }}>Your decision</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {opts.map((o) => {
          const on = decision === o.id;
          const danger = o.id === "deny";
          return (
            <button key={o.id} onClick={() => setDecision(o.id)} style={{
              flex: 1, textAlign: "left", padding: "10px 12px", borderRadius: "var(--r-1)", cursor: "pointer",
              background: on ? (danger ? "rgba(248,81,73,0.10)" : "rgba(46,175,183,0.10)") : "var(--paper)",
              border: `1px solid ${on ? (danger ? "rgba(248,81,73,0.35)" : "rgba(46,175,183,0.35)") : "var(--bd-2)"}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: on ? (danger ? "var(--danger)" : "var(--scai-teal)") : "var(--fg-1)", marginBottom: 2 }}>
                <Icon name={o.icon} size={14} /> {o.label}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--fg-3)" }}>{o.sub}</div>
            </button>
          );
        })}
      </div>

      {decision === "modify" && (
        <Field label="New deadline you're granting" required>
          <TextInput type="date" value={newDate} min={addDays(e.originalDeadline, 1)} onChange={(e2) => setNewDate(e2.target.value)} />
        </Field>
      )}

      <Field label="Reply to the developer" hint="Optional but encouraged">
        <TextArea value={note} placeholder={decision === "deny" ? "Explain why, and what you'd like instead." : "A quick note — e.g. 'Approved, get it solid.'"} onChange={(e2) => setNote(e2.target.value)} style={{ minHeight: 64 }} />
      </Field>
    </Modal>
  );
}

// ---- Manager task detail (editable) --------------------------------------
function MgrTaskDetail({ taskId, onClose, onReview }) {
  const state = useStore();
  useIcons();
  const t = SCAI.taskById(taskId);
  if (!t) return null;
  const proj = SCAI.projectById(t.project);
  const stale = SCAI.isStale(t);
  const pending = t.ext && t.ext.state === "pending";

  return (
    <Modal width={620} onClose={onClose}
      eyebrow={<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><ProjectTag projectId={t.project} /> <span style={{ fontFamily: "var(--font-mono)", letterSpacing: 0 }}>{t.key}</span></span>}
      title={t.title}
      footer={<><Btn kind="ghost" onClick={onClose}>Close</Btn>{pending && <Btn kind="teal" icon="calendar-check" onClick={() => onReview(t)}>Review extension</Btn>}</>}>

      {stale && (
        <div style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.28)", borderRadius: "var(--r-1)", padding: "10px 12px", marginBottom: 16, color: "var(--danger)" }}>
          <Icon name="alert-triangle" size={16} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500 }}>Stale — {Math.abs(SCAI.daysLeft(t))} days past deadline.</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px", marginBottom: 4 }}>
        <Field label="Status">
          <Select value={t.status} onChange={(e) => { SCAI.patchTask(t.id, { status: e.target.value }); toast(`${t.key} → ${SCAI.STATUS[e.target.value].label}`); }}>
            {["todo", "in_progress", "in_review", "done"].map((s) => <option key={s} value={s}>{SCAI.STATUS[s].label}</option>)}
          </Select>
        </Field>
        <Field label="Assignee">
          <Select value={t.assignee} onChange={(e) => { SCAI.patchTask(t.id, { assignee: e.target.value }); toast(`Reassigned to ${SCAI.personById(e.target.value).name.split(" ")[0]}`); }}>
            {proj.members.map((m) => <option key={m} value={m}>{SCAI.personById(m).name}</option>)}
          </Select>
        </Field>
        <Field label="Deadline" hint="You can change this">
          <TextInput type="date" value={t.deadline} onChange={(e) => { SCAI.patchTask(t.id, { deadline: e.target.value }); toast(`Deadline → ${fmtShort(e.target.value)}`); }} />
        </Field>
        <Field label="Priority">
          <Select value={t.priority} onChange={(e) => SCAI.patchTask(t.id, { priority: e.target.value })}>
            {["low", "med", "high"].map((p) => <option key={p} value={p}>{SCAI.PRIORITY[p].label}</option>)}
          </Select>
        </Field>
      </div>

      <MetaRow icon="git-branch" label="Branch"><BranchTag branch={t.branch} /></MetaRow>

      <div style={{ marginTop: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Description</div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>{t.desc || "No description."}</p>
      </div>

      {t.ext && (
        <div style={{ marginTop: 18, background: pending ? "rgba(46,175,183,0.08)" : "var(--paper-2)", border: `1px solid ${pending ? "rgba(46,175,183,0.28)" : "var(--bd-1)"}`, borderRadius: "var(--r-2)", padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Icon name={pending ? "hourglass" : t.ext.state === "approved" ? "check-circle-2" : "x-circle"} size={15} style={{ color: pending ? "var(--coral-600)" : t.ext.state === "approved" ? "var(--success)" : "var(--danger)" }} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600 }}>{pending ? "Extension requested" : t.ext.state === "approved" ? "Extension approved" : "Extension denied"}</span>
            <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)" }}>{fmtShort(t.ext.originalDeadline)} → {fmtShort(t.ext.grantedDate || t.ext.requestedDate)}</span>
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.5, fontStyle: "italic" }}>“{t.ext.note}”</div>
          {pending && <div style={{ marginTop: 12 }}><Btn kind="teal" size="sm" icon="calendar-check" onClick={() => onReview(t)}>Review request</Btn></div>}
        </div>
      )}
    </Modal>
  );
}


const DEV_EMAILS = {
  d_elena: "elena.lopez@simplecodeai.com",
  d_jamie: "jamie.marston@simplecodeai.com",
  d_ravi:  "ravi.adeyemi@simplecodeai.com",
  d_kai:   "kai.nguyen@simplecodeai.com",
  d_sana:  "sana.devi@simplecodeai.com",
};

function ManageMembersModal({ projectId, onClose }) {
  const state = useStore();
  useIcons();
  const proj = SCAI.projectById(projectId);
  const [members, setMembers] = useState([...proj.members]);
  const [query, setQuery] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const inputRef = React.useRef(null);

  const available = state.developers.filter((d) => !members.includes(d.id));
  const filtered = available.filter((d) => {
    const q = query.toLowerCase();
    return !q || d.name.toLowerCase().includes(q) || DEV_EMAILS[d.id].toLowerCase().includes(q);
  });

  function add(id) { setMembers((m) => [...m, id]); setQuery(""); setDropOpen(false); }
  function remove(id) { setMembers((m) => m.filter((x) => x !== id)); }
  function save() {
    const added = members.filter((m) => !proj.members.includes(m)).length;
    SCAI.setProjectMembers(projectId, members);
    toast(added > 0 ? `${added} developer${added === 1 ? "" : "s"} added to ${proj.key}` : "Members updated");
    onClose();
  }

  return (
    <Modal width={500} onClose={onClose}
      eyebrow={<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><ProjectTag projectId={projectId} /> {proj.name}</span>}
      title="Manage space members"
      footer={<><Btn kind="ghost" onClick={onClose}>Cancel</Btn><Btn kind="primary" icon="check" onClick={save}>Save members</Btn></>}>

      {members.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 8 }}>Current members — {members.length}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {members.map((id) => {
              const d = SCAI.personById(id);
              return (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "var(--paper-2)", border: "1px solid var(--bd-1)", borderRadius: "var(--r-1)" }}>
                  <Avatar id={id} size={26} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "var(--fg-1)" }}>{d.name}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--scai-teal)" }}>{DEV_EMAILS[id]}</div>
                  </div>
                  <button onClick={() => remove(id)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "var(--r-1)", background: "transparent", border: "1px solid transparent", cursor: "pointer", color: "var(--fg-3)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,81,73,0.10)"; e.currentTarget.style.color = "var(--danger)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-3)"; }}>
                    <Icon name="x" size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 8 }}>Add member by email</div>
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--paper-2)", border: `1px solid ${dropOpen ? "var(--scai-teal)" : "var(--bd-2)"}`, borderRadius: "var(--r-1)", padding: "8px 10px", boxShadow: dropOpen ? "0 0 0 2px rgba(46,175,183,0.12)" : "none", transition: "border-color 120ms" }}>
          <Icon name="mail" size={14} style={{ color: "var(--fg-3)", flexShrink: 0 }} />
          <input ref={inputRef} value={query}
            placeholder={available.length ? "Search by name or email…" : "All team members added"}
            disabled={!available.length}
            onChange={(e) => { setQuery(e.target.value); setDropOpen(true); }}
            onFocus={() => setDropOpen(true)}
            onBlur={() => setTimeout(() => setDropOpen(false), 150)}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--fg-1)" }} />
          {query && <button onClick={() => { setQuery(""); setDropOpen(false); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--fg-3)", display: "flex", padding: 0 }}><Icon name="x" size={13} /></button>}
        </div>
        {dropOpen && filtered.length > 0 && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--paper)", border: "1px solid var(--bd-2)", borderRadius: "var(--r-2)", boxShadow: "var(--shadow-2)", zIndex: 10, overflow: "hidden" }}>
            {filtered.map((d) => (
              <button key={d.id} onMouseDown={() => add(d.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(46,175,183,0.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <Avatar id={d.id} size={26} />
                <div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "var(--fg-1)" }}>{d.name}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--scai-teal)" }}>{DEV_EMAILS[d.id]}</div>
                </div>
                <Icon name="plus" size={14} style={{ color: "var(--scai-teal)", marginLeft: "auto" }} />
              </button>
            ))}
          </div>
        )}
        {dropOpen && filtered.length === 0 && query && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--paper)", border: "1px solid var(--bd-2)", borderRadius: "var(--r-2)", padding: "12px 14px", zIndex: 10 }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-3)" }}>No matching developers found.</span>
          </div>
        )}
      </div>
      {available.length === 0 && <div style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--success)", display: "flex", alignItems: "center", gap: 6 }}><Icon name="check-circle-2" size={13} /> All team members are in this space.</div>}
      <div style={{ marginTop: 12, fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-3)", lineHeight: 1.5 }}>Removing a member hides this space from their account.</div>
    </Modal>
  );
}

Object.assign(window, { CreateTaskModal, ApprovalModal, MgrTaskDetail, ManageMembersModal });
