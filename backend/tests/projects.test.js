const { setupDb, teardownDb, clearDb, api, makeUser, auth } = require("./helpers");

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

async function mgr() { return makeUser({ role: "manager", email: "m@x.com" }); }

test("manager creates a project", async () => {
  const { token } = await mgr();
  const res = await api().post("/api/projects").set(auth(token))
    .send({ name: "Atlas Web App", key: "atlas", tone: "teal" });
  expect(res.status).toBe(201);
  expect(res.body.project.key).toBe("ATLAS");
});

test("developer cannot create a project", async () => {
  const { token } = await makeUser({ role: "developer", email: "d@x.com" });
  const res = await api().post("/api/projects").set(auth(token)).send({ name: "X", key: "X" });
  expect(res.status).toBe(403);
});

test("developer only sees projects they are a member of", async () => {
  const { token: mtoken } = await mgr();
  const { user: dev, token: dtoken } = await makeUser({ role: "developer", email: "d@x.com" });
  const a = await api().post("/api/projects").set(auth(mtoken)).send({ name: "A", key: "A" });
  await api().post("/api/projects").set(auth(mtoken)).send({ name: "B", key: "B" });
  await api().patch(`/api/projects/${a.body.project.id}/members`).set(auth(mtoken)).send({ members: [dev.id] });

  const res = await api().get("/api/projects").set(auth(dtoken));
  expect(res.status).toBe(200);
  expect(res.body.projects.length).toBe(1);
  expect(res.body.projects[0].key).toBe("A");
});

test("manager sees all projects", async () => {
  const { token } = await mgr();
  await api().post("/api/projects").set(auth(token)).send({ name: "A", key: "A" });
  await api().post("/api/projects").set(auth(token)).send({ name: "B", key: "B" });
  const res = await api().get("/api/projects").set(auth(token));
  expect(res.body.projects.length).toBe(2);
});

// I2: PATCH /:id/members must reject non-existent or non-developer user ids
test("setting members to a non-existent id returns 400", async () => {
  const { token } = await mgr();
  const proj = (await api().post("/api/projects").set(auth(token)).send({ name: "A", key: "A" })).body.project;
  const fakeId = "000000000000000000000001";
  const res = await api().patch(`/api/projects/${proj.id}/members`).set(auth(token)).send({ members: [fakeId] });
  expect(res.status).toBe(400);
});

test("setting members to valid developer ids succeeds", async () => {
  const { token } = await mgr();
  const { user: dev } = await makeUser({ role: "developer", email: "dev@x.com" });
  const proj = (await api().post("/api/projects").set(auth(token)).send({ name: "A", key: "A" })).body.project;
  const res = await api().patch(`/api/projects/${proj.id}/members`).set(auth(token)).send({ members: [dev.id] });
  expect(res.status).toBe(200);
  expect(res.body.project.members).toContain(dev.id);
});
