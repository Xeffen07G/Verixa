const { askGroq } = require('./groq');

/**
 * EvaluationEngine: Measures the quality of intelligence outputs.
 * Provides benchmarks for retrieval, grounding, and synthesis.
 */
class EvaluationEngine {
  /**
   * Evaluate the grounding accuracy of an answer against its sources.
   */
  async evaluateGrounding(query, answer, sources) {
    const prompt = `You are a Fact-Checking Judge. Evaluate the "Grounding Accuracy" of the answer based ONLY on the provided sources.
    
    QUERY: "${query}"
    ANSWER: "${answer}"
    SOURCES:
    ${sources.map((s, i) => `[Source ${i + 1}] ${s.text}`).join("\n\n")}
    
    CRITERIA:
    1. Does every claim in the answer have a corresponding source?
    2. Are there any hallucinations (claims not in sources)?
    3. Are citations correctly mapped?
    
    Respond in JSON:
    {
      "grounding_score": 0-100,
      "hallucinations": [ { "claim": "...", "reason": "..." } ],
      "citation_accuracy": 0-100,
      "verdict": "Pass/Fail/Partial"
    }`;

    try {
      const raw = await askGroq(prompt, true, "llama-3.3-70b-versatile");
      return JSON.parse(raw);
    } catch (err) {
      return { error: "Evaluation failed", score: 0 };
    }
  }

  /**
   * Evaluate retrieval precision.
   */
  async evaluateRetrieval(query, results) {
    const prompt = `Evaluate the "Retrieval Precision" for this query.
    QUERY: "${query}"
    RESULTS:
    ${results.map((r, i) => `[${i}] ${r.text.slice(0, 300)}`).join("\n\n")}
    
    Identify which results are actually relevant.
    Respond in JSON:
    {
      "precision": 0.0-1.0,
      "relevant_indices": [0, 2, ...],
      "noise_ratio": 0.0-1.0
    }`;

    try {
      const raw = await askGroq(prompt, true, "llama-3.1-8b-instant");
      return JSON.parse(raw);
    } catch (err) {
      return { precision: 0 };
    }
  }

  /**
   * Run a full intelligence benchmark.
   */
  async runBenchmark(sessionId, workflowData) {
    const { query, answer, sources, retrievalResults } = workflowData;
    
    const [grounding, retrieval] = await Promise.all([
      this.evaluateGrounding(query, answer, sources),
      this.evaluateRetrieval(query, retrievalResults)
    ]);

    return {
      sessionId,
      timestamp: Date.now(),
      metrics: {
        grounding_score: grounding.grounding_score,
        citation_accuracy: grounding.citation_accuracy,
        retrieval_precision: retrieval.precision * 100,
        hallucination_count: grounding.hallucinations?.length || 0
      },
      verdict: grounding.verdict
    };
  }
}

module.exports = new EvaluationEngine();
