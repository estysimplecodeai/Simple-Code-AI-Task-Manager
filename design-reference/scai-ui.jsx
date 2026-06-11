// ============================================================
// Simple Code AI CRM — shared React UI (Babel JSX)
// Light theme: white surfaces · near-black ink · SCAI teal accent
// ============================================================
const { useState, useEffect, useRef, useCallback } = React;

function useStore() {
  const [, force] = useState(0);
  useEffect(() => SCAI.subscribe(() => force((n) => n + 1)), []);
  return SCAI.getState();
}
function useIcons() { useEffect(() => { if (window.lucide) window.lucide.createIcons(); }); }
function Icon({ name, size = 16, color, style }) {
  return <i data-lucide={name} style={{ width: size, height: size, color, flexShrink: 0, ...style }} />;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate(s) { if (!s) return "—"; const d = new Date(s + "T00:00:00"); return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; }
function fmtShort(s) { if (!s) return "—"; const d = new Date(s + "T00:00:00"); return `${MONTHS[d.getMonth()]} ${d.getDate()}`; }
function deadlinePhrase(t) {
  const n = SCAI.daysLeft(t);
  if (t.status === "done") return "delivered";
  if (n === 0) return "due today";
  if (n > 0) return `in ${n}d`;
  return `${Math.abs(n)}d overdue`;
}

// ---- Avatar --------------------------------------------------------------
const TONE_FOR = (id) => {
  const map = { d_elena:"#1d6e74", d_jamie:"#3a5e6b", d_ravi:"#2d5472",
                d_kai:"#3a5e44",   d_sana:"#5e3e6e", m_dana:"#1e2328" };
  return map[id] || "#2a3a4a";
};
function Avatar({ id, size = 28, ring }) {
  const p = SCAI.personById(id);
  if (!p) return null;
  return (
    <div title={p.name} style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: TONE_FOR(id), color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-mono)", fontSize: size * 0.38, fontWeight: 600, letterSpacing: "0.03em",
      boxShadow: ring ? "0 0 0 2px #fff, 0 0 0 3px var(--bd-2)" : "none",
    }}>{p.initials}</div>
  );
}

// ---- Status pill ---------------------------------------------------------
const PILL_STYLES = {
  neutral: { bg: "#f0f2f5",             fg: "#57606a", bd: "#d0d7de" },
  success: { bg: "#dafbe1",             fg: "#1a7f37", bd: "#a0e5b0" },
  warning: { bg: "#fff8c5",             fg: "#9a6700", bd: "#e5c07b" },
  danger:  { bg: "#ffebe9",             fg: "#cf222e", bd: "#faa9a7" },
  info:    { bg: "rgba(46,175,183,0.10)", fg: "#1a7a82", bd: "rgba(46,175,183,0.30)" },
  accent:  { bg: "rgba(46,175,183,0.12)", fg: "#157880", bd: "rgba(46,175,183,0.35)" },
};
function StatusPill({ status, dot = true, size = 11 }) {
  const meta = SCAI.STATUS[status] || SCAI.STATUS.todo;
  const s = PILL_STYLES[meta.tone];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: size, fontWeight: 500, padding: "3px 8px", borderRadius: "var(--r-1)", background: s.bg, color: s.fg, border: `1px solid ${s.bd}`, letterSpacing: "0.03em", whiteSpace: "nowrap" }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", flexShrink: 0 }} />}
      {meta.label}
    </span>
  );
}

function PriorityTag({ priority, withLabel = true }) {
  const meta = SCAI.PRIORITY[priority] || SCAI.PRIORITY.med;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-body)", fontSize: 12, color: "var(--fg-2)", whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: 1, background: meta.color, transform: "rotate(45deg)", flexShrink: 0 }} />
      {withLabel && meta.label}
    </span>
  );
}

const PROJECT_TONE = {
  teal:  { bg: "rgba(46,175,183,0.09)", fg: "#157880", bd: "rgba(46,175,183,0.28)" },
  coral: { bg: "rgba(46,175,183,0.07)", fg: "#1a7a82", bd: "rgba(46,175,183,0.22)" },
  sand:  { bg: "#f0f2f5",               fg: "#57606a", bd: "#d0d7de" },
};
function ProjectTag({ projectId }) {
  const p = SCAI.projectById(projectId);
  if (!p) return null;
  const t = PROJECT_TONE[p.tone] || PROJECT_TONE.teal;
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600, padding: "2px 6px", borderRadius: 3, background: t.bg, color: t.fg, border: `1px solid ${t.bd}`, whiteSpace: "nowrap", letterSpacing: "0.05em", textTransform: "uppercase" }}>{p.key}</span>
  );
}

function BranchTag({ branch }) {
  if (!branch) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--scai-teal)", background: "rgba(46,175,183,0.08)", border: "1px solid rgba(46,175,183,0.22)", borderRadius: 3, padding: "2px 7px", maxWidth: "100%", overflow: "hidden" }}>
      <Icon name="git-branch" size={12} style={{ flexShrink: 0, color: "var(--scai-teal)" }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{branch}</span>
    </span>
  );
}

// ---- Buttons -------------------------------------------------------------
function Btn({ kind = "secondary", icon, children, onClick, disabled, size = "md", full, style }) {
  const pad = size === "sm" ? "5px 10px" : size === "lg" ? "10px 18px" : "7px 13px";
  const fs = size === "sm" ? 11.5 : 13;
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    fontFamily: "var(--font-body)", fontSize: fs, fontWeight: 500, padding: pad,
    borderRadius: "var(--r-1)", cursor: disabled ? "not-allowed" : "pointer",
    transition: "background 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
    width: full ? "100%" : "auto", opacity: disabled ? 0.45 : 1, whiteSpace: "nowrap", letterSpacing: "0.01em",
  };
  const kinds = {
    primary:      { background: "var(--scai-teal)",  color: "#fff",           border: "1px solid var(--scai-teal-bright)" },
    teal:         { background: "var(--scai-slate)",  color: "#fff",           border: "1px solid #0d1117" },
    secondary:    { background: "#ffffff",            color: "var(--fg-1)",    border: "1px solid var(--bd-2)" },
    ghost:        { background: "transparent",        color: "var(--fg-2)",    border: "1px solid transparent" },
    danger:       { background: "#ffffff",            color: "var(--danger)",  border: "1px solid #faa9a7" },
    "danger-solid":{ background: "#ffebe9",           color: "var(--danger)",  border: "1px solid #faa9a7" },
  };
  let el;
  return (
    <button ref={r => (el = r)} onClick={disabled ? undefined : onClick} disabled={disabled}
      onMouseEnter={() => { if (!disabled && el) {
        if (kind === "primary") { el.style.background = "var(--scai-teal-bright)"; }
        else if (kind === "teal") { el.style.background = "#2c3238"; }
        else if (kind === "secondary") { el.style.background = "var(--paper-3)"; el.style.borderColor = "var(--bd-3)"; }
        else if (kind === "ghost") { el.style.background = "var(--paper-2)"; }
        else if (kind === "danger" || kind === "danger-solid") { el.style.background = "#ffccc8"; }
      }}}
      onMouseLeave={() => { if (el) { el.style.background = kinds[kind]?.background || ""; el.style.borderColor = ""; } }}
      style={{ ...base, ...kinds[kind], ...style }}>
      {icon && <Icon name={icon} size={size === "sm" ? 12 : 14} />}
      {children}
    </button>
  );
}

// ---- Modal ---------------------------------------------------------------
function Modal({ title, eyebrow, onClose, children, footer, width = 540 }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div onMouseDown={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 20px", zIndex: 100, overflowY: "auto", animation: "scaiFade var(--dur-2) var(--ease)" }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ width, maxWidth: "100%", background: "#ffffff", border: "1px solid var(--bd-2)", borderTop: "3px solid var(--scai-teal)", borderRadius: "var(--r-3)", boxShadow: "var(--shadow-2)", overflow: "hidden", animation: "scaiRise var(--dur-3) var(--ease)" }}>
        <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--bd-1)", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            {eyebrow && <div className="eyebrow" style={{ marginBottom: 5, fontSize: 9.5 }}>{eyebrow}</div>}
            <div style={{ fontFamily: "var(--font-body)", fontSize: 20, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.01em", color: "var(--fg-1)" }}>{title}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid transparent", borderRadius: "var(--r-1)", cursor: "pointer", color: "var(--fg-3)", padding: 5, display: "flex" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--paper-2)"; e.currentTarget.style.color = "var(--fg-1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-3)"; }}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: "18px 20px" }}>{children}</div>
        {footer && <div style={{ padding: "12px 20px", borderTop: "1px solid var(--bd-1)", background: "var(--paper-2)", display: "flex", justifyContent: "flex-end", gap: 8 }}>{footer}</div>}
      </div>
    </div>
  );
}

// ---- Form fields ---------------------------------------------------------
function Field({ label, hint, children, required }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 5 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-3)" }}>{label}</span>
        {required && <span style={{ color: "var(--scai-teal)", fontSize: 11 }}>•</span>}
        {hint && <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)" }}>{hint}</span>}
      </div>
      {children}
    </label>
  );
}
const inputStyle = { width: "100%", boxSizing: "border-box", background: "#ffffff", border: "1px solid var(--bd-2)", borderRadius: "var(--r-1)", padding: "9px 11px", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-1)", outline: "none" };
function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }}
    onFocus={e => { e.target.style.borderColor = "var(--scai-teal)"; e.target.style.boxShadow = "0 0 0 3px rgba(46,175,183,0.14)"; }}
    onBlur={e => { e.target.style.borderColor = "var(--bd-2)"; e.target.style.boxShadow = "none"; }} />;
}
function TextArea(props) {
  return <textarea {...props} style={{ ...inputStyle, resize: "vertical", minHeight: 84, lineHeight: 1.5, ...(props.style || {}) }}
    onFocus={e => { e.target.style.borderColor = "var(--scai-teal)"; e.target.style.boxShadow = "0 0 0 3px rgba(46,175,183,0.14)"; }}
    onBlur={e => { e.target.style.borderColor = "var(--bd-2)"; e.target.style.boxShadow = "none"; }} />;
}
function Select({ children, ...props }) {
  const svg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238c959f' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>`);
  return <select {...props} style={{ ...inputStyle, cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml;utf8,${svg}")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 32, ...(props.style || {}) }}
    onFocus={e => { e.target.style.borderColor = "var(--scai-teal)"; e.target.style.boxShadow = "0 0 0 3px rgba(46,175,183,0.14)"; }}
    onBlur={e => { e.target.style.borderColor = "var(--bd-2)"; e.target.style.boxShadow = "none"; }}>{children}</select>;
}

// ---- Sidebar -------------------------------------------------------------
function Sidebar({ tag, nav, active, onChange, footer }) {
  return (
    <aside style={{ width: 220, flexShrink: 0, background: "var(--paper-2)", borderRight: "1px solid var(--bd-1)", display: "flex", flexDirection: "column", padding: "16px 12px" }}>
      <div style={{ padding: "6px 8px 18px" }}>
        <img src="assets/scai-logo.png" alt="Simple Code AI" height="34" style={{ display: "block", mixBlendMode: "multiply", maxWidth: "100%", marginBottom: 6 }} />
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, letterSpacing: "0.22em", color: "var(--scai-teal)", textTransform: "uppercase" }}>{tag}</div>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {nav.map(it => {
          if (it.section) return <div key={it.section} style={{ padding: "12px 10px 5px", fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-3)" }}>{it.section}</div>;
          const on = active === it.id;
          return (
            <button key={it.id} onClick={() => onChange(it.id)} style={{ display: "flex", alignItems: "center", gap: 9, padding: on ? "8px 10px 8px 8px" : "8px 10px", background: on ? "#ffffff" : "transparent", borderTop: "none", borderRight: "none", borderBottom: "none", borderLeft: `2px solid ${on ? "var(--scai-teal)" : "transparent"}`, borderRadius: on ? "0 var(--r-1) var(--r-1) 0" : "var(--r-1)", color: on ? "var(--fg-1)" : "var(--fg-2)", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: on ? 600 : 400, cursor: "pointer", textAlign: "left", boxShadow: on ? "var(--shadow-1)" : "none", transition: "background 120ms ease" }}
              onMouseEnter={e => { if (!on) { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = "var(--fg-1)"; } }}
              onMouseLeave={e => { if (!on) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-2)"; } }}>
              <Icon name={it.icon} size={15} style={{ color: on ? "var(--scai-teal)" : "var(--fg-3)" }} />
              <span style={{ flex: 1 }}>{it.label}</span>
              {it.badge > 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 9, background: "var(--scai-teal)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{it.badge}</span>}
            </button>
          );
        })}
      </nav>
      <div style={{ flex: 1 }} />
      {footer}
    </aside>
  );
}

// ---- Top bar -------------------------------------------------------------
function TopBar({ crumbs, title, lead, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "13px 24px", borderBottom: "1px solid var(--bd-1)", background: "#ffffff", gap: 16, flexShrink: 0 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {crumbs && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", marginBottom: 3, letterSpacing: "0.02em" }}>
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                <span style={{ color: i === crumbs.length - 1 ? "var(--scai-teal)" : "var(--fg-3)", fontWeight: i === crumbs.length - 1 ? 600 : 400 }}>{c}</span>
                {i < crumbs.length - 1 && <span style={{ color: "var(--bd-3)", margin: "0 1px" }}>/</span>}
              </React.Fragment>
            ))}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--fg-1)", whiteSpace: "nowrap" }}>{title}</div>
          {lead && <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lead}</div>}
        </div>
      </div>
      {right}
    </div>
  );
}

// ---- Toast ---------------------------------------------------------------
let _pushToast = null;
function ToastHost() {
  const [items, setItems] = useState([]);
  useIcons();
  useEffect(() => {
    _pushToast = (msg, tone = "success") => {
      const id = Date.now() + Math.random();
      setItems(xs => [...xs, { id, msg, tone }]);
      setTimeout(() => setItems(xs => xs.filter(x => x.id !== id)), 3200);
    };
    return () => { _pushToast = null; };
  }, []);
  return (
    <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", gap: 8, zIndex: 200, alignItems: "center" }}>
      {items.map(t => (
        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 9, background: "var(--scai-slate)", color: "#fff", padding: "10px 16px", borderRadius: "var(--r-2)", boxShadow: "var(--shadow-2)", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, animation: "scaiRise var(--dur-3) var(--ease)", maxWidth: 440 }}>
          <Icon name={t.tone === "success" ? "check-circle-2" : t.tone === "danger" ? "alert-circle" : "info"} size={15} style={{ color: t.tone === "danger" ? "#f85149" : "var(--scai-teal)" }} />
          {t.msg}
        </div>
      ))}
    </div>
  );
}
function toast(msg, tone) { _pushToast && _pushToast(msg, tone); }

// ---- Empty state ---------------------------------------------------------
function EmptyState({ icon = "inbox", title, sub }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "52px 24px", textAlign: "center" }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(46,175,183,0.10)", border: "1px solid rgba(46,175,183,0.22)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <Icon name={icon} size={24} style={{ color: "var(--scai-teal)" }} />
      </div>
      <div style={{ fontFamily: "var(--font-body)", fontSize: 17, fontWeight: 600, color: "var(--fg-2)", marginBottom: 5 }}>{title}</div>
      {sub && <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--fg-3)", maxWidth: 360, lineHeight: 1.55 }}>{sub}</div>}
    </div>
  );
}

function addDays(iso, n) { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

function MetaRow({ icon, label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--bd-1)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, width: 116, flexShrink: 0, color: "var(--fg-3)" }}>
        <Icon name={icon} size={13} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

function Panel({ title, right, children, pad = true, style }) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid var(--bd-1)", borderRadius: "var(--r-2)", overflow: "hidden", ...style }}>
      {title && <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--bd-1)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 600, flex: 1, color: "var(--fg-1)" }}>{title}</div>
        {right}
      </div>}
      <div style={{ padding: pad ? 16 : 0 }}>{children}</div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 700, color: tone || "var(--fg-1)", lineHeight: 1, letterSpacing: "-0.03em" }}>{value}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--fg-3)", marginTop: 5 }}>{label}</div>
    </div>
  );
}

Object.assign(window, {
  useStore, useIcons, Icon, fmtDate, fmtShort, deadlinePhrase, Avatar,
  StatusPill, PriorityTag, ProjectTag, BranchTag, Btn, Modal, Field,
  TextInput, TextArea, Select, Sidebar, TopBar, ToastHost, toast, EmptyState, Panel,
  MetaRow, addDays, Stat,
});
