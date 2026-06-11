const { setupDb, teardownDb, clearDb } = require("./helpers");
const User = require("../src/models/User");
const { seedManager } = require("../src/seed");

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

test("seedManager creates the manager when none exist", async () => {
  const created = await seedManager({ email: "esty@simplecodeai.com", name: "Esty", password: "pw123456" });
  expect(created).toBe(true);
  const u = await User.findOne({ email: "esty@simplecodeai.com" });
  expect(u.role).toBe("manager");
  expect(u.status).toBe("active");
  expect(u.passwordHash).toBeTruthy();
});

test("seedManager is idempotent (no duplicate)", async () => {
  await seedManager({ email: "esty@simplecodeai.com", name: "Esty", password: "pw123456" });
  const created = await seedManager({ email: "esty@simplecodeai.com", name: "Esty", password: "pw123456" });
  expect(created).toBe(false);
  expect(await User.countDocuments()).toBe(1);
});
