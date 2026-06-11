import { Icon } from "./icons";
import { useData } from "../../store/DataContext";

export const STATUS = {
  todo: { label: "Todo", tone: "neutral" },
  in_progress: { label: "In Progress", tone: "info" },
  in_review: { label: "In Review", tone: "accent" },
  stale: { label: "Stale", tone: "danger" },
  done: { label: "Done", tone: "success" },
};
export const PRIORITY = {
  high: { label: "High", color: "var(--danger)" },
  med: { label: "Medium", color: "var(--warning)" },
  low: { label: "Low", color: "var(--teal-500)" },
};
const PILL_STYLES = {
  neutral: { bg: "#f0f2f5",               fg: "#57606a", bd: "#d0d7de" },
  success: { bg: "#dafbe1",               fg: "#1a7f37", bd: "#a0e5b0" },
  warning: { bg: "#fff8c5",               fg: "#9a6700", bd: "#e5c07b" },
  danger:  { bg: "#ffebe9",               fg: "#cf222e", bd: "#faa9a7" },
  info:    { bg: "rgba(46,175,183,0.10)", fg: "#1a7a82", bd: "rgba(46,175,183,0.30)" },
  accent:  { bg: "rgba(46,175,183,0.12)", fg: "#157880", bd: "rgba(46,175,183,0.35)" },
};
export const PROJECT_TONE = {
  teal:  { bg: "rgba(46,175,183,0.09)", fg: "#157880", bd: "rgba(46,175,183,0.28)" },
  coral: { bg: "rgba(46,175,183,0.07)", fg: "#1a7a82", bd: "rgba(46,175,183,0.22)" },
  sand:  { bg: "#f0f2f5",               fg: "#57606a", bd: "#d0d7de" },
};

export function StatusPill({ status, dot = true, size = 11 }) {
  const meta = STATUS[status] || STATUS.todo;
  const s = PILL_STYLES[meta.tone];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: size, fontWeight: 500, padding: "3px 8px", borderRadius: "var(--r-1)", background: s.bg, color: s.fg, border: `1px solid ${s.bd}`, letterSpacing: "0.03em", whiteSpace: "nowrap" }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />}
      {meta.label}
    </span>
  );
}
export function PriorityTag({ priority, withLabel = true }) {
  const meta = PRIORITY[priority] || PRIORITY.med;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--fg-2)", whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: 1, background: meta.color, transform: "rotate(45deg)" }} />
      {withLabel && meta.label}
    </span>
  );
}
export function ProjectTag({ projectId }) {
  const p = useData().projectById(projectId);
  if (!p) return null;
  const t = PROJECT_TONE[p.tone] || PROJECT_TONE.teal;
  return <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600, padding: "2px 6px", borderRadius: 3, background: t.bg, color: t.fg, border: `1px solid ${t.bd}`, letterSpacing: "0.05em", textTransform: "uppercase" }}>{p.key}</span>;
}
export function BranchTag({ branch }) {
  if (!branch) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--scai-teal)", background: "rgba(46,175,183,0.08)", border: "1px solid rgba(46,175,183,0.22)", borderRadius: 3, padding: "2px 7px", maxWidth: "100%", overflow: "hidden" }}>
      <Icon name="git-branch" size={12} style={{ color: "var(--scai-teal)" }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{branch}</span>
    </span>
  );
}
