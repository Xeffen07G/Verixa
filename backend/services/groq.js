const Groq = require("groq-sdk");
const fetch = require("node-fetch");

function getClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

async function askGroq(prompt, jsonMode = false, model = "llama-3.1-8b-instant") {
  const groq = getClient();
  const completion = await groq.chat.completions.create({
    model: model, // Specific model ID (8b for speed/TPM, 70b for quality)
    messages: [
      {
        role: "system",
        content: `You are VeriXa — the world's most precise AI fact-verification engine.
You are exceptionally thorough, accurate, and evidence-based.
You NEVER guess. You ONLY make verdicts based on retrieved evidence.
You always respond in valid JSON as instructed.`,
      },
      { role: "user", content: prompt },
    ],
    temperature: jsonMode ? 0.1 : 0.2,
    response_format: jsonMode ? { type: "json_object" } : undefined,
    max_completion_tokens: 4096,
  });
  return completion.choices[0].message.content.trim();
}

async function tavilySearch(query) {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        search_depth: "advanced",
        max_results: 6,
        include_answer: true,
        include_raw_content: false,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Tavily error");

    const answer = data.answer ? `Direct Answer: ${data.answer}\n\n` : "";
    const sources = (data.results || [])
      .slice(0, 5)
      .map((r, i) => `[Source ${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content?.slice(0, 500) || ""}`)
      .join("\n\n");

    return {
      text: answer + sources,
      sources: (data.results || []).slice(0, 3).map((r) => ({
        title: r.title,
        snippet: r.content?.slice(0, 200) || "",
        url: r.url,
      })),
    };
  } catch (err) {
    console.error("Tavily search failed:", err.message);
    return { text: "Search unavailable. Insufficient evidence retrieved.", sources: [] };
  }
}

async function extractClaims(text) {
  const prompt = `Extract EVERY factual claim from this text. You must extract ALL of them including false ones and conspiracy theories.

CRITICAL RULES:
- Extract ONLY factual claims that are ACTUALLY STATED in the text
- Extract EVERY single claim no matter how obviously false it seems
- Do NOT skip claims that seem wrong, controversial or like misinformation
- Do NOT merge multiple claims into one
- Keep the EXACT wording from the original text as much as possible
- Each claim must be one sentence only
- Extract between 1 and 8 claims — extract however many exist in the text
- If there is only 1 claim in the text, return exactly 1 claim
- NEVER invent claims that are not in the text
- NEVER add meta-commentary like "the text is too short" or "there are no claims"
- NEVER add observations ABOUT the text itself — only extract claims FROM the text

EXAMPLE 1:
Text: "Vaccines cause autism. The earth is flat. COVID started in 2019. 5G causes cancer."
Correct: {"claims": ["Vaccines cause autism", "The earth is flat", "COVID started in 2019", "5G causes cancer"]}

EXAMPLE 2:
Text: "Elon Musk founded Apple."
Correct: {"claims": ["Elon Musk founded Apple"]}
Wrong: {"claims": ["Elon Musk founded Apple", "The text is too short", "There are no other claims"]}

Text to extract from (truncated for performance):
"${text.slice(0, 8000)}"

Return ONLY this exact JSON format:
{"claims": ["claim 1", "claim 2"]}`;

  // Using 8b model for extraction (faster, higher TPM limit)
  const raw = await askGroq(prompt, true, "llama-3.1-8b-instant");
  const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  return parsed.claims || parsed;
}

async function searchEvidence(claim) {
  const queryPrompt = `Create the best Google search query to fact-check this claim.
The query should find authoritative sources like Wikipedia, BBC, Reuters, WHO, CDC, official websites.
Return ONLY the search query — no explanation, no quotes, no punctuation at the end.

Claim: "${claim}"`;

  let searchQuery = claim;
  try {
    // Using 8b model for search query generation
    searchQuery = await askGroq(queryPrompt, false, "llama-3.1-8b-instant");
    searchQuery = searchQuery.replace(/"/g, "").trim();
  } catch (e) {
    // fallback to raw claim
  }

  return await tavilySearch(searchQuery);
}

async function verifyClaims(claimsWithEvidence) {
  const formatted = claimsWithEvidence
    .map(
      (item, i) =>
        `Claim ${i + 1}: "${item.claim}"\n\nEvidence Retrieved:\n${item.evidenceText.slice(0, 800)}`
    )
    .join("\n\n═══════════════\n\n");

  const prompt = `You are VeriXa's verification engine. Carefully evaluate each claim against ONLY the retrieved evidence.

VERDICT RULES:
- "True" — The evidence CLEARLY and DIRECTLY confirms the claim is correct
- "False" — The evidence CLEARLY contradicts or disproves the claim
- "Partially True" — The claim is PARTLY correct OR sources give conflicting information
- "Unverifiable" — The evidence is insufficient, irrelevant, or not found

CONFIDENCE RULES:
- 90-100: Multiple authoritative sources agree completely
- 70-89: One strong source or multiple weaker sources agree
- 50-69: Some evidence but not conclusive
- 0-49: Very little relevant evidence

REASONING RULES:
- Always cite SPECIFIC facts from the evidence (dates, names, specific numbers)
- For historical "founding" claims: distinguish between original incorporators and later co-founders/investors. 
- If the claim is "X made Y", check if X was the ORIGINAL creator. If X joined later, even as a co-founder, the verdict should be "Partially True" or "False" depending on wording.
- If the claim has a specific error (wrong date, wrong name), state the correct information clearly.
- If sources conflict (e.g., popular narrative vs technical record), explicitly mention both and lean towards the technical record.
- Be precise and factual — no vague language.
- For conspiracy theories and misinformation, cite scientific/official consensus.

IMPORTANT: You MUST return a verdict for EVERY claim. Never skip any claim.

Return ONLY this JSON format:
{
  "results": [
    {
      "claim": "exact original claim text",
      "verdict": "True" or "False" or "Partially True" or "Unverifiable",
      "confidence_score": integer 0-100,
      "reasoning": "Specific 2-3 sentence explanation citing evidence with correct facts",
      "conflicting_sources": true or false
    }
  ]
}

Claims to verify:
${formatted}`;

  // Keeping 70b model for final verification (best results)
  const raw = await askGroq(prompt, true, "llama-3.3-70b-versatile");
  const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  const verified = parsed.results || parsed;

  return verified.map((item, i) => ({
    ...item,
    sources: claimsWithEvidence[i]?.sources || [],
  }));
}

async function detectAIText(text) {
  const prompt = `You are an expert AI text detector. Analyze this text and determine if it was written by a human or generated by an AI language model.

Look for these AI indicators:
- Overly structured or formulaic writing
- Unnatural transitions ("Furthermore", "Moreover", "It is worth noting")
- Lack of personal voice or emotion
- Perfectly balanced sentences
- Generic or vague statements
- Absence of typos or colloquialisms
- Repetitive sentence structures

Look for these human indicators:
- Natural imperfections and varied sentence length
- Personal opinions and emotions
- Colloquial language or slang
- Unique perspective or voice
- Occasional errors or informal language

Return ONLY this JSON format:
{
  "ai_probability": integer 0-100,
  "human_probability": integer 0-100,
  "indicators": ["specific indicator 1", "specific indicator 2", "specific indicator 3"],
  "assessment": "one clear sentence explaining your conclusion"
}

Text to analyze:
${text.slice(0, 3000)}`;

  // Using 8b for AI detection (fast)
  const raw = await askGroq(prompt, true, "llama-3.1-8b-instant");
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

module.exports = { extractClaims, searchEvidence, verifyClaims, detectAIText };