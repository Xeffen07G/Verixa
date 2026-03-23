const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");

function getClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const VISION_PROMPT = `You are VeriXa's image authenticity analyzer.

CRITICAL: You MUST respond with ONLY a JSON object. No explanation, no preamble, no text before or after the JSON.

Examine this image and return ONLY this JSON:
{
  "ai_probability": <integer 0-100>,
  "real_probability": <integer 0-100>,
  "verdict": "<one of: AI Generated, Likely AI Generated, Uncertain, Likely Real, Real>",
  "confidence": <integer 0-100>,
  "indicators": ["<observation 1>", "<observation 2>", "<observation 3>"],
  "assessment": "<2 sentence explanation>",
  "risk_level": "<one of: High, Medium, Low>"
}

Base your analysis on:
- Facial features naturalness
- Background consistency
- Lighting and shadows
- Edge artifacts
- Overall coherence

REMEMBER: Return ONLY the JSON object. Nothing else.`;

async function analyzeImage(content) {
  const groq = getClient();
  const completion = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [{
      role: "user",
      content,
    }],
    max_tokens: 1024,
    temperature: 0.1,
  });

  let raw = completion.choices[0].message.content.trim();

  // Extract JSON if model added extra text anyway
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) raw = jsonMatch[0];

  return JSON.parse(raw);
}

router.post("/url", async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });

  try { new URL(imageUrl); }
  catch { return res.status(400).json({ error: "Invalid URL format" }); }

  try {
    const result = await analyzeImage([
      { type: "image_url", image_url: { url: imageUrl } },
      { type: "text", text: VISION_PROMPT },
    ]);
    res.json(result);
  } catch (err) {
    console.error("Image analysis error:", err.message);
    res.status(500).json({ error: "Image analysis failed: " + err.message });
  }
});

router.post("/upload", express.raw({
  type: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  limit: "10mb"
}), async (req, res) => {
  if (!req.body || req.body.length === 0) {
    return res.status(400).json({ error: "No image data received" });
  }

  const mimeType = req.headers["content-type"] || "image/jpeg";
  const base64Data = req.body.toString("base64");

  try {
    const result = await analyzeImage([
      { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } },
      { type: "text", text: VISION_PROMPT },
    ]);
    res.json(result);
  } catch (err) {
    console.error("Image analysis error:", err.message);
    res.status(500).json({ error: "Image analysis failed: " + err.message });
  }
});

module.exports = router;