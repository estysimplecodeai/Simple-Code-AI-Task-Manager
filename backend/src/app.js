const express = require("express");
const cors = require("cors");
const config = require("./config");
const { errorHandler } = require("./middleware/error");

function buildApp() {
  const app = express();
  app.use(cors({ origin: config.clientUrl, credentials: true }));
  app.use(express.json());

  app.get("/api/health", (req, res) => res.json({ ok: true }));

  // ROUTES MOUNTED HERE (auth, users, projects, tasks) in later tasks.

  app.use(errorHandler);
  return app;
}

module.exports = { buildApp };
