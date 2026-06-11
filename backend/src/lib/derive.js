const DAY = 86400000;

function startOfDay(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

// Whole days from `now` to `deadline`. Negative = overdue.
function daysLeft(task, now = new Date()) {
  return Math.round((startOfDay(task.deadline) - startOfDay(now)) / DAY);
}

// Stale = deadline passed AND status is not done and not in review.
function isStale(task, now = new Date()) {
  if (task.status === "done" || task.status === "in_review") return false;
  return daysLeft(task, now) < 0;
}

function columnOf(task, now = new Date()) {
  return isStale(task, now) ? "stale" : task.status;
}

// Attach derived fields to a plain task object for API responses.
function withDerived(taskObj, now = new Date()) {
  return { ...taskObj, stale: isStale(taskObj, now), daysLeft: daysLeft(taskObj, now), column: columnOf(taskObj, now) };
}

module.exports = { isStale, daysLeft, columnOf, withDerived };
