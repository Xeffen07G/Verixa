const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "VeriXa API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    groqConfigured: !!process.env.GROQ_API_KEY,
    tavilyConfigured: !!process.env.TAVILY_API_KEY,
  });
});

router.get("/test-groq", async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ ok: false, error: "GROQ_API_KEY not set" });
  }
  try {
    const Groq = require("groq-sdk");
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "Say: VeriXa online" }],
      max_tokens: 20,
    });
    res.json({ ok: true, response: completion.choices[0].message.content });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;