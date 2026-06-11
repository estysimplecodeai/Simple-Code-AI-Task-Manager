const express = require("express");
const cors = require("cors");
const config = require("./config");
const { errorHandler } = require("./middleware/error");

function buildApp() {
  const app = express();
  app.use(cors({ origin: config.clientUrl, credentials: true }));
  app.use(express.json());

  app.get("/api/health", (req, res) => res.json({ ok: true }));

  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/users", require("./routes/users"));
  app.use("/api/projects", require("./routes/projects"));

  app.use(errorHandler);
  return app;
}

module.exports = { buildApp };
