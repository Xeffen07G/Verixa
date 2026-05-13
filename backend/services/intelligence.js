const { retrieveContext } = require("../utils/rag");
const { rerankResults } = require("./rerank");
const { askGroq } = require("./groq");

/**
 * Orchestrates document-grounded intelligence.
 * Handles retrieval, reranking, and generation with citations.
 */
async function queryIntelligence(query, documentId = null) {
  // 1. Retrieval
  const filter = documentId ? { "metadata.documentId": documentId } : {};
  const initialResults = await retrieveContext(query, 15, filter);
  
  if (initialResults.length === 0) {
    return {
      answer: "No relevant evidence found in the knowledge base.",
      sources: []
    };
  }

  // 2. Reranking
  const reranked = await rerankResults(query, initialResults, 5);
  
  // 3. Generation with Citations
  const context = reranked.map((r, i) => `[Source ${i + 1}] (Page ${r.metadata?.page || 'Unknown'}): ${r.text}`).join("\n\n");
  
  const prompt = `You are VeriXa Intelligence. Answer the query based ONLY on the provided context.
  
  QUERY: "${query}"
  
  CONTEXT:
  ${context}
  
  RULES:
  - Every factual statement MUST be followed by a citation like [Source X].
  - If the context doesn't contain the answer, state that clearly.
  - Provide a "Source Grounding" section at the end listing the unique sources used.
  - Rate your confidence from 0-100 based on evidence strength.
  
  Respond in valid JSON:
  {
    "answer": "...",
    "confidence_score": 0-100,
    "grounding_sources": [
      { "id": 1, "page": 1, "relevance": "..." }
    ]
  }`;

  const rawAnswer = await askGroq(prompt, true, "llama-3.3-70b-versatile");
  const data = JSON.parse(rawAnswer);

  return {
    ...data,
    original_sources: reranked.map((r, i) => ({
      id: i + 1,
      text: r.text,
      metadata: r.metadata
    }))
  };
}

module.exports = { queryIntelligence };
