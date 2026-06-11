const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const d0 = (s) => new Date(s);
export const fmtDate = (s) => { if (!s) return "—"; const d = d0(s); return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; };
export const fmtShort = (s) => { if (!s) return "—"; const d = d0(s); return `${MONTHS[d.getMonth()]} ${d.getDate()}`; };
export const addDays = (iso, n) => { const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
export const toInputDate = (s) => (s ? new Date(s).toISOString().slice(0, 10) : "");
export function deadlinePhrase(task) {
  if (task.status === "done") return "delivered";
  const n = task.daysLeft;
  if (n === 0) return "due today";
  if (n > 0) return `in ${n}d`;
  return `${Math.abs(n)}d overdue`;
}
