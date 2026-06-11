import { useState, useEffect } from "react";
import { Icon } from "./icons";

let _push = null;
export function toast(msg, tone = "success") { _push && _push(msg, tone); }

export function ToastHost() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    _push = (msg, tone = "success") => {
      const id = Date.now() + Math.random();
      setItems((xs) => [...xs, { id, msg, tone }]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3200);
    };
    return () => { _push = null; };
  }, []);
  return (
    <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", gap: 8, zIndex: 200, alignItems: "center" }}>
      {items.map((t) => (
        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 9, background: "var(--scai-slate)", color: "#fff", padding: "10px 16px", borderRadius: "var(--r-2)", boxShadow: "var(--shadow-2)", fontSize: 13, fontWeight: 500, animation: "scaiRise var(--dur-3) var(--ease)", maxWidth: 440 }}>
          <Icon name={t.tone === "success" ? "check-circle-2" : t.tone === "danger" ? "alert-circle" : "info"} size={15} style={{ color: t.tone === "danger" ? "#f85149" : "var(--scai-teal)" }} />
          {t.msg}
        </div>
      ))}
    </div>
  );
}
