const mongoose = require("mongoose");
const User = require("./models/User");
const { hash } = require("./lib/password");
const { connectDb } = require("./db");
const config = require("./config");

// Returns true if it created the manager, false if one already existed.
async function seedManager({ email, name, password } = config.seedManager) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return false;
  await User.create({
    name, email, role: "manager", status: "active", passwordHash: await hash(password),
  });
  return true;
}

async function runCli() {
  await connectDb();
  const created = await seedManager();
  if (created) {
    console.log(`Seeded manager ${config.seedManager.email}.`);
    if (config.seedManager.password === "ChangeMe!2026") {
      console.warn("WARNING: using the default SEED_MANAGER_PASSWORD — change it after first login.");
    }
  } else {
    console.log("Manager already exists; nothing to seed.");
  }
  await mongoose.disconnect();
}

if (require.main === module) runCli().catch((e) => { console.error(e); process.exit(1); });

module.exports = { seedManager };
