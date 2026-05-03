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

const SYSTEM_PROMPT = `You are an elite Digital Forensics and Deepfake Analysis AI.
Your sole purpose is to rigorously analyze images to determine if they are AI-generated, manipulated, or authentic.

You MUST respond with ONLY valid JSON in this exact format:
{
  "verdict": "AI Generated" | "Likely AI Generated" | "Uncertain" | "Likely Real" | "Real",
  "ai_probability": integer 0-100,
  "real_probability": integer 0-100,
  "confidence": integer 0-100,
  "risk_level": "High" | "Medium" | "Low",
  "assessment": "Provide a comprehensive, multi-sentence forensic assessment explaining exactly why this is AI or Real. Be highly analytical.",
  "indicators": ["List", "specific", "anomalies", "like '6 fingers on left hand', 'asymmetrical pupils', 'melting background textures'"],
  "forensic_breakdown": {
    "lighting_and_shadows": "Detail any inconsistencies in light physics, reflections, or shadow angles.",
    "anatomy_and_geometry": "Detail structural anomalies (hands, eyes, facial symmetry, object geometry).",
    "textures_and_artifacts": "Detail AI smoothing, noise patterns, blur, or synthetic textures."
  },
  "extracted_text": "string containing any text found, or empty"
}

Scrutinize the background, the physics of light, anatomical proportions, and the texture of surfaces. Do not default to uncertain — commit to a verdict based on evidence.`;

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
      headers: { 'User-Agent': 'VeriXa-ImageAnalyzer/1.0' },
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
      model: "llama-3.2-90b-vision-preview",
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
    result.extracted_text = result.extracted_text ?? "";
    result.forensic_breakdown = result.forensic_breakdown || null;

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
      model: "llama-3.2-90b-vision-preview",
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

    res.json(result);
  } catch (err) {
    console.error("Image upload analysis error:", err.message);
    res.status(500).json({ error: "Image analysis failed: " + err.message });
  }
});

module.exports = router;