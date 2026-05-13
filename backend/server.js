process.on("uncaughtException", (err) => {
  console.error("[FATAL] Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("[FATAL] Unhandled Rejection at:", promise, "reason:", reason);
});

require("dotenv").config();
const fs = require("fs");
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
const express = require("express");
const cors = require("cors");

// Connect to Database (Lightweight check)
if (process.env.MONGO_URI) {
  console.log('MONGO_URI found. Initializing connection...');
  require("./config/db")();
} else {
  console.error('CRITICAL: MONGO_URI is missing!');
}

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Diagnostic Logging (Top-most)
app.use((req, res, next) => {
  console.log(`[CORS DEBUG] ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// 2. Brute-force Manual CORS Headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://verixa-gamma.vercel.app");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "*");
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 3. Official CORS Middleware
const corsOptions = {
  origin: ["https://verixa-gamma.vercel.app", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"]
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// 4. Body Parsers
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// 5. Helmet (Temporarily disabled for CORS troubleshooting)
// app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const SAFE_MODE = process.env.SAFE_MODE === 'true';
const PROCESS_TYPE = process.env.PROCESS_TYPE || 'api';

// 5. Helmet & Logging
const morgan = require("morgan");
app.use(morgan("dev"));

// Root health check (Zero dependency)
app.get("/health", (req, res) => res.json({ status: "ok", mode: SAFE_MODE ? "SAFE" : "NORMAL", process: PROCESS_TYPE }));

// 6. Request Lifecycle Instrumentation
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[REQ START] ${req.method} ${req.originalUrl}`);
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[REQ END] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// 7. SAFE_MODE Mocks
if (SAFE_MODE) {
  console.log('!!! BACKEND RUNNING IN SAFE_MODE !!!');
  app.use("/api/pdf/ingest", (req, res) => res.status(202).json({ mock: true, jobId: "safe_job", mode: "SAFE_MODE" }));
  app.use("/api/rag/documents", (req, res) => res.json({ mock: true, documents: [], mode: "SAFE_MODE" }));
  app.use("/api/organization", (req, res) => res.json({ mock: true, members: [], mode: "SAFE_MODE" }));
}

// 8. Deferred Route Loading
if (!SAFE_MODE && PROCESS_TYPE === 'api') {
  const { requireApiKey } = require("./middleware/validate");
  const rateLimit = require("express-rate-limit");
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests." },
  });
  app.use("/api/", limiter);

  app.use("/api/verify", requireApiKey, require("./routes/verify"));
  app.use("/api/url", requireApiKey, require("./routes/url"));
  app.use("/api/health", require("./routes/health"));
  app.use("/api/trending", require("./routes/trending"));
  app.use('/api/organization', require('./routes/organization'));
  app.use('/api/user', require('./routes/user'));
  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/pdf", requireApiKey, require("./routes/pdf"));
  app.use("/api/image", requireApiKey, require("./routes/image"));
  app.use("/api/video", requireApiKey, require("./routes/video"));
  app.use("/api/rag", require("./routes/rag"));
} else if (PROCESS_TYPE === 'api') {
  // Minimal routes for SAFE_MODE
  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/health", (req, res) => res.json({ status: "safe" }));
}

// 404 handler
app.use((req, res) => {
  console.warn(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: "Route not found",
    method: req.method,
    path: req.originalUrl,
    hint: "Verify if the API path is correctly prefixed with /api/"
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n🔍 VeriXa Backend running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}\n`);
});

module.exports = app;