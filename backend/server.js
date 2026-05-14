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
const pdfParseModule = require("pdf-parse");

const pdfParse =
  typeof pdfParseModule === "function"
    ? pdfParseModule
    : pdfParseModule.default;

if (typeof pdfParse !== "function") {
  console.error("CRITICAL: pdfParse failed to initialize", { 
    moduleType: typeof pdfParseModule,
    hasDefault: !!pdfParseModule?.default 
  });
}

const { askGroq } = require("./services/groq");

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const app = express();
const PORT = process.env.PORT || 5000;

const SAFE_MODE = process.env.SAFE_MODE === "true";
const PROCESS_TYPE = process.env.PROCESS_TYPE || "api";

const SAFE_DOCS = [];
const SAFE_CHUNKS = []; // In-memory vector store for SAFE_MODE
const INGESTION_STATUS = {}; // Track async processing { id: { status, total, current } }

let extractor = null;
async function getExtractor() {
  if (!extractor) {
    console.log("[SAFE_MODE] Loading embedding model (all-MiniLM-L6-v2)...");
    const start = Date.now();
    const { pipeline } = await import("@xenova/transformers");
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log(`[SAFE_MODE] Model loaded in ${Date.now() - start}ms`);
  }
  return extractor;
}

function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    mA += a[i] * a[i];
    mB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(mA) * Math.sqrt(mB));
}

function semanticChunking(text, filename, options = { size: 700, overlap: 100 }) {
  const chunks = [];
  let chunkIndex = 1;

  // Split into sections
  const sections = text.split(/\n(?=[A-Z0-9\s\.]{5,20}\n)/);
  
  for (const section of sections) {
    let sectionStart = 0;
    const sectionTitle = section.split('\n')[0].slice(0, 50).trim();
    
    while (sectionStart < section.length) {
      if (chunks.length >= 20) break; // Limit for FREE tier stability

      let end = sectionStart + options.size;
      let chunkText = section.slice(sectionStart, end);
      
      let breakPoint = chunkText.lastIndexOf('\n');
      if (breakPoint < options.size * 0.5) breakPoint = chunkText.lastIndexOf('. ');
      if (breakPoint < options.size * 0.5) breakPoint = chunkText.length;
      
      chunks.push({
        id: `${filename}-ch-${chunkIndex++}`,
        filename,
        section: sectionTitle || "General",
        text: section.slice(sectionStart, sectionStart + breakPoint).trim(),
        metadata: {
          page: Math.floor(sectionStart / 2500) + 1,
          length: breakPoint
        }
      });
      
      sectionStart += (breakPoint - options.overlap > 0) ? (breakPoint - options.overlap) : breakPoint;
    }
    if (chunks.length >= 20) break;
  }
  return chunks;
}

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
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });    try {
      const dataBuffer = fs.readFileSync(req.file.path);
      let extractedText = "";

      if (req.file.originalname.toLowerCase().endsWith(".pdf")) {
        const parsed = await pdfParse(dataBuffer);
        extractedText = parsed.text;
      } else {
        extractedText = dataBuffer.toString("utf-8");
      }

      // Cleanup buffer immediately
      try { fs.unlinkSync(req.file.path); } catch (e) {}

      const docId = Date.now().toString();
      const docObj = {
        id: docId,
        filename: req.file.originalname,
        text: extractedText,
        uploadedAt: new Date().toISOString(),
      };

      SAFE_DOCS.push(docObj);
      INGESTION_STATUS[docId] = { status: "processing", totalChunks: 0, chunksEmbedded: 0 };

      // START ASYNC PROCESSING (Non-blocking)
      (async () => {
        try {
          console.log(`[SAFE_MODE] Async Chunking ${req.file.originalname}...`);
          const chunks = semanticChunking(extractedText, req.file.originalname);
          INGESTION_STATUS[docId].totalChunks = chunks.length;

          const embed = await getExtractor();
          const startEmbed = Date.now();

          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            try {
              const output = await embed(chunk.text, { pooling: 'mean', normalize: true });
              chunk.embedding = Array.from(output.data);
              SAFE_CHUNKS.push(chunk);
            } catch (embedErr) {
              console.error(`[SAFE_MODE] Embedding failed for chunk ${i}, skipping semantic support for this segment.`);
            }
            INGESTION_STATUS[docId].chunksEmbedded = i + 1;
          }

          INGESTION_STATUS[docId].status = "completed";
          console.log(`[SAFE_MODE] Async Ingestion completed in ${Date.now() - startEmbed}ms for ${chunks.length} chunks.`);
        } catch (err) {
          console.error("[SAFE_MODE] Async Ingestion Error:", err);
          INGESTION_STATUS[docId].status = "failed";
        }
      })();

      return res.json({
        success: true,
        documentId: docId,
        message: "Upload successful, processing in background.",
        mode: "SAFE_MODE"
      });

    } catch (err) {
      console.error("[SAFE_MODE] Ingest Error:", err);
      return res.status(500).json({ error: "Failed to extract document text" });
    }
  });

  app.get("/api/pdf/status/:id", (req, res) => {
    const status = INGESTION_STATUS[req.params.id];
    if (!status) return res.status(404).json({ error: "Not found" });
    return res.json(status);
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

    console.log(`[SAFE_MODE] Semantic Research query: "${query}"`);

    try {
      if (SAFE_CHUNKS.length === 0) {
        return res.json({
          answer: "No documents have been learned yet. Please upload a PDF first.",
          sources: []
        });
      }

      // 1. Embed query
      const embed = await getExtractor();
      const queryOutput = await embed(query, { pooling: 'mean', normalize: true });
      const queryEmbedding = Array.from(queryOutput.data);
      const queryTerms = query.toLowerCase().split(/\W+/).filter(t => t.length > 3);

      // 2. Hybrid Semantic + Keyword Search
      const scoredChunks = SAFE_CHUNKS.map(chunk => {
        const semanticScore = cosineSimilarity(queryEmbedding, chunk.embedding);
        
        // Keyword overlap
        const chunkTextLower = chunk.text.toLowerCase();
        let keywordHits = 0;
        queryTerms.forEach(term => {
          if (chunkTextLower.includes(term)) keywordHits++;
        });
        const keywordScore = queryTerms.length > 0 ? (keywordHits / queryTerms.length) : 0;
        
        // Hybrid score (70% semantic, 30% keyword)
        const finalScore = (semanticScore * 0.7) + (keywordScore * 0.3);
        
        return { ...chunk, score: finalScore, semanticScore, keywordScore };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); 

      // 3. Evidence Thresholding
      const topScore = scoredChunks[0]?.score || 0;
      console.log(`[SAFE_MODE] Query: "${query}" | Top Hybrid Score: ${topScore.toFixed(3)}`);
      
      if (topScore < 0.35) { // Threshold for "no evidence"
        console.warn(`[SAFE_MODE] Low confidence retrieval for "${query}". Denying grounding.`);
        return res.json({
          answer: `I could not find any evidence or specific mention regarding **"${query}"** in the provided document segments. My retrieval engine returned low-confidence matches that do not meet the integrity threshold for a grounded response.`,
          confidence: 0,
          sources: [],
          found_evidence: false
        });
      }

      // 4. Build Context & Prompt
      const context = scoredChunks.map(c => 
        `[CHUNK ID: ${c.id}] [SOURCE: ${c.filename}, Page ${c.metadata.page}, Section: ${c.section}]\nTEXT: ${c.text}`
      ).join("\n\n---\n\n");

      const prompt = `You are the VeriXa Research Integrity Agent. Your task is to provide a surgical, evidence-backed analysis based ONLY on the provided document segments.

DOCUMENT SEGMENTS:
${context}

QUERY: "${query}"

STRICT INTEGRITY RULES:
- If the segments do NOT discuss the query (e.g. question is about "quantum" but text is about "transformers"), you MUST state: "No evidence found regarding [query] in the analyzed segments."
- DO NOT provide a general summary of the paper if it does not answer the specific question.
- DO NOT hallucinate or infer claims not explicitly stated.
- CITE exact [CHUNK ID] for every factual statement.
- Use structured markdown for the answer.

JSON RESPONSE FORMAT:
{
  "answer": "Your grounded analysis in markdown",
  "confidence": 0.95,
  "found_evidence": true
}`;

      const rawAnswer = await askGroq(prompt, true, "llama-3.1-8b-instant");
      const data = JSON.parse(rawAnswer);

      // 5. Telemetry & Formatting
      console.log(`[SAFE_MODE] Response generated. Confidence: ${data.confidence}. Evidence: ${data.found_evidence}`);
      const sources = scoredChunks.map(c => ({
        id: c.id,
        text: c.text,
        score: c.score,
        metadata: {
          source: c.filename,
          page: c.metadata.page,
          section: c.section
        }
      }));

      return res.json({
        ...data,
        sources,
        results: sources,
        mode: "SAFE_MODE_HYBRID_INTEGRITY"
      });
    } catch (err) {
      console.error("[SAFE_MODE] Research Query Error:", err);
      return res.status(500).json({ error: "Failed to process research query" });
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