const express = require("express");
const router = express.Router();
const { extractClaims, searchEvidence, verifyClaims, detectAIText } = require("../services/groq");

router.post("/", async (req, res) => {
  const { text, detectAI = false } = req.body;

  if (!text || text.trim().length < 5) {
    return res.status(400).json({ error: "Please provide at least 5 characters of text." });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (event, data) => {
    const payload = JSON.stringify({ event, ...data });
    res.write(`data: ${payload}\n\n`);
  };

  try {
    send("stage", { stage: "extracting", message: "Decomposing text & analyzing origin..." });
    
    // Run extraction and AI detection in parallel to save significant time
    // Adding a 60-second timeout to prevent permanent hangs
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Verification timed out during extraction")), 60000)
    );

    const extractPromise = extractClaims(text).then(claims => {
      send("log", { message: `Found ${claims.length} verifiable claims` });
      return claims;
    });

    let aiDetectionPromise = Promise.resolve(null);
    if (detectAI) {
      aiDetectionPromise = detectAIText(text)
        .then(res => {
          send("log", { message: `AI probability: ${res.ai_probability}%` });
          return res;
        })
        .catch(e => {
          send("log", { message: "AI detection skipped: " + e.message });
          return null;
        });
    }

    const [claims, aiDetection] = await Promise.race([
      Promise.all([extractPromise, aiDetectionPromise]),
      timeoutPromise
    ]);

    // Send extracted claims immediately to the frontend so they can see what's being checked
    send("claims_extracted", { claims });

    send("stage", { stage: "searching", message: "Retrieving evidence & verifying truth..." });
    
    // Process each claim independently and stream results back immediately
    const verifiedResults = [];
    for (let index = 0; index < claims.length; index++) {
      const claim = claims[index];
      try {
        // Add a 500ms delay between claims to stay under TPM limits
        if (index > 0) await new Promise(r => setTimeout(r, 500));

        // 1. Search evidence for this specific claim
        const evidence = await searchEvidence(claim);
        send("log", { message: `Evidence found for claim #${index + 1}` });

        // 2. Verify this specific claim immediately
        const singleClaimResult = await verifyClaims([{ claim, evidenceText: evidence.text, sources: evidence.sources }]);
        const result = singleClaimResult[0];

        // 3. Stream this specific result to the frontend
        send("claim_verified", { claim: result, index });
        verifiedResults.push(result);
      } catch (e) {
        console.error(`Error verifying claim #${index + 1}:`, e);
        const errorResult = { claim, verdict: "Unverifiable", confidence_score: 0, reasoning: "Internal processing error.", sources: [] };
        send("claim_verified", { claim: errorResult, index });
        verifiedResults.push(errorResult);
      }
    }

    const scoreMap = { True: 100, "Partially True": 50, False: 0, Unverifiable: 50 };
    const overallScore = Math.round(
      verifiedResults.reduce((s, c) => s + (scoreMap[c.verdict] ?? 50), 0) / verifiedResults.length
    );

    send("result", {
      stage: "done",
      claims: verifiedResults,
      overallScore,
      totalClaims: verifiedResults.length,
      aiDetection,
      timestamp: new Date().toISOString(),
    });

    // Report to trending (same logic as before)
    try {
      const falseOrPartial = verifiedResults.filter(c => c.verdict === "False" || c.verdict === "Partially True");
      if (falseOrPartial.length > 0) {
        const protocol = req.secure ? "https" : "http";
        const host = req.get("host");
        fetch(`${protocol}://${host}/api/trending/report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ claims: falseOrPartial }),
        }).catch(() => {});
      }
    } catch (e) {}

  } catch (err) {
    console.error("Pipeline error:", err);
    send("error", { message: err.message || "Verification pipeline failed" });
  } finally {
    res.end();
  }
});

module.exports = router;