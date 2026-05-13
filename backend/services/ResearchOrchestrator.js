const { retrieveContext } = require("../utils/rag");
const { rerankResults } = require("./rerank");
const agents = require("./agents");

/**
 * ResearchOrchestrator: Coordinates multi-agent intelligence workflows.
 */
class ResearchOrchestrator {
  constructor(options = {}) {
    this.topK = options.topK || 20;
    this.rerankN = options.rerankN || 5;
  }

  async performSynthesis(query, documentIds = []) {
    console.log(`[Orchestrator] Starting synthesis for: "${query}"`);
    
    // 1. Multi-Document Retrieval
    const filter = documentIds.length > 0 ? { "metadata.documentId": { $in: documentIds } } : {};
    const rawContexts = await retrieveContext(query, this.topK, filter);
    
    if (rawContexts.length === 0) return { error: "No evidence found." };

    // 2. Reranking & Selection
    const selectedContexts = await rerankResults(query, rawContexts, this.rerankN);

    // 3. Parallel Agent Execution
    const [contradictions, methodology] = await Promise.all([
      agents.ContradictionAgent(query, selectedContexts.map(c => c.text)),
      agents.MethodologyAgent(selectedContexts.map(c => c.text).join("\n"))
    ]);

    // 4. Final Synthesis with Citations
    // Using the Intelligence Service logic here but orchestrated
    const intelligence = require("./intelligence");
    const result = await intelligence.queryIntelligence(query, documentIds[0]); // Simplified for now

    return {
      ...result,
      forensics: {
        contradictions: contradictions.contradictions,
        methodology: methodology
      },
      orchestration_metadata: {
        sources_analyzed: rawContexts.length,
        rerank_precision: selectedContexts[0]?.score || 0
      }
    };
  }

  async auditDocument(documentId) {
    const filter = { "metadata.documentId": documentId };
    const chunks = await retrieveContext("comprehensive overview", 15, filter);
    const context = chunks.map(c => c.text).join("\n\n");

    return await agents.SummarizationAgent(documentId, context);
  }
}

module.exports = new ResearchOrchestrator();
