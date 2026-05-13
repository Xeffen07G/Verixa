const express = require('express');
const router = express.Router();
const { addChunkToRAG } = require('../utils/rag');
const { queryIntelligence } = require('../services/intelligence');

/**
 * POST /api/rag/add
 * Manually add a fact to RAG.
 */
router.post('/add', async (req, res) => {
  const { id, text, metadata } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });

  const success = await addChunkToRAG(id || `manual_${Date.now()}`, text, metadata || {});
  
  if (success) {
    res.json({ message: "Evidence added to VeriXa intelligence successfully!" });
  } else {
    res.status(500).json({ error: "Failed to add evidence" });
  }
});

/**
 * POST /api/rag/query
 * Perform a grounded intelligence query.
 */
router.post('/query', async (req, res) => {
  const { query, documentId } = req.body;
  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    const result = await queryIntelligence(query, documentId);
    res.json(result);
  } catch (error) {
    console.error("Intelligence Query Error:", error);
    res.status(500).json({ error: "Failed to process intelligence query" });
  }
});

const orchestrator = require('../services/ResearchOrchestrator');
const consensusEngine = require('../services/ConsensusEngine');
const graphService = require('../services/graph');

/**
 * POST /api/rag/synthesis
 * Perform multi-agent evidence synthesis.
 */
router.post('/synthesis', async (req, res) => {
  const { query, documentIds } = req.body;
  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    const result = await orchestrator.performSynthesis(query, documentIds || []);
    res.json(result);
  } catch (error) {
    console.error("Synthesis Error:", error);
    res.status(500).json({ error: "Multi-agent synthesis failed" });
  }
});

/**
 * POST /api/rag/consensus
 * Analyze consensus and contradictions for a claim.
 */
router.post('/consensus', async (req, res) => {
  const { query, documentIds } = req.body;
  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    const result = await consensusEngine.analyzeConsensus(query, documentIds || []);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Consensus analysis failed" });
  }
});

/**
 * GET /api/rag/graph/:nodeId
 * Retrieve influence graph for a concept or entity.
 */
router.get('/graph/:nodeId', async (req, res) => {
  try {
    const graph = await graphService.getInfluenceGraph(req.params.nodeId);
    res.json(graph);
  } catch (error) {
    res.status(500).json({ error: "Graph retrieval failed" });
  }
});




module.exports = router;
