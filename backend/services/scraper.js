const fetch = require("node-fetch");
const cheerio = require("cheerio");

/**
 * Robust URL scraper for VeriXa Intelligence
 * Extracts core text, titles, and metadata while filtering junk.
 */
async function scrapeUrl(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      },
      timeout: 10000,
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove scripts, styles, and ads
    $("script, style, nav, footer, header, ads, .ads, #ads").remove();

    const title = $("title").text().trim() || $("h1").first().text().trim();
    
    // Extract main text content
    let text = "";
    $("p, h1, h2, h3, li").each((_, el) => {
      const line = $(el).text().trim();
      if (line.length > 20) text += line + "\n\n";
    });

    if (text.length < 100) {
      // Fallback for non-standard structures
      text = $("body").text().replace(/\s+/g, " ").trim();
    }

    return {
      title,
      text: text.slice(0, 10000), // Cap for performance
      url,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error(`Scrape failed for ${url}:`, err.message);
    throw new Error("Could not extract content from the provided URL. The site may be blocking automated access.");
  }
}

module.exports = { scrapeUrl };
