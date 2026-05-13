const express = require("express");
const router = express.Router();
const fs = require("fs");
const multer = require("multer");
const { parsePDF, createChunks } = require("../services/ingestion");
const { addChunkToRAG } = require("../utils/rag");
const IngestionJob = require("../models/IngestionJob");
const { askGroq } = require("../services/groq");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

const { ingestionQueue } = require("../services/queue");

/**
 * POST /api/pdf/ingest
 * Adds a document to the background ingestion queue.
 */
router.post("/ingest", upload.single("pdf"), async (req, res) => {
  const tStart = Date.now();
  if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });

  try {
    const documentId = `doc_${Date.now()}`;
    
    // 1. Create persistent job record
    const ingestionJob = await IngestionJob.create({
      documentId,
      filename: req.file.originalname,
      path: req.file.path,
      status: 'pending',
      metadata: { uploadedAt: new Date(), size: req.file.size }
    });

    // 2. Add to first stage of the pipeline
    const job = await ingestionQueue.add('extract', {
      documentId,
      filename: req.file.originalname,
      path: req.file.path
    }, {
      removeOnComplete: true,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 }
    });

    // 3. Link BullMQ job ID for tracking
    ingestionJob.jobId = job.id;
    await ingestionJob.save();

    res.status(202).json({
      success: true,
      jobId: job.id,
      documentId
    });
  } catch (err) {
    console.error("[API] Ingestion Error:", err);
    res.status(500).json({ error: "Ingestion pipeline failure" });
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
      const job = await ingestionQueue.getJob(jobId);
      if (!job) return res.status(404).json({ error: "Job not found" });
      return res.json({ status: await job.getState(), progress: job.progress });
    }

    res.json({
      status: ingestionJob.status,
      progress: ingestionJob.progress,
      stage: ingestionJob.stage,
      chunks: ingestionJob.chunksCount,
      timing: ingestionJob.timing,
      error: ingestionJob.error
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