const { setupDb, teardownDb, clearDb, api, makeUser, auth } = require("./helpers");

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

// A throwaway protected route is mounted via the real app in Task 1.6+ (auth/me).
test("rejects missing token on /api/auth/me", async () => {
  const res = await api().get("/api/auth/me");
  expect(res.status).toBe(401);
});

test("accepts valid token on /api/auth/me", async () => {
  const { token, user } = await makeUser({ role: "manager", email: "m@x.com" });
  const res = await api().get("/api/auth/me").set(auth(token));
  expect(res.status).toBe(200);
  expect(res.body.user.email).toBe("m@x.com");
});
