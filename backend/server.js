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
const multer = require("multer");
const pdfParseLib = require("pdf-parse");
const pdfParse = pdfParseLib.default || pdfParseLib;
const { askGroq } = require("./services/groq");

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const app = express();
const PORT = process.env.PORT || 5000;

const SAFE_MODE = process.env.SAFE_MODE === "true";
const PROCESS_TYPE = process.env.PROCESS_TYPE || "api";

const SAFE_DOCS = [];

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for SAFE_MODE
});

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
  console.log("⚠️ BACKEND RUNNING IN SAFE_MODE (In-Memory Document Store Active)");

  /*
  ==========================
  MOCK PDF INGEST -> IN-MEMORY
  ==========================
  */
  app.post("/api/pdf/ingest", upload.single("pdf"), async (req, res) => {
    console.log("[SAFE_MODE] Ingesting document...");
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const dataBuffer = fs.readFileSync(req.file.path);
      let extractedText = "";

      if (req.file.originalname.endsWith(".pdf")) {
        const data = await pdfParse(dataBuffer);
        extractedText = data.text;
      } else {
        extractedText = dataBuffer.toString("utf-8");
      }

      const documentId = `safe_doc_${Date.now()}`;
      const newDoc = {
        id: documentId,
        documentId: documentId,
        filename: req.file.originalname,
        text: extractedText,
        uploadedAt: new Date(),
        timestamp: new Date(), // For frontend compat
      };

      SAFE_DOCS.push(newDoc);
      console.log(`[SAFE_MODE] Document stored: ${req.file.originalname} (${extractedText.length} chars)`);

      // Clean up the uploaded file
      try { fs.unlinkSync(req.file.path); } catch (e) {}

      return res.status(202).json({
        success: true,
        accepted: true,
        mock: true,
        jobId: documentId,
        status: "completed",
        message: "Document indexed in-memory successfully.",
        mode: "SAFE_MODE",
      });
    } catch (err) {
      console.error("[SAFE_MODE] Ingest Error:", err);
      return res.status(500).json({ error: "Failed to process document in SAFE_MODE" });
    }
  });

  /*
  ==========================
  MOCK PDF STATUS
  ==========================
  */
  app.get("/api/pdf/status/:jobId", (req, res) => {
    const doc = SAFE_DOCS.find(d => d.id === req.params.jobId);
    
    return res.json({
      success: true,
      jobId: req.params.jobId,
      status: doc ? "completed" : "pending",
      progress: doc ? 100 : 0,
      completed: !!doc,
      mock: true,
      mode: "SAFE_MODE",
      result: doc ? {
        documentId: doc.id,
        filename: doc.filename
      } : null
    });
  });

  /*
  ==========================
  MOCK PDF SUMMARY / ANALYSIS
  ==========================
  */
  app.post("/api/pdf/summary", (req, res) => {
    const doc = SAFE_DOCS.find(d => d.id === req.body.documentId);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    
    return res.json({
      objective: "Extracted objective from " + doc.filename,
      novelty: "Synthetic summary generated for SAFE_MODE demo.",
      findings: "This document contains " + doc.text.length + " characters of text.",
      impact: "High impact research artifact."
    });
  });

  /*
  ==========================
  MOCK RAG QUERY -> GROUNDED
  ==========================
  */
  app.post("/api/rag/query", async (req, res) => {
    const { query, documentId } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });

    console.log(`[SAFE_MODE] Grounded query: "${query}" (Doc: ${documentId || 'All'})`);

    try {
      let context = "";
      let sourceDocs = [];

      if (documentId) {
        const doc = SAFE_DOCS.find(d => d.id === documentId);
        if (doc) {
          context = doc.text.slice(0, 8000);
          sourceDocs = [doc];
        }
      } else {
        context = SAFE_DOCS.map(d => `[Source: ${d.filename}]: ${d.text.slice(0, 3000)}`).join("\n\n");
        sourceDocs = SAFE_DOCS;
      }

      if (!context) {
        return res.json({
          answer: "I don't have any documents indexed to answer that question.",
          sources: [],
          results: []
        });
      }

      const prompt = `You are VeriXa Intelligence (SAFE_MODE). Answer the query based ONLY on the provided context from uploaded documents.
      
      QUERY: "${query}"
      
      CONTEXT:
      ${context}
      
      RULES:
      - Be precise and academic. 
      - If the context doesn't contain the answer, state that clearly.
      - Return JSON: { "answer": "...", "confidence_score": 0-100 }`;

      const rawAnswer = await askGroq(prompt, true, "llama-3.1-8b-instant");
      const data = JSON.parse(rawAnswer);

      // Create rich sources for both UI views
      const sources = sourceDocs.map((doc, i) => ({
        id: i + 1,
        text: doc.text.slice(0, 500),
        score: 0.95,
        metadata: { 
          filename: doc.filename, 
          source: doc.filename,
          page: "N/A" 
        }
      }));

      return res.json({
        ...data,
        sources,
        results: sources, // For DashboardPage
        original_sources: sources, // For ResearchWorkspace
        mock: true,
        mode: "SAFE_MODE"
      });
    } catch (err) {
      console.error("[SAFE_MODE] Query Error:", err);
      return res.status(500).json({ error: "Failed to process grounded query" });
    }
  });

  /*
  ==========================
  MOCK RAG DOCS -> RETURN SAFE_DOCS
  ==========================
  */
  app.get("/api/rag/documents", (req, res) => {
    return res.json({
      success: true,
      mock: true,
      documents: SAFE_DOCS.map(d => ({
        id: d.id,
        documentId: d.id,
        filename: d.filename,
        uploadedAt: d.uploadedAt,
        timestamp: d.timestamp // For frontend compat
      })),
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