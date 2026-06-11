// ============================================================
// Simple Code AI — Developer modals: Task detail + Extension request
// ============================================================
function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function MetaRow({ icon, label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--bd-1)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: 120, flex: "0 0 120px", color: "var(--fg-3)" }}>
        <Icon name={icon} size={14} />
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

const STATUS_FLOW = ["todo", "in_progress", "in_review", "done"];
function StatusEditor({ task, editable }) {
  useIcons();
  const cur = task.status;
  return (
    <div>
      <div style={{ display: "flex", gap: 0, border: "1px solid var(--bd-2)", borderRadius: "var(--r-1)", overflow: "hidden", width: "fit-content", maxWidth: "100%", flexWrap: "wrap" }}>
        {STATUS_FLOW.map((s, i) => {
          const on = cur === s;
          const meta = SCAI.STATUS[s];
          return (
            <button key={s} disabled={!editable} onClick={() => {
              if (cur === s) return;
              const wasStale = SCAI.isStale(task);
              SCAI.setTaskStatus(task.id, s);
              if (wasStale && (s === "in_review" || s === "done")) toast(`${task.key} cleared from Stale → ${meta.label}`);
              else toast(`${task.key} → ${meta.label}`);
            }} style={{
              padding: "7px 13px", border: "none", borderRight: i < STATUS_FLOW.length - 1 ? "1px solid var(--bd-2)" : "none",
              background: on ? "var(--teal-800)" : "var(--paper)", color: on ? "var(--paper)" : "var(--fg-2)",
              fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: on ? 600 : 400,
              cursor: editable ? "pointer" : "default", whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { if (editable && !on) e.currentTarget.style.background = "var(--sand-200)"; }}
            onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "var(--paper)"; }}>
              {meta.label}
            </button>
          );
        })}
      </div>
      {!editable && <div style={{ marginTop: 7, fontFamily: "var(--font-body)", fontSize: 11.5, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 5 }}><Icon name="eye" size={12} /> View only — this task is assigned to {SCAI.personById(task.assignee).name.split(" ")[0]}.</div>}
    </div>
  );
}

function DevTaskDetail({ taskId, onClose, onRequestExt }) {
  const state = useStore();
  useIcons();
  const t = SCAI.taskById(taskId);
  if (!t) return null;
  const mine = t.assignee === state.session.devId;
  const stale = SCAI.isStale(t);
  const left = SCAI.daysLeft(t);
  const pending = t.ext && t.ext.state === "pending";

  return (
    <Modal width={620} onClose={onClose}
      eyebrow={<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><ProjectTag projectId={t.project} /> <span style={{ fontFamily: "var(--font-mono)", letterSpacing: 0 }}>{t.key}</span></span>}
      title={t.title}
      footer={<>
        <Btn kind="ghost" onClick={onClose}>Close</Btn>
        {mine && !pending && <Btn kind="primary" icon="calendar-plus" onClick={() => onRequestExt(t)}>Request extension</Btn>}
      </>}>

      {stale && (
        <div style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.28)", borderRadius: "var(--r-1)", padding: "10px 12px", marginBottom: 16, color: "var(--danger)" }}>
          <Icon name="alert-triangle" size={16} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500 }}>Stale — {Math.abs(left)} day{Math.abs(left) === 1 ? "" : "s"} past deadline and not yet in review.</span>
        </div>
      )}

      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Status</div>
        <StatusEditor task={t} editable={mine} />
        <div style={{ marginTop: 8, fontFamily: "var(--font-body)", fontSize: 11.5, color: "var(--fg-3)" }}>Done and In Review are never marked stale.</div>
      </div>

      <MetaRow icon="user" label="Assignee">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar id={t.assignee} size={24} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--fg-1)" }}>{SCAI.personById(t.assignee).name}</span>
          {mine && <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--teal-700)", background: "var(--teal-100)", border: "1px solid var(--teal-200)", borderRadius: 3, padding: "1px 6px" }}>You</span>}
        </div>
      </MetaRow>
      <MetaRow icon="flag" label="Priority"><PriorityTag priority={t.priority} /></MetaRow>
      <MetaRow icon="lock" label="Deadline">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: left < 0 && t.status !== "done" ? "var(--danger)" : "var(--fg-1)", fontWeight: 600 }}>{fmtDate(t.deadline)}</span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-3)" }}>· {deadlinePhrase(t)}</span>
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-body)", fontSize: 11, color: "var(--fg-3)" }}><Icon name="lock" size={11} /> Set by Dana Okafor</span>
        </div>
      </MetaRow>
      <MetaRow icon="git-branch" label="Branch"><BranchTag branch={t.branch} /></MetaRow>

      <div style={{ marginTop: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Description</div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>{t.desc}</p>
      </div>

      {t.ext && (
        <div style={{ marginTop: 18, background: "var(--paper-2)", border: "1px solid var(--bd-2)", borderTop: "1px solid rgba(46,175,183,0.25)", borderRadius: "var(--r-2)", padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Icon name={t.ext.state === "pending" ? "hourglass" : t.ext.state === "approved" ? "check-circle-2" : "x-circle"} size={15} style={{ color: t.ext.state === "pending" ? "var(--scai-teal)" : t.ext.state === "approved" ? "var(--success)" : "var(--danger)" }} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--fg-1)" }}>
              {t.ext.state === "pending" ? "Extension requested" : t.ext.state === "approved" ? "Extension approved" : "Extension denied"}
            </span>
            <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)" }}>{fmtShort(t.ext.originalDeadline)} → {fmtShort(t.ext.grantedDate || t.ext.requestedDate)}</span>
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.5, fontStyle: "italic" }}>“{t.ext.note}”</div>
          {t.ext.managerNote && <div style={{ marginTop: 8, fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.5 }}><strong style={{ color: "var(--fg-1)" }}>Dana:</strong> {t.ext.managerNote}</div>}
        </div>
      )}
    </Modal>
  );
}

function ExtensionModal({ task, onClose }) {
  useIcons();
  const [date, setDate] = useState(addDays(task.deadline, 7));
  const [note, setNote] = useState("");
  const valid = note.trim().length >= 8 && date > task.deadline;
  function submit() {
    if (!valid) return;
    SCAI.requestExtension(task.id, date, note.trim());
    toast("Extension request sent to Dana Okafor");
    onClose();
  }
  return (
    <Modal width={520} onClose={onClose} eyebrow="Request more time" title="Request a deadline extension"
      footer={<>
        <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
        <Btn kind="primary" icon="send" disabled={!valid} onClick={submit}>Send request</Btn>
      </>}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--paper-2)", border: "1px solid var(--bd-1)", borderRadius: "var(--r-1)", padding: "10px 12px", marginBottom: 18 }}>
        <ProjectTag projectId={task.project} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)" }}>{task.key}</span>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "var(--fg-1)" }}>{task.title}</span>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Current deadline</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--danger)", padding: "9px 0", fontWeight: 600 }}>{fmtDate(task.deadline)}</div>
        </div>
        <div style={{ alignSelf: "center", color: "var(--fg-3)", paddingTop: 18 }}><Icon name="arrow-right" size={18} /></div>
        <div style={{ flex: 1 }}>
          <Field label="New date you're requesting" required>
            <TextInput type="date" value={date} min={addDays(task.deadline, 1)} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
      </div>

      <Field label="Why do you need more time?" hint="Required" required>
        <TextArea value={note} placeholder="Be specific — your managing engineer reads this. e.g. 'The auth spec changed upstream; I need 3 more days to adapt and test.'" onChange={(e) => setNote(e.target.value)} />
      </Field>
      <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="info" size={13} /> You can't change the deadline yourself — Dana Okafor reviews and decides.
      </div>
    </Modal>
  );
}

Object.assign(window, { DevTaskDetail, ExtensionModal, addDays });
