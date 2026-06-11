const router = require("express").Router();
const Task = require("../models/Task");
const Project = require("../models/Project");
const { withDerived } = require("../lib/derive");
const { asyncH, HttpError } = require("../middleware/error");
const { requireAuth, requireManager } = require("../middleware/auth");

router.use(requireAuth);

const REAL_STATUSES = ["todo", "in_progress", "in_review", "done"];

function taskJson(t, now = new Date()) {
  const obj = {
    id: t.id, key: t.key, project: t.project?._id ? t.project._id.toString() : t.project.toString(),
    title: t.title, desc: t.desc,
    assignee: t.assignee ? (t.assignee._id ? t.assignee._id.toString() : t.assignee.toString()) : null,
    priority: t.priority, status: t.status, deadline: t.deadline, branch: t.branch,
    createdBy: t.createdBy ? t.createdBy.toString() : null, ext: t.ext || null,
  };
  return withDerived(obj, now);
}

// Project ids the current user may see.
async function visibleProjectIds(user) {
  if (user.role === "manager") return null; // null = all
  const projects = await Project.find({ members: user._id }).select("_id");
  return projects.map((p) => p._id);
}

router.get("/", asyncH(async (req, res) => {
  const pids = await visibleProjectIds(req.user);
  const filter = {};
  if (pids) filter.project = { $in: pids };
  if (req.query.project) filter.project = req.query.project;
  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  res.json({ tasks: tasks.map((t) => taskJson(t)) });
}));

router.get("/:id", asyncH(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new HttpError(404, "Task not found");
  if (req.user.role !== "manager") {
    const project = await Project.findById(task.project);
    if (!project || !project.members.some((m) => m.equals(req.user._id))) throw new HttpError(403, "No access to this task");
  }
  res.json({ task: taskJson(task) });
}));

router.post("/", requireManager, asyncH(async (req, res) => {
  const { project, title, desc, assignee, priority, deadline, branch } = req.body;
  if (!project || !title) throw new HttpError(400, "Project and title are required");
  if (!deadline) throw new HttpError(400, "Deadline is required");
  const proj = await Project.findById(project);
  if (!proj) throw new HttpError(404, "Project not found");
  const num = proj.nextNum;
  proj.nextNum = num + 1;
  await proj.save();
  const task = await Task.create({
    key: `${proj.key}-${num}`, project: proj._id, title, desc: desc || "",
    assignee: assignee || null, priority: priority || "med", status: "todo",
    deadline: new Date(deadline), branch: branch || "", createdBy: req.user.id, ext: null,
  });
  res.status(201).json({ task: taskJson(task) });
}));

// Developer (assigned) or manager changes status. Never "stale" (derived).
router.patch("/:id/status", asyncH(async (req, res) => {
  const { status } = req.body;
  if (!REAL_STATUSES.includes(status)) throw new HttpError(400, "Invalid status");
  const task = await Task.findById(req.params.id);
  if (!task) throw new HttpError(404, "Task not found");
  const isAssignee = task.assignee && task.assignee.equals(req.user._id);
  if (req.user.role !== "manager" && !isAssignee) throw new HttpError(403, "You can only update tasks assigned to you");
  task.status = status;
  await task.save();
  res.json({ task: taskJson(task) });
}));

// Manager-only full patch (incl. deadline).
router.patch("/:id", requireManager, asyncH(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new HttpError(404, "Task not found");
  const allowed = ["title", "desc", "assignee", "priority", "status", "deadline", "branch"];
  for (const k of allowed) {
    if (req.body[k] === undefined) continue;
    if (k === "status" && !REAL_STATUSES.includes(req.body[k])) throw new HttpError(400, "Invalid status");
    task[k] = k === "deadline" ? new Date(req.body[k]) : req.body[k];
  }
  await task.save();
  res.json({ task: taskJson(task) });
}));

// Developer (assignee) requests a deadline extension.
router.post("/:id/extension", asyncH(async (req, res) => {
  const { requestedDate, note } = req.body;
  if (!requestedDate) throw new HttpError(400, "A requested date is required");
  const task = await Task.findById(req.params.id);
  if (!task) throw new HttpError(404, "Task not found");
  const isAssignee = task.assignee && task.assignee.equals(req.user._id);
  if (!isAssignee) throw new HttpError(403, "You can only request extensions on tasks assigned to you");
  task.ext = {
    state: "pending", requestedDate: new Date(requestedDate), note: note || "",
    requestedAt: new Date(), requestedBy: req.user._id, originalDeadline: task.deadline,
  };
  await task.save();
  res.json({ task: taskJson(task) });
}));

// Manager decides: approve (requested date) | modify (newDate) | deny.
router.post("/:id/extension/decide", requireManager, asyncH(async (req, res) => {
  const { decision, newDate, managerNote } = req.body;
  const task = await Task.findById(req.params.id);
  if (!task) throw new HttpError(404, "Task not found");
  if (!task.ext || task.ext.state !== "pending") throw new HttpError(400, "No pending extension request");
  task.ext.managerNote = managerNote || "";
  task.ext.decidedDate = new Date();
  task.ext.decidedBy = req.user._id;
  if (decision === "approve") {
    task.ext.state = "approved";
    task.deadline = task.ext.requestedDate;
  } else if (decision === "modify") {
    if (!newDate) throw new HttpError(400, "newDate is required to modify");
    task.ext.state = "approved";
    task.ext.grantedDate = new Date(newDate);
    task.deadline = new Date(newDate);
  } else if (decision === "deny") {
    task.ext.state = "denied";
  } else {
    throw new HttpError(400, "decision must be approve, modify, or deny");
  }
  await task.save();
  res.json({ task: taskJson(task) });
}));

module.exports = { router, taskJson };
