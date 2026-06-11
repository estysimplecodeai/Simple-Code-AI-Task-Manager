require("dotenv").config();

const config = {
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpires: process.env.JWT_EXPIRES || "7d",
  port: process.env.PORT || 4000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  seedManager: {
    email: (process.env.SEED_MANAGER_EMAIL || "esty@simplecodeai.com").toLowerCase(),
    name: process.env.SEED_MANAGER_NAME || "Esty",
    password: process.env.SEED_MANAGER_PASSWORD || "ChangeMe!2026",
  },
  inviteTtlDays: 7,
};

module.exports = config;
