const { askGroq } = require('./groq');
const { retrieveContext } = require('../utils/rag');
const graphService = require('./graph');

/**
 * ConsensusEngine: Identifies dominant vs. minority findings and conflicting evidence.
 */
class ConsensusEngine {
  /**
   * Analyze a claim or query for consensus across the entire knowledge base.
   */
  async analyzeConsensus(query, documentIds = []) {
    const filter = documentIds.length > 0 ? { "metadata.documentId": { $in: documentIds } } : {};
    const evidence = await retrieveContext(query, 20, filter);

    if (evidence.length === 0) return { error: "Insufficient evidence for consensus analysis." };

    const prompt = `Analyze these evidence chunks regarding the claim: "${query}"
    
    EVIDENCE:
    ${evidence.map((e, i) => `[${i}] ${e.text}`).join("\n\n")}
    
    OBJECTIVES:
    1. Identify the "Dominant Consensus" (what most sources agree on).
    2. Identify "Minority Findings" (outliers or alternative views).
    3. Detect direct "Evidence Contradictions".
    4. Score Overall Confidence (0-100).
    
    Respond in JSON:
    {
      "consensus": "...",
      "minority_views": ["...", "..."],
      "contradictions": [ { "point": "...", "sources": [0, 1] } ],
      "confidence_score": 0-100,
      "unresolved_questions": []
    }`;

    try {
      const raw = await askGroq(prompt, true, "llama-3.3-70b-versatile");
      const data = JSON.parse(raw);

      // Map evidence indices back to IDs
      if (data.contradictions) {
        data.contradictions = data.contradictions.map(c => ({
          ...c,
          evidence_details: c.sources.map(idx => evidence[idx])
        }));
      }

      return data;
    } catch (err) {
      console.error("[ConsensusEngine] Analysis failed:", err);
      return { error: "Consensus analysis failed." };
    }
  }

  /**
   * Adaptive Source Reliability Scoring.
   */
  async computeReliability(documentId) {
    // Placeholder for reliability computation logic based on graph and contradiction density
    const contradictions = await graphService.findContradictions(documentId);
    const baseScore = 100 - (contradictions.length * 5);
    return Math.max(0, baseScore);
  }
}

module.exports = new ConsensusEngine();
