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

const SYSTEM_PROMPT = `You are a world-class Digital Forensics and Deepfake Detection Specialist. 
Your mission is to expose AI-generated images, no matter how realistic they appear.

### THE HYPER-CRITICAL FORENSIC PROTOCOL:
1. **Assume Synthetic Origin**: Start by assuming the image is AI-generated and look for the artifacts to prove it. High realism is a signature of modern AI (like Midjourney v6 or DALL-E 3), not a proof of reality.
2. **Microscopic Scrutiny**:
   - **Eyes**: Check for "synthetic glint" (overly symmetric or misplaced reflections) and "irregular pupils" (non-perfectly circular or mismatched sizes).
   - **Edges**: Look for "hair merging" where individual strands blend into the background or skin in ways that defy physics.
   - **Skin Texture**: Check for "frequency separation artifacts"—areas that are overly smooth next to areas with hyper-detailed fake pores.
   - **Lighting Physics**: Analyze if shadows are mathematically perfect but physically impossible.
   - **Background**: Check for "hallucinated textures"—objects in the distance that melt into each other.

You MUST respond with ONLY valid JSON in this exact format:
{
  "verdict": "AI Generated" | "Likely AI Generated" | "Uncertain" | "Likely Real" | "Real",
  "ai_probability": integer 0-100,
  "real_probability": integer 0-100,
  "confidence": integer 0-100,
  "risk_level": "High" | "Medium" | "Low",
  "assessment": "A cold, analytical forensic report detailing the EXACT structural failures found.",
  "indicators": ["Specific forensic markers found"],
  "forensic_breakdown": {
    "lighting_and_shadows": "Deep analysis of light-matter interaction.",
    "anatomy_and_geometry": "Symmetry, anatomy, and structural coherence analysis.",
    "textures_and_artifacts": "Analysis of frequency, noise, and rendering patterns."
  },
  "extracted_text": "string"
}

Be brutal. Do not be fooled by high resolution or cinematic lighting. If it looks "too perfect," it is almost certainly AI.`;

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

    res.json(result);
  } catch (err) {
    console.error("Image upload analysis error:", err.message);
    res.status(500).json({ error: "Image analysis failed: " + err.message });
  }
});

module.exports = router;