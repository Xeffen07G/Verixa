const express = require("express");
const router = express.Router();
const fs = require("fs");
const multer = require("multer");
const { parsePDF, createChunks } = require("../services/ingestion");
const { addChunkToRAG } = require("../utils/rag");
const IngestionJob = require("../models/IngestionJob");
const { askGroq } = require("../services/groq");

// Ensure uploads directory exists on boot
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

const { ingestionQueue } = require("../services/queue");

const pdfParseModule = require("pdf-parse");
const pdfParse = (function() {
  if (typeof pdfParseModule === "function") return pdfParseModule;
  if (pdfParseModule && typeof pdfParseModule.PDFParse === "function") return pdfParseModule.PDFParse;
  if (pdfParseModule && typeof pdfParseModule.default === "function") return pdfParseModule.default;
  return null;
})();

/**
 * POST /api/pdf/ingest
 * Adds a document to the background ingestion queue.
 */
router.post("/ingest", upload.single("pdf"), async (req, res) => {
  const tStart = Date.now();
  const documentId = `doc_${Date.now()}`;

  // --- PHASE 4: EXTRACTION TELEMETRY (Upload received / file size) ---
  if (req.file) {
    console.log(`[API] Ingestion upload received: "${req.file.originalname}" (${req.file.size} bytes), documentId: ${documentId}`);
  } else {
    console.log(`[API] Ingestion upload failed: No file payload. documentId: ${documentId}`);
  }

  // --- PHASE 1: HARD FILE VALIDATION ---
  if (!req.file) {
    return res.status(400).json({
      error: "Forensic Ingestion Failed",
      reason: "No file payload received in multipart/form-data upload.",
      fallback: true,
      forensicStatus: "INGESTION_DEGRADED"
    });
  }

  const { path: filePath, mimetype, originalname, size } = req.file;

  // Validate file exists on disk
  if (!fs.existsSync(filePath)) {
    return res.status(400).json({
      error: "Forensic Ingestion Failed",
      reason: "Temporary persistent file not found on server disk.",
      fallback: true,
      forensicStatus: "INGESTION_DEGRADED"
    });
  }

  // Validate non-zero bytes and reasonable size (25MB limit)
  if (size <= 0 || size > 25 * 1024 * 1024) {
    if (fs.existsSync(filePath)) { try { fs.unlinkSync(filePath); } catch (e) {} }
    return res.status(400).json({
      error: "Forensic Ingestion Failed",
      reason: size <= 0 
        ? "Document contains zero bytes. Corrupted upload." 
        : `File size exceeds current secure threshold limit of 25MB.`,
      fallback: true,
      forensicStatus: "INGESTION_DEGRADED"
    });
  }

  // Validate extension & mimetype
  const extension = originalname.split('.').pop().toLowerCase();
  if (mimetype !== "application/pdf" && extension !== "pdf") {
    if (fs.existsSync(filePath)) { try { fs.unlinkSync(filePath); } catch (e) {} }
    return res.status(400).json({
      error: "Forensic Ingestion Failed",
      reason: `Mimetype must be application/pdf. Detected mimetype: ${mimetype}, extension: .${extension}`,
      fallback: true,
      forensicStatus: "INGESTION_DEGRADED"
    });
  }

  let ingestionJob = null;

  try {
    // 1. Create persistent job record
    ingestionJob = await IngestionJob.create({
      documentId,
      filename: originalname,
      path: filePath,
      status: 'pending',
      metadata: { uploadedAt: new Date(), size: size }
    });

    // Determine if we should switch to direct synchronous parsing (no Redis, fallback mode, or cold boot)
    let fallbackMode = false;
    let extractedText = "";

    try {
      if (ingestionQueue && typeof ingestionQueue.add === 'function' && process.env.REDIS_URL) {
        // 2. Add to first stage of the pipeline
        const job = await ingestionQueue.add('extract', {
          documentId,
          filename: originalname,
          path: filePath
        }, {
          removeOnComplete: true,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 }
        });

        // 3. Link BullMQ job ID for tracking
        ingestionJob.jobId = job.id;
        await ingestionJob.save();
      } else {
        throw new Error("BullMQ ingestion queue connection not active.");
      }
    } catch (queueErr) {
      console.warn("[API] Ingestion queue offline, switching to direct ingestion fallback mode:", queueErr.message);
      fallbackMode = true;
    }

    if (fallbackMode) {
      // --- PHASE 3: PDF PARSER HARDENING (Wrap pdf-parse in isolated try/catch) ---
      let parsed = null;
      try {
        const dataBuffer = fs.readFileSync(filePath);
        parsed = await pdfParse(dataBuffer);
        extractedText = parsed ? (parsed.text || "") : "";
        if (!extractedText.trim()) throw new Error("Parsed text is empty.");
        console.log(`[API] Ingest Direct Parse success: Extracted ${extractedText.length} characters`);
      } catch (parseErr) {
        console.error("[API] Graceful fallback parser activated:", parseErr.message);
        extractedText = `Forensic Alert: Remote source parsing failed during extraction. The PDF structure may be corrupted, scanned without OCR layers, or password protected.

Please extract the plain text manually or upload an OCR-processed copy. Ingestion degraded to diagnostic fallback mode.`;
        ingestionJob.extractionFailed = true;
        ingestionJob.forensicStatus = "INGESTION_DEGRADED";
        ingestionJob.reasoning = `PDF extraction failure: ${parseErr.message}`;
      }

      ingestionJob.status = 'completed';
      ingestionJob.progress = 100;
      ingestionJob.chunksCount = 1;
      ingestionJob.metadata = {
        ...ingestionJob.metadata,
        extractedText,
        directIngested: true,
        extractionTimeMs: Date.now() - tStart
      };
      await ingestionJob.save();
    }

    res.status(202).json({
      success: true,
      jobId: ingestionJob.jobId || `direct_${documentId}`,
      documentId,
      ...(ingestionJob.extractionFailed ? {
        fallback: true,
        forensicStatus: "INGESTION_DEGRADED",
        reasoning: ingestionJob.reasoning
      } : {})
    });
  } catch (err) {
    console.error("[API] Ingestion Error:", err);
    res.status(500).json({ 
      error: "Ingestion pipeline failure",
      fallback: true,
      forensicStatus: "INGESTION_DEGRADED",
      reason: err.message
    });
  } finally {
    // --- PHASE 2: PREVENT PREMATURE CLEANUP ---
    // If we're not running RAG queue (or completed direct synchronous ingest), clean up now.
    // If using background BullMQ queue, the worker will delete it, but in fallbackMode we must delete it.
    if (!ingestionQueue || !process.env.REDIS_URL) {
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { console.error("[API] Cleanup failed:", e.message); }
      }
    }
  }
});

/**
 * GET /api/pdf/status/:jobId
 * Check status using IngestionJob record (Persistent Source of Truth)
 */
router.get("/status/:jobId", async (req, res) => {
  const { jobId } = req.params;
  const { documentId } = req.query; // Fallback to documentId for lookup
  
  try {
    // Priority: Lookup by documentId if provided, otherwise jobId
    const query = documentId ? { documentId } : { jobId };
    const ingestionJob = await IngestionJob.findOne(query);
    
    if (!ingestionJob) {
      // Fallback to BullMQ check if DB record missing (legacy)
      if (ingestionQueue && typeof ingestionQueue.getJob === 'function' && process.env.REDIS_URL) {
        const job = await ingestionQueue.getJob(jobId);
        if (!job) return res.status(404).json({ error: "Job not found" });
        return res.json({ status: await job.getState(), progress: job.progress });
      }
      return res.status(404).json({ error: "Job not found" });
    }

    res.json({
      success: true,
      status: ingestionJob.status,
      progress: ingestionJob.progress,
      stage: ingestionJob.stage,
      chunks: ingestionJob.chunksCount,
      timing: ingestionJob.timing,
      error: ingestionJob.error,
      result: ingestionJob.status === "completed" ? { text: ingestionJob.metadata?.extractedText || "" } : null,
      ...(ingestionJob.extractionFailed ? {
        fallback: true,
        forensicStatus: "INGESTION_DEGRADED",
        reasoning: ingestionJob.reasoning || "PDF extraction failure. Graceful text fallback generated."
      } : {})
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

const researchAnalysis = require("../services/ResearchAnalysis");

/**
 * POST /api/pdf/summary
 * Generates an executive research summary.
 */
router.post("/summary", async (req, res) => {
  const { documentId, mode } = req.body;
  if (!documentId) return res.status(400).json({ error: "Document ID required" });
  try {
    const summary = await researchAnalysis.generateExecutiveSummary(documentId, mode);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: "Summary generation failed" });
  }
});

/**
 * POST /api/pdf/sections
 * Performs section-wise synthesis of the document.
 */
router.post("/sections", async (req, res) => {
  const { documentId } = req.body;
  if (!documentId) return res.status(400).json({ error: "Document ID required" });
  try {
    const sections = await researchAnalysis.synthesizeSections(documentId);
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: "Section synthesis failed" });
  }
});

/**
 * POST /api/pdf/gaps
 * Detects research gaps and identifies weaknesses.
 */
router.post("/gaps", async (req, res) => {
  const { documentId } = req.body;
  if (!documentId) return res.status(400).json({ error: "Document ID required" });
  try {
    const gaps = await researchAnalysis.detectResearchGaps(documentId);
    res.json(gaps);
  } catch (err) {
    res.status(500).json({ error: "Gap detection failed" });
  }
});

/**
 * POST /api/pdf/methodology
 * Explains methodology and terminology.
 */
router.post("/methodology", async (req, res) => {
  const { documentId } = req.body;
  if (!documentId) return res.status(400).json({ error: "Document ID required" });
  try {
    const methodology = await researchAnalysis.explainMethodology(documentId);
    res.json(methodology);
  } catch (err) {
    res.status(500).json({ error: "Methodology explainer failed" });
  }
});



module.exports = router;