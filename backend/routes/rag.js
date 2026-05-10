const express = require('express');
const router = express.Router();
const { addDocumentToRAG, retrieveContext, getKnowledgeBase } = require('../utils/rag');
const Groq = require('groq-sdk');

// POST /api/rag/add
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
router.post('/query', async (req, res) => {
  const { query, context: inputContext, topK = 3 } = req.body;
  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    const results = await retrieveContext(query, topK);
    const retrievedText = results.map(r => r.text).join('\n\n');
    
    // Combine manual context (from the image/pdf) and retrieved context
    const finalContext = `Manual Context: ${inputContext || 'None'}\n\nRetrieved Knowledge: ${retrievedText || 'None'}`;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are VeriXa Intelligence, a factual forensic assistant. Use the provided context to answer the user's query accurately. If the context doesn't contain the answer, say you don't know based on the current knowledge base. Keep it professional and concise."
        },
        {
          role: "user",
          content: `Context:\n${finalContext}\n\nQuery: ${query}`
        }
      ],
      temperature: 0.2
    });

    res.json({ 
      answer: completion.choices[0].message.content,
      results 
    });
  } catch (error) {
    console.error("RAG Query Error:", error);
    res.status(500).json({ error: "Failed to process intelligence query" });
  }
});

// GET /api/rag/documents
router.get('/documents', async (req, res) => {
  try {
    const docs = await getKnowledgeBase();
    res.json({ documents: docs });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

module.exports = router;
