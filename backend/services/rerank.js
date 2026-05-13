/**
 * Reranking service to improve retrieval precision.
 * Currently uses a fast LLM-based reranking approach.
 */
const { askGroq } = require("./groq");

async function rerankResults(query, results, topN = 5) {
  if (results.length <= 1) return results;

  const context = results.map((r, i) => `[ID: ${i}] ${r.text.slice(0, 300)}`).join("\n\n");
  
  const prompt = `Rank these document snippets based on their relevance to this query: "${query}"
  
  Return ONLY a comma-separated list of IDs in order of relevance, most relevant first.
  
  Snippets:
  ${context}`;

  try {
    const response = await askGroq(prompt, false, "llama-3.1-8b-instant");
    const rankedIds = response.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    
    const reranked = rankedIds
      .map(id => results[id])
      .filter(Boolean)
      .slice(0, topN);
      
    // Append any results that were missed in the LLM ranking just in case
    const seen = new Set(rankedIds);
    results.forEach((r, i) => {
      if (!seen.has(i)) reranked.push(r);
    });

    return reranked.slice(0, topN);
  } catch (err) {
    console.warn("Reranking failed, falling back to original order:", err.message);
    return results.slice(0, topN);
  }
}

module.exports = { rerankResults };
