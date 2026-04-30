const express = require("express");
const router = express.Router();
const { extractClaims, searchEvidence, verifyClaims, detectAIText } = require("../services/groq");

router.post("/", async (req, res) => {
  const { text, detectAI = false } = req.body;

  if (!text || text.trim().length < 5) {
    return res.status(400).json({ error: "Please provide at least 5 characters of text." });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  const send = (event, data) => {
    const payload = JSON.stringify({ event, ...data });
    res.write(`data: ${payload}\n\n`);
  };

  try {
    send("stage", { stage: "extracting", message: "Decomposing text into verifiable claims..." });
    const claims = await extractClaims(text);
    send("log", { message: `Found ${claims.length} verifiable claims` });

    let aiDetection = null;
    if (detectAI) {
      send("stage", { stage: "analyzing", message: "Analyzing text origin..." });
      try {
        aiDetection = await detectAIText(text);
        send("log", { message: `AI probability: ${aiDetection.ai_probability}%` });
      } catch (e) {
        send("log", { message: "AI detection skipped: " + e.message });
      }
    }

    send("stage", { stage: "searching", message: "Retrieving evidence from the web..." });
    const claimsWithEvidence = [];

    for (let i = 0; i < claims.length; i++) {
      send("log", { message: `Searching evidence for claim ${i + 1} of ${claims.length}...` });
      try {
        const result = await searchEvidence(claims[i]);
        claimsWithEvidence.push({ claim: claims[i], evidenceText: result.text, sources: result.sources });
      } catch (e) {
        claimsWithEvidence.push({ claim: claims[i], evidenceText: "Search failed.", sources: [] });
      }
    }

    send("stage", { stage: "verifying", message: "Running verification logic..." });
    const verified = await verifyClaims(claimsWithEvidence);

    const scoreMap = { True: 100, "Partially True": 50, False: 0, Unverifiable: 50 };
    const overallScore = Math.round(
      verified.reduce((s, c) => s + (scoreMap[c.verdict] ?? 50), 0) / verified.length
    );

    send("result", {
      stage: "done",
      claims: verified,
      overallScore,
      totalClaims: verified.length,
      aiDetection,
      timestamp: new Date().toISOString(),
    });

    // Report false/partial claims to trending leaderboard
    try {
      const trendingRouter = require("./trending");
      // Direct in-process report (avoid HTTP roundtrip)
      const falseOrPartial = verified.filter(c => c.verdict === "False" || c.verdict === "Partially True");
      if (falseOrPartial.length > 0) {
        // Use the trending module's internal store via a lightweight approach
        const trendingModule = require("./trending");
        // We'll use a simple fetch to our own endpoint
        const port = process.env.PORT || 5000;
        fetch(`http://localhost:${port}/api/trending/report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ claims: falseOrPartial }),
        }).catch(() => {}); // fire-and-forget
      }
    } catch (e) { /* ignore trending errors */ }

  } catch (err) {
    console.error("Pipeline error:", err);
    send("error", { message: err.message || "Verification pipeline failed" });
  } finally {
    res.end();
  }
});

module.exports = router;