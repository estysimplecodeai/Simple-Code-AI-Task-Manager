import { useState } from "react";
import { ProjectsApi } from "../../api/endpoints";
import { useData } from "../../store/DataContext";
import { toast } from "../../components/ui/Toast";
import Modal from "../../components/ui/Modal";
import Btn from "../../components/ui/Btn";
import { Field, TextInput, Select } from "../../components/ui/fields";

export default function CreateProjectModal({ onClose }) {
  const { refresh } = useData();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [tone, setTone] = useState("teal");
  const [loading, setLoading] = useState(false);

  const valid = name.trim().length >= 2 && key.trim().length >= 2;

  function handleKeyChange(e) {
    // Auto-uppercase, strip spaces, max 8 chars
    setKey(e.target.value.replace(/\s/g, "").toUpperCase().slice(0, 8));
  }

  function handleNameChange(e) {
    const v = e.target.value;
    setName(v);
    // Auto-derive key from first letters of each word if key not manually edited
    if (!key || key === derivedKey(name)) {
      setKey(derivedKey(v));
    }
  }

  function derivedKey(str) {
    return str
      .trim()
      .split(/\s+/)
      .map((w) => w[0] || "")
      .join("")
      .toUpperCase()
      .slice(0, 8);
  }

  async function submit() {
    if (!valid || loading) return;
    setLoading(true);
    try {
      await ProjectsApi.create({ name: name.trim(), key: key.trim(), tone });
      await refresh();
      toast("Space created");
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to create space";
      toast(msg, "danger");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      width={460}
      onClose={onClose}
      eyebrow="New space"
      title="Create a project space"
      footer={
        <>
          <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
          <Btn kind="primary" icon="folder-plus" disabled={!valid || loading} onClick={submit}>
            {loading ? "Creating…" : "Create space"}
          </Btn>
        </>
      }
    >
      <Field label="Space name" required>
        <TextInput
          value={name}
          placeholder="e.g. Atlas Web App"
          autoFocus
          onChange={handleNameChange}
        />
      </Field>

      <Field label="Short key" required hint="Auto-generated · max 8 chars">
        <TextInput
          value={key}
          placeholder="e.g. ATLAS"
          onChange={handleKeyChange}
          style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}
        />
      </Field>

      <Field label="Colour tone">
        <Select value={tone} onChange={(e) => setTone(e.target.value)}>
          <option value="teal">Teal</option>
          <option value="coral">Coral</option>
          <option value="sand">Sand</option>
        </Select>
      </Field>
    </Modal>
  );
}
