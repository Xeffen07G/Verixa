const { askGroq } = require("./groq");

/**
 * VeriXa Forensic Reasoning Engine (Phase 7 Upgrade)
 * Advanced intelligence layer for cross-document consistency, consensus, and conflict mapping.
 */
async function analyzeContradictions(evidenceChunks, query) {
  if (!evidenceChunks || evidenceChunks.length < 2) {
    return { hasContradiction: false, contradictions: [], explanation: 'Insufficient evidence for deep forensic reasoning.' };
  }

  // Bounded Reasoning: Max 5 chunks to preserve free-tier stability
  const topChunks = evidenceChunks.slice(0, 5);
  
  const evidenceContext = topChunks.map((c, i) => 
    `[Source ${i+1}] Paper: ${c.filename || c.metadata?.source} | Page: ${c.metadata?.page || 'N/A'} | Text: "${c.text}"`
  ).join("\n\n---\n\n");

  const CONTRADICTION_PROMPTS = require("../prompts/contradictionPrompts");

  const prompt = CONTRADICTION_PROMPTS.v1.system(evidenceContext, query);

  try {
    const rawResult = await askGroq(prompt, true, "llama-3.1-8b-instant");
    const result = JSON.parse(rawResult);
    
    // Add additional metadata for UI
    result.analyzedChunkCount = topChunks.length;
    result.timestamp = new Date().toISOString();
    
    return result;
  } catch (err) {
    console.error("[ForensicEngine] reasoning failed:", err);
    return { hasContradiction: false, contradictions: [], explanation: "Advanced forensic reasoning offline." };
  }
}

module.exports = { analyzeContradictions };
