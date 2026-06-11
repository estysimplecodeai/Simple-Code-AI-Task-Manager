import { Fragment, useState } from "react";
import Board from "../../components/board/Board";
import { EmptyState } from "../../components/ui/misc";
import { StatusPill, PriorityTag, BranchTag } from "../../components/ui/pills";
import Avatar from "../../components/ui/Avatar";
import { Icon } from "../../components/ui/icons";
import { toast } from "../../components/ui/Toast";
import { useAuth } from "../../auth/AuthContext";
import { useData } from "../../store/DataContext";
import { TasksApi } from "../../api/endpoints";
import { columnOf } from "../../lib/derive";
import { fmtShort, deadlinePhrase } from "../../lib/format";

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

export default function SpaceView({ projectId, mode, onOpenTask, onRequestExt }) {
  const { user } = useAuth();
  const { tasksForProject, personById, refresh } = useData();

  const tasks = tasksForProject(projectId);

  const [sort, setSort] = useState({ key: "assignee", dir: "asc" });
  const [groupByAssignee, setGroupByAssignee] = useState(true);

  function handleSort(key) {
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
  }

  async function handleSetStatus(task, status) {
    if (task.assignee !== user?.id) {
      toast("You can only move your own tasks", "danger");
      return;
    }
    try {
      await TasksApi.setStatus(task.id, status);
      await refresh();
    } catch (err) {
      toast(err?.response?.data?.error || "Failed to update status", "danger");
    }
  }

  if (mode === "board") {
    return (
      <div style={{ padding: "16px 28px", overflowX: "auto" }}>
        <Board
          tasks={tasks}
          canDrag={(t) => t.assignee === user?.id}
          onSetStatus={handleSetStatus}
          onOpenTask={(t) => onOpenTask(t.id !== undefined ? t.id : t)}
          onRequestExt={(t) => { if (t.assignee === user?.id) onRequestExt(t); }}
        />
      </div>
    );
  }

  // List mode
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

  const groups = [];
  if (groupByAssignee) {
    const byDev = {};
    sorted.forEach((t) => {
      const aid = t.assignee || "__unassigned__";
      (byDev[aid] = byDev[aid] || []).push(t);
    });
    Object.keys(byDev)
      .sort((a, b) => (personById(a)?.name || "").localeCompare(personById(b)?.name || ""))
      .forEach((dev) => groups.push({ dev, rows: byDev[dev] }));
  } else {
    groups.push({ dev: null, rows: sorted });
  }

  const pad = "11px 16px";

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <button
          onClick={() => setGroupByAssignee((g) => !g)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: groupByAssignee ? "rgba(46,175,183,0.10)" : "var(--paper)",
            border: `1px solid ${groupByAssignee ? "rgba(46,175,183,0.30)" : "var(--bd-2)"}`,
            borderRadius: "var(--r-1)", padding: "6px 9px",
            fontFamily: "var(--font-body)", fontSize: 12.5,
            color: groupByAssignee ? "var(--scai-teal)" : "var(--fg-1)",
            cursor: "pointer", outline: "none",
          }}
        >
          <Icon name="users" size={13} /> Group by assignee
        </button>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)" }}>
          {sorted.length} tasks
        </span>
      </div>

      <div style={{ background: "var(--paper)", border: "1px solid var(--bd-1)", borderRadius: "var(--r-2)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--paper-2)" }}>
              <Th label="Task" sortKey="key" sort={sort} onSort={handleSort} />
              <Th label="Status" sortKey="status" sort={sort} onSort={handleSort} />
              <Th label="Assignee" sortKey="assignee" sort={sort} onSort={handleSort} />
              <Th label="Priority" sortKey="priority" sort={sort} onSort={handleSort} />
              <Th label="Deadline" sortKey="deadline" sort={sort} onSort={handleSort} />
              <th style={{
                padding: "10px 16px", borderBottom: "1px solid var(--bd-2)", textAlign: "left",
                fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600,
                letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-3)",
              }}>Branch</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g, gi) => (
              <Fragment key={gi}>
                {g.dev && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        background: "rgba(46,175,183,0.04)", padding: "7px 16px",
                        borderBottom: "1px solid var(--bd-1)",
                        borderTop: gi > 0 ? "1px solid var(--bd-1)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <Avatar id={g.dev} size={20} />
                        <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--fg-1)" }}>
                          {personById(g.dev)?.name || "Unassigned"}
                        </span>
                        {g.dev === user?.id && (
                          <span style={{
                            fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--scai-teal)",
                            background: "rgba(46,175,183,0.10)", border: "1px solid rgba(46,175,183,0.25)",
                            borderRadius: 2, padding: "1px 6px", letterSpacing: "0.04em",
                          }}>YOU</span>
                        )}
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", marginLeft: "auto" }}>
                          {g.rows.length}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
                {g.rows.map((t) => {
                  const left = t.daysLeft ?? 0;
                  const isOverdue = left < 0 && t.status !== "done";
                  return (
                    <tr
                      key={t.id}
                      onClick={() => onOpenTask(t.id)}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Task key + title */}
                      <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", flexShrink: 0 }}>
                            {t.key}
                          </span>
                          <span style={{ fontWeight: 500, color: "var(--fg-1)" }}>{t.title}</span>
                          {t.ext && t.ext.state === "pending" && (
                            <Icon name="hourglass" size={12} style={{ color: "var(--scai-teal)" }} />
                          )}
                        </div>
                      </td>
                      {/* Status */}
                      <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)" }}>
                        <StatusPill status={columnOf(t)} />
                      </td>
                      {/* Assignee */}
                      <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <Avatar id={t.assignee} size={20} />
                          <span style={{ color: "var(--fg-2)", whiteSpace: "nowrap", fontSize: 12.5 }}>
                            {personById(t.assignee)?.name || "—"}
                          </span>
                        </div>
                      </td>
                      {/* Priority */}
                      <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)" }}>
                        <PriorityTag priority={t.priority} />
                      </td>
                      {/* Deadline — locked caption */}
                      <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)", whiteSpace: "nowrap" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-2)" }}>
                          {fmtShort(t.deadline)}
                        </div>
                        <div style={{
                          fontFamily: "var(--font-body)", fontSize: 11,
                          color: isOverdue ? "var(--danger)" : "var(--fg-3)",
                          display: "flex", alignItems: "center", gap: 4, marginTop: 2,
                        }}>
                          <Icon name="lock" size={10} />
                          {deadlinePhrase(t)}
                        </div>
                      </td>
                      {/* Branch */}
                      <td style={{ padding: pad, borderBottom: "1px solid var(--bd-1)" }}>
                        <BranchTag branch={t.branch} />
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <EmptyState title="No tasks here" sub="This space has no tasks yet." />
        )}
      </div>
    </div>
  );
}
