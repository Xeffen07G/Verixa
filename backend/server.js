process.on("uncaughtException", (err) => {
  console.error("[FATAL] Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[FATAL] Unhandled Rejection at:", promise, "reason:", reason);
});

require("dotenv").config();

const fs = require("fs");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const app = express();
const PORT = process.env.PORT || 5000;

const SAFE_MODE = process.env.SAFE_MODE === "true";
const PROCESS_TYPE = process.env.PROCESS_TYPE || "api";

/*
==================================================
ULTRA-EARLY DIAGNOSTIC ROUTE
==================================================
THIS MUST STAY AT THE TOP
*/
app.get("/ping", (req, res) => {
  console.log("[PING] Route hit");

  res.json({
    ok: true,
    timestamp: Date.now(),
    safeMode: SAFE_MODE,
    processType: PROCESS_TYPE,
  });
});

/*
==================================================
ROOT HEALTH CHECK
==================================================
*/
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mode: SAFE_MODE ? "SAFE" : "NORMAL",
    process: PROCESS_TYPE,
    uptime: process.uptime(),
  });
});

/*
==================================================
REQUEST LOGGER
==================================================
*/
app.use((req, res, next) => {
  const start = Date.now();

  console.log(`[REQ START] ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    const duration = Date.now() - start;

    console.log(
      `[REQ END] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`
    );
  });

  next();
});

/*
==================================================
CORS
==================================================
*/
const corsOptions = {
  origin: [
    "https://verixa-gamma.vercel.app",
    "http://localhost:3000",
  ],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/*
==================================================
BODY PARSERS
==================================================
*/
app.use(morgan("dev"));

app.use(express.json({
  limit: "50mb",
}));

app.use(express.urlencoded({
  limit: "50mb",
  extended: true,
}));

/*
==================================================
SAFE MODE MOCK ROUTES
==================================================
*/
if (SAFE_MODE) {
  console.log("⚠️ BACKEND RUNNING IN SAFE_MODE");

  app.use("/api/pdf/ingest", (req, res) => {
    return res.status(202).json({
      mock: true,
      jobId: "safe_job",
      mode: "SAFE_MODE",
    });
  });

  app.use("/api/rag/documents", (req, res) => {
    return res.json({
      mock: true,
      documents: [],
      mode: "SAFE_MODE",
    });
  });

  app.use("/api/organization", (req, res) => {
    return res.json({
      mock: true,
      members: [],
      mode: "SAFE_MODE",
    });
  });
}

/*
==================================================
DATABASE CONNECTION
==================================================
ONLY CONNECT AFTER EXPRESS IS READY
*/
if (!SAFE_MODE && process.env.MONGO_URI) {
  console.log("[DB] Connecting MongoDB...");

  const connectDB = require("./config/db");

  connectDB()
    .then(() => {
      console.log("[DB] Mongo Connected");
    })
    .catch((err) => {
      console.error("[DB] Mongo Connection Failed:", err);
    });
}

/*
==================================================
API ROUTES
==================================================
*/
if (!SAFE_MODE && PROCESS_TYPE === "api") {
  console.log("[API] Loading production routes...");

  const rateLimit = require("express-rate-limit");
  const { requireApiKey } = require("./middleware/validate");

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      error: "Too many requests",
    },
  });

  app.use("/api/", limiter);

  app.use("/api/verify", requireApiKey, require("./routes/verify"));
  app.use("/api/url", requireApiKey, require("./routes/url"));
  app.use("/api/health", require("./routes/health"));
  app.use("/api/trending", require("./routes/trending"));
  app.use("/api/organization", require("./routes/organization"));
  app.use("/api/user", require("./routes/user"));
  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/pdf", requireApiKey, require("./routes/pdf"));
  app.use("/api/image", requireApiKey, require("./routes/image"));
  app.use("/api/video", requireApiKey, require("./routes/video"));
  app.use("/api/rag", require("./routes/rag"));

} else if (PROCESS_TYPE === "api") {
  console.log("[SAFE API] Minimal routes enabled");

  app.use("/api/auth", require("./routes/auth"));

  app.use("/api/health", (req, res) => {
    res.json({
      status: "safe",
    });
  });
}

/*
==================================================
404 HANDLER
==================================================
*/
app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.originalUrl}`);

  res.status(404).json({
    error: "Route not found",
    method: req.method,
    path: req.originalUrl,
  });
});

/*
==================================================
ERROR HANDLER
==================================================
*/
app.use((err, req, res, next) => {
  console.error("[EXPRESS ERROR]", err);

  res.status(500).json({
    error: err.message || "Internal server error",
  });
});

/*
==================================================
START SERVER
==================================================
*/
app.listen(PORT, () => {
  console.log(`\n🚀 VeriXa Backend running on port ${PORT}`);
  console.log(`🛡 SAFE_MODE: ${SAFE_MODE}`);
  console.log(`⚙️ PROCESS_TYPE: ${PROCESS_TYPE}\n`);
});

module.exports = app;