const { buildApp } = require("./app");
const { connectDb } = require("./db");
const config = require("./config");

async function main() {
  await connectDb();
  const app = buildApp();
  app.listen(config.port, () => console.log(`API on :${config.port}`));
}

main().catch((e) => {
  console.error("Failed to start:", e);
  process.exit(1);
});
