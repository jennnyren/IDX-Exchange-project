// Log every request: method, URL, status code, duration in ms
module.exports = function requestLogger(req, res, next) {
  const start = process.hrtime.bigint(); // high-precision start time
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`,
    );
  });
  next(); // hand off to the next handler — REQUIRED
};
