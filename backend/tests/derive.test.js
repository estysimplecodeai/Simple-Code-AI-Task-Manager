const { isStale, daysLeft, columnOf } = require("../src/lib/derive");

const today = new Date("2026-06-10T00:00:00Z");
const mk = (status, deadline) => ({ status, deadline: new Date(deadline + "T00:00:00Z") });

test("overdue + not done/review => stale", () => {
  expect(isStale(mk("todo", "2026-06-05"), today)).toBe(true);
  expect(isStale(mk("in_progress", "2026-06-09"), today)).toBe(true);
});

test("done or in_review never stale even if overdue", () => {
  expect(isStale(mk("done", "2026-06-01"), today)).toBe(false);
  expect(isStale(mk("in_review", "2026-06-01"), today)).toBe(false);
});

test("future or today deadline not stale", () => {
  expect(isStale(mk("todo", "2026-06-10"), today)).toBe(false);
  expect(isStale(mk("todo", "2026-06-15"), today)).toBe(false);
});

test("daysLeft negative when overdue", () => {
  expect(daysLeft(mk("todo", "2026-06-15"), today)).toBe(5);
  expect(daysLeft(mk("todo", "2026-06-05"), today)).toBe(-5);
});

test("columnOf returns stale when stale else status", () => {
  expect(columnOf(mk("todo", "2026-06-05"), today)).toBe("stale");
  expect(columnOf(mk("in_review", "2026-06-05"), today)).toBe("in_review");
  expect(columnOf(mk("todo", "2026-06-20"), today)).toBe("todo");
});
