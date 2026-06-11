const { setupDb, teardownDb, clearDb, api, makeUser, auth } = require("./helpers");
const User = require("../src/models/User");
const { hash } = require("../src/lib/password");

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

test("login succeeds with correct password and returns token + user", async () => {
  await User.create({ name: "Esty", email: "esty@x.com", role: "manager", status: "active", passwordHash: await hash("pw123456") });
  const res = await api().post("/api/auth/login").send({ email: "esty@x.com", password: "pw123456" });
  expect(res.status).toBe(200);
  expect(res.body.token).toBeTruthy();
  expect(res.body.user.role).toBe("manager");
});

test("login fails with wrong password", async () => {
  await User.create({ name: "Esty", email: "esty@x.com", role: "manager", status: "active", passwordHash: await hash("pw123456") });
  const res = await api().post("/api/auth/login").send({ email: "esty@x.com", password: "nope" });
  expect(res.status).toBe(401);
});

test("invited user cannot log in until accept", async () => {
  await User.create({ name: "Dev", email: "dev@x.com", role: "developer", status: "invited", inviteToken: "tok123", inviteExpires: new Date(Date.now() + 1e9) });
  const login = await api().post("/api/auth/login").send({ email: "dev@x.com", password: "whatever" });
  expect(login.status).toBe(401);

  const info = await api().get("/api/auth/invite/tok123");
  expect(info.status).toBe(200);
  expect(info.body.email).toBe("dev@x.com");

  const accept = await api().post("/api/auth/accept-invite").send({ token: "tok123", password: "newpass123" });
  expect(accept.status).toBe(200);
  expect(accept.body.token).toBeTruthy();

  const relogin = await api().post("/api/auth/login").send({ email: "dev@x.com", password: "newpass123" });
  expect(relogin.status).toBe(200);
});

test("change-password updates the hash", async () => {
  const { token } = await makeUser({ role: "developer", email: "d@x.com", password: "oldpass123" });
  const res = await api().post("/api/auth/change-password").set(auth(token))
    .send({ currentPassword: "oldpass123", newPassword: "brandnew123" });
  expect(res.status).toBe(200);
  const relogin = await api().post("/api/auth/login").send({ email: "d@x.com", password: "brandnew123" });
  expect(relogin.status).toBe(200);
});
