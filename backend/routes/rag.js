const express = require('express');
const router = express.Router();
const { addDocumentToRAG, retrieveContext } = require('../utils/rag');

// POST /api/rag/add
// Send { "id": "fact1", "text": "The verified truth is...", "metadata": {"source": "Internal"} }
router.post('/add', async (req, res) => {
  const { id, text, metadata } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });

  const success = await addDocumentToRAG(id || Date.now().toString(), text, metadata || {});
  
  if (success) {
    res.json({ message: "Fact added to RAG knowledge base successfully!" });
  } else {
    res.status(500).json({ error: "Failed to add fact to knowledge base" });
  }
});

// POST /api/rag/query
// Send { "query": "Is the sky blue?" }
router.post('/query', async (req, res) => {
  const { query, topK = 3 } = req.body;
  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    const results = await retrieveContext(query, topK);
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: "Failed to search knowledge base" });
  }
});

module.exports = router;
