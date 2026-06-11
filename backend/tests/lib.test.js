const { hash, compare } = require("../src/lib/password");
const { signJwt, verifyJwt, randomToken } = require("../src/lib/token");

test("hash/compare round-trips", async () => {
  const h = await hash("secret123");
  expect(h).not.toBe("secret123");
  expect(await compare("secret123", h)).toBe(true);
  expect(await compare("wrong", h)).toBe(false);
});

test("jwt sign/verify round-trips", () => {
  const t = signJwt({ sub: "abc", role: "manager" });
  const decoded = verifyJwt(t);
  expect(decoded.sub).toBe("abc");
  expect(decoded.role).toBe("manager");
});

test("randomToken is unique and url-safe", () => {
  const a = randomToken(), b = randomToken();
  expect(a).not.toBe(b);
  expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
});
