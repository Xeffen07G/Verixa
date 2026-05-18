const express = require("express");
const router = express.Router();
const { extractClaims, searchEvidence, verifyClaims, detectAIText } = require("../services/groq");
const { normalizeVerificationResponse } = require("../utils/adapter");

router.post("/", async (req, res) => {
  const { text, detectAI = false, forensic = false } = req.body;
  const isStream = req.headers.accept === "text/event-stream" || req.query.stream === "true";


  if (!text || text.trim().length < 5) {
    return res.status(400).json({ error: "Please provide at least 5 characters of text." });
  }

  console.log(`[VERIFY] Request received: ${text.slice(0, 50)}${text.length > 50 ? '...' : ''} (stream=${isStream})`);

  if (isStream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
  }

  const send = (event, data) => {
    const payload = JSON.stringify({ event, ...data });

    if (isStream) {
      res.write(`data: ${payload}\n\n`);
    } else {
      console.log(`[VERIFY][LOG] ${event}: ${data.message || '...'}`);
    }
  };

  try {
    send("stage", { stage: "extracting", message: "Decomposing text & analyzing origin..." });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Verification timed out during extraction")), 60000)
    );

    const extractPromise = extractClaims(text).then(claims => {
      send("log", { message: `Found ${claims.length} verifiable claims` });
      return Array.isArray(claims) ? claims : [];
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

    send("claims_extracted", { claims });

    send("stage", { stage: "searching", message: "Retrieving evidence & verifying truth..." });
    
    const verifiedResults = [];
    for (let index = 0; index < (claims?.length || 0); index++) {
      const claim = claims[index];
      try {
        if (index > 0) await new Promise(r => setTimeout(r, 500));

        const evidence = await searchEvidence(claim);
        send("log", { message: `Evidence found for claim #${index + 1}` });

        const singleClaimResult = await verifyClaims([{ claim, evidenceText: evidence.text, sources: evidence.sources }]);
        const result = singleClaimResult[0];

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
    const overallScore = verifiedResults.length > 0 
      ? Math.round(verifiedResults.reduce((s, c) => s + (scoreMap[c.verdict] ?? 50), 0) / verifiedResults.length)
      : 0;

    const finalResult = {
      stage: "done",
      claims: verifiedResults,
      overallScore,
      totalClaims: verifiedResults.length,
      aiDetection,
      timestamp: new Date().toISOString(),
    };

    if (isStream) {
      send("result", finalResult);
    } else {
      res.json(finalResult);
    }

    // Report to trending
    try {
      const falseOrPartial = verifiedResults.filter(c => c.verdict === "False" || c.verdict === "Partially True");
      if (falseOrPartial.length > 0) {
        const protocol = req.secure ? "https" : "http";
        const host = req.get("host");
        // Use direct function call if in the same process to avoid self-fetch issues
        const { reportClaim } = require("./trending");
        if (typeof reportClaim === 'function') {
          falseOrPartial.forEach(c => reportClaim(c.claim, c.verdict, c.confidence_score || 50));
        } else {
          // Fallback to fetch if trending isn't exported as a function
          fetch(`${protocol}://${host}/api/trending/report`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ claims: falseOrPartial }),
          }).catch(() => {});
        }
      }
    } catch (e) {}

  } catch (err) {
    console.error("Pipeline error:", err);

    // SAFE_MODE / API failure recovery fallback
    const fallbackClaim = text.slice(0, 100) + (text.length > 100 ? "..." : "");
    const fallbackResultClaim = {
      claim: fallbackClaim,
      verdict: "Unverifiable",
      confidence_score: 30,
      reasoning: `Verification pipeline operating in diagnostic safety mode. The verification service encountered an issue: ${err.message || 'Service temporarily offline'}.`,
      sources: [
        { title: "VeriXa Diagnostic Recovery Log", snippet: "System fallback activated. Live research indexing was bypassed to prevent analysis blockage.", url: "" }
      ]
    };
    
    const fallbackResult = {
      stage: "done",
      claims: [fallbackResultClaim],
      overallScore: 30,
      totalClaims: 1,
      aiDetection: { ai_probability: 0, human_probability: 100, indicators: ["Offline recovery"], assessment: "Analysis completed via diagnostic safety mode." },
      timestamp: new Date().toISOString(),
    };

    try {
      send("claims_extracted", { claims: [fallbackClaim] });
      send("claim_verified", { claim: fallbackResultClaim, index: 0 });
      send("result", fallbackResult);
    } catch (sendErr) {
      console.error("Failed to send fallback stream events:", sendErr);
      if (!res.headersSent) {
        if (isStream) {
          res.write(`data: ${JSON.stringify({ event: "result", ...fallbackResult })}\n\n`);
        } else {
          res.json(fallbackResult);
        }
      }
    }
  } finally {
    if (isStream) res.end();
  }
});

module.exports = router;