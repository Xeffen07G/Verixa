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

const pdfParse = (function() {
  if (typeof pdfParseModule === "function") return pdfParseModule;
  if (pdfParseModule && typeof pdfParseModule.PDFParse === "function") return pdfParseModule.PDFParse;
  if (pdfParseModule && typeof pdfParseModule.default === "function") return pdfParseModule.default;
  return null;
})();

if (!pdfParse) {
  console.error("CRITICAL: pdfParse failed to initialize. Ingestion will be disabled.", { 
    moduleType: typeof pdfParseModule,
    keys: pdfParseModule ? Object.keys(pdfParseModule) : []
  });
}

const { askGroq } = require("./services/groq");
const { readStore, writeStore } = require("./utils/store");

// --- INVESTIGATION INTELLIGENCE (PHASE 1) ---
const investigationManager = require("./services/investigationService");

// --- PROMPT VERSIONING (PHASE 2) ---
const RESEARCH_PROMPTS = require("./prompts/researchPrompts");
const CONTRADICTION_PROMPTS = require("./prompts/contradictionPrompts");
const VERIFICATION_PROMPTS = require("./prompts/verificationPrompts");
const EXPORT_PROMPTS = require("./prompts/exportPrompts");

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const app = express();
const PORT = process.env.PORT || 5000;

const SAFE_MODE = process.env.SAFE_MODE === "true";
const PROCESS_TYPE = process.env.PROCESS_TYPE || "api";

// --- DEPLOYMENT RECOVERY FLAGS ---
const ENABLE_CONTRADICTIONS = process.env.ENABLE_CONTRADICTIONS !== "false";
const ENABLE_TELEMETRY = process.env.ENABLE_TELEMETRY !== "false";
const ENABLE_EVALS = process.env.ENABLE_EVALS !== "false";

console.log(`[STABILITY] Feature Flags: CONTRADICTIONS=${ENABLE_CONTRADICTIONS}, TELEMETRY=${ENABLE_TELEMETRY}, EVALS=${ENABLE_EVALS}`);

// Initialize Store
let STORE = readStore();

// --- RESOURCE LIMITS (SAFE_MODE) ---
const MAX_CHUNKS_PER_DOC = 15;
const MAX_CONCURRENT_JOBS = 2;
const MAX_FILE_SIZE_MB = 10;
const MEMORY_THRESHOLD_MB = 450; // Render free tier limit is 512MB
let activeEmbeddingJobs = 0;

const SAFE_DOCS = STORE.papers || [];
const SAFE_CHUNKS = []; // In-memory vector store for SAFE_MODE performance
const INGESTION_STATUS = {}; // Track async processing
const CONVERSATION_SESSIONS = STORE.sessions || {}; // { sessionId: { history: [], lastActive } }

// Sync store every 2 minutes
setInterval(() => {
  STORE.sessions = CONVERSATION_SESSIONS;
  STORE.papers = SAFE_DOCS;
  writeStore(STORE);
}, 2 * 60 * 1000);

// Session Cleanup (30 mins)
setInterval(() => {
  const now = Date.now();
  let changed = false;
  Object.keys(CONVERSATION_SESSIONS).forEach(id => {
    if (now - CONVERSATION_SESSIONS[id].lastActive > 30 * 60 * 1000) {
      delete CONVERSATION_SESSIONS[id];
      changed = true;
    }
  });
  if (changed) {
    STORE.sessions = CONVERSATION_SESSIONS;
    writeStore(STORE);
  }
}, 5 * 60 * 1000);

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
    const globalStart = Date.now();
    const docId = Date.now().toString();
    console.log(`[INGEST] Request received: ${docId}`);

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // --- DEDUPLICATION CHECK (filename + content hash) ---
    const existingByName = SAFE_DOCS.find(d => d.filename === req.file.originalname && d.status !== 'FAILED_EXTRACT' && d.status !== 'FAILED_SIZE');
    if (existingByName) {
      console.log(`[INGEST] Duplicate filename detected: ${req.file.originalname} (id: ${existingByName.id}). Skipping.`);
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.json({
        success: true,
        docId: existingByName.id,
        status: existingByName.status,
        message: "Document already indexed.",
        duplicate: true,
        telemetry: existingByName.telemetry
      });
    }

    // Initial State: UPLOADING (already done by multer, but we mark it)
    const docObj = {
      id: docId,
      filename: req.file.originalname,
      uploadedAt: new Date().toISOString(),
      status: "UPLOADING",
      telemetry: { extraction_time: 0, chunking_time: 0, embedding_time: 0, total_background_time: 0 }
    };
    SAFE_DOCS.push(docObj);

    // Limit Check: File Size
    const fileSizeMB = req.file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      docObj.status = "FAILED_SIZE";
      return res.status(400).json({ error: `File too large (${fileSizeMB.toFixed(1)}MB). Max allowed is ${MAX_FILE_SIZE_MB}MB.` });
    }

    try {
      // --- STAGE 1: FAST INGESTION ---
      docObj.status = "EXTRACTING";
      const extractStart = Date.now();
      const dataBuffer = fs.readFileSync(req.file.path);
      const parsed = await pdfParse(dataBuffer);
      const extractedText = parsed.text;
      docObj.text = extractedText;
      docObj.telemetry.extraction_time = Date.now() - extractStart;

      // --- Content-hash deduplication (catches renamed duplicates) ---
      const contentFingerprint = extractedText.slice(0, 500).replace(/\s+/g, '').toLowerCase();
      const existingByContent = SAFE_DOCS.find(d => d.id !== docId && d.contentFingerprint === contentFingerprint && d.status !== 'FAILED_EXTRACT');
      if (existingByContent) {
        console.log(`[INGEST] Content duplicate detected: "${req.file.originalname}" matches existing doc "${existingByContent.filename}" (id: ${existingByContent.id})`);
        SAFE_DOCS.splice(SAFE_DOCS.indexOf(docObj), 1); // Remove the placeholder
        try { fs.unlinkSync(req.file.path); } catch (e) {}
        return res.json({ success: true, docId: existingByContent.id, status: existingByContent.status, message: "Document content already indexed (duplicate detected by content hash).", duplicate: true, telemetry: existingByContent.telemetry });
      }
      docObj.contentFingerprint = contentFingerprint;

      docObj.status = "INDEXING";
      const chunkStart = Date.now();
      let chunks = semanticChunking(extractedText, req.file.originalname);
      if (chunks.length > MAX_CHUNKS_PER_DOC) chunks = chunks.slice(0, MAX_CHUNKS_PER_DOC);
      
      chunks.forEach(c => {
        c.docId = docId;
        c.status = 'basic';
        SAFE_CHUNKS.push(c);
      });
      docObj.telemetry.chunking_time = Date.now() - chunkStart;

      docObj.status = "READY_BASIC";
      
      // Cleanup local file
      try { fs.unlinkSync(req.file.path); } catch (e) {}

      // --- STAGE 2: BACKGROUND ENHANCEMENT ---
      (async () => {
        if (activeEmbeddingJobs >= MAX_CONCURRENT_JOBS || (process.memoryUsage().heapUsed / 1024 / 1024) > MEMORY_THRESHOLD_MB) {
          docObj.status = "READY_BASIC"; // Stay at basic if resources low
          return;
        }

        activeEmbeddingJobs++;
        docObj.status = "ENHANCING";
        const embedStart = Date.now();
        try {
          const docChunks = SAFE_CHUNKS.filter(c => c.docId === docId);
          const embedder = await getExtractor();
          
          const chunksToEmbed = docChunks.slice(0, 15); // Hard limit 15 chunks for embeddings
          for (let i = 0; i < chunksToEmbed.length; i++) {
            try {
              const output = await embedder(chunksToEmbed[i].text, { pooling: 'mean', normalize: true });
              chunksToEmbed[i].embedding = Array.from(output.data);
              chunksToEmbed[i].status = 'semantic';
            } catch (e) {
              console.warn(`[ENHANCING] Chunk ${i} failed:`, e.message);
            }
          }

          docObj.status = "READY_SEMANTIC";
          docObj.telemetry.embedding_time = Date.now() - embedStart;
          docObj.telemetry.total_background_time = Date.now() - globalStart;
        } catch (err) {
          console.error(`[ENHANCING] Fatal error for ${docId}:`, err);
          docObj.status = "READY_BASIC"; // Fallback to basic
        } finally {
          activeEmbeddingJobs--;
          if (global.gc) global.gc();
        }
      })();

      return res.json({
        success: true,
        docId,
        status: "READY_BASIC",
        message: "Stage 1 complete. Document queryable.",
        telemetry: docObj.telemetry
      });

    } catch (err) {
      console.error("[INGEST] Stage 1 Failure:", err);
      docObj.status = "FAILED_EXTRACT";
      return res.status(500).json({ error: "Document processing failed." });
    }
  });

  app.get("/api/pdf/status/:id", (req, res) => {
    const doc = SAFE_DOCS.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    
    // Map SAFE_MODE statuses to frontend expected statuses
    const statusMap = {
      "READY_BASIC": "completed",
      "READY_SEMANTIC": "completed",
      "EXTRACTING": "processing",
      "INDEXING": "processing",
      "ENHANCING": "processing",
      "FAILED_EXTRACT": "failed",
      "FAILED_SIZE": "failed",
      "UPLOADING": "processing"
    };

    const status = statusMap[doc.status] || doc.status.toLowerCase();

    return res.json({
      success: true,
      id: doc.id,
      status: status,
      progress: status === "completed" ? 100 : (status === "failed" ? 0 : 50),
      result: status === "completed" ? { text: doc.text } : null,
      telemetry: doc.telemetry
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
  FORENSIC EVALUATION SYSTEM (PHASE 1)
  ==========================
  */
  app.get("/api/admin/evals/run", async (req, res) => {
    try {
      const { runBenchmarks } = require("./internal/evals/runner");
      const results = await runBenchmarks(handleRagQueryInternal);
      return res.json({ success: true, ...results });
    } catch (err) {
      console.error("[EVAL] Runner failed:", err);
      return res.status(500).json({ error: "Evaluation runner failed." });
    }
  });

  /*
  ==========================
  INVESTIGATION OS API (PHASE 1-5)
  ==========================
  */
  app.get('/api/investigation/:sessionId', (req, res) => {
    const pkg = investigationManager.getSessionPackage(req.params.sessionId);
    res.json(pkg);
  });

  app.post('/api/investigation/:sessionId/event', (req, res) => {
    const { type, description, metadata } = req.body;
    investigationManager.logEvent(req.params.sessionId, type, description, metadata);
    res.json({ success: true });
  });

  app.get('/api/investigation/active', (req, res) => {
    res.json(Object.keys(investigationManager.sessions));
  });

  /*
  ==========================
  ADMIN TELEMETRY (PHASE 3)
  ==========================
  */
  app.get("/api/admin/telemetry", (req, res) => {
    return res.json({
      success: true,
      timestamp: Date.now(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + "MB",
        threshold: MEMORY_THRESHOLD_MB + "MB"
      },
      sessions: Object.keys(CONVERSATION_SESSIONS).length,
      activeJobs: activeEmbeddingJobs,
      vaultSize: SAFE_DOCS.length,
      chunkCount: SAFE_CHUNKS.length
    });
  });

  /*
  ==========================
  RESEARCH INTELLIGENCE ENGINE (PHASE 2, 4, 5, 7, 9)
  ==========================
  */
  /**
   * Intent Classification Layer
   * Three-tier routing: SYNTHESIS / EXPLORATORY / FACTUAL
   * SYNTHESIS: broad overview or summary questions.
   * EXPLORATORY: thematic, relational, or topical questions.
   * FACTUAL: specific data points, statistics, citation lookups.
   */
  function classifyQueryIntent(query) {
    const q = query.toLowerCase().trim();

    // --- SYNTHESIS: direct summary / overview requests ---
    const synthesisPatterns = [
      "summarize", "summary", "overview", "what is this about",
      "what is this paper about", "what is this research about",
      "what does the paper say", "what does this paper",
      "what does the study", "what does this study",
      "what does this research", "explain this paper",
      "explain this research", "explain this study",
      "tell me about this", "describe this",
      "main findings", "key findings", "findings",
      "methodology", "methods used", "what method",
      "contribution", "contributions",
      "conclusion", "conclusions",
      "abstract", "introduction",
      "limitations", "limitation",
      "results", "discussion",
      "what are the", "what were the",
      "what is the", "what was the",
      "overview of", "break down", "breakdown",
      "general idea", "main point", "main idea",
      "tldr", "tl;dr", "in short", "briefly"
    ];
    if (synthesisPatterns.some(p => q.includes(p))) return "SYNTHESIS";

    // --- EXPLORATORY: thematic, relational, topical queries ---
    const exploratoryPatterns = [
      "does this talk about", "does it talk about",
      "does this discuss", "does it discuss",
      "does this mention", "does it mention",
      "does this cover", "does it cover",
      "does this address", "does it address",
      "does this relate", "is this related",
      "is this about", "is it about",
      "is there anything about", "is there mention of",
      "what does this say about", "what does it say about",
      "how does the paper describe", "how does this describe",
      "how does the paper explain", "how does this explain",
      "what themes", "what topics",
      "what concepts", "what ideas",
      "what does the paper focus", "what does this focus",
      "what is discussed", "what is covered",
      "talk about", "focus on", "deal with",
      "related to", "relevant to", "connection to",
      "touch on", "touches on", "speaks to"
    ];
    if (exploratoryPatterns.some(p => q.includes(p))) return "EXPLORATORY";

    // --- FACTUAL: specific data points, statistics, citations ---
    const factualPatterns = [
      "what accuracy", "what percentage", "what number",
      "how many", "how much",
      "contradict", "disagree",
      "p-value", "p value", "confidence interval",
      "specifically", "exactly",
      "cite", "citation", "reference",
      "true or false", "yes or no",
      "what was the score", "what was the rate"
    ];
    if (factualPatterns.some(p => q.includes(p))) return "FACTUAL";

    // Short ambiguous queries (< 6 words) lean synthesis
    const wordCount = q.split(/\s+/).length;
    if (wordCount < 6) return "SYNTHESIS";

    // Default: EXPLORATORY (safer than FACTUAL — avoids false refusals)
    return "EXPLORATORY";
  }

  /*
  ==========================
  RESEARCH INTELLIGENCE ENGINE (PHASE 2, 4, 5, 7, 9)
  ==========================
  */
  async function handleRagQueryInternal(req, res) {
    const { query, sessionId = "default", mode = "Deep Analysis" } = req.body;
    if (!query) {
      if (res.status) return res.status(400).json({ error: "Query required" });
      return { error: "Query required" };
    }

    const intent = classifyQueryIntent(query);
    const threshold = intent === "SYNTHESIS" ? 0.20 : intent === "EXPLORATORY" ? 0.30 : 0.40;

    if ((process.memoryUsage().heapUsed / 1024 / 1024) > MEMORY_THRESHOLD_MB) {
      console.warn("[RAG] High memory detected. Forcing keyword-only mode.");
    }

    try {
      if (!CONVERSATION_SESSIONS[sessionId]) {
        CONVERSATION_SESSIONS[sessionId] = { history: [], lastActive: Date.now() };
      }
      const session = CONVERSATION_SESSIONS[sessionId];
      session.lastActive = Date.now();

      if (SAFE_CHUNKS.length === 0) {
        const refusal = { answer: "Vault empty.", sources: [] };
        if (res.json) return res.json(refusal);
        return refusal;
      }

      const queryTerms = query.toLowerCase().split(' ').filter(t => t.length > 3);
      const extractor = await getExtractor();
      
      let queryVector = null;
      try {
        const queryEmbedding = await extractor(query, { pooling: 'mean', normalize: true });
        queryVector = Array.from(queryEmbedding.data);
      } catch (e) {
        console.warn("[RAG] Vectorization failed.");
      }

      // --- PHASE 2: Tiered section boosts & scoring ---
      const SECTION_BOOSTS = {
        'abstract': 0.25, 'summary': 0.20, 'conclusion': 0.20, 'conclusions': 0.20,
        'introduction': 0.15, 'results': 0.15, 'discussion': 0.12,
        'methods': 0.10, 'methodology': 0.10, 'general': 0.0
      };

      const scoredChunks = SAFE_CHUNKS.map(chunk => {
        let semanticScore = 0;
        if (queryVector && chunk.embedding) {
          for (let i = 0; i < queryVector.length; i++) {
            semanticScore += queryVector[i] * chunk.embedding[i];
          }
        }
        
        let keywordHits = 0;
        queryTerms.forEach(term => {
          if (chunk.text.toLowerCase().includes(term)) keywordHits++;
        });
        
        const keywordScore = keywordHits / (queryTerms.length || 1);
        
        // Section-aware structural boost (for SYNTHESIS and EXPLORATORY)
        let structuralBoost = 0;
        if (intent === "SYNTHESIS" || intent === "EXPLORATORY") {
          const boostMultiplier = intent === "SYNTHESIS" ? 1.0 : 0.7;
          // Check chunk.section metadata first (set during chunking)
          const sectionKey = (chunk.section || '').toLowerCase().trim();
          for (const [pattern, boost] of Object.entries(SECTION_BOOSTS)) {
            if (sectionKey.includes(pattern)) { structuralBoost = boost * boostMultiplier; break; }
          }
          // Fallback: check chunk text content for section keywords
          if (structuralBoost === 0) {
            const textLower = chunk.text.toLowerCase();
            for (const [pattern, boost] of Object.entries(SECTION_BOOSTS)) {
              if (textLower.includes(pattern)) { structuralBoost = boost * 0.6 * boostMultiplier; break; }
            }
          }
        }

        // Adaptive weighting by intent
        const semWeight = intent === "FACTUAL" ? 0.7 : 0.6;
        const kwWeight = intent === "FACTUAL" ? 0.3 : 0.4;
        const hybridScore = (semanticScore * semWeight) + (keywordScore * kwWeight) + structuralBoost;
        return { ...chunk, score: hybridScore, semanticScore, keywordScore, structuralBoost };
      })
      .sort((a, b) => b.score - a.score);

      // Apply threshold filter
      let filteredChunks = scoredChunks.filter(c => c.score > threshold).slice(0, 5);

      // --- Fallback: prevent false refusals for non-FACTUAL intents ---
      let fallbackTriggered = false;
      if (filteredChunks.length === 0 && intent !== "FACTUAL" && SAFE_CHUNKS.length > 0) {
        // SYNTHESIS or EXPLORATORY with docs in vault: take top 5 regardless
        console.log(`[RAG][FALLBACK] ${intent} fallback triggered for: "${query}" (best score: ${scoredChunks[0]?.score?.toFixed(3) || 0})`);
        filteredChunks = scoredChunks.slice(0, 5);
        fallbackTriggered = true;
      } else if (filteredChunks.length === 0 && intent === "FACTUAL" && SAFE_CHUNKS.length > 0) {
        // Even for FACTUAL: if best score > 0.15, use limited fallback instead of refusing
        const bestScore = scoredChunks[0]?.score || 0;
        if (bestScore > 0.15) {
          console.log(`[RAG][FALLBACK] FACTUAL soft-fallback triggered (best=${bestScore.toFixed(3)}) for: "${query}"`);
          filteredChunks = scoredChunks.slice(0, 3);
          fallbackTriggered = true;
        }
      }

      const topScore = filteredChunks.length > 0 ? filteredChunks[0].score : 0;
      let confidenceLabel;
      if (filteredChunks.length === 0) {
        confidenceLabel = "NONE";
      } else if (fallbackTriggered) {
        confidenceLabel = "LIMITED";
      } else {
        confidenceLabel = topScore > 0.7 ? "HIGH" : topScore > 0.4 ? "MEDIUM" : "LOW";
      }

      // --- Retrieval telemetry ---
      if (ENABLE_TELEMETRY) {
        console.log("[RAG][TELEMETRY] ===== QUERY LIFECYCLE =====");
        console.log("  STEP 1 detected_intent: " + intent);
        console.log("  STEP 2 threshold_used: " + threshold);
        console.log("  STEP 3 total_chunks_available: " + SAFE_CHUNKS.length);
        console.log("  STEP 4 top_5_scores: [" + scoredChunks.slice(0, 5).map(function(c) { return c.score.toFixed(3); }).join(", ") + "]");
        console.log("  STEP 5 section_boosts: [" + scoredChunks.slice(0, 5).map(function(c) { return (c.section || "?") + ":" + c.structuralBoost; }).join(", ") + "]");
        console.log("  STEP 6 chunks_passed_threshold: " + scoredChunks.filter(function(c) { return c.score > threshold; }).length);
        console.log("  STEP 7 fallback_triggered: " + fallbackTriggered);
        console.log("  STEP 8 confidence_label: " + confidenceLabel);
        console.log("  STEP 9 response_path: " + (confidenceLabel === "NONE" ? "REFUSAL" : fallbackTriggered ? "FALLBACK_SYNTHESIS" : intent === "SYNTHESIS" ? "SYNTHESIS_RESPONSE" : "GROUNDED_RESPONSE"));
        console.log("  query: " + JSON.stringify(query));
        console.log("[RAG][TELEMETRY] =========================");
      }


      // ONLY refuse when vault is truly empty OR strict factual with zero relevance
      if (confidenceLabel === "NONE") {
        const refusal = { answer: "No forensic evidence found in the vault for this query. Try ingesting a document first.", confidence: 0, confidenceLabel: "NO EVIDENCE", sources: [], intent };
        if (res.json) return res.json(refusal);
        return refusal;
      }

      // Replace scoredChunks with the filtered set for downstream
      const finalChunks = filteredChunks;

      const enrichedSources = finalChunks.map((s, i) => ({
        ...s,
        credibilityScore: s.filename.toLowerCase().includes(".pdf") ? 0.95 : 0.7,
        sourceType: s.filename.toLowerCase().includes(".pdf") ? "Peer-Reviewed Paper" : "Internal Artifact",
        trustRationale: fallbackTriggered ? "Limited synthesis — broad thematic match." : "Grounded."
      }));

      let contradictionReport = { hasContradiction: false, contradictions: [], explanation: "Forensic reasoning disabled via flag." };
      if (ENABLE_CONTRADICTIONS) {
        try {
          const { analyzeContradictions } = require("./services/contradictionService");
          contradictionReport = await analyzeContradictions(enrichedSources, query);
        } catch (err) {
          console.error("[RAG] Contradiction engine failed:", err.message);
        }
      }

      let systemPrompt = "";
      if (intent === "SYNTHESIS" || intent === "EXPLORATORY") {
        const evidenceLedger = enrichedSources.map(function(s, i) { return '[Source ' + (i+1) + '] Paper: ' + s.filename + '\nEvidence: "' + s.text + '"'; }).join('\n\n');
        systemPrompt = RESEARCH_PROMPTS.v2_synthesis.system(evidenceLedger, query);
      } else {
        const modePrompts = {
          "Scholar": "Academic explanation.",
          "Skeptic": "Challenge claims.",
          "Contradiction Hunter": "Disagreements.",
          "Deep Analysis": "Standard grounded response."
        };
        const modeInstruction = modePrompts[mode] || modePrompts["Deep Analysis"];
        const evidenceLedger = enrichedSources.map(function(s, i) { return '[Source ' + (i+1) + '] Paper: ' + s.filename + ' | Trust: ' + s.credibilityScore + '\nEvidence: "' + s.text + '"'; }).join('\n\n');
        systemPrompt = RESEARCH_PROMPTS.v1.system(mode, modeInstruction, evidenceLedger, contradictionReport.explanation, query);
      }

      const groqResponse = await askGroq(systemPrompt, false, "llama-3.1-70b-versatile");
      
      const sources = enrichedSources.map((c, i) => ({
        id: c.id,
        label: `Source ${i+1}`,
        text: c.text,
        score: c.score,
        credibility: { score: c.credibilityScore, type: c.sourceType, rationale: c.trustRationale },
        metadata: { source: c.filename, page: c.metadata?.page, alignment: Math.round(c.semanticScore * 100) + "%" }
      }));

      const finalResponse = {
        answer: groqResponse,
        confidence: topScore,
        confidenceLabel,
        intent,
        fallbackTriggered,
        sources,
        contradictions: contradictionReport.contradictions || [],
        mode: mode,
        telemetry: {
          memory_usage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
          retrieval_chunks: finalChunks.length,
          detected_intent: intent,
          threshold_used: threshold,
          top_score: parseFloat(topScore.toFixed(3)),
          fallback_triggered: fallbackTriggered,
          section_boosts: finalChunks.slice(0, 3).map(c => ({ section: c.section, boost: c.structuralBoost }))
        }
      };

      // 9. Intelligence OS Synchronization (Phase 1-5)
      investigationManager.logEvent(sessionId, "QUERY_EXECUTED", `Grounded retrieval for: "${query}"`, { intent, confidenceLabel });
      
      finalResponse.sources.forEach(s => {
        investigationManager.addEvidence(sessionId, {
          id: s.id,
          source: s.metadata.source,
          text: s.text,
          confidence: s.score,
          alignment: s.metadata.alignment,
          origin: "RESEARCH_WORKSPACE"
        });
      });

      if (finalResponse.contradictions.length > 0) {
        finalResponse.contradictions.forEach(c => {
          investigationManager.addContradiction(sessionId, c);
        });
      }

      const updatedSession = investigationManager.getOrCreateSession(sessionId);
      finalResponse.telemetry.trustScore = updatedSession.trustScore;

      session.history.push({ query, answer: groqResponse, timestamp: Date.now() });
      if (res.json) return res.json(finalResponse);
      return finalResponse;

    } catch (err) {
      console.error("[RAG] Pipeline Failure:", err);
      if (res.status) return res.status(500).json({ error: "Intelligence retrieval failed." });
      throw err;
    }
  }

  app.post("/api/rag/query", handleRagQueryInternal);

  /*
  ==========================
  FORENSIC REPORT GENERATOR (PHASE 6)
  ==========================
  */
  app.post("/api/rag/report", async (req, res) => {
    const { sessionId } = req.body;
    const sessionPackage = investigationManager.getOrCreateSession(sessionId);
    
    if (!sessionPackage || (sessionPackage.evidenceLedger.length === 0 && sessionPackage.contradictions.length === 0)) {
      return res.status(400).json({ error: "Insufficient evidence for a forensic report." });
    }

    try {
      const prompt = EXPORT_PROMPTS.v2.system(sessionPackage);
      const report = await askGroq(prompt, false, "llama-3.1-70b-versatile");
      
      investigationManager.logEvent(sessionId, "REPORT_GENERATED", "V2 Forensic Intelligence Report exported.");
      
      return res.json({ success: true, report });
    } catch (err) {
      console.error("[REPORT] Generation failed:", err);
      return res.status(500).json({ error: "Report generation failed." });
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
  MOCK INVESTIGATION BOARDS
  ==========================
  */
  app.get("/api/boards", (req, res) => {
    return res.json({ success: true, boards: STORE.boards || [] });
  });

  app.post("/api/boards", (req, res) => {
    const { title, description } = req.body;
    const newBoard = {
      id: `board_${Date.now()}`,
      title: title || "New Investigation",
      description: description || "",
      items: [],
      createdAt: new Date().toISOString()
    };
    STORE.boards = STORE.boards || [];
    STORE.boards.push(newBoard);
    writeStore(STORE);
    return res.json({ success: true, board: newBoard });
  });

  app.post("/api/boards/:id/pin", (req, res) => {
    const { item } = req.body; // { type: 'claim'|'paper'|'finding', data: {} }
    const board = (STORE.boards || []).find(b => b.id === req.params.id);
    if (!board) return res.status(404).json({ error: "Board not found" });
    
    board.items.push({
      ...item,
      pinnedAt: new Date().toISOString()
    });
    writeStore(STORE);
    return res.json({ success: true, board });
  });

  /*
  ==========================
  INTELLIGENCE EVALUATION
  ==========================
  */
  const { runBenchmark } = require("./utils/benchmarks");
  
  app.post("/api/admin/benchmarks", async (req, res) => {
    // Hidden benchmark runner
    const results = await runBenchmark(handleRagQueryInternal);
    STORE.benchmarks = {
      ...STORE.benchmarks,
      lastRun: results.timestamp,
      avgAccuracy: results.avgAccuracy,
      totalEvaluations: (STORE.benchmarks.totalEvaluations || 0) + 1
    };
    writeStore(STORE);
    return res.json({ success: true, results });
  });

  /*
  ==========================
  CROSS-WORKSPACE FLOW
  ==========================
  */
  app.post("/api/flow/transfer", (req, res) => {
    const { type, data, targetWorkspace } = req.body;
    // Simple transfer mechanism: create a research session with pre-filled context
    if (targetWorkspace === 'research') {
      const sessionId = `flow_${Date.now()}`;
      CONVERSATION_SESSIONS[sessionId] = {
        history: [{ 
          query: `Analyze this claim forensicly: "${data.text}"`, 
          answer: "Claim received from Verification Lab. Analyzing supporting documentation...",
          timestamp: Date.now() 
        }],
        lastActive: Date.now()
      };
      return res.json({ success: true, sessionId, redirect: '/research' });
    }
    return res.status(400).json({ error: "Invalid target workspace" });
  });

  /*
  ==========================
  STABILITY & MEMORY AUDIT
  ==========================
  */
  setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    Object.keys(CONVERSATION_SESSIONS).forEach(id => {
      // 30-minute session expiry to prevent memory leaks
      if (now - CONVERSATION_SESSIONS[id].lastActive > 30 * 60 * 1000) {
        delete CONVERSATION_SESSIONS[id];
        cleanedCount++;
      }
    });
    if (cleanedCount > 0) console.log(`[STABILITY] Cleaned ${cleanedCount} stale research sessions.`);
  }, 5 * 60 * 1000); // Check every 5 minutes

  app.use((req, res, next) => {
    const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    if (memUsage > 450) { 
      console.warn(`[SAFEGUARD] Critical memory: ${Math.round(memUsage)}MB. Purging all sessions.`);
      Object.keys(CONVERSATION_SESSIONS).forEach(id => delete CONVERSATION_SESSIONS[id]);
    }
    next();
  });
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

  // Mount RAG routes always
  app.use("/api/rag", require("./routes/rag"));

  // --- CORE VERIFICATION WORKFLOWS (RESTORATION) ---
  app.use("/api/verify", requireApiKey, require("./routes/verify"));
  app.use("/api/url", requireApiKey, require("./routes/url"));
  app.use("/api/pdf", requireApiKey, require("./routes/pdf"));
  app.use("/api/image", requireApiKey, require("./routes/image"));
  app.use("/api/video", requireApiKey, require("./routes/video"));
  app.use("/api/trending", require("./routes/trending"));
  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/user", require("./routes/user"));
  app.use("/api/organization", require("./routes/organization"));

  // --- ADMIN & TELEMETRY ---
  app.get("/api/admin/telemetry", (req, res) => {
    const investigationManager = require("./services/investigationService");
    res.json({
      sessions: investigationManager ? Object.keys(investigationManager.sessions).length : 0,
      vaultSize: typeof SAFE_DOCS !== 'undefined' ? SAFE_DOCS.length : 0,
      chunkCount: typeof SAFE_CHUNKS !== 'undefined' ? SAFE_CHUNKS.length : 142,
      activeJobs: 0,
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
        heapUsedNum: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      }
    });
  });

  if (!SAFE_MODE) {
    console.log("[API] Loading production configuration...");
    const rateLimit = require("express-rate-limit");
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: { error: "Too many requests" },
    });
    app.use("/api/", limiter);
  } else {
    console.log("[SAFE API] Multi-branch routes enabled (SAFE_MODE)");
    app.get("/api/health", (req, res) => res.json({ status: "safe", mode: "RECOVERY_ACTIVE" }));
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