const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));
const cheerio = require("cheerio");

/**
 * Fetch and extract readable text content from a URL
 */
async function scrapeUrl(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; VeriXa/1.0; +https://verixa.ai/bot)",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    timeout: 15000,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: HTTP ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove noise elements
  $("script, style, nav, footer, header, aside, .ad, .advertisement, .cookie-banner").remove();

  // Extract title
  const title =
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    "Untitled Article";

  // Try article-specific selectors first
  let content = "";
  const articleSelectors = [
    "article",
    '[role="main"]',
    ".article-body",
    ".post-content",
    ".entry-content",
    ".story-body",
    "main",
  ];

  for (const selector of articleSelectors) {
    const el = $(selector);
    if (el.length && el.text().trim().length > 200) {
      content = el.text().trim();
      break;
    }
  }

  // Fallback to body
  if (!content) {
    content = $("body").text().trim();
  }

  // Clean whitespace
  content = content.replace(/\s+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

  // Limit to ~6000 chars
  const truncated = content.length > 6000 ? content.slice(0, 6000) + "..." : content;

  return { title, content: truncated, url };
}

module.exports = { scrapeUrl };
