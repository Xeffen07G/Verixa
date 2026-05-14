const TEST_DATASET = [
  {
    query: "What is the primary goal of the attention mechanism?",
    expectedKeywords: ["scaling", "dot-product", "alignment", "relevance"],
    minConfidence: 0.7
  },
  {
    query: "How does the model handle multi-head attention?",
    expectedKeywords: ["parallel", "projections", "concatenate", "linear"],
    minConfidence: 0.6
  },
  {
    query: "Is there a consensus on Method X performance?",
    expectedKeywords: ["contradiction", "disagreement", "conflicting", "evidence"],
    minConfidence: 0.5,
    isContradictionTest: true
  }
];

async function runBenchmark(queryHandler) {
  const results = [];
  let totalScore = 0;

  for (const test of TEST_DATASET) {
    const start = Date.now();
    try {
      // Mock request/response objects
      const req = { body: { query: test.query, sessionId: 'benchmark_session' } };
      let resData = null;
      const res = { 
        json: (data) => { resData = data; } 
      };

      await queryHandler(req, res);

      const latency = Date.now() - start;
      const keywordsFound = test.expectedKeywords.filter(k => 
        resData.answer.toLowerCase().includes(k.toLowerCase())
      );
      const accuracy = keywordsFound.length / test.expectedKeywords.length;

      results.push({
        query: test.query,
        accuracy,
        latency,
        confidence: resData.confidence,
        status: accuracy >= test.minConfidence ? 'PASS' : 'FAIL'
      });
      totalScore += accuracy;
    } catch (err) {
      results.push({ query: test.query, status: 'ERROR', error: err.message });
    }
  }

  return {
    timestamp: new Date().toISOString(),
    avgAccuracy: totalScore / TEST_DATASET.length,
    results
  };
}

module.exports = { runBenchmark };
