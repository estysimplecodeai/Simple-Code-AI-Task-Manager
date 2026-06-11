import { useRef } from "react";
import { Icon } from "./icons";

export default function Btn({ kind = "secondary", icon, children, onClick, disabled, size = "md", full, style }) {
  const elRef = useRef(null);
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
    primary:       { background: "var(--scai-teal)",  color: "#fff",           border: "1px solid var(--scai-teal-bright)" },
    teal:          { background: "var(--scai-slate)",  color: "#fff",           border: "1px solid #0d1117" },
    secondary:     { background: "#ffffff",            color: "var(--fg-1)",    border: "1px solid var(--bd-2)" },
    ghost:         { background: "transparent",        color: "var(--fg-2)",    border: "1px solid transparent" },
    danger:        { background: "#ffffff",            color: "var(--danger)",  border: "1px solid #faa9a7" },
    "danger-solid":{ background: "#ffebe9",            color: "var(--danger)",  border: "1px solid #faa9a7" },
  };
  return (
    <button ref={elRef} onClick={disabled ? undefined : onClick} disabled={disabled}
      onMouseEnter={() => { const el = elRef.current; if (!disabled && el) {
        if (kind === "primary") { el.style.background = "var(--scai-teal-bright)"; }
        else if (kind === "teal") { el.style.background = "#2c3238"; }
        else if (kind === "secondary") { el.style.background = "var(--paper-3)"; el.style.borderColor = "var(--bd-3)"; }
        else if (kind === "ghost") { el.style.background = "var(--paper-2)"; }
        else if (kind === "danger" || kind === "danger-solid") { el.style.background = "#ffccc8"; }
      }}}
      onMouseLeave={() => { const el = elRef.current; if (el) { el.style.background = kinds[kind]?.background || ""; el.style.borderColor = ""; } }}
      style={{ ...base, ...kinds[kind], ...style }}>
      {icon && <Icon name={icon} size={size === "sm" ? 12 : 14} />}
      {children}
    </button>
  );
}
