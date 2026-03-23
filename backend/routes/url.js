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

  try {
    const result = await scrapeUrl(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch URL: " + err.message });
  }
});

module.exports = router;
