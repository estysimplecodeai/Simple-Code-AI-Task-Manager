import { Icon } from "../ui/icons";
import Avatar from "../ui/Avatar";
import { ProjectTag, PriorityTag, BranchTag } from "../ui/pills";
import { deadlinePhrase } from "../../lib/format";
import { daysLeft as computeDaysLeft, isStale as computeIsStale } from "../../lib/derive";

// If the backend has already attached .daysLeft / .stale, use those; otherwise compute locally.
function resolvedDaysLeft(task) {
  if (task.daysLeft !== undefined) return task.daysLeft;
  return computeDaysLeft(task);
}

function resolvedIsStale(task) {
  if (task.stale !== undefined) return task.stale;
  return computeIsStale(task);
}

export default function TaskCard({ task, draggable, onClick, onDragStart, onRequestExt }) {
  const stale = resolvedIsStale(task);
  const left = resolvedDaysLeft(task);
  const isOverdue = left < 0 && task.status !== "done";
  const pending = task.ext && task.ext.state === "pending";

  // For deadlinePhrase to work correctly, ensure task.daysLeft is set
  const taskWithDaysLeft = { ...task, daysLeft: left };

  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? (e) => { e.dataTransfer.effectAllowed = "move"; onDragStart && onDragStart(); } : undefined}
      onClick={onClick}
      style={{
        background: "var(--paper)",
        border: stale ? "2px solid rgba(248,81,73,0.65)" : "1px solid var(--bd-1)",
        borderRadius: "var(--r-2)",
        padding: "11px 12px",
        cursor: "pointer",
        transition: "box-shadow var(--dur-1) var(--ease), border-color var(--dur-1) var(--ease)",
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-1)";
        if (!stale) e.currentTarget.style.borderColor = "var(--bd-2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = stale ? "rgba(248,81,73,0.65)" : "var(--bd-1)";
      }}
    >
      {/* Top row: project tag, key, priority diamond */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
        <ProjectTag projectId={task.project} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>{task.key}</span>
        <span style={{ marginLeft: "auto" }}><PriorityTag priority={task.priority} withLabel={false} /></span>
      </div>

      {/* Title */}
      <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 500, color: "var(--fg-1)", lineHeight: 1.35, marginBottom: 9, textWrap: "pretty" }}>
        {task.title}
      </div>

      {/* Bottom row: assignee avatar + deadline phrase */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Avatar id={task.assignee} size={20} />
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontFamily: "var(--font-mono)", fontSize: 11,
          color: isOverdue ? "var(--danger)" : "var(--fg-3)",
          marginLeft: "auto",
        }}>
          <Icon name={task.status === "done" ? "check" : "clock"} size={11} />
          {deadlinePhrase(taskWithDaysLeft)}
        </span>
      </div>

      {/* Branch tag */}
      {task.branch && (
        <div style={{ marginTop: 8 }}>
          <BranchTag branch={task.branch} />
        </div>
      )}

      {/* Extension pending indicator */}
      {pending && (
        <div style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--scai-teal)", display: "flex", alignItems: "center", gap: 5 }}>
          <Icon name="hourglass" size={11} /> Extension requested
        </div>
      )}

      {/* Request extension button — shown when stale, not pending, and onRequestExt provided */}
      {onRequestExt && stale && !pending && (
        <button
          onClick={(e) => { e.stopPropagation(); onRequestExt(); }}
          style={{
            marginTop: 9, width: "100%",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
            background: "rgba(46,175,183,0.10)", color: "var(--scai-teal)",
            border: "1px solid rgba(46,175,183,0.25)",
            borderRadius: "var(--r-1)", padding: "5px 8px",
            fontFamily: "var(--font-body)", fontSize: 11.5, fontWeight: 500, cursor: "pointer",
          }}
        >
          <Icon name="calendar-plus" size={12} /> Request extension
        </button>
      )}
    </div>
  );
}
