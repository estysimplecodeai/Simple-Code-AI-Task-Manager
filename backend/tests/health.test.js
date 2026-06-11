const { setupDb, teardownDb, clearDb, api } = require("./helpers");

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

test("GET /api/health returns ok", async () => {
  const res = await api().get("/api/health");
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ ok: true });
});
