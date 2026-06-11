import { useState, useRef } from "react";
import { useData } from "../../store/DataContext";
import { ProjectsApi } from "../../api/endpoints";
import { toast } from "../../components/ui/Toast";
import Modal from "../../components/ui/Modal";
import Btn from "../../components/ui/Btn";
import Avatar from "../../components/ui/Avatar";
import { ProjectTag } from "../../components/ui/pills";
import { Icon } from "../../components/ui/icons";

export default function ManageMembersModal({ projectId, onClose }) {
  const { projects, users, refresh } = useData();
  const project = projects.find((p) => p.id === projectId);
  const [members, setMembers] = useState(project ? [...project.members] : []);
  const [query, setQuery] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // All developers not yet in the working member set
  const developers = users.filter((u) => u.role === "developer");
  const available = developers.filter((d) => !members.includes(d.id));
  const filtered = available.filter((d) => {
    const q = query.toLowerCase();
    return !q || d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q);
  });

  function add(id) {
    setMembers((m) => [...m, id]);
    setQuery("");
    setDropOpen(false);
  }

  function remove(id) {
    setMembers((m) => m.filter((x) => x !== id));
  }

  async function save() {
    if (loading) return;
    setLoading(true);
    try {
      await ProjectsApi.setMembers(projectId, members);
      await refresh();
      toast("Members updated");
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update members";
      toast(msg, "danger");
    } finally {
      setLoading(false);
    }
  }

  if (!project) return null;

  return (
    <Modal
      width={500}
      onClose={onClose}
      eyebrow={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <ProjectTag projectId={projectId} /> {project.name}
        </span>
      }
      title="Manage space members"
      footer={
        <>
          <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
          <Btn kind="primary" icon="check" onClick={save} disabled={loading}>
            {loading ? "Saving…" : "Save members"}
          </Btn>
        </>
      }
    >
      {/* Current members */}
      {members.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 8 }}>
            Current members — {members.length}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {members.map((id) => {
              const dev = users.find((u) => u.id === id);
              if (!dev) return null;
              return (
                <div
                  key={id}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "var(--paper-2)", border: "1px solid var(--bd-1)", borderRadius: "var(--r-1)" }}
                >
                  <Avatar id={id} person={dev} size={26} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "var(--fg-1)" }}>
                      {dev.name}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--scai-teal)" }}>
                      {dev.email}
                    </div>
                  </div>
                  <button
                    onClick={() => remove(id)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "var(--r-1)", background: "transparent", border: "1px solid transparent", cursor: "pointer", color: "var(--fg-3)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,81,73,0.10)"; e.currentTarget.style.color = "var(--danger)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-3)"; }}
                  >
                    <Icon name="x" size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search to add */}
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 8 }}>
        Add member by email
      </div>
      <div style={{ position: "relative" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--paper-2)",
          border: `1px solid ${dropOpen ? "var(--scai-teal)" : "var(--bd-2)"}`,
          borderRadius: "var(--r-1)", padding: "8px 10px",
          boxShadow: dropOpen ? "0 0 0 2px rgba(46,175,183,0.12)" : "none",
          transition: "border-color 120ms",
        }}>
          <Icon name="mail" size={14} style={{ color: "var(--fg-3)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            placeholder={available.length ? "Search by name or email…" : "All team members added"}
            disabled={!available.length}
            onChange={(e) => { setQuery(e.target.value); setDropOpen(true); }}
            onFocus={() => setDropOpen(true)}
            onBlur={() => setTimeout(() => setDropOpen(false), 150)}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--fg-1)" }}
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setDropOpen(false); }}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--fg-3)", display: "flex", padding: 0 }}
            >
              <Icon name="x" size={13} />
            </button>
          )}
        </div>

        {/* Dropdown results */}
        {dropOpen && filtered.length > 0 && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--paper)", border: "1px solid var(--bd-2)", borderRadius: "var(--r-2)", boxShadow: "var(--shadow-2)", zIndex: 10, overflow: "hidden" }}>
            {filtered.map((dev) => (
              <button
                key={dev.id}
                onMouseDown={() => add(dev.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(46,175,183,0.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Avatar id={dev.id} person={dev} size={26} />
                <div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "var(--fg-1)" }}>{dev.name}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--scai-teal)" }}>{dev.email}</div>
                </div>
                <Icon name="plus" size={14} style={{ color: "var(--scai-teal)", marginLeft: "auto" }} />
              </button>
            ))}
          </div>
        )}

        {/* Empty search result */}
        {dropOpen && filtered.length === 0 && query && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--paper)", border: "1px solid var(--bd-2)", borderRadius: "var(--r-2)", padding: "12px 14px", zIndex: 10 }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-3)" }}>No matching developers found.</span>
          </div>
        )}
      </div>

      {/* All-added message */}
      {available.length === 0 && (
        <div style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--success)", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="check-circle-2" size={13} /> All team members are in this space.
        </div>
      )}

      <div style={{ marginTop: 12, fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-3)", lineHeight: 1.5 }}>
        Removing a member hides this space from their account.
      </div>
    </Modal>
  );
}
