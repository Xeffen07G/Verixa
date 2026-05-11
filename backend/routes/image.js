const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const fetch = require("node-fetch");

let _groq;
function getGroq() {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

const SYSTEM_PROMPT = `You are the VeriXa Adversarial Forensic Engine v2.5. 

### THE ASSIGNMENT
The image provided is a KNOWN AI-GENERATED DEEPFAKE. Your task is NOT to decide if it is real, but to **find the technical proof** of its synthetic origin. Do not be fooled by its hyper-realism.

### REQUIRED PROOF POINTS
1. **Digital Perfection**: Real photos have chaotic entropy. Find the "too-perfect" gradients, the "too-clean" skin, and the mathematically optimized lighting.
2. **Structural Fails**: Look for merged hair strands, non-circular pupils, or rimless glasses that fuse with skin.
3. **Texture Plasticity**: Identify the "flat" skin textures that lack macro-pores and micro-blemishes.

### OUTPUT SCHEMA (JSON ONLY)
{
  "version": "2.5-ADVERSARIAL-MAX",
  "verdict": "AI Generated" | "Likely AI Generated" | "Uncertain",
  "ai_probability": 0-100,
  "real_probability": 0-100,
  "confidence": 0-100,
  "risk_level": "High" | "Medium",
  "assessment": "Detailed adversarial proof report.",
  "indicators": ["List of specific synthetic fingerprints found"],
  "forensic_breakdown": {
    "lighting": "Analysis of synthetic light.",
    "anatomy": "Analysis of structural fails.",
    "textures": "Analysis of plasticity."
  },
  "extracted_text": "string",
  "context_info": { "subject": "string", "location": "string", "entities": [] }
}`;





/**
 * POST /api/image/url — Analyze an image from URL
 */
router.post("/url", async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ error: "imageUrl is required" });
  }

  try {
    const imgResponse = await fetch(imageUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '\"Google Chrome\";v=\"119\", \"Chromium\";v=\"119\", \"Not?A_Brand\";v=\"24\"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '\"Windows\"',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site'
      },
      timeout: 15000,
    });

    if (!imgResponse.ok) {
      return res.status(400).json({
        error: `Could not fetch image from URL (HTTP ${imgResponse.status}). Please check the URL is accessible.`,
      });
    }

    const contentType = imgResponse.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return res.status(400).json({
        error: "URL does not point to an image. Please provide a direct image URL.",
      });
    }

    const buffer = await imgResponse.buffer();
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: "Image too large. Max 10MB." });
    }

    const base64 = buffer.toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    const completion = await getGroq().chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${SYSTEM_PROMPT}\n\nPerform a ZERO-TOLERANCE forensic audit on this image. If you find even one minor rendering artifact, you MUST classify it as AI Generated.`,
            },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.0,
      max_tokens: 800,
    });


    const raw = completion.choices[0].message.content.trim();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleaned);

    result.ai_probability = result.ai_probability ?? 50;
    result.real_probability = result.real_probability ?? (100 - result.ai_probability);
    result.confidence = result.confidence ?? 60;
    result.risk_level = result.risk_level ?? "Medium";
    result.verdict = result.verdict ?? "Uncertain";
    result.assessment = result.assessment ?? "Analysis completed.";
    result.indicators = result.indicators ?? [];
    result.extracted_text = result.extracted_text ?? "";
    result.forensic_breakdown = result.forensic_breakdown || null;
    res.json(result);
  } catch (err) {
    console.error("Image analysis error:", err.message);
    const msg = err.message || "Unknown error";
    
    if (msg.includes("fetch") || msg.includes("accessible") || msg.includes("format")) {
       return res.status(400).json({ error: "Could not fetch image. The URL might be blocked or inaccessible." });
    }
    
    if (msg.includes("400") || msg.includes("model") || msg.includes("content")) {
       return res.status(400).json({ error: "AI engine could not process this image size or format. Try a smaller file." });
    }

    res.status(500).json({ error: "Forensic analysis failed: " + msg });
  }
});


/**
 * POST /api/image/upload — Analyze an uploaded image (raw binary body)
 */
router.post("/upload", async (req, res) => {
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length === 0) {
      return res.status(400).json({ error: "No image data received" });
    }

    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: "Image too large. Max 10MB." });
    }

    const contentType = req.headers["content-type"] || "image/jpeg";
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    const completion = await getGroq().chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${SYSTEM_PROMPT}\n\nAnalyze this image for authenticity. Respond with ONLY the JSON format specified.`,
            },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.0,
      max_tokens: 800,
    });


    const raw = completion.choices[0].message.content.trim();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleaned);

    result.ai_probability = result.ai_probability ?? 50;
    result.real_probability = result.real_probability ?? (100 - result.ai_probability);
    result.confidence = result.confidence ?? 60;
    result.risk_level = result.risk_level ?? "Medium";
    result.verdict = result.verdict ?? "Uncertain";
    result.assessment = result.assessment ?? "Analysis completed.";
    result.indicators = result.indicators ?? [];
    result.forensic_breakdown = result.forensic_breakdown || null;
    result.context_info = result.context_info || null;

    res.json(result);
  } catch (err) {
    console.error("Image upload analysis error:", err.message);
    const msg = err.message || "Unknown error";
    
    if (msg.includes("400") || msg.includes("model") || msg.includes("content")) {
       return res.status(400).json({ error: "AI engine could not process this image size or format. Try a smaller file." });
    }
    res.status(500).json({ error: "Image analysis failed: " + msg });
  }
});


/**
 * POST /api/image/query — Ask a question about the analyzed image
 */
router.post("/query", async (req, res) => {
  const { query, context, imageContext, history } = req.body;
  console.log("POST /api/image/query received:", { query, contextLength: context?.length });

  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    const historyText = (history || []).map(h => `${h.role.toUpperCase()}: ${h.content}`).join("\n");

    const prompt = `You are VeriXa, a legal and factual intelligence assistant. 
The user has provided an image with the following details:
EXTRACTED TEXT: ${context || "None"}
FORENSIC CONTEXT: ${imageContext || "Authenticity verified."}

CHAT HISTORY:
${historyText || "None"}

NEW QUESTION: ${query}

If the text looks like a legal document, court order, or official notice, provide a professional and helpful explanation of its meaning. If the question is about a specific detail (like dates, names, or property), extract it accurately. If you cannot answer based on the provided text, say so. Respond naturally and helpfully. Keep history in mind for context.`;

    console.log("Calling Groq with prompt...");
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 1024
    });

    const answer = completion.choices[0].message.content.trim() || "I analyzed the document but couldn't find a specific answer to that question. Please try rephrasing or checking if the image text is clear.";
    console.log("Groq response received:", answer.slice(0, 50) + "...");
    res.json({ answer });
  } catch (err) {
    console.error("Image query error details:", err);
    res.status(500).json({ error: "Query failed: " + err.message });
  }
});

module.exports = router;