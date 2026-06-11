const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true, uppercase: true, trim: true },
    tone: { type: String, enum: ["teal", "coral", "sand"], default: "teal" },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    nextNum: { type: Number, default: 1 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
