const fs = require('fs');
const path = require('path');
const Knowledge = require('../models/Knowledge');

// Dynamically import the transformers library
let pipeline;
async function getPipeline() {
  if (!pipeline) {
    const transformers = await import('@xenova/transformers');
    // Using a very small, fast, and free embedding model that runs 100% locally on CPU
    pipeline = await transformers.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return pipeline;
}

const DB_PATH = path.join(__dirname, '..', 'knowledge_base.json');

// Helper function to calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 1. Generate an embedding vector for a given text.
 */
async function generateEmbedding(text) {
  const extractor = await getPipeline();
  // Generate embeddings. Pooling 'mean' gives a single sentence embedding.
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  // Convert Float32Array to standard JS Array
  return Array.from(output.data);
}

/**
 * 2. Add a new document to the RAG knowledge base.
 */
async function addDocumentToRAG(id, text, metadata = {}) {
  try {
    const embedding = await generateEmbedding(text);

    // Try MongoDB first
    try {
      await Knowledge.findOneAndUpdate(
        { id },
        { id, text, metadata, embedding, timestamp: new Date() },
        { upsert: true, new: true }
      );
      console.log(`Document [${id}] added to MongoDB RAG.`);
    } catch (dbError) {
      console.warn("MongoDB RAG failed, falling back to JSON:", dbError.message);
      // Fallback to JSON
      let kb = [];
      if (fs.existsSync(DB_PATH)) {
        const fileData = fs.readFileSync(DB_PATH, 'utf-8');
        kb = JSON.parse(fileData);
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
 * 3. Search the knowledge base for context similar to the query.
 */
async function retrieveContext(queryText, topK = 3) {
  let kb = [];
  
  // Try MongoDB first
  try {
    kb = await Knowledge.find({}).lean();
    if (kb.length === 0) {
      // If MongoDB is empty, check JSON fallback
      if (fs.existsSync(DB_PATH)) {
        kb = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      }
    }
  } catch (dbError) {
    console.warn("MongoDB retrieval failed, falling back to JSON:", dbError.message);
    if (fs.existsSync(DB_PATH)) {
      kb = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    }
  }

  if (!kb || kb.length === 0) return [];

  const queryEmbedding = await generateEmbedding(queryText);

  // Calculate similarity for all stored documents
  const results = kb.map(doc => {
    const score = cosineSimilarity(queryEmbedding, doc.embedding);
    return { ...doc, score };
  });

  // Sort by highest similarity
  results.sort((a, b) => b.score - a.score);

  // Return the top K matches without the heavy embedding arrays
  return results.slice(0, topK).map(res => ({
    id: res.id,
    text: res.text,
    metadata: res.metadata,
    score: res.score
  }));
}

async function getKnowledgeBase() {
  try {
    const docs = await Knowledge.find({}, { embedding: 0 }).lean();
    if (docs.length > 0) return docs;
  } catch (e) {
    console.warn("MongoDB getKnowledgeBase failed:", e.message);
  }

  if (!fs.existsSync(DB_PATH)) return [];
  const kb = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  return kb.map(res => ({
    id: res.id,
    text: res.text,
    metadata: res.metadata,
    timestamp: res.timestamp || new Date().toISOString()
  }));
}

module.exports = {
  generateEmbedding,
  addDocumentToRAG,
  retrieveContext,
  getKnowledgeBase
};
