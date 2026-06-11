const router = require("express").Router();
const Project = require("../models/Project");
const { asyncH, HttpError } = require("../middleware/error");
const { requireAuth, requireManager } = require("../middleware/auth");

router.use(requireAuth);

function projectJson(p) {
  return {
    id: p.id, name: p.name, key: p.key, tone: p.tone,
    members: p.members.map((m) => (m._id ? m._id.toString() : m.toString())),
  };
}

// Manager: all projects. Developer: only projects they're a member of.
router.get("/", asyncH(async (req, res) => {
  const filter = req.user.role === "manager" ? {} : { members: req.user._id };
  const projects = await Project.find(filter).sort({ createdAt: 1 });
  res.json({ projects: projects.map(projectJson) });
}));

router.post("/", requireManager, asyncH(async (req, res) => {
  const { name, key, tone, members } = req.body;
  if (!name || !key) throw new HttpError(400, "Name and key are required");
  const exists = await Project.findOne({ key: String(key).toUpperCase() });
  if (exists) throw new HttpError(409, "A project with that key already exists");
  const project = await Project.create({
    name, key, tone: tone || "teal", members: members || [], createdBy: req.user.id,
  });
  res.status(201).json({ project: projectJson(project) });
}));

router.patch("/:id/members", requireManager, asyncH(async (req, res) => {
  const { members } = req.body;
  if (!Array.isArray(members)) throw new HttpError(400, "members must be an array of user ids");
  const project = await Project.findById(req.params.id);
  if (!project) throw new HttpError(404, "Project not found");
  project.members = members;
  await project.save();
  res.json({ project: projectJson(project) });
}));

module.exports = router;
