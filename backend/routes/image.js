const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const fetch = require("node-fetch");

function getClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const SYSTEM_PROMPT = `You are VeriXa's image authenticity analysis engine.
You analyze images to determine if they are AI-generated, manipulated, or authentic.

You MUST respond with ONLY valid JSON in this exact format:
{
  "verdict": "AI Generated" | "Likely AI Generated" | "Uncertain" | "Likely Real" | "Real",
  "ai_probability": integer 0-100,
  "real_probability": integer 0-100,
  "confidence": integer 0-100,
  "risk_level": "High" | "Medium" | "Low",
  "assessment": "1-2 sentence assessment of the image",
  "indicators": ["list", "of", "specific", "indicators", "found"]
}

Analyze carefully for:
- Unnatural smoothness, warping, or artifacts typical of AI generation
- Inconsistent lighting, shadows, or reflections
- Anomalies in text, hands, fingers, teeth, or fine details
- Background inconsistencies or blending artifacts
- Overly perfect symmetry or composition
- Signs of deepfake manipulation in faces
- Metadata-level clues (if available)

Be precise and calibrated. Do not default to uncertain — commit to a verdict based on evidence.`;

/**
 * POST /api/image/url — Analyze an image from URL
 */
router.post("/url", async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ error: "imageUrl is required" });
  }

    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.2-11b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `${SYSTEM_PROMPT}\n\nAnalyze this image for authenticity. Is it AI-generated, manipulated, or real? Respond with ONLY the JSON format specified.`,
              },
              {
                type: "image_url",
                image_url: { url: imageUrl },
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

    // Ensure required fields
    result.ai_probability = result.ai_probability ?? 50;
    result.real_probability = result.real_probability ?? (100 - result.ai_probability);
    result.confidence = result.confidence ?? 60;
    result.risk_level = result.risk_level ?? "Medium";
    result.verdict = result.verdict ?? "Uncertain";
    result.assessment = result.assessment ?? "Analysis completed.";
    result.indicators = result.indicators ?? [];

    res.json(result);
  } catch (err) {
    console.error("Image URL analysis error:", err.message);

    // If vision model fails, fall back to a text-based analysis
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

    // Determine mime type from content-type header or default
    const contentType = req.headers["content-type"] || "image/jpeg";
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.2-11b-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${SYSTEM_PROMPT}\n\nAnalyze this image for authenticity. Is it AI-generated, manipulated, or real? Respond with ONLY the JSON format specified.`,
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

    // Ensure required fields
    result.ai_probability = result.ai_probability ?? 50;
    result.real_probability = result.real_probability ?? (100 - result.ai_probability);
    result.confidence = result.confidence ?? 60;
    result.risk_level = result.risk_level ?? "Medium";
    result.verdict = result.verdict ?? "Uncertain";
    result.assessment = result.assessment ?? "Analysis completed.";
    result.indicators = result.indicators ?? [];

    res.json(result);
  } catch (err) {
    console.error("Image upload analysis error:", err.message);
    res.status(500).json({ error: "Image analysis failed: " + err.message });
  }
});

module.exports = router;