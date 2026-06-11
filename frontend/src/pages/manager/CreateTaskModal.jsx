import { useState, useEffect } from "react";
import { useData } from "../../store/DataContext";
import { TasksApi } from "../../api/endpoints";
import { toast } from "../../components/ui/Toast";
import Modal from "../../components/ui/Modal";
import Btn from "../../components/ui/Btn";
import { Field, TextInput, TextArea, Select } from "../../components/ui/fields";
import { addDays } from "../../lib/format";

export default function CreateTaskModal({ defaultProjectId, onClose }) {
  const { projects, users, refresh } = useData();

  const firstProject = projects[0]?.id || "";
  const [project, setProject] = useState(defaultProjectId || firstProject);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState("med");
  const today = new Date().toISOString().slice(0, 10);
  const [deadline, setDeadline] = useState(addDays(today, 14));
  const [branch, setBranch] = useState("");
  const [loading, setLoading] = useState(false);

  // Members of the selected project — look up user objects
  const selectedProject = projects.find((p) => p.id === project);
  const memberIds = selectedProject?.members || [];
  const memberUsers = memberIds
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean);

  // When project changes, reset assignee to first member of the new project
  useEffect(() => {
    setAssignee(memberUsers[0]?.id || "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  const valid =
    title.trim().length >= 3 &&
    project &&
    assignee &&
    deadline;

  async function submit() {
    if (!valid || loading) return;
    setLoading(true);
    try {
      await TasksApi.create({
        project,
        title: title.trim(),
        desc: desc.trim(),
        assignee,
        priority,
        deadline,
        branch: branch.trim(),
      });
      await refresh();
      const assigneeName = users.find((u) => u.id === assignee)?.name?.split(" ")[0] || "developer";
      toast(`Task created and assigned to ${assigneeName}`);
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to create task";
      toast(msg, "danger");
    } finally {
      setLoading(false);
    }
  }

  const PRIORITY_LABELS = { low: "Low", med: "Medium", high: "High" };

  return (
    <Modal
      width={580}
      onClose={onClose}
      eyebrow="New task"
      title="Create a task"
      footer={
        <>
          <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
          <Btn kind="primary" icon="plus" disabled={!valid || loading} onClick={submit}>
            {loading ? "Creating…" : "Create task"}
          </Btn>
        </>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Title" required>
            <TextInput
              value={title}
              placeholder="Short, action-first — e.g. 'Add retry backoff to webhooks'"
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Description">
            <TextArea
              value={desc}
              placeholder="What does done look like? Acceptance criteria, links, context."
              onChange={(e) => setDesc(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Space / project" required>
          <Select value={project} onChange={(e) => setProject(e.target.value)}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </Field>

        <Field
          label="Assignee"
          hint={`${memberUsers.length} in space`}
          required
        >
          <Select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            disabled={memberUsers.length === 0}
          >
            {memberUsers.length === 0 ? (
              <option value="">No members — add some first</option>
            ) : (
              memberUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))
            )}
          </Select>
        </Field>

        <Field label="Deadline" required hint="Locked for the developer">
          <TextInput
            type="date"
            value={deadline}
            min={today}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </Field>

        <Field label="Priority">
          <div style={{ display: "flex", border: "1px solid var(--bd-2)", borderRadius: "var(--r-1)", overflow: "hidden" }}>
            {["low", "med", "high"].map((p, i) => {
              const on = priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  style={{
                    flex: 1, padding: "9px 0", border: "none",
                    borderRight: i < 2 ? "1px solid var(--bd-2)" : "none",
                    background: on ? "var(--scai-slate)" : "var(--paper)",
                    color: on ? "#fff" : "var(--fg-2)",
                    fontFamily: "var(--font-body)", fontSize: 12.5,
                    fontWeight: on ? 600 : 400, cursor: "pointer", textTransform: "capitalize",
                  }}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              );
            })}
          </div>
        </Field>

        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="GitHub branch" hint="Optional">
            <TextInput
              value={branch}
              placeholder={selectedProject ? `feature/${selectedProject.key.toLowerCase()}-…` : "feature/…"}
              onChange={(e) => setBranch(e.target.value)}
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
