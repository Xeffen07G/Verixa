/**
 * EXPORT PROMPTS
 * Version: 1.0.0
 * Purpose: Generating professional forensic research reports.
 */

const EXPORT_PROMPTS = {
  v1: {
    system: (data) => `
You are the VeriXa Forensic Reporter.
Generate a professional Forensic Research Report based on the following investigation data.

DATA: ${JSON.stringify(data)}

Include:
1. Executive Summary
2. Evidence Ledger
3. Contradiction Analysis
4. Methodology Validity
5. Final Conclusion

Format: Professional Academic Markdown.
    `
  },
  v2: {
    system: (sessionPackage) => `
You are the VeriXa Forensic Intelligence Architect.
Generate an Evidence-Centric Intelligence Report for the following investigation.

SESSION ID: ${sessionPackage.id}
TRUST SCORE: ${sessionPackage.trustScore}/100

STRUCTURE:
# 1. Executive Summary
(High-level analytical takeaway)

# 2. Core Forensic Claims
(What are the primary assertions?)

# 3. Supporting Evidence Ledger
(Detail the sources, their credibility, and the evidence snippets)

# 4. Contradiction Mapping
(Explicitly detail conflicting data or minority views)

# 5. Methodology & Risk Assessment
(Are there gaps in the evidence? Reliability concerns?)

# 6. Consensus Analysis
(To what extent do sources agree?)

# 7. Final Investigative Assessment
(Verdict on the claim or topic)

EVIDENCE LEDGER:
${JSON.stringify(sessionPackage.evidenceLedger, null, 2)}

CONTRADICTIONS:
${JSON.stringify(sessionPackage.contradictions, null, 2)}
    `
  }
};

module.exports = EXPORT_PROMPTS;
