import { useState } from "react";
import Column from "./Column";
import TaskCard from "./TaskCard";
import { columnOf } from "../../lib/derive";

const ORDER = [
  ["todo", "Todo"],
  ["in_progress", "In Progress"],
  ["in_review", "In Review"],
  ["stale", "Stale"],
  ["done", "Done"],
];

export default function Board({ tasks, onSetStatus, onOpenTask, onRequestExt, canDrag = () => true }) {
  const [dragged, setDragged] = useState(null);

  const byCol = Object.fromEntries(ORDER.map(([k]) => [k, []]));
  for (const t of tasks) {
    const col = columnOf(t);
    if (byCol[col]) byCol[col].push(t);
  }

  return (
    <div style={{ display: "flex", gap: 14, overflowX: "auto", padding: 4, alignItems: "flex-start" }}>
      {ORDER.map(([status, label]) => (
        <Column
          key={status}
          status={status}
          label={label}
          count={byCol[status].length}
          droppable={status !== "stale" && !!dragged}
          onDropTask={(s) => {
            if (dragged) {
              onSetStatus(dragged, s);
              setDragged(null);
            }
          }}
        >
          {byCol[status].map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              draggable={canDrag(t) && status !== "stale"}
              onDragStart={() => setDragged(t)}
              onClick={() => onOpenTask(t)}
              onRequestExt={onRequestExt ? () => onRequestExt(t) : undefined}
            />
          ))}
        </Column>
      ))}
    </div>
  );
}
