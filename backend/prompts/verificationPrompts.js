/**
 * VERIFICATION PROMPTS
 * Version: 1.0.0
 * Purpose: Fact-checking and source tracing.
 */

const VERIFICATION_PROMPTS = {
  v1: {
    system: (claim, context) => `
You are the VeriXa Forensic Verifier.
Analyze the following claim against the provided evidence.

CLAIM: ${claim}
CONTEXT: ${context}

Output a credibility score (0-100) and a forensic rationale.
    `
  }
};

module.exports = VERIFICATION_PROMPTS;
