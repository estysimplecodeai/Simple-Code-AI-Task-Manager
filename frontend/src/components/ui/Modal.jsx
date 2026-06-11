import { useEffect } from "react";
import { Icon } from "./icons";

export default function Modal({ title, eyebrow, onClose, children, footer, width = 540 }) {
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
