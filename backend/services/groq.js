const Groq = require("groq-sdk");
const fetch = require("node-fetch");

function getClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

async function askGroq(prompt, jsonMode = false) {
  const groq = getClient();
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `You are VeriXa — the world's most precise AI fact-verification engine.
You were built by an elite team of AI researchers to combat misinformation.
You are exceptionally thorough, accurate, and evidence-based.
You NEVER guess. You ONLY make verdicts based on retrieved evidence.
You NEVER skip or merge claims. You extract ALL claims as stated.
You always respond in valid JSON as instructed.`,
      },
      { role: "user", content: prompt },
    ],
    temperature: jsonMode ? 0.1 : 0.2,
    response_format: jsonMode ? { type: "json_object" } : undefined,
    max_tokens: 4096,
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
- Extract EVERY single claim no matter how obviously false it seems
- Do NOT skip claims that seem wrong, controversial or like misinformation
- Do NOT merge multiple claims into one
- Keep the EXACT wording from the original text as much as possible
- Each claim must be one sentence only
- You MUST extract ALL claims — minimum 3, maximum 8
- If there are 4 sentences with claims, return 4 claims

EXAMPLE:
Text: "Vaccines cause autism. The earth is flat. COVID started in 2019. 5G causes cancer."
Correct: {"claims": ["Vaccines cause autism", "The earth is flat", "COVID started in 2019", "5G causes cancer"]}
Wrong: {"claims": ["Vaccines cause autism", "COVID started in 2019"]} — you skipped claims!

Text to extract from:
"${text}"

Return ONLY this exact JSON format:
{"claims": ["claim 1", "claim 2", "claim 3", "claim 4"]}`;

  const raw = await askGroq(prompt, true);
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
    searchQuery = await askGroq(queryPrompt);
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
        `Claim ${i + 1}: "${item.claim}"\n\nEvidence Retrieved:\n${item.evidenceText.slice(0, 1500)}`
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
- Always cite SPECIFIC facts from the evidence
- If the claim has a specific error (wrong date, wrong name), state the correct information
- If sources conflict, explicitly mention both sides
- Be precise and factual — no vague language
- For conspiracy theories and misinformation, cite scientific consensus

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

  const raw = await askGroq(prompt, true);
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
${text.slice(0, 2000)}`;

  const raw = await askGroq(prompt, true);
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

module.exports = { extractClaims, searchEvidence, verifyClaims, detectAIText };