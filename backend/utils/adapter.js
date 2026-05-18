/**
 * VeriXa Compatibility Adapter
 * Normalizes newer forensic pipeline responses into original UI/UX structures.
 */

/**
 * Normalizes a Research Workspace (RAG) response into a Verification Lab response.
 * @param {Object} raw - The raw response from handleRagQueryInternal
 * @returns {Object} - The normalized verification result
 */
function normalizeVerificationResponse(raw) {
  if (!raw) return null;

  // If it's already in the original format, return as is
  if (raw.verdict && raw.claims) {
    return raw;
  }

  // Map confidenceLabel to original verdicts
  const labelMap = {
    'HIGH': 'True',
    'MEDIUM': 'Partially True',
    'LOW': 'False',
    'NONE': 'Unverifiable',
    'NO EVIDENCE': 'Unverifiable',
    'LIMITED': 'Partially True'
  };

  const verdict = labelMap[raw.confidenceLabel] || 'Unverifiable';
  
  // Create a single claim from the answer if it's a general query
  const claims = [{
    claim: raw.intent === 'SYNTHESIS' ? 'General Synthesis' : 'Grounded Investigation',
    verdict: verdict,
    reasoning: raw.answer || 'Analysis completed.',
    sources: (raw.sources || []).map(s => ({
      title: s.metadata?.source || s.label || 'Source',
      url: s.url || '',
      snippet: s.text || ''
    }))
  }];

  return {
    overallScore: Math.round((raw.confidence || 0) * 100),
    claims: claims,
    verdict: verdict,
    reasoning: raw.answer,
    sources: claims[0].sources,
    telemetry: raw.telemetry,
    contradictions: raw.contradictions
  };
}

module.exports = {
  normalizeVerificationResponse
};
