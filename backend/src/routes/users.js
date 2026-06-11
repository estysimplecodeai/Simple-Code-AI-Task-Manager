const router = require("express").Router();
const User = require("../models/User");
const Project = require("../models/Project");
const { randomToken } = require("../lib/token");
const { asyncH, HttpError } = require("../middleware/error");
const { requireAuth, requireManager } = require("../middleware/auth");
const config = require("../config");

router.use(requireAuth);

// List all users (manager only) — for team & member pickers.
router.get("/", requireManager, asyncH(async (req, res) => {
  const users = await User.find().sort({ createdAt: 1 });
  res.json({ users: users.map((u) => u.publicJson()) });
}));

function inviteFields() {
  const inviteToken = randomToken();
  const inviteExpires = new Date(Date.now() + config.inviteTtlDays * 86400000);
  return { inviteToken, inviteExpires };
}

// Create a developer in invited state; return the shareable invite link.
router.post("/", requireManager, asyncH(async (req, res) => {
  const { name, email, title } = req.body;
  if (!name || !email) throw new HttpError(400, "Name and email are required");
  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) throw new HttpError(409, "A user with that email already exists");
  const { inviteToken, inviteExpires } = inviteFields();
  const user = await User.create({
    name, email, title: title || "", role: "developer", status: "invited",
    inviteToken, inviteExpires, createdBy: req.user.id,
  });
  res.status(201).json({ user: user.publicJson(), inviteToken, invitePath: `/accept-invite/${inviteToken}` });
}));

// Disable / enable / reinvite.
router.patch("/:id", requireManager, asyncH(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, "User not found");
  const { action } = req.body;
  if (action === "disable") user.status = "disabled";
  else if (action === "enable") user.status = user.passwordHash ? "active" : "invited";
  else if (action === "reinvite") {
    const f = inviteFields();
    user.inviteToken = f.inviteToken; user.inviteExpires = f.inviteExpires;
    user.status = "invited"; user.passwordHash = null;
  } else throw new HttpError(400, "Unknown action");
  await user.save();
  const out = { user: user.publicJson() };
  if (action === "reinvite") { out.inviteToken = user.inviteToken; out.invitePath = `/accept-invite/${user.inviteToken}`; }
  res.json(out);
}));

module.exports = router;
