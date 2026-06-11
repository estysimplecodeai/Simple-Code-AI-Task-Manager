const User = require("../models/User");
const { verifyJwt } = require("../lib/token");
const { asyncH, HttpError } = require("./error");

const requireAuth = asyncH(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new HttpError(401, "Authentication required");
  let decoded;
  try { decoded = verifyJwt(token); } catch { throw new HttpError(401, "Invalid or expired token"); }
  const user = await User.findById(decoded.sub);
  if (!user || user.status === "disabled") throw new HttpError(401, "Account not available");
  req.user = user;
  next();
});

function requireManager(req, res, next) {
  if (!req.user || req.user.role !== "manager") return next(new HttpError(403, "Manager access required"));
  next();
}

module.exports = { requireAuth, requireManager };
