import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Field, TextInput } from "../components/ui/fields";
import Btn from "../components/ui/Btn";
import logo from "../assets/scai-logo.png";

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr("");
    try { await login(email, password); nav("/"); }
    catch (e2) { setErr(e2.response?.data?.error || "Login failed"); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-1)" }}>
      <form onSubmit={submit} style={{ width: 360, background: "#fff", border: "1px solid var(--bd-1)", borderTop: "3px solid var(--scai-teal)", borderRadius: "var(--r-3)", boxShadow: "var(--shadow-2)", padding: 28 }}>
        <img src={logo} alt="Simple Code AI" height="38" style={{ display: "block", mixBlendMode: "multiply", marginBottom: 18 }} />
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 18 }}>Sign in</div>
        <Field label="Email" required><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus /></Field>
        <Field label="Password" required><TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {err && <div style={{ color: "var(--danger)", fontSize: 12.5, marginBottom: 10 }}>{err}</div>}
        <Btn kind="primary" type="submit" full disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Btn>
      </form>
    </div>
  );
}
