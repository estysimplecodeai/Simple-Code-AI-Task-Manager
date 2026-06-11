import { useData } from "../../store/DataContext";

const TONE = ["#1d6e74", "#3a5e6b", "#2d5472", "#3a5e44", "#5e3e6e", "#2a3a4a"];
function toneFor(id) {
  let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONE[h % TONE.length];
}

export default function Avatar({ id, person, size = 28, ring }) {
  const data = useData();
  const p = person || data?.personById(id);
  if (!p) return null;
  return (
    <div title={p.name} style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: p.role === "manager" ? "#1e2328" : toneFor(p.id), color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-mono)", fontSize: size * 0.38, fontWeight: 600, letterSpacing: "0.03em",
      boxShadow: ring ? "0 0 0 2px #fff, 0 0 0 3px var(--bd-2)" : "none",
    }}>{p.initials}</div>
  );
}
