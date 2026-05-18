const express = require("express");
const router = express.Router();
const { scrapeUrl } = require("../services/scraper");

/**
 * POST /api/url
 * Scrape a URL and return extracted text
 */
router.post("/", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required." });
  }

  // Validate URL
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res.status(400).json({ error: "Only HTTP/HTTPS URLs are supported." });
    }
  } catch {
    return res.status(400).json({ error: "Invalid URL format." });
  }

  console.log(`[API] Processing URL verification for: ${url}`);

  try {
    const result = await scrapeUrl(url);
    res.json(result);
  } catch (err) {
    console.error("URL PIPELINE ERROR:", err);
    // Graceful forensic fallback mode to ensure user always receives a forensic report
    res.json({
      title: "Remote Source Retrieval Failed (Diagnostic Fallback)",
      text: `Forensic Alert: Remote source retrieval failed during forensic audit of ${url}. The target site may be offline, protected by bot detection (such as Cloudflare or Captcha), or blocking direct API extraction.

Please copy the text manually and paste it into the Verification tab, or proceed to verify this status report.`,
      url,
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
});

module.exports = router;
