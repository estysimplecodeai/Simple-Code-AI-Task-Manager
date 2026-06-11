// Runs the API against an ephemeral in-memory MongoDB — no Atlas/network needed.
// Useful for offline development and demos. Data is wiped on exit.
// Start with: npm run dev:memory
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const { buildApp } = require("./app");
const { seedManager } = require("./seed");
const config = require("./config");

async function main() {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const created = await seedManager();
  console.log(
    created
      ? `Seeded manager ${config.seedManager.email} (password: ${config.seedManager.password})`
      : "Manager already exists."
  );
  const app = buildApp();
  app.listen(config.port, () => {
    console.log(`In-memory API on :${config.port} — data is ephemeral, lost on exit.`);
  });

  const shutdown = async () => {
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((e) => {
  console.error("Failed to start in-memory server:", e);
  process.exit(1);
});
