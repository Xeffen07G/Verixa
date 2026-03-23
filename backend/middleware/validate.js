function requireApiKey(req, res, next) {
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({
      error: "GROQ_API_KEY is not configured. Please set it in your backend/.env file.",
    });
  }
  next();
}

function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${res.statusCode} (${ms}ms)`);
  });
  next();
}

module.exports = { requireApiKey, requestLogger };