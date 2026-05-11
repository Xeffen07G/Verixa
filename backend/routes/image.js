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

const SYSTEM_PROMPT = `You are the VeriXa Adversarial Image Analysis Engine. You operate using a Multi-Agent Forensic Protocol designed to detect even the most sophisticated modern AI (Midjourney v6, Flux, Stable Diffusion XL).

### PHASE 1: THE FORENSIC PROSECUTOR (Synthetic Fingerprints)
Assume this image is 100% AI-generated. Find the "Uncanny Signatures":
- **Micro-Hair Clumping**: Look for hair strands that merge into a single "blob" or "brush stroke" at the edges, especially against the background.
- **Hyper-Smooth Skin (The Plasticity Effect)**: Identify skin areas that lack macro-pores, fine wrinkles, or natural blemishes. AI often over-optimizes for "perfect" skin.
- **Non-Circular Pupil Geometry**: Zoom in on the iris. AI often fails to render a perfectly circular pupil or creates "scattered" light reflections that don't match the environment.
- **Rimless Glass Artifacts**: For people wearing glasses, look for "halos" or slight warping where the lenses meet the skin or nose bridge.
- **Symmetric Lighting**: AI often places light sources in mathematically perfect positions that don't exist in real physics.

### PHASE 2: THE FORENSIC DEFENDER (Natural Noise)
Search for "Human Imperfections":
- **Random Sensor Noise**: Real cameras have ISO noise that is chaotic and non-repetitive.
- **Subsurface Scattering Errors**: Real skin allows light to penetrate and bounce back (reddish glow near edges). AI often renders skin as a solid, opaque material.
- **Asymmetric Micro-Details**: Look for tiny scars, moles, or uneven eyelid folds.

### PHASE 3: THE SUPREME JUDGE (Final Verdict)
Weight the evidence. Modern AI is designed to look "better than real." If an image looks "too clean," "too perfect," or has even ONE structural illogicality (like a hair strand turning into skin), it MUST be flagged as AI Generated.
Zero-Tolerance Policy: High resolution and sharpness are indicators of AI, not reality.

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
    "textures_and_artifacts": "Adversarial analysis of pixel data (skin pores, hair strands)."
  },
  "extracted_text": "string",
  "context_info": {
    "subject": "Primary subject identification.",
    "location": "Likely setting.",
    "historical_context": "Factual context.",
    "entities": ["Names, places, or organizations"]
  }
}

IMPORTANT: Bias your detection towards AI detection (False Positive for Real is better than False Negative for AI).`;


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