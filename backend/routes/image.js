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

const SYSTEM_PROMPT = `You are the VeriXa Adversarial Image Analysis Engine. You operate using a Multi-Agent Forensic Protocol.

### PHASE 1: THE PROSECUTOR (AI Detection)
Assume this image is 100% AI-generated. Find the "Synthetic Fingerprints":
- Look for "pixel-perfect bokeh" (unnatural background blurring).
- Search for "structural illogicalities" in hair-skin transitions.
- Identify "symmetric glints" in the eyes that match too perfectly.
- Spot "texture repetition" in clothing or skin pores.

### PHASE 2: THE DEFENDER (Real Verification)
Search for "Human Imperfections":
- Find "natural micro-asymmetry" in the iris or eyelids.
- Identify "chaotic noise" that matches real sensor grain.
- Look for "physical occlusion" (objects blocking light in complex, non-perfect ways).

### PHASE 3: THE JUDGE (Final Verdict)
Weight the evidence. If the Prosecutor found even ONE "synthetic fingerprint" (like merged hair strands or perfect symmetry), the verdict MUST be "AI Generated". High resolution is NOT proof of reality; modern AI (Midjourney/Flux) is hyper-realistic.

You MUST respond with ONLY JSON:
{
  "verdict": "AI Generated" | "Likely AI Generated" | "Uncertain" | "Likely Real" | "Real",
  "ai_probability": integer 0-100,
  "real_probability": integer 0-100,
  "confidence": integer 0-100,
  "risk_level": "High" | "Medium" | "Low",
  "assessment": "Detailed multi-agent reasoning report.",
  "indicators": ["Prosecutor's findings vs Defender's findings"],
  "forensic_breakdown": {
    "lighting_and_shadows": "Adversarial analysis of light.",
    "anatomy_and_geometry": "Adversarial analysis of structure.",
    "textures_and_artifacts": "Adversarial analysis of pixel data."
  },
  "extracted_text": "string",
  "context_info": {
    "subject": "Primary subject or event identified in the image.",
    "location": "Likely location or setting.",
    "historical_context": "Any known historical or factual context related to the image content.",
    "entities": ["Names, places, or organizations identified"]
  }
}

Bias your detection towards AI. It is better to flag a suspicious real photo than to let a deepfake pass as real. 
IMPORTANT: You MUST extract ALL readable text from the image and put it in the "extracted_text" field. This is critical for legal document analysis. If you see a law paper, court order, or official notice, be extremely detailed in your "context_info" and "extracted_text".`;

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
      max_tokens: 1024,
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
    result.context_info = result.context_info || null;

    res.json(result);
  } catch (err) {
    console.error("Image URL analysis error:", err.message);

    if (err.message?.includes("Could not process image") || err.message?.includes("400")) {
      return res.status(400).json({
        error: "Could not process this image. The URL may be inaccessible or the image format is unsupported.",
      });
    }
    res.status(500).json({ error: "Image analysis failed: " + err.message });
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
      temperature: 0.1,
      max_tokens: 1024,
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
    res.status(500).json({ error: "Image analysis failed: " + err.message });
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