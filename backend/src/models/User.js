const mongoose = require("mongoose");

function initialsOf(name) {
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null },
    role: { type: String, enum: ["manager", "developer"], required: true },
    initials: { type: String },
    title: { type: String, default: "" },
    status: { type: String, enum: ["invited", "active", "disabled"], default: "invited" },
    inviteToken: { type: String, default: null },
    inviteExpires: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

userSchema.pre("validate", function () {
  if (!this.initials && this.name) this.initials = initialsOf(this.name);
});

userSchema.methods.publicJson = function () {
  return {
    id: this.id, name: this.name, email: this.email, role: this.role,
    initials: this.initials, title: this.title, status: this.status,
  };
};

userSchema.statics.initialsOf = initialsOf;
module.exports = mongoose.model("User", userSchema);
