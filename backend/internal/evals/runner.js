const fs = require('fs');
const path = require('path');

/**
 * VeriXa Forensic Evaluation Runner
 * Benchmarks retrieval correctness and hallucination resistance.
 */
async function runBenchmarks(ragQueryHandler) {
  const benchmarkPath = path.join(__dirname, 'benchmarks.json');
  const benchmarks = JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'));
  
  const results = {
    timestamp: new Date().toISOString(),
    totalTests: benchmarks.length,
    passed: 0,
    failed: 0,
    categories: {},
    detailedResults: []
  };

  for (const test of benchmarks) {
    console.log(`[EVAL] Running ${test.id}...`);
    
    // Initialize category if not exists
    if (!results.categories[test.category]) {
      results.categories[test.category] = { total: 0, passed: 0 };
    }
    results.categories[test.category].total++;

    const startTime = Date.now();
    let passed = false;
    let actualResponse = null;

    try {
      // Mock request/response objects for the internal handler
      const mockReq = { body: { query: test.query, sessionId: 'eval_session' } };
      const mockRes = {
        json: (data) => { actualResponse = data; }
      };

      await ragQueryHandler(mockReq, mockRes);

      // Simple heuristic evaluation
      if (test.category === 'hallucination_resistance' && test.isEvidenceMissing) {
        // Expect refusal or "No evidence"
        passed = actualResponse.answer.toLowerCase().includes('no evidence') || 
                 actualResponse.confidenceLabel === 'NO EVIDENCE FOUND';
      } else if (test.category === 'contradiction_detection') {
        passed = actualResponse.contradictions && actualResponse.contradictions.length > 0;
      } else if (test.category === 'citation_alignment') {
        passed = test.expectedCitations.every(c => actualResponse.answer.includes(c));
      }

      if (passed) {
        results.passed++;
        results.categories[test.category].passed++;
      } else {
        results.failed++;
      }

      results.detailedResults.push({
        id: test.id,
        category: test.category,
        passed,
        latency: Date.now() - startTime,
        query: test.query,
        actualAnswer: actualResponse.answer,
        confidence: actualResponse.confidence
      });

    } catch (err) {
      console.error(`[EVAL] Test ${test.id} failed with error:`, err);
      results.failed++;
      results.detailedResults.push({
        id: test.id,
        category: test.category,
        passed: false,
        error: err.message
      });
    }
  }

  // Calculate metrics
  results.metrics = {
    retrieval_accuracy: (results.passed / results.totalTests).toFixed(2),
    avg_latency: results.detailedResults.reduce((acc, r) => acc + (r.latency || 0), 0) / results.totalTests
  };

  return results;
}

module.exports = { runBenchmarks };
