import { useState } from "react";
import Modal from "../ui/Modal";
import Btn from "../ui/Btn";
import Avatar from "../ui/Avatar";
import { Field, TextInput, TextArea, Select } from "../ui/fields";
import { MetaRow } from "../ui/misc";
import { ProjectTag, PriorityTag, BranchTag, StatusPill, STATUS, PRIORITY } from "../ui/pills";
import { Icon } from "../ui/icons";
import { toast } from "../ui/Toast";
import { useData } from "../../store/DataContext";
import { useAuth } from "../../auth/AuthContext";
import { TasksApi } from "../../api/endpoints";
import { fmtDate, fmtShort, toInputDate, deadlinePhrase, addDays } from "../../lib/format";
import ExtensionRequestModal from "./ExtensionRequestModal";

// ============================================================
// Developer mode — status flow bar
// ============================================================
const STATUS_FLOW = ["todo", "in_progress", "in_review", "done"];

function StatusEditor({ task, editable, onStatusChange }) {
  const cur = task.status;
  return (
    <div>
      <div style={{ display: "flex", gap: 0, border: "1px solid var(--bd-2)", borderRadius: "var(--r-1)", overflow: "hidden", width: "fit-content", maxWidth: "100%", flexWrap: "wrap" }}>
        {STATUS_FLOW.map((s, i) => {
          const on = cur === s;
          const meta = STATUS[s];
          return (
            <button
              key={s}
              disabled={!editable}
              onClick={() => { if (cur !== s) onStatusChange(s); }}
              style={{
                padding: "7px 13px",
                border: "none",
                borderRight: i < STATUS_FLOW.length - 1 ? "1px solid var(--bd-2)" : "none",
                background: on ? "var(--teal-800, #1a4a4d)" : "var(--paper)",
                color: on ? "#fff" : "var(--fg-2)",
                fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: on ? 600 : 400,
                cursor: editable ? "pointer" : "default", whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { if (editable && !on) e.currentTarget.style.background = "var(--sand-200, #f5f0e8)"; }}
              onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "var(--paper)"; }}
            >
              {meta?.label || s}
            </button>
          );
        })}
      </div>
      {!editable && (
        <div style={{ marginTop: 7, fontFamily: "var(--font-body)", fontSize: 11.5, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 5 }}>
          <Icon name="eye" size={12} /> View only — this task is not assigned to you.
        </div>
      )}
    </div>
  );
}

// ============================================================
// Developer task detail modal
// ============================================================
function DeveloperTaskDetail({ task, onClose }) {
  const { user } = useAuth();
  const { personById, refresh } = useData();
  const [showExtModal, setShowExtModal] = useState(false);
  const [busy, setBusy] = useState(false);

  const mine = task.assignee === user?.id;
  const stale = task.stale || false;
  const left = task.daysLeft;
  const pending = task.ext && task.ext.state === "pending";

  async function handleStatusChange(newStatus) {
    setBusy(true);
    try {
      await TasksApi.setStatus(task.id, newStatus);
      await refresh();
      toast(`${task.key} → ${STATUS[newStatus]?.label || newStatus}`);
    } catch (err) {
      toast(err?.response?.data?.error || "Failed to update status", "danger");
    } finally {
      setBusy(false);
    }
  }

  const manager = task.createdBy ? personById(task.createdBy) : null;
  const managerName = manager ? manager.name : "your manager";

  return (
    <>
      <Modal
        width={620}
        onClose={onClose}
        eyebrow={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <ProjectTag projectId={task.project} />
            <span style={{ fontFamily: "var(--font-mono)", letterSpacing: 0 }}>{task.key}</span>
          </span>
        }
        title={task.title}
        footer={
          <>
            <Btn kind="ghost" onClick={onClose}>Close</Btn>
            {mine && !pending && (
              <Btn kind="primary" icon="calendar-plus" onClick={() => setShowExtModal(true)}>
                Request extension
              </Btn>
            )}
          </>
        }
      >
        {/* Stale banner */}
        {stale && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.28)", borderRadius: "var(--r-1)", padding: "10px 12px", marginBottom: 16, color: "var(--danger)" }}>
            <Icon name="alert-triangle" size={16} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500 }}>
              Stale — {Math.abs(left)} day{Math.abs(left) === 1 ? "" : "s"} past deadline and not yet in review.
            </span>
          </div>
        )}

        {/* Status editor */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 8 }}>Status</div>
          <StatusEditor task={task} editable={mine && !busy} onStatusChange={handleStatusChange} />
          <div style={{ marginTop: 8, fontFamily: "var(--font-body)", fontSize: 11.5, color: "var(--fg-3)" }}>Done and In Review are never marked stale.</div>
        </div>

        {/* Meta rows */}
        <MetaRow icon="user" label="Assignee">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar id={task.assignee} size={24} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--fg-1)" }}>
              {personById(task.assignee)?.name || task.assignee}
            </span>
            {mine && (
              <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--teal-700, #1a7a82)", background: "var(--teal-100, rgba(46,175,183,0.10))", border: "1px solid var(--teal-200, rgba(46,175,183,0.25))", borderRadius: 3, padding: "1px 6px" }}>
                You
              </span>
            )}
          </div>
        </MetaRow>

        <MetaRow icon="flag" label="Priority">
          <PriorityTag priority={task.priority} />
        </MetaRow>

        <MetaRow icon="lock" label="Deadline">
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: left < 0 && task.status !== "done" ? "var(--danger)" : "var(--fg-1)", fontWeight: 600 }}>
              {fmtDate(task.deadline)}
            </span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-3)" }}>
              · {deadlinePhrase(task)}
            </span>
            <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-body)", fontSize: 11, color: "var(--fg-3)" }}>
              <Icon name="lock" size={11} /> Set by {managerName}
            </span>
          </div>
        </MetaRow>

        <MetaRow icon="git-branch" label="Branch">
          <BranchTag branch={task.branch} />
        </MetaRow>

        {/* Description */}
        {task.desc && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 8 }}>Description</div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>{task.desc}</p>
          </div>
        )}

        {/* Extension panel */}
        {task.ext && (
          <div style={{ marginTop: 18, background: "var(--paper-2)", border: "1px solid var(--bd-2)", borderTop: "1px solid rgba(46,175,183,0.25)", borderRadius: "var(--r-2)", padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Icon
                name={task.ext.state === "pending" ? "hourglass" : task.ext.state === "approved" ? "check-circle-2" : "x-circle"}
                size={15}
                style={{ color: task.ext.state === "pending" ? "var(--scai-teal)" : task.ext.state === "approved" ? "var(--success)" : "var(--danger)" }}
              />
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--fg-1)" }}>
                {task.ext.state === "pending" ? "Extension requested" : task.ext.state === "approved" ? "Extension approved" : "Extension denied"}
              </span>
              <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)" }}>
                {fmtShort(task.ext.originalDeadline)} → {fmtShort(task.ext.grantedDate || task.ext.requestedDate)}
              </span>
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.5, fontStyle: "italic" }}>"{task.ext.note}"</div>
            {task.ext.managerNote && (
              <div style={{ marginTop: 8, fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--fg-1)" }}>{managerName}:</strong> {task.ext.managerNote}
              </div>
            )}
          </div>
        )}
      </Modal>

      {showExtModal && (
        <ExtensionRequestModal
          task={task}
          onClose={() => setShowExtModal(false)}
        />
      )}
    </>
  );
}

// ============================================================
// Manager task detail modal (editable)
// ============================================================
function ManagerTaskDetail({ task, onClose }) {
  const { personById, projectById, refresh } = useData();
  const proj = projectById(task.project);
  const members = proj?.members || [];
  const stale = task.stale || false;
  const pending = task.ext && task.ext.state === "pending";

  // Editable local state
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.desc || "");
  const [assignee, setAssignee] = useState(task.assignee || "");
  const [priority, setPriority] = useState(task.priority || "med");
  const [deadline, setDeadline] = useState(toInputDate(task.deadline));
  const [branch, setBranch] = useState(task.branch || "");
  const [status, setStatus] = useState(task.status);

  // Extension decision state
  const [decision, setDecision] = useState("approve");
  const [newDate, setNewDate] = useState(task.ext ? toInputDate(task.ext.requestedDate) : "");
  const [managerNote, setManagerNote] = useState("");

  const [busy, setBusy] = useState(false);

  const extOrigDeadline = task.ext ? toInputDate(task.ext.originalDeadline) : "";
  const decisionValid = decision !== "modify" || (newDate && newDate > extOrigDeadline);

  async function saveField(field, value) {
    try {
      await TasksApi.patch(task.id, { [field]: value });
      await refresh();
      toast(`Updated ${field}`);
    } catch (err) {
      toast(err?.response?.data?.error || "Failed to update", "danger");
    }
  }

  async function saveStatus(newStatus) {
    try {
      await TasksApi.setStatus(task.id, newStatus);
      await refresh();
      toast(`${task.key} → ${STATUS[newStatus]?.label || newStatus}`);
    } catch (err) {
      toast(err?.response?.data?.error || "Failed to update status", "danger");
    }
  }

  async function handleDecide() {
    if (!decisionValid || busy) return;
    setBusy(true);
    try {
      const opts = { managerNote: managerNote.trim() };
      if (decision === "modify") opts.newDate = newDate;
      await TasksApi.decideExtension(task.id, decision, opts);
      await refresh();
      const assigneeName = personById(task.assignee)?.name?.split(" ")[0] || "developer";
      if (decision === "deny") {
        toast(`Extension denied — ${assigneeName} notified`);
      } else {
        const grantDate = decision === "modify" ? newDate : (task.ext?.requestedDate ? toInputDate(task.ext.requestedDate) : "");
        toast(`Deadline moved to ${fmtShort(grantDate)}`);
      }
      onClose();
    } catch (err) {
      toast(err?.response?.data?.error || "Failed to decide", "danger");
    } finally {
      setBusy(false);
    }
  }

  const extOpts = [
    { id: "approve", label: "Approve", icon: "check", sub: task.ext ? `Move to ${fmtShort(task.ext.requestedDate)}` : "" },
    { id: "modify", label: "Adjust date", icon: "calendar", sub: "Grant a different date" },
    { id: "deny", label: "Deny", icon: "x", sub: "Keep current deadline" },
  ];

  return (
    <Modal
      width={620}
      onClose={onClose}
      eyebrow={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <ProjectTag projectId={task.project} />
          <span style={{ fontFamily: "var(--font-mono)", letterSpacing: 0 }}>{task.key}</span>
        </span>
      }
      title={task.title}
      footer={
        <>
          <Btn kind="ghost" onClick={onClose}>Close</Btn>
          {pending && (
            <Btn kind="teal" icon="calendar-check" onClick={handleDecide} disabled={!decisionValid || busy}>
              {busy ? "Saving…" : "Review extension"}
            </Btn>
          )}
        </>
      }
    >
      {/* Stale banner */}
      {stale && (
        <div style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.28)", borderRadius: "var(--r-1)", padding: "10px 12px", marginBottom: 16, color: "var(--danger)" }}>
          <Icon name="alert-triangle" size={16} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500 }}>
            Stale — {Math.abs(task.daysLeft)} day{Math.abs(task.daysLeft) === 1 ? "" : "s"} past deadline.
          </span>
        </div>
      )}

      {/* Editable fields grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px", marginBottom: 4 }}>
        {/* Title — full width */}
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Title" required>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => { if (title.trim() !== task.title) saveField("title", title.trim()); }}
            />
          </Field>
        </div>

        {/* Description — full width */}
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Description">
            <TextArea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onBlur={() => { if (desc !== (task.desc || "")) saveField("desc", desc); }}
            />
          </Field>
        </div>

        <Field label="Status">
          <Select value={status} onChange={(e) => { setStatus(e.target.value); saveStatus(e.target.value); }}>
            {["todo", "in_progress", "in_review", "done"].map((s) => (
              <option key={s} value={s}>{STATUS[s]?.label || s}</option>
            ))}
          </Select>
        </Field>

        <Field label="Assignee">
          <Select value={assignee} onChange={(e) => { setAssignee(e.target.value); saveField("assignee", e.target.value); }}>
            {assignee && !members.includes(assignee) && (
              <option value={assignee}>{personById(assignee)?.name || assignee} (not a member)</option>
            )}
            {members.map((m) => (
              <option key={m} value={m}>{personById(m)?.name || m}</option>
            ))}
          </Select>
        </Field>

        <Field label="Deadline" hint="You can change this">
          <TextInput
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            onBlur={() => { if (deadline !== toInputDate(task.deadline)) saveField("deadline", deadline); }}
          />
        </Field>

        <Field label="Priority">
          <Select value={priority} onChange={(e) => { setPriority(e.target.value); saveField("priority", e.target.value); }}>
            {["low", "med", "high"].map((p) => (
              <option key={p} value={p}>{PRIORITY[p]?.label || p}</option>
            ))}
          </Select>
        </Field>

        {/* Branch — full width */}
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="GitHub branch" hint="Optional">
            <TextInput
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              onBlur={() => { if (branch !== (task.branch || "")) saveField("branch", branch); }}
            />
          </Field>
        </div>
      </div>

      <MetaRow icon="git-branch" label="Branch">
        <BranchTag branch={task.branch} />
      </MetaRow>

      {/* Extension panel */}
      {task.ext && (
        <div style={{ marginTop: 18, background: pending ? "rgba(46,175,183,0.08)" : "var(--paper-2)", border: `1px solid ${pending ? "rgba(46,175,183,0.28)" : "var(--bd-1)"}`, borderRadius: "var(--r-2)", padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Icon
              name={pending ? "hourglass" : task.ext.state === "approved" ? "check-circle-2" : "x-circle"}
              size={15}
              style={{ color: pending ? "var(--coral-600, #e05c3a)" : task.ext.state === "approved" ? "var(--success)" : "var(--danger)" }}
            />
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600 }}>
              {pending ? "Extension requested" : task.ext.state === "approved" ? "Extension approved" : "Extension denied"}
            </span>
            <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)" }}>
              {fmtShort(task.ext.originalDeadline)} → {fmtShort(task.ext.grantedDate || task.ext.requestedDate)}
            </span>
          </div>

          {/* Developer's note */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Avatar id={task.assignee} size={28} />
            <div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600 }}>
                {personById(task.assignee)?.name || "Developer"}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-3)" }}>
                requested {fmtShort(task.ext.requestedAt)}
              </div>
            </div>
          </div>

          <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-2)", lineHeight: 1.55, paddingLeft: 12, borderLeft: "2px solid var(--bd-1)", marginBottom: pending ? 16 : 0 }}>
            "{task.ext.note}"
          </div>

          {/* Decision controls (only for pending extensions) */}
          {pending && (
            <>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 8 }}>Your decision</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {extOpts.map((o) => {
                  const on = decision === o.id;
                  const danger = o.id === "deny";
                  return (
                    <button
                      key={o.id}
                      onClick={() => setDecision(o.id)}
                      style={{
                        flex: 1, textAlign: "left", padding: "10px 12px", borderRadius: "var(--r-1)", cursor: "pointer",
                        background: on ? (danger ? "rgba(248,81,73,0.10)" : "rgba(46,175,183,0.10)") : "var(--paper)",
                        border: `1px solid ${on ? (danger ? "rgba(248,81,73,0.35)" : "rgba(46,175,183,0.35)") : "var(--bd-2)"}`,
                      }}
                    >
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
                  <TextInput
                    type="date"
                    value={newDate}
                    min={addDays(extOrigDeadline, 1)}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </Field>
              )}

              <Field label="Reply to the developer" hint="Optional but encouraged">
                <TextArea
                  value={managerNote}
                  placeholder={decision === "deny" ? "Explain why, and what you'd like instead." : "A quick note — e.g. 'Approved, get it solid.'"}
                  onChange={(e) => setManagerNote(e.target.value)}
                  style={{ minHeight: 64 }}
                />
              </Field>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

// ============================================================
// Public export — routes to dev or manager mode
// ============================================================
export default function TaskDetailModal({ taskId, mode, onClose }) {
  const { taskById } = useData();
  const task = taskById(taskId);

  if (!task) return null;

  if (mode === "manager") {
    return <ManagerTaskDetail task={task} onClose={onClose} />;
  }
  return <DeveloperTaskDetail task={task} onClose={onClose} />;
}
