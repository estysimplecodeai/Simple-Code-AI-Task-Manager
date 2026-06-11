export function Field({ label, hint, children, required }) {
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
export const inputStyle = { width: "100%", boxSizing: "border-box", background: "#ffffff", border: "1px solid var(--bd-2)", borderRadius: "var(--r-1)", padding: "9px 11px", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--fg-1)", outline: "none" };
export function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }}
    onFocus={e => { e.target.style.borderColor = "var(--scai-teal)"; e.target.style.boxShadow = "0 0 0 3px rgba(46,175,183,0.14)"; }}
    onBlur={e => { e.target.style.borderColor = "var(--bd-2)"; e.target.style.boxShadow = "none"; }} />;
}
export function TextArea(props) {
  return <textarea {...props} style={{ ...inputStyle, resize: "vertical", minHeight: 84, lineHeight: 1.5, ...(props.style || {}) }}
    onFocus={e => { e.target.style.borderColor = "var(--scai-teal)"; e.target.style.boxShadow = "0 0 0 3px rgba(46,175,183,0.14)"; }}
    onBlur={e => { e.target.style.borderColor = "var(--bd-2)"; e.target.style.boxShadow = "none"; }} />;
}
export function Select({ children, ...props }) {
  const svg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238c959f' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>`);
  return <select {...props} style={{ ...inputStyle, cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml;utf8,${svg}")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 32, ...(props.style || {}) }}
    onFocus={e => { e.target.style.borderColor = "var(--scai-teal)"; e.target.style.boxShadow = "0 0 0 3px rgba(46,175,183,0.14)"; }}
    onBlur={e => { e.target.style.borderColor = "var(--bd-2)"; e.target.style.boxShadow = "none"; }}>{children}</select>;
}
