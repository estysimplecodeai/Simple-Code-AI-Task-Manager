const { setupDb, teardownDb, clearDb, api, makeUser, auth } = require("./helpers");

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

async function setup() {
  const { token: mtoken } = await makeUser({ role: "manager", email: "m@x.com" });
  const { user: dev, token: dtoken } = await makeUser({ role: "developer", email: "d@x.com" });
  const { user: other, token: otoken } = await makeUser({ role: "developer", email: "o@x.com" });
  const proj = (await api().post("/api/projects").set(auth(mtoken)).send({ name: "Atlas", key: "ATLAS" })).body.project;
  await api().patch(`/api/projects/${proj.id}/members`).set(auth(mtoken)).send({ members: [dev.id] });
  return { mtoken, dev, dtoken, other, otoken, proj };
}

test("manager creates a task with generated key", async () => {
  const { mtoken, dev, proj } = await setup();
  const res = await api().post("/api/tasks").set(auth(mtoken)).send({
    project: proj.id, title: "Fix overflow", assignee: dev.id,
    priority: "high", deadline: "2026-06-20", branch: "feature/x",
  });
  expect(res.status).toBe(201);
  expect(res.body.task.key).toBe("ATLAS-1");
  expect(res.body.task.status).toBe("todo");
  const res2 = await api().post("/api/tasks").set(auth(mtoken)).send({ project: proj.id, title: "Second", deadline: "2026-06-21" });
  expect(res2.body.task.key).toBe("ATLAS-2");
});

test("task requires a deadline", async () => {
  const { mtoken, proj } = await setup();
  const res = await api().post("/api/tasks").set(auth(mtoken)).send({ project: proj.id, title: "No deadline" });
  expect(res.status).toBe(400);
});

test("developer cannot create a task", async () => {
  const { dtoken, proj } = await setup();
  const res = await api().post("/api/tasks").set(auth(dtoken)).send({ project: proj.id, title: "X", deadline: "2026-06-20" });
  expect(res.status).toBe(403);
});

test("developer sees only tasks in their projects, with derived stale", async () => {
  const { mtoken, dev, dtoken, otoken, proj } = await setup();
  await api().post("/api/tasks").set(auth(mtoken)).send({ project: proj.id, title: "Old", assignee: dev.id, deadline: "2000-01-01" });
  const devList = await api().get("/api/tasks").set(auth(dtoken));
  expect(devList.body.tasks.length).toBe(1);
  expect(devList.body.tasks[0].stale).toBe(true);
  const otherList = await api().get("/api/tasks").set(auth(otoken));
  expect(otherList.body.tasks.length).toBe(0); // not a member
});

test("developer can change status only on assigned tasks", async () => {
  const { mtoken, dev, dtoken, otoken, proj } = await setup();
  const t = (await api().post("/api/tasks").set(auth(mtoken)).send({ project: proj.id, title: "T", assignee: dev.id, deadline: "2026-06-20" })).body.task;
  const ok = await api().patch(`/api/tasks/${t.id}/status`).set(auth(dtoken)).send({ status: "in_progress" });
  expect(ok.status).toBe(200);
  expect(ok.body.task.status).toBe("in_progress");
  const denied = await api().patch(`/api/tasks/${t.id}/status`).set(auth(otoken)).send({ status: "done" });
  expect(denied.status).toBe(403);
});

test("status cannot be set to stale", async () => {
  const { mtoken, dev, dtoken, proj } = await setup();
  const t = (await api().post("/api/tasks").set(auth(mtoken)).send({ project: proj.id, title: "T", assignee: dev.id, deadline: "2026-06-20" })).body.task;
  const res = await api().patch(`/api/tasks/${t.id}/status`).set(auth(dtoken)).send({ status: "stale" });
  expect(res.status).toBe(400);
});

test("manager patch can change deadline; developer cannot patch", async () => {
  const { mtoken, dtoken, dev, proj } = await setup();
  const t = (await api().post("/api/tasks").set(auth(mtoken)).send({ project: proj.id, title: "T", assignee: dev.id, deadline: "2026-06-20" })).body.task;
  const ok = await api().patch(`/api/tasks/${t.id}`).set(auth(mtoken)).send({ deadline: "2026-07-01", priority: "low" });
  expect(ok.status).toBe(200);
  expect(ok.body.task.priority).toBe("low");
  const denied = await api().patch(`/api/tasks/${t.id}`).set(auth(dtoken)).send({ title: "hacked" });
  expect(denied.status).toBe(403);
});
