const mongoose = require("mongoose");

const extSchema = new mongoose.Schema(
  {
    state: { type: String, enum: ["pending", "approved", "denied"], required: true },
    requestedDate: { type: Date, required: true },
    note: { type: String, default: "" },
    requestedAt: { type: Date, default: Date.now },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    originalDeadline: { type: Date },
    managerNote: { type: String, default: "" },
    decidedDate: { type: Date, default: null },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    grantedDate: { type: Date, default: null },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    title: { type: String, required: true },
    desc: { type: String, default: "" },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    priority: { type: String, enum: ["low", "med", "high"], default: "med" },
    status: { type: String, enum: ["todo", "in_progress", "in_review", "done"], default: "todo" },
    deadline: { type: Date, required: true },
    branch: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    ext: { type: extSchema, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
