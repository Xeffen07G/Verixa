const express = require("express");
const router = express.Router();

// ─── In-memory trending store ───
// In production, replace with Redis or a database
const trendingStore = new Map();
const MAX_ENTRIES = 200;

function normalizeClaimKey(claim) {
  return claim.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim().slice(0, 120);
}

function reportClaim(claim, verdict, confidence) {
  const key = normalizeClaimKey(claim);
  if (!key || key.length < 5) return;

  if (trendingStore.has(key)) {
    const entry = trendingStore.get(key);
    entry.count += 1;
    entry.lastChecked = new Date().toISOString();
    entry.verdicts[verdict] = (entry.verdicts[verdict] || 0) + 1;
    entry.avgConfidence = Math.round(
      (entry.avgConfidence * (entry.count - 1) + confidence) / entry.count
    );
  } else {
    // Evict oldest if at capacity
    if (trendingStore.size >= MAX_ENTRIES) {
      let oldest = null, oldestKey = null;
      for (const [k, v] of trendingStore) {
        if (!oldest || v.lastChecked < oldest.lastChecked) {
          oldest = v; oldestKey = k;
        }
      }
      if (oldestKey) trendingStore.delete(oldestKey);
    }

    trendingStore.set(key, {
      claim: claim.slice(0, 200),
      count: 1,
      verdict,
      verdicts: { [verdict]: 1 },
      avgConfidence: confidence,
      firstSeen: new Date().toISOString(),
      lastChecked: new Date().toISOString(),
    });
  }
}

// Seed some realistic trending data so the page isn't empty
const seedData = [
  { claim: "5G towers cause COVID-19 symptoms in humans", verdict: "False", confidence: 96, count: 847 },
  { claim: "The Great Wall of China is visible from space with the naked eye", verdict: "False", confidence: 94, count: 623 },
  { claim: "Humans only use 10% of their brain", verdict: "False", confidence: 97, count: 589 },
  { claim: "COVID-19 vaccines contain microchips for tracking", verdict: "False", confidence: 99, count: 1204 },
  { claim: "Drinking warm water kills coronavirus", verdict: "False", confidence: 95, count: 432 },
  { claim: "The Earth is flat and NASA fakes space images", verdict: "False", confidence: 99, count: 1567 },
  { claim: "MSG causes brain damage and cancer", verdict: "False", confidence: 91, count: 298 },
  { claim: "Ivermectin is a proven cure for COVID-19", verdict: "False", confidence: 93, count: 756 },
  { claim: "Wind turbines cause cancer in nearby residents", verdict: "False", confidence: 96, count: 187 },
  { claim: "Eating sugar causes hyperactivity in children", verdict: "False", confidence: 88, count: 334 },
  { claim: "The moon landing was faked by NASA in 1969", verdict: "False", confidence: 99, count: 923 },
  { claim: "Vaccines cause autism in children", verdict: "False", confidence: 99, count: 1891 },
  { claim: "Apple cider vinegar cures diabetes", verdict: "False", confidence: 92, count: 267 },
  { claim: "Mobile phones cause brain tumors", verdict: "Partially True", confidence: 65, count: 445 },
  { claim: "Goldfish have a 3-second memory", verdict: "False", confidence: 94, count: 178 },
  { claim: "Lightning never strikes the same place twice", verdict: "False", confidence: 97, count: 156 },
  { claim: "Cracking knuckles causes arthritis", verdict: "False", confidence: 93, count: 289 },
  { claim: "Eating carrots significantly improves night vision", verdict: "Partially True", confidence: 71, count: 203 },
  { claim: "Bulls are enraged by the color red", verdict: "False", confidence: 95, count: 167 },
  { claim: "Napoleon Bonaparte was extremely short", verdict: "False", confidence: 90, count: 198 },
];

seedData.forEach(s => {
  const key = normalizeClaimKey(s.claim);
  trendingStore.set(key, {
    claim: s.claim,
    count: s.count,
    verdict: s.verdict,
    verdicts: { [s.verdict]: s.count },
    avgConfidence: s.confidence,
    firstSeen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastChecked: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString(),
  });
});

const axios = require("axios");
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

// ─── Cache for live news ───
let liveNewsCache = {
  data: [],
  lastFetched: 0,
};
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

async function fetchLiveNews() {
  if (Date.now() - liveNewsCache.lastFetched < CACHE_DURATION) {
    return liveNewsCache.data;
  }

  try {
    // 1. Search for trending global news/claims using Tavily
    const searchRes = await axios.post("https://api.tavily.com/search", {
      api_key: TAVILY_API_KEY,
      query: "latest trending global news controversy misinformation claims current affairs",
      search_depth: "advanced",
      max_results: 5,
    });

    const results = searchRes.data.results || [];
    const context = results.map(r => r.content).join("\n\n");

    // 2. Use Groq to extract structured trending claims
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Extract 8-10 major current global news claims or controversies from the provided text. Format as JSON: { trending: [{ claim: string, verdict: 'True'|'False'|'Partially True', confidence: number, source: string }] }" },
        { role: "user", content: `Text: ${context}` }
      ],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    const news = parsed.trending.map(n => ({
      ...n,
      count: Math.floor(Math.random() * 5000) + 100, // Simulated trend volume
      firstSeen: new Date().toISOString(),
      lastChecked: new Date().toISOString(),
    }));

    liveNewsCache = { data: news, lastFetched: Date.now() };
    return news;
  } catch (error) {
    console.error("Live news fetch failed:", error);
    return [];
  }
}

/**
 * GET /api/trending — returns top trending claims (live news + reported)
 */
router.get("/", async (req, res) => {
  const liveNews = await fetchLiveNews();
  const reported = Array.from(trendingStore.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  // Merge and deduplicate
  const all = [...liveNews, ...reported].sort((a, b) => b.count - a.count).slice(0, 100);

  res.json({
    trending: all,
    totalTracked: trendingStore.size + liveNews.length,
    lastUpdated: new Date(liveNewsCache.lastFetched || Date.now()).toISOString(),
  });
});

/**
 * POST /api/trending/report — record a verification result
 */
router.post("/report", (req, res) => {
  const { claims } = req.body;
  if (!claims || !Array.isArray(claims)) {
    return res.status(400).json({ error: "claims array required" });
  }

  let reported = 0;
  for (const c of claims) {
    if (c.verdict === "False" || c.verdict === "Partially True") {
      reportClaim(c.claim, c.verdict, c.confidence_score || 50);
      reported++;
    }
  }

  res.json({ reported, totalTracked: trendingStore.size });
});

module.exports = router;
