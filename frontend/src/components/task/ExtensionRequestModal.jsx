import { useState } from "react";
import Modal from "../ui/Modal";
import Btn from "../ui/Btn";
import { Field, TextInput, TextArea } from "../ui/fields";
import { ProjectTag } from "../ui/pills";
import { Icon } from "../ui/icons";
import { toast } from "../ui/Toast";
import { useData } from "../../store/DataContext";
import { TasksApi } from "../../api/endpoints";
import { fmtDate, addDays, toInputDate } from "../../lib/format";

export default function ExtensionRequestModal({ task, onClose }) {
  const { personById, refresh } = useData();

  // Default new date = current deadline + 7 days
  const deadlineInput = toInputDate(task.deadline);
  const [date, setDate] = useState(addDays(deadlineInput, 7));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  // New date must be strictly after current deadline
  const minDate = addDays(deadlineInput, 1);
  const valid = note.trim().length >= 8 && date > deadlineInput;

  const manager = task.createdBy ? personById(task.createdBy) : null;
  const managerName = manager ? manager.name : "your manager";

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    try {
      await TasksApi.requestExtension(task.id, date, note.trim());
      await refresh();
      toast("Extension request sent to " + managerName);
      onClose();
    } catch (err) {
      toast(err?.response?.data?.error || "Failed to send request", "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      width={520}
      onClose={onClose}
      eyebrow="Request more time"
      title="Request a deadline extension"
      footer={
        <>
          <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
          <Btn kind="primary" icon="send" disabled={!valid || busy} onClick={submit}>
            {busy ? "Sending…" : "Send request"}
          </Btn>
        </>
      }
    >
      {/* Task summary chip */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--paper-2)", border: "1px solid var(--bd-1)", borderRadius: "var(--r-1)", padding: "10px 12px", marginBottom: 18 }}>
        <ProjectTag projectId={task.project} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)" }}>{task.key}</span>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "var(--fg-1)" }}>{task.title}</span>
      </div>

      {/* Current deadline (locked) and new date picker side by side */}
      <div style={{ display: "flex", gap: 16, marginBottom: 4, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 6 }}>Current deadline</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--danger)", padding: "9px 0", fontWeight: 600 }}>
            {fmtDate(task.deadline)}
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 5 }}>
            <Icon name="lock" size={11} /> Set by {managerName}
          </div>
        </div>
        <div style={{ alignSelf: "center", color: "var(--fg-3)", paddingBottom: 4 }}>
          <Icon name="arrow-right" size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <Field label="New date you're requesting" required>
            <TextInput
              type="date"
              value={date}
              min={minDate}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
        </div>
      </div>

      <Field label="Why do you need more time?" hint="Required" required>
        <TextArea
          value={note}
          placeholder="Be specific — your managing engineer reads this. e.g. 'The auth spec changed upstream; I need 3 more days to adapt and test.'"
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>

      <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="info" size={13} /> You can't change the deadline yourself — {managerName} reviews and decides.
      </div>
    </Modal>
  );
}
