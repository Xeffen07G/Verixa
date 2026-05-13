const fs = require('fs');
const path = require('path');
const Knowledge = require('../models/Knowledge');

// Dynamically import the transformers library
let pipeline;
async function getPipeline() {
  if (!pipeline) {
    console.log('[RAG] Loading transformer model (Xenova/all-MiniLM-L6-v2)...');
    const transformers = await import('@xenova/transformers');
    pipeline = await transformers.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('[RAG] Model loaded successfully.');
  }
  return pipeline;
}

/**
 * Generate an embedding vector for a given text.
 */
async function generateEmbedding(text) {
  const extractor = await getPipeline();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Add a new document chunk to the RAG knowledge base.
 */
async function addChunkToRAG(id, text, metadata = {}) {
  try {
    const embedding = await generateEmbedding(text);

    // Try MongoDB first
    try {
      await Knowledge.findOneAndUpdate(
        { id },
        { id, text, metadata, embedding, timestamp: new Date() },
        { upsert: true, new: true }
      );
    } catch (dbError) {
      console.warn("MongoDB RAG failed, falling back to JSON:", dbError.message);
      let kb = [];
      if (fs.existsSync(DB_PATH)) {
        kb = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      }
      const existingIdx = kb.findIndex(d => d.id === id);
      if (existingIdx >= 0) kb[existingIdx] = { id, text, metadata, embedding };
      else kb.push({ id, text, metadata, embedding });
      fs.writeFileSync(DB_PATH, JSON.stringify(kb, null, 2));
    }

    return true;
  } catch (error) {
    console.error("Error adding document to RAG:", error);
    return false;
  }
}

/**
 * Cosine Similarity calculation.
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return normA === 0 || normB === 0 ? 0 : dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Reciprocal Rank Fusion (RRF) to combine multiple search results.
 */
function rrf(resultsSets, k = 60) {
  const scores = new Map();
  resultsSets.forEach(results => {
    results.forEach((res, rank) => {
      const id = res.id;
      const score = 1 / (rank + k);
      if (scores.has(id)) {
        scores.set(id, { ...res, rrfScore: scores.get(id).rrfScore + score });
      } else {
        scores.set(id, { ...res, rrfScore: score });
      }
    });
  });
  return Array.from(scores.values()).sort((a, b) => b.rrfScore - a.rrfScore);
}

/**
 * Retrieve similar context using Hybrid Search (Vector + Keyword).
 */
async function retrieveContext(queryText, topK = 10, filter = {}) {
  const queryEmbedding = await generateEmbedding(queryText);
  
  // 1. Vector Search (using cosine similarity fallback or Atlas)
  let vectorResults = [];
  try {
    const kb = await Knowledge.find(filter).lean();
    vectorResults = kb.map(doc => ({
      ...doc,
      vectorScore: cosineSimilarity(queryEmbedding, doc.embedding)
    }))
    .sort((a, b) => b.vectorScore - a.vectorScore)
    .slice(0, 50);
  } catch (e) {
    console.warn("Vector search failed:", e.message);
  }

  // 2. Keyword Search (using MongoDB Text Index)
  let keywordResults = [];
  try {
    keywordResults = await Knowledge.find({
      ...filter,
      $text: { $search: queryText }
    })
    .select({ score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" } })
    .limit(50)
    .lean();
  } catch (e) {
    console.warn("Keyword search failed:", e.message);
  }

  // 3. Fusion (RRF)
  const fused = rrf([vectorResults, keywordResults]);

  return fused.slice(0, topK).map(res => ({
    id: res.id,
    text: res.text,
    metadata: res.metadata,
    scores: {
      vector: res.vectorScore || 0,
      keyword: res.score || 0,
      fused: res.rrfScore
    }
  }));
}


module.exports = {
  generateEmbedding,
  addChunkToRAG,
  retrieveContext
};

