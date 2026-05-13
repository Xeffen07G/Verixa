const { askGroq } = require("./groq");

/**
 * Specialized Agents for Evidence Intelligence.
 */

async function SummarizationAgent(documentId, context) {
  const prompt = `Generate a high-level technical summary for document ${documentId}.
  Focus on unique contributions and core findings.
  
  CONTEXT:
  ${context}
  
  Respond in JSON: { "summary": "...", "highlights": ["..."] }`;
  return JSON.parse(await askGroq(prompt, true, "llama-3.3-70b-versatile"));
}

async function ContradictionAgent(query, contexts) {
  const prompt = `Identify any logical contradictions or conflicting evidence regarding "${query}" within these sources.
  
  SOURCES:
  ${contexts.join("\n\n---\n\n")}
  
  Respond in JSON: { "contradictions": [ { "point": "...", "sourceA": "...", "sourceB": "...", "reconciliation": "..." } ] }`;
  return JSON.parse(await askGroq(prompt, true, "llama-3.3-70b-versatile"));
}

async function CitationAgent(answer, sources) {
  const prompt = `Verify and refine citations for this answer. Ensure every claim maps to the most relevant source.
  
  ANSWER: ${answer}
  SOURCES: ${sources.map(s => `[${s.id}] ${s.text}`).join("\n")}
  
  Respond in JSON: { "refined_answer": "...", "citations_verified": true }`;
  return JSON.parse(await askGroq(prompt, true, "llama-3.1-8b-instant"));
}

async function MethodologyAgent(context) {
  const prompt = `Extract and analyze the methodology used in this document. Rate its technical rigor (0-100).
  
  CONTEXT: ${context}
  
  Respond in JSON: { "methodology": "...", "rigor_score": 0-100, "pros": [], "cons": [] }`;
  return JSON.parse(await askGroq(prompt, true, "llama-3.3-70b-versatile"));
}

module.exports = {
  SummarizationAgent,
  ContradictionAgent,
  CitationAgent,
  MethodologyAgent
};
