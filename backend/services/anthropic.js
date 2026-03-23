const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Extract verifiable claims from input text
 */
async function extractClaims(text) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: `You are a precision claim extraction engine for VeriXa, an elite fact-checking system.

Your task: Decompose the following text into discrete, verifiable factual claims.

Rules:
- Each claim must be atomic (one fact only)
- Each claim must be independently verifiable
- Exclude opinions, predictions, and subjective statements
- Preserve the original meaning precisely
- Return 3-10 claims maximum

Return ONLY a JSON array of strings. No preamble, no markdown fences, no explanation.

Text:
${text}`,
      },
    ],
  });

  const raw = response.content
    .map((b) => b.text || "")
    .join("")
    .replace(/```json|```/g, "")
    .trim();

  return JSON.parse(raw);
}

/**
 * Search for evidence on a specific claim using Claude's web search tool
 */
async function searchEvidence(claim) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [
      {
        role: "user",
        content: `Search the web for evidence to verify this specific claim. Retrieve authoritative, current sources.\n\nClaim: "${claim}"\n\nReturn everything relevant you find.`,
      },
    ],
  });

  const textBlocks = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return textBlocks;
}

/**
 * Verify claims against retrieved evidence using chain-of-thought reasoning
 */
async function verifyClaims(claimsWithEvidence) {
  const formatted = claimsWithEvidence
    .map(
      (item, i) =>
        `Claim ${i + 1}: "${item.claim}"\n\nEvidence:\n${item.evidence.slice(0, 2000)}`
    )
    .join("\n\n---\n\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are VeriXa's verification engine. Use chain-of-thought reasoning to evaluate each claim against its evidence.

For each claim, reason step by step:
1. What does the evidence say?
2. Does it support, contradict, or neither confirm/deny the claim?
3. Are sources conflicting? If so, note this explicitly.
4. What is the appropriate verdict and confidence?

Verdict options:
- "True" — Evidence clearly supports the claim
- "False" — Evidence clearly contradicts the claim  
- "Partially True" — Evidence partially supports or conflicting sources exist
- "Unverifiable" — Insufficient evidence found

Return ONLY a valid JSON array. Each object must have:
{
  "claim": string,
  "verdict": "True" | "False" | "Partially True" | "Unverifiable",
  "confidence_score": number (0-100),
  "reasoning": string (2-3 sentences, cite evidence),
  "conflicting_sources": boolean,
  "sources": [{ "title": string, "snippet": string, "url": string }] (max 3)
}

No markdown, no preamble, valid JSON only.

${formatted}`,
      },
    ],
  });

  const raw = response.content
    .map((b) => b.text || "")
    .join("")
    .replace(/```json|```/g, "")
    .trim();

  return JSON.parse(raw);
}

/**
 * Detect AI-generated text probability
 */
async function detectAIText(text) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `Analyze the following text and estimate the probability it was AI-generated versus human-written.

Consider:
- Sentence structure variety and naturalness
- Use of filler phrases common in LLMs
- Repetitive patterns or formulaic transitions
- Vocabulary diversity and naturalness
- Presence of hallmark AI phrases ("It's worth noting...", "In conclusion...", etc.)
- Overall coherence and logical flow patterns

Return ONLY JSON:
{
  "ai_probability": number (0-100),
  "human_probability": number (0-100),
  "indicators": ["list", "of", "key", "indicators"],
  "assessment": "brief 1-sentence assessment"
}

Text:
${text.slice(0, 3000)}`,
      },
    ],
  });

  const raw = response.content
    .map((b) => b.text || "")
    .join("")
    .replace(/```json|```/g, "")
    .trim();

  return JSON.parse(raw);
}

module.exports = { extractClaims, searchEvidence, verifyClaims, detectAIText };
