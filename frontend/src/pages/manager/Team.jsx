import { useState } from "react";
import { useData } from "../../store/DataContext";
import { UsersApi } from "../../api/endpoints";
import { toast } from "../../components/ui/Toast";
import Modal from "../../components/ui/Modal";
import Btn from "../../components/ui/Btn";
import Avatar from "../../components/ui/Avatar";

import { Field, TextInput } from "../../components/ui/fields";
import { Icon } from "../../components/ui/icons";

// A small inline pill for user status (invited / active / disabled)
const USER_STATUS_PILL = {
  invited:  { bg: "#fff8c5", fg: "#9a6700", bd: "#e5c07b", label: "Invited" },
  active:   { bg: "#dafbe1", fg: "#1a7f37", bd: "#a0e5b0", label: "Active" },
  disabled: { bg: "#ffebe9", fg: "#cf222e", bd: "#faa9a7", label: "Disabled" },
};
function UserStatusPill({ status }) {
  const s = USER_STATUS_PILL[status] || USER_STATUS_PILL.invited;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 500, padding: "3px 8px", borderRadius: "var(--r-1)", background: s.bg, color: s.fg, border: `1px solid ${s.bd}`, letterSpacing: "0.03em", whiteSpace: "nowrap" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
      {s.label}
    </span>
  );
}

function InviteLinkModal({ link, onClose }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <Modal
      width={480}
      title="Invite link created"
      eyebrow="Share this link with the developer"
      onClose={onClose}
      footer={
        <Btn kind="primary" icon={copied ? "check" : "copy"} onClick={copy}>
          {copied ? "Copied!" : "Copy link"}
        </Btn>
      }
    >
      <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-2)", marginBottom: 12, lineHeight: 1.55 }}>
        Send this link to the developer so they can set their password and activate their account. The link expires in 7 days.
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "var(--paper-2)", border: "1px solid var(--bd-2)", borderRadius: "var(--r-1)", padding: "10px 12px",
      }}>
        <Icon name="link" size={13} style={{ color: "var(--scai-teal)", flexShrink: 0 }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--scai-teal)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {link}
        </span>
      </div>
    </Modal>
  );
}

function NewDeveloperModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const valid = name.trim().length >= 2 && email.trim().includes("@");

  async function submit() {
    if (!valid || loading) return;
    setLoading(true);
    try {
      const res = await UsersApi.create({ name: name.trim(), email: email.trim(), title: title.trim() });
      onCreated(res);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to create developer";
      toast(msg, "danger");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      width={480}
      title="Add a developer"
      eyebrow="New team member"
      onClose={onClose}
      footer={
        <>
          <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
          <Btn kind="primary" icon="user-plus" disabled={!valid || loading} onClick={submit}>
            {loading ? "Creating…" : "Create & get invite link"}
          </Btn>
        </>
      }
    >
      <Field label="Full name" required>
        <TextInput
          value={name}
          placeholder="e.g. Elena Lopez"
          autoFocus
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="Email address" required>
        <TextInput
          type="email"
          value={email}
          placeholder="e.g. elena@simplecodeai.com"
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label="Job title" hint="Optional">
        <TextInput
          value={title}
          placeholder="e.g. Frontend Engineer"
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>
    </Modal>
  );
}

export default function Team({ onNewSpace }) {
  const { users, refresh } = useData();
  const developers = users.filter((u) => u.role === "developer");

  const [newDevOpen, setNewDevOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  async function handleCreated(res) {
    setNewDevOpen(false);
    await refresh();
    const link = window.location.origin + res.invitePath;
    setInviteLink(link);
    toast("Invite link created");
  }

  async function handleAction(userId, action) {
    if (actionLoading) return;
    setActionLoading(userId + action);
    try {
      const res = await UsersApi.patch(userId, { action });
      await refresh();
      if (action === "reinvite" && res.invitePath) {
        const link = window.location.origin + res.invitePath;
        setInviteLink(link);
        toast("New invite link generated");
      } else if (action === "disable") {
        toast("Developer disabled");
      } else if (action === "enable") {
        toast("Developer re-enabled");
      }
    } catch (err) {
      const msg = err?.response?.data?.error || "Action failed";
      toast(msg, "danger");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 22, fontWeight: 700, color: "var(--fg-1)", letterSpacing: "-0.02em" }}>
            Team
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-3)", marginTop: 2 }}>
            {developers.length} developer{developers.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {onNewSpace && (
            <Btn kind="secondary" icon="folder-plus" onClick={onNewSpace}>
              New space
            </Btn>
          )}
          <Btn kind="primary" icon="user-plus" onClick={() => setNewDevOpen(true)}>
            New developer
          </Btn>
        </div>
      </div>

      {/* Table */}
      {developers.length === 0 ? (
        <div style={{
          background: "#fff", border: "1px solid var(--bd-1)", borderRadius: "var(--r-2)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "52px 24px", textAlign: "center",
        }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(46,175,183,0.10)", border: "1px solid rgba(46,175,183,0.22)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Icon name="users" size={22} style={{ color: "var(--scai-teal)" }} />
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 600, color: "var(--fg-2)", marginBottom: 4 }}>No developers yet</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-3)", maxWidth: 300, lineHeight: 1.55 }}>
            Add your first developer to get started. They'll receive an invite link to set their password.
          </div>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid var(--bd-1)", borderRadius: "var(--r-2)", overflow: "hidden" }}>
          {/* Table head */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 2fr 1.5fr 100px 120px",
            gap: "0 12px",
            padding: "9px 16px",
            background: "var(--paper-2)",
            borderBottom: "1px solid var(--bd-1)",
          }}>
            {["Developer", "Email", "Title", "Status", "Actions"].map((h) => (
              <div key={h} style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-3)" }}>
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {developers.map((dev, i) => (
            <div
              key={dev.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr 1.5fr 100px 120px",
                gap: "0 12px",
                padding: "11px 16px",
                alignItems: "center",
                borderBottom: i < developers.length - 1 ? "1px solid var(--bd-1)" : "none",
                opacity: dev.status === "disabled" ? 0.55 : 1,
              }}
            >
              {/* Developer */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <Avatar id={dev.id} person={dev} size={30} />
                <span style={{ fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 500, color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {dev.name}
                </span>
              </div>

              {/* Email */}
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--scai-teal)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {dev.email}
              </div>

              {/* Title */}
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--fg-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {dev.title || <span style={{ color: "var(--fg-3)" }}>—</span>}
              </div>

              {/* Status — map user status to pill tones */}
              <div>
                <UserStatusPill status={dev.status} />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 5 }}>
                {dev.status !== "disabled" && (
                  <button
                    title="Re-send invite"
                    onClick={() => handleAction(dev.id, "reinvite")}
                    disabled={!!actionLoading}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 26, height: 26, borderRadius: "var(--r-1)",
                      background: "transparent", border: "1px solid var(--bd-2)",
                      cursor: "pointer", color: "var(--fg-3)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(46,175,183,0.08)"; e.currentTarget.style.color = "var(--scai-teal)"; e.currentTarget.style.borderColor = "rgba(46,175,183,0.35)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-3)"; e.currentTarget.style.borderColor = "var(--bd-2)"; }}
                  >
                    <Icon name="mail" size={13} />
                  </button>
                )}
                {dev.status === "disabled" ? (
                  <button
                    title="Re-enable"
                    onClick={() => handleAction(dev.id, "enable")}
                    disabled={!!actionLoading}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 26, height: 26, borderRadius: "var(--r-1)",
                      background: "transparent", border: "1px solid var(--bd-2)",
                      cursor: "pointer", color: "var(--fg-3)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(26,127,55,0.08)"; e.currentTarget.style.color = "var(--success)"; e.currentTarget.style.borderColor = "rgba(26,127,55,0.35)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-3)"; e.currentTarget.style.borderColor = "var(--bd-2)"; }}
                  >
                    <Icon name="user-check" size={13} />
                  </button>
                ) : (
                  <button
                    title="Disable account"
                    onClick={() => handleAction(dev.id, "disable")}
                    disabled={!!actionLoading}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 26, height: 26, borderRadius: "var(--r-1)",
                      background: "transparent", border: "1px solid var(--bd-2)",
                      cursor: "pointer", color: "var(--fg-3)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,81,73,0.08)"; e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.borderColor = "rgba(248,81,73,0.28)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-3)"; e.currentTarget.style.borderColor = "var(--bd-2)"; }}
                  >
                    <Icon name="user-x" size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {newDevOpen && (
        <NewDeveloperModal onClose={() => setNewDevOpen(false)} onCreated={handleCreated} />
      )}
      {inviteLink && (
        <InviteLinkModal link={inviteLink} onClose={() => setInviteLink(null)} />
      )}
    </div>
  );
}
