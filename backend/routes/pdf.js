const express = require("express");
const router = express.Router();
const multer = require("multer");
const { parsePDF, createChunks } = require("../services/ingestion");
const { addChunkToRAG } = require("../utils/rag");
const { askGroq } = require("../services/groq");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // Increased to 25MB for research papers
});

const { ingestionQueue } = require("../services/queue");


/**
 * POST /api/pdf/ingest
 * Adds a document to the background ingestion queue.
 */
router.post("/ingest", upload.single("pdf"), async (req, res) => {
  console.log('[API] PDF INGEST ROUTE HIT');
  console.log('  - Fieldname Expected: pdf');
  console.log('  - File received:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'NONE');

  if (!req.file) {
    console.warn('  - [400] No file found in request.');
    return res.status(400).json({ error: "No PDF file uploaded. Field 'pdf' is required." });
  }

  try {
    const documentId = `doc_${Date.now()}`;
    const filename = req.file.originalname;

    // Add to BullMQ
    const job = await ingestionQueue.add('process-pdf', {
      documentId,
      filename,
      buffer: req.file.buffer,
      metadata: { uploadedAt: new Date() }
    });

    console.log(`[API] Job Created: ${job.id} for ${filename}`);

    res.json({
      message: "Ingestion started in background",
      documentId,
      jobId: job.id
    });
  } catch (err) {
    console.error("Queue error:", err);
    res.status(500).json({ error: "Failed to queue document: " + err.message });
  }
});

/**
 * GET /api/pdf/status/:jobId
 * Check the status of a background ingestion job.
 */
router.get("/status/:jobId", async (req, res) => {
  try {
    const job = await ingestionQueue.getJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const status = await job.getState();
    const progress = job.progress;
    const result = job.returnvalue;

    res.json({ status, progress, result });
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