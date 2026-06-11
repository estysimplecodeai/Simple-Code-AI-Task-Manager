// Wrap async route handlers so thrown errors hit the error handler.
const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Throw this for expected, client-facing failures.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function errorHandler(err, req, res, _next) {
  let status = err.status || 500;
  if (err.name === "ValidationError" || err.name === "CastError") status = 400;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || "Server error" });
}

module.exports = { asyncH, HttpError, errorHandler };
