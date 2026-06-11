import { useState } from "react";
import { EmptyState } from "../../components/ui/misc";
import { StatusPill, ProjectTag } from "../../components/ui/pills";
import { Icon } from "../../components/ui/icons";
import Avatar from "../../components/ui/Avatar";
import { useData } from "../../store/DataContext";
import { daysLeft } from "../../lib/derive";
import { fmtShort } from "../../lib/format";

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

function PlainTh({ label }) {
  return (
    <th style={{
      textAlign: "left", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600,
      letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fg-3)",
      padding: "10px 16px", borderBottom: "1px solid var(--bd-2)", whiteSpace: "nowrap",
    }}>{label}</th>
  );
}

export default function StaleTasks({ onOpenTask }) {
  const { tasks, projects, personById } = useData();

  // Default sort: worst-overdue first (most negative daysLeft = most overdue)
  const [sort, setSort] = useState({ key: "overdue", dir: "desc" });
  const [projFilter, setProjFilter] = useState("all");

  const staleAll = tasks.filter((t) => t.stale);
  const filtered = projFilter === "all" ? staleAll : staleAll.filter((t) => t.project === projFilter);

  const sorted = [...filtered].sort((a, b) => {
    const dir = sort.dir === "asc" ? 1 : -1;
    if (sort.key === "overdue") {
      // desc = worst first = most negative daysLeft first
      return dir * (daysLeft(b) - daysLeft(a));
    }
    if (sort.key === "assignee") {
      const na = personById(a.assignee)?.name || "";
      const nb = personById(b.assignee)?.name || "";
      return dir * na.localeCompare(nb);
    }
    if (sort.key === "project") {
      const pa = a.project || "";
      const pb = b.project || "";
      return dir * pa.localeCompare(pb);
    }
    return 0;
  });

  function handleSort(k) {
    setSort((s) => ({ key: k, dir: s.key === k && s.dir === "desc" ? "asc" : "desc" }));
  }

  const pendingExtCount = sorted.filter((t) => t.ext && t.ext.state === "pending").length;

  const ctrl = {
    background: "#fff", border: "1px solid var(--bd-2)", borderRadius: "var(--r-1)",
    padding: "6px 9px", fontFamily: "var(--font-body)", fontSize: 12.5,
    color: "var(--fg-1)", cursor: "pointer", outline: "none",
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
      {/* Red alert banner */}
      {sorted.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "#fff8f8", border: "1px solid #faa9a7",
          borderRadius: "var(--r-1)", padding: "10px 14px", marginBottom: 18,
        }}>
          <Icon name="alert-triangle" size={15} style={{ color: "var(--danger)", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--danger)", fontWeight: 500 }}>
            {sorted.length} task{sorted.length === 1 ? " is" : "s are"} past deadline and not yet in review.
            {pendingExtCount > 0 && ` ${pendingExtCount} with a pending extension request.`}
          </span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <select
          value={projFilter}
          onChange={(e) => setProjFilter(e.target.value)}
          style={ctrl}
        >
          <option value="all">All spaces</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)" }}>
          {sorted.length} stale
        </span>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid var(--bd-1)", borderRadius: "var(--r-2)", overflow: "hidden" }}>
        {sorted.length === 0 ? (
          <EmptyState
            icon="check-circle-2"
            title="Nothing stale"
            sub="All tasks are within their deadlines, or already in review."
          />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--paper-2)" }}>
                <Th label="Task" sortKey="task" sort={sort} onSort={handleSort} />
                <Th label="Space" sortKey="project" sort={sort} onSort={handleSort} />
                <Th label="Assignee" sortKey="assignee" sort={sort} onSort={handleSort} />
                <PlainTh label="Status" />
                <PlainTh label="Deadline" />
                <Th label="Overdue" sortKey="overdue" sort={sort} onSort={handleSort} />
                <PlainTh label="Ext. request" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => {
                const overdue = Math.abs(daysLeft(t));
                const hasPending = t.ext && t.ext.state === "pending";
                // amber <7d, red ≥7d
                const urgentColor = overdue >= 7 ? "var(--danger)" : "#9a6700";
                const assignee = personById(t.assignee);

                return (
                  <tr
                    key={t.id}
                    onClick={() => onOpenTask(t.id)}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.025)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Task */}
                    <td style={{ padding: "11px 16px", borderBottom: "1px solid var(--bd-1)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)", flexShrink: 0 }}>
                          {t.key}
                        </span>
                        <span style={{ fontWeight: 500, color: "var(--fg-1)" }}>{t.title}</span>
                      </div>
                    </td>

                    {/* Space */}
                    <td style={{ padding: "11px 16px", borderBottom: "1px solid var(--bd-1)" }}>
                      <ProjectTag projectId={t.project} />
                    </td>

                    {/* Assignee */}
                    <td style={{ padding: "11px 16px", borderBottom: "1px solid var(--bd-1)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <Avatar id={t.assignee} size={20} />
                        <span style={{ color: "var(--fg-2)", whiteSpace: "nowrap", fontSize: 12.5 }}>
                          {assignee ? assignee.name : "—"}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "11px 16px", borderBottom: "1px solid var(--bd-1)" }}>
                      <StatusPill status={t.status} />
                    </td>

                    {/* Deadline */}
                    <td style={{
                      padding: "11px 16px", borderBottom: "1px solid var(--bd-1)",
                      fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-2)",
                    }}>
                      {fmtShort(t.deadline)}
                    </td>

                    {/* Overdue — amber <7d / red ≥7d */}
                    <td style={{ padding: "11px 16px", borderBottom: "1px solid var(--bd-1)" }}>
                      <span style={{
                        fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: urgentColor,
                      }}>
                        {overdue}d
                      </span>
                    </td>

                    {/* Ext. request */}
                    <td style={{ padding: "11px 16px", borderBottom: "1px solid var(--bd-1)" }}>
                      {hasPending ? (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600,
                          color: "var(--scai-teal)", background: "rgba(46,175,183,0.09)",
                          border: "1px solid rgba(46,175,183,0.25)", borderRadius: 3,
                          padding: "2px 7px", letterSpacing: "0.04em",
                        }}>
                          <Icon name="hourglass" size={11} /> Pending
                        </span>
                      ) : (
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
