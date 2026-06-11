const { setupDb, teardownDb, clearDb } = require("./helpers");
const User = require("../src/models/User");
const Project = require("../src/models/Project");
const Task = require("../src/models/Task");

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

test("User derives initials from name and lowercases email", async () => {
  const u = await User.create({ name: "Elena Lopez", email: "Elena@X.com", role: "developer" });
  expect(u.initials).toBe("EL");
  expect(u.email).toBe("elena@x.com");
  expect(u.status).toBe("invited");
});

test("User email is unique", async () => {
  await User.init();
  await User.create({ name: "A B", email: "dup@x.com", role: "developer" });
  await expect(User.create({ name: "C D", email: "dup@x.com", role: "developer" }))
    .rejects.toThrow();
});

test("Project requires unique uppercase key", async () => {
  const p = await Project.create({ name: "Core API", key: "api" });
  expect(p.key).toBe("API");
  expect(p.nextNum).toBe(1);
});

test("Task requires a deadline and defaults status/priority", async () => {
  const p = await Project.create({ name: "Atlas", key: "ATLAS" });
  await expect(Task.create({ project: p._id, title: "no deadline" })).rejects.toThrow();
  const t = await Task.create({ project: p._id, title: "ok", deadline: new Date("2026-06-20"), key: "ATLAS-1" });
  expect(t.status).toBe("todo");
  expect(t.priority).toBe("med");
  expect(t.ext).toBeNull();
});
