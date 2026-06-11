const { setupDb, teardownDb, clearDb, api, makeUser, auth } = require("./helpers");

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

async function setup() {
  const { token: mtoken } = await makeUser({ role: "manager", email: "m@x.com" });
  const { user: dev, token: dtoken } = await makeUser({ role: "developer", email: "d@x.com" });
  const proj = (await api().post("/api/projects").set(auth(mtoken)).send({ name: "Atlas", key: "ATLAS" })).body.project;
  await api().patch(`/api/projects/${proj.id}/members`).set(auth(mtoken)).send({ members: [dev.id] });
  const task = (await api().post("/api/tasks").set(auth(mtoken)).send({ project: proj.id, title: "T", assignee: dev.id, deadline: "2026-06-10" })).body.task;
  return { mtoken, dtoken, dev, proj, task };
}

test("developer requests an extension; it becomes pending", async () => {
  const { dtoken, task } = await setup();
  const res = await api().post(`/api/tasks/${task.id}/extension`).set(auth(dtoken))
    .send({ requestedDate: "2026-06-20", note: "Need more time" });
  expect(res.status).toBe(200);
  expect(res.body.task.ext.state).toBe("pending");
  expect(res.body.task.ext.note).toBe("Need more time");
});

test("non-assignee cannot request an extension", async () => {
  const { mtoken, task } = await setup();
  const { token: otoken } = await makeUser({ role: "developer", email: "o@x.com" });
  const res = await api().post(`/api/tasks/${task.id}/extension`).set(auth(otoken)).send({ requestedDate: "2026-06-20", note: "x" });
  expect(res.status).toBe(403);
});

test("manager approve uses the requested date", async () => {
  const { dtoken, mtoken, task } = await setup();
  await api().post(`/api/tasks/${task.id}/extension`).set(auth(dtoken)).send({ requestedDate: "2026-06-20", note: "x" });
  const res = await api().post(`/api/tasks/${task.id}/extension/decide`).set(auth(mtoken))
    .send({ decision: "approve", managerNote: "ok" });
  expect(res.status).toBe(200);
  expect(res.body.task.ext.state).toBe("approved");
  expect(new Date(res.body.task.deadline).toISOString().slice(0, 10)).toBe("2026-06-20");
});

test("manager modify uses newDate, not requested", async () => {
  const { dtoken, mtoken, task } = await setup();
  await api().post(`/api/tasks/${task.id}/extension`).set(auth(dtoken)).send({ requestedDate: "2026-06-20", note: "x" });
  const res = await api().post(`/api/tasks/${task.id}/extension/decide`).set(auth(mtoken))
    .send({ decision: "modify", newDate: "2026-06-15", managerNote: "partial" });
  expect(new Date(res.body.task.deadline).toISOString().slice(0, 10)).toBe("2026-06-15");
  expect(res.body.task.ext.grantedDate).toBeTruthy();
});

test("manager deny leaves the deadline unchanged", async () => {
  const { dtoken, mtoken, task } = await setup();
  await api().post(`/api/tasks/${task.id}/extension`).set(auth(dtoken)).send({ requestedDate: "2026-06-20", note: "x" });
  const res = await api().post(`/api/tasks/${task.id}/extension/decide`).set(auth(mtoken))
    .send({ decision: "deny", managerNote: "no" });
  expect(res.body.task.ext.state).toBe("denied");
  expect(new Date(res.body.task.deadline).toISOString().slice(0, 10)).toBe("2026-06-10");
});

test("developer cannot decide an extension", async () => {
  const { dtoken, task } = await setup();
  await api().post(`/api/tasks/${task.id}/extension`).set(auth(dtoken)).send({ requestedDate: "2026-06-20", note: "x" });
  const res = await api().post(`/api/tasks/${task.id}/extension/decide`).set(auth(dtoken)).send({ decision: "approve" });
  expect(res.status).toBe(403);
});
