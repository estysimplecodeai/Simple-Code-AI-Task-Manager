import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AuthApi } from "../api/endpoints";
import { Field, TextInput } from "../components/ui/fields";
import Btn from "../components/ui/Btn";
import logo from "../assets/scai-logo.png";

const cardStyle = {
  width: 360,
  background: "#fff",
  border: "1px solid var(--bd-1)",
  borderTop: "3px solid var(--scai-teal)",
  borderRadius: "var(--r-3)",
  boxShadow: "var(--shadow-2)",
  padding: 28,
};

const wrapStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--bg-1)",
};

export default function AcceptInvite() {
  const { token } = useParams();
  const nav = useNavigate();
  const { acceptInvite } = useAuth();

  const [invite, setInvite] = useState(null);   // { name, email }
  const [invalid, setInvalid] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    AuthApi.invite(token)
      .then((data) => setInvite(data))
      .catch(() => setInvalid(true))
      .finally(() => setFetching(false));
  }, [token]);

  // Validation
  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = password.length >= 8 && password === confirm && !busy;

  async function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true); setErr("");
    try {
      await acceptInvite(token, password);
      nav("/");
    } catch (e2) {
      setErr(e2.response?.data?.error || "Could not set password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (fetching) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <img src={logo} alt="Simple Code AI" height="38" style={{ display: "block", mixBlendMode: "multiply", marginBottom: 18 }} />
          <div style={{ color: "var(--fg-3)", fontSize: 14 }}>Loading invite…</div>
        </div>
      </div>
    );
  }

  if (invalid) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <img src={logo} alt="Simple Code AI" height="38" style={{ display: "block", mixBlendMode: "multiply", marginBottom: 18 }} />
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Invite invalid or expired</div>
          <div style={{ fontSize: 14, color: "var(--fg-3)", lineHeight: 1.6 }}>
            This invite link is no longer valid. Please ask your manager to send a new one.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapStyle}>
      <form onSubmit={submit} style={cardStyle}>
        <img src={logo} alt="Simple Code AI" height="38" style={{ display: "block", mixBlendMode: "multiply", marginBottom: 18 }} />
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 4 }}>Welcome, {invite.name}</div>
        <div style={{ fontSize: 13, color: "var(--fg-3)", marginBottom: 20 }}>Set a password for <strong>{invite.email}</strong></div>

        {/* Read-only name + email */}
        <Field label="Name">
          <TextInput type="text" value={invite.name} readOnly style={{ background: "var(--paper-2)", color: "var(--fg-3)", cursor: "default" }} />
        </Field>
        <Field label="Email">
          <TextInput type="email" value={invite.email} readOnly style={{ background: "var(--paper-2)", color: "var(--fg-3)", cursor: "default" }} />
        </Field>

        <Field label="Choose a password" required hint={tooShort ? "Min 8 characters" : undefined}>
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            minLength={8}
          />
        </Field>
        <Field label="Confirm password" required hint={mismatch ? "Passwords must match" : undefined}>
          <TextInput
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>

        {(tooShort || mismatch) && (
          <div style={{ color: "var(--danger)", fontSize: 12.5, marginBottom: 10 }}>
            {tooShort ? "Password must be at least 8 characters." : "Passwords do not match."}
          </div>
        )}
        {err && <div style={{ color: "var(--danger)", fontSize: 12.5, marginBottom: 10 }}>{err}</div>}

        <Btn kind="primary" full disabled={!canSubmit}>
          {busy ? "Setting password…" : "Set password & sign in"}
        </Btn>
      </form>
    </div>
  );
}
