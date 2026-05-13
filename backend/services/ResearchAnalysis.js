const { askGroq } = require('./groq');
const { retrieveContext } = require('../utils/rag');

/**
 * ResearchAnalysisService: specialized logic for deep academic paper synthesis.
 * Handles section detection, methodology explainer, and gap analysis.
 */
class ResearchAnalysisService {
  /**
   * Performs an executive summary with variable depth modes.
   */
  async generateExecutiveSummary(documentId, mode = 'technical') {
    const filter = { "metadata.documentId": documentId };
    const chunks = await retrieveContext("abstract introduction conclusion", 10, filter);
    const context = chunks.map(c => c.text).join("\n\n");

    const prompt = `Generate a ${mode} Executive Summary for this research paper.
    Include:
    - Main Objectives
    - Core Novelty / Contribution
    - Key Findings
    - Societal/Academic Impact
    
    CONTEXT:
    ${context}
    
    Respond in JSON:
    {
      "objective": "...",
      "novelty": "...",
      "findings": "...",
      "impact": "...",
      "mode": "${mode}"
    }`;

    const raw = await askGroq(prompt, true, "llama-3.3-70b-versatile");
    return JSON.parse(raw);
  }

  /**
   * Synthesizes specific paper sections using grounded evidence.
   */
  async synthesizeSections(documentId) {
    const filter = { "metadata.documentId": documentId };
    const sections = [
      "Abstract", "Introduction", "Related Work", "Methodology", 
      "Experiments", "Results", "Limitations", "Conclusion"
    ];

    const results = {};
    for (const section of sections) {
      const chunks = await retrieveContext(`detailed ${section} content`, 5, filter);
      const context = chunks.map(c => c.text).join("\n\n");

      const prompt = `Summarize the ${section} section of this paper.
      Be precise and grounded. Mention specific methodologies or results.
      
      CONTEXT:
      ${context}
      
      Respond in JSON: { "summary": "...", "page_references": [${chunks.map(c => c.metadata.page).join(",")}] }`;
      
      const raw = await askGroq(prompt, true, "llama-3.1-8b-instant");
      results[section] = JSON.parse(raw);
    }

    return results;
  }

  /**
   * Detects research gaps and identifies critical weaknesses.
   */
  async detectResearchGaps(documentId) {
    const filter = { "metadata.documentId": documentId };
    const chunks = await retrieveContext("limitations future work weak assumptions results analysis", 12, filter);
    const context = chunks.map(c => c.text).join("\n\n");

    const prompt = `Perform a critical analysis of this research paper to identify "Research Gaps".
    Focus on:
    1. Unresolved problems
    2. Weak assumptions
    3. Scalability limitations
    4. Unexplored opportunities
    
    CONTEXT:
    ${context}
    
    Respond in JSON:
    {
      "gaps": [ { "type": "...", "point": "...", "reasoning": "..." } ],
      "critique": "..."
    }`;

    const raw = await askGroq(prompt, true, "llama-3.3-70b-versatile");
    return JSON.parse(raw);
  }

  /**
   * Explains technical methodology simply but accurately.
   */
  async explainMethodology(documentId) {
    const filter = { "metadata.documentId": documentId };
    const chunks = await retrieveContext("methodology algorithm architecture equations", 10, filter);
    const context = chunks.map(c => c.text).join("\n\n");

    const prompt = `Explain the methodology of this paper.
    Simplify complex algorithms or architectures without losing accuracy.
    Define core terminology.
    
    CONTEXT:
    ${context}
    
    Respond in JSON:
    {
      "explanation": "...",
      "core_terminology": [ { "term": "...", "def": "..." } ],
      "architecture_summary": "..."
    }`;

    const raw = await askGroq(prompt, true, "llama-3.3-70b-versatile");
    return JSON.parse(raw);
  }
}

module.exports = new ResearchAnalysisService();
