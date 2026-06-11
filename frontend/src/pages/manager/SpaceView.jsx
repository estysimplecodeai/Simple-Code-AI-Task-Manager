import { Fragment, useState } from "react";
import Board from "../../components/board/Board";
import { EmptyState } from "../../components/ui/misc";
import { StatusPill, PriorityTag, ProjectTag } from "../../components/ui/pills";
import Avatar from "../../components/ui/Avatar";
import { Icon } from "../../components/ui/icons";
import { toast } from "../../components/ui/Toast";
import { useData } from "../../store/DataContext";
import { TasksApi } from "../../api/endpoints";
import { columnOf } from "../../lib/derive";
import { fmtShort } from "../../lib/format";

const PRI_RANK = { high: 0, med: 1, low: 2 };
const STA_RANK = { stale: 0, in_progress: 1, in_review: 2, todo: 3, done: 4 };

function Th({ label, sortKey, sort, onSort }) {
  const on = sort.key === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{
        textAlign: "left", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600,
        letterSpacing: "0.1em", textTransform: "uppercase",
        color: on ? "var(--scai-teal)" : "var(--fg-3)",
        padding: "10px 16px", borderBottom: "1px solid var(--bd-2)",
        cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {label}
        {on && <Icon name={sort.dir === "asc" ? "arrow-up" : "arrow-down"} size={11} />}
      </span>
    </th>
  );
}

export default function SpaceView({ projectId, mode, onOpenTask }) {
  const { tasksForProject, personById, refresh } = useData();

  const tasks = tasksForProject(projectId);

  const [sort, setSort] = useState({ key: "status", dir: "asc" });

  function handleSort(key) {
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
  }

  async function handleSetStatus(task, status) {
    try {
      await TasksApi.setStatus(task.id, status);
      await refresh();
      toast(`${task.key} moved`);
    } catch (err) {
      toast(err?.response?.data?.error || "Failed to update status", "danger");
    }
  }

  if (mode === "board") {
    return (
      <div style={{ padding: "16px 28px", overflowX: "auto" }}>
        <Board
          tasks={tasks}
          // Managers can drag any task
          canDrag={() => true}
          onSetStatus={handleSetStatus}
          onOpenTask={(t) => onOpenTask(t.id !== undefined ? t.id : t)}
        />
      </div>
    );
  }

  // List mode — port MgrTasks sortable/filterable table
  const sorted = [...tasks].sort((a, b) => {
    const dir = sort.dir === "asc" ? 1 : -1;
    switch (sort.key) {
      case "assignee": {
        const na = personById(a.assignee)?.name || "";
        const nb = personById(b.assignee)?.name || "";
        return dir * na.localeCompare(nb);
      }
      case "priority":
        return dir * ((PRI_RANK[a.priority] ?? 1) - (PRI_RANK[b.priority] ?? 1));
      case "deadline":
        return dir * (new Date(a.deadline) - new Date(b.deadline));
      case "status":
        return dir * ((STA_RANK[columnOf(a)] ?? 3) - (STA_RANK[columnOf(b)] ?? 3));
      default:
        return dir * (a.key || "").localeCompare(b.key || "");
    }
  });

  const pad = "11px 16px";

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
      {/* Task count */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)" }}>
          {sorted.length} tasks
        </span>
      </div>

      <div style={{ background: "var(--paper)", border: "1px solid var(--bd-1)", borderRadius: "var(--r-2)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--paper-2)" }}>
              <Th label="Task" sortKey="key" sort={sort} onSort={handleSort} />
              <Th label="Assignee" sortKey="assignee" sort={sort} onSort={handleSort} />
              <Th label="Priority" sortKey="priority" sort={sort} onSort={handleSort} />
              <Th label="Status" sortKey="status" sort={sort} onSort={handleSort} />
              <Th label="Deadline" sortKey="deadline" sort={sort} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => {
              const left = t.daysLeft ?? 0;
              const isOverdue = left < 0 && t.status !== "done";
              const assignee = personById(t.assignee);
              return (
                <tr
                  key={t.id}
                  onClick={() => onOpenTask(t.id)}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sand-100, #fdf9f4)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Task key + title */}
                  <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", flexShrink: 0 }}>
                        {t.key}
                      </span>
                      <span style={{ fontWeight: 500 }}>{t.title}</span>
                      {t.ext && t.ext.state === "pending" && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 3,
                          fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--scai-teal)",
                          background: "rgba(46,175,183,0.10)", border: "1px solid rgba(46,175,183,0.25)",
                          borderRadius: 2, padding: "1px 6px", letterSpacing: "0.04em",
                        }}>
                          <Icon name="hourglass" size={10} /> ext
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Assignee */}
                  <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Avatar id={t.assignee} size={20} />
                      <span style={{ color: "var(--fg-2)", whiteSpace: "nowrap" }}>
                        {assignee ? assignee.name : "—"}
                      </span>
                    </div>
                  </td>

                  {/* Priority */}
                  <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)" }}>
                    <PriorityTag priority={t.priority} />
                  </td>

                  {/* Status */}
                  <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)" }}>
                    <StatusPill status={columnOf(t)} />
                  </td>

                  {/* Deadline */}
                  <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)", whiteSpace: "nowrap" }}>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 12,
                      color: isOverdue ? "var(--danger)" : "var(--fg-2)",
                    }}>
                      {fmtShort(t.deadline)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <EmptyState title="No tasks here" sub="This space has no tasks yet." />
        )}
      </div>
    </div>
  );
}
