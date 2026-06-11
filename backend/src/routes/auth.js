const router = require("express").Router();
const User = require("../models/User");
const { hash, compare } = require("../lib/password");
const { signJwt } = require("../lib/token");
const { asyncH, HttpError } = require("../middleware/error");
const { requireAuth } = require("../middleware/auth");

const issue = (user) => ({ token: signJwt({ sub: user.id, role: user.role }), user: user.publicJson() });

router.post("/login", asyncH(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || "").toLowerCase() });
  if (!user || user.status !== "active" || !user.passwordHash) throw new HttpError(401, "Invalid credentials");
  if (!(await compare(password || "", user.passwordHash))) throw new HttpError(401, "Invalid credentials");
  res.json(issue(user));
}));

router.get("/me", requireAuth, (req, res) => res.json({ user: req.user.publicJson() }));

router.get("/invite/:token", asyncH(async (req, res) => {
  const user = await User.findOne({ inviteToken: req.params.token });
  if (!user || user.status !== "invited") throw new HttpError(404, "Invite not found");
  if (user.inviteExpires && user.inviteExpires < new Date()) throw new HttpError(410, "Invite expired");
  res.json({ name: user.name, email: user.email });
}));

router.post("/accept-invite", asyncH(async (req, res) => {
  const { token, password } = req.body;
  if (!password || password.length < 8) throw new HttpError(400, "Password must be at least 8 characters");
  const user = await User.findOne({ inviteToken: token });
  if (!user || user.status !== "invited") throw new HttpError(404, "Invite not found");
  if (user.inviteExpires && user.inviteExpires < new Date()) throw new HttpError(410, "Invite expired");
  user.passwordHash = await hash(password);
  user.status = "active";
  user.inviteToken = null;
  user.inviteExpires = null;
  await user.save();
  res.json(issue(user));
}));

router.post("/change-password", requireAuth, asyncH(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) throw new HttpError(400, "New password must be at least 8 characters");
  if (!(await compare(currentPassword || "", req.user.passwordHash || ""))) throw new HttpError(400, "Current password is incorrect");
  req.user.passwordHash = await hash(newPassword);
  await req.user.save();
  res.json({ ok: true });
}));

module.exports = router;
