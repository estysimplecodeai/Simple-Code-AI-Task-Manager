const DAY = 86400000;
const startOfDay = (d) => { const x = new Date(d); x.setUTCHours(0, 0, 0, 0); return x; };
export const daysLeft = (task, now = new Date()) => Math.round((startOfDay(task.deadline) - startOfDay(now)) / DAY);
export const isStale = (task, now = new Date()) =>
  task.status !== "done" && task.status !== "in_review" && daysLeft(task, now) < 0;
export const columnOf = (task, now = new Date()) => (isStale(task, now) ? "stale" : task.status);
