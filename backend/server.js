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

app.use(
  express.json({
    limit: "50mb",
  })
);

app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
  })
);

/*
==================================================
SAFE MODE MOCK ROUTES
==================================================
*/
if (SAFE_MODE) {
  console.log("⚠️ BACKEND RUNNING IN SAFE_MODE");

  /*
  ==========================
  MOCK PDF INGEST
  ==========================
  */
  app.post("/api/pdf/ingest", (req, res) => {
    console.log("[SAFE_MODE] Mock ingest hit");

    return res.status(202).json({
      success: true,
      accepted: true,
      mock: true,
      queued: true,

      jobId: "safe_job",

      status: "queued",
      state: "queued",

      progress: 5,

      message: "Document queued successfully.",

      mode: "SAFE_MODE",
    });
  });

  /*
  ==========================
  MOCK PDF STATUS
  ==========================
  */
  app.get("/api/pdf/status/:jobId", (req, res) => {
    console.log(
      `[SAFE_MODE] Status requested for ${req.params.jobId}`
    );

    return res.json({
      success: true,

      jobId: req.params.jobId,

      status: "completed",
      state: "completed",

      progress: 100,

      completed: true,

      mock: true,
      mode: "SAFE_MODE",

      stage: "completed",

      result: {
        text: "SAFE_MODE mock extraction completed successfully.",
      },

      extractedText:
        "SAFE_MODE mock extraction completed successfully.",
    });
  });

  /*
  ==========================
  MOCK RAG QUERY
  ==========================
  */
  app.post("/api/rag/query", (req, res) => {
    console.log("[SAFE_MODE] Mock RAG query hit");
    return res.json({
      answer: "This is a synthetic intelligence response generated in SAFE_MODE. In a production environment, this would be grounded in your indexed documents using vector embeddings and the VeriXa RAG engine.",
      confidence_score: 95,
      grounding_sources: [
        { id: 1, page: 1, relevance: "High" },
        { id: 2, page: 4, relevance: "Medium" }
      ],
      sources: [
        { id: 1, text: "Verification of synthetic media requires multi-stage analysis of noise patterns and frequency domain anomalies.", metadata: { page: 1 } },
        { id: 2, text: "Deepfake detection models often struggle with high-frequency components in compressed video streams.", metadata: { page: 4 } }
      ],
      original_sources: [
        { id: 1, text: "Verification of synthetic media requires multi-stage analysis of noise patterns and frequency domain anomalies.", metadata: { page: 1 } },
        { id: 2, text: "Deepfake detection models often struggle with high-frequency components in compressed video streams.", metadata: { page: 4 } }
      ],
      mock: true,
      mode: "SAFE_MODE"
    });
  });

  /*
  ==========================
  MOCK RAG DOCS
  ==========================
  */
  app.get("/api/rag/documents", (req, res) => {
    return res.json({
      success: true,
      mock: true,
      documents: [],
      mode: "SAFE_MODE",
    });
  });
  /*
  ==========================
  MOCK ORGANIZATION
  ==========================
  */
  app.get("/api/organization/:orgId/members", (req, res) => {
    return res.json({
      success: true,
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
if (PROCESS_TYPE === "api") {
  const { requireApiKey } = require("./middleware/validate");

  // Mount RAG routes always, so they are available even if some other features are limited
  app.use("/api/rag", require("./routes/rag"));

  if (!SAFE_MODE) {
    console.log("[API] Loading production routes...");

    const rateLimit = require("express-rate-limit");

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
  } else {
    console.log("[SAFE API] Minimal routes enabled");

    app.use("/api/auth", require("./routes/auth"));

    app.use("/api/health", (req, res) => {
      res.json({
        status: "safe",
      });
    });
  }
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