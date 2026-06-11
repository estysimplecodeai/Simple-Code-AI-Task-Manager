const { setupDb, teardownDb, clearDb, api, makeUser, auth } = require("./helpers");

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

test("manager creates a developer and gets an invite link", async () => {
  const { token } = await makeUser({ role: "manager", email: "m@x.com" });
  const res = await api().post("/api/users").set(auth(token))
    .send({ name: "Ravi Adeyemi", email: "ravi@simplecodeai.com", title: "Backend Engineer" });
  expect(res.status).toBe(201);
  expect(res.body.user.role).toBe("developer");
  expect(res.body.user.status).toBe("invited");
  expect(res.body.inviteToken).toBeTruthy();
  expect(res.body.invitePath).toContain("/accept-invite/");
});

test("developer cannot create users", async () => {
  const { token } = await makeUser({ role: "developer", email: "d@x.com" });
  const res = await api().post("/api/users").set(auth(token)).send({ name: "X", email: "x@x.com" });
  expect(res.status).toBe(403);
});

test("manager lists users", async () => {
  const { token } = await makeUser({ role: "manager", email: "m@x.com" });
  await api().post("/api/users").set(auth(token)).send({ name: "A B", email: "a@x.com" });
  const res = await api().get("/api/users").set(auth(token));
  expect(res.status).toBe(200);
  expect(res.body.users.length).toBeGreaterThanOrEqual(2); // manager + new dev
});

test("creating a duplicate email fails", async () => {
  const { token } = await makeUser({ role: "manager", email: "m@x.com" });
  await api().post("/api/users").set(auth(token)).send({ name: "A", email: "a@x.com" });
  const res = await api().post("/api/users").set(auth(token)).send({ name: "B", email: "a@x.com" });
  expect(res.status).toBe(409);
});

test("manager can re-issue an invite", async () => {
  const { token } = await makeUser({ role: "manager", email: "m@x.com" });
  const created = await api().post("/api/users").set(auth(token)).send({ name: "A", email: "a@x.com" });
  const id = created.body.user.id;
  const res = await api().patch(`/api/users/${id}`).set(auth(token)).send({ action: "reinvite" });
  expect(res.status).toBe(200);
  expect(res.body.inviteToken).toBeTruthy();
});
