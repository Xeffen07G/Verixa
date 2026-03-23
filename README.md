# VeriXa — AI-Powered Fact & Claim Verification Engine

> *Truth is not negotiable.*

VeriXa is an elite, production-grade AI fact-checking system that extracts verifiable claims from any text or article URL, retrieves real-time evidence via web search, and generates a granular accuracy report — complete with verdicts, confidence scores, and source citations.

---

## ✦ Features

| Feature | Description |
|---|---|
| **Claim Extraction** | Atomically decomposes text into discrete, verifiable factual statements |
| **Web Evidence Retrieval** | Autonomous search agents fetch authoritative, real-time sources |
| **Verdict Engine** | Classifies each claim: True / False / Partially True / Unverifiable |
| **Confidence Scoring** | 0–100 score per claim with transparent chain-of-thought reasoning |
| **AI Text Detection** | Probabilistic analysis of whether text was LLM-generated or human-written |
| **URL Ingestion** | Paste any news article URL — VeriXa scrapes and analyzes automatically |
| **Conflict Surfacing** | When sources disagree, conflicting evidence is flagged explicitly |
| **Streaming Pipeline** | Real-time SSE progress: Extracting → Searching → Verifying → Done |

---

## ✦ Tech Stack

**Frontend:** React 18, React Router v6, Axios, Custom SSE hook  
**Backend:** Node.js + Express, Anthropic Claude API, Cheerio, SSE streaming  
**AI:** Claude Sonnet 4 + web_search_20250305 tool (evidence retrieval)

---

## ✦ Project Structure

```
verixa/
├── backend/
│   ├── routes/
│   │   ├── verify.js        # Main pipeline (SSE streaming)
│   │   ├── url.js           # URL scraping endpoint
│   │   └── health.js        # Health check
│   ├── services/
│   │   ├── anthropic.js     # Extract, search, verify, AI-detect
│   │   └── scraper.js       # Cheerio URL extractor
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── components/Navbar.jsx
│   │   ├── hooks/useVerify.js
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   └── VerifyPage.jsx
│   │   ├── styles/global.css
│   │   ├── App.js
│   │   └── index.js
│   ├── .env.example
│   └── package.json
├── .gitignore
├── package.json
└── README.md
```

---

## ✦ Getting Started

### Prerequisites
- Node.js v18+
- An [Anthropic API key](https://console.anthropic.com/)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/verixa.git
cd verixa
```

### 2. Install all dependencies

```bash
npm run install:all
```

### 3. Configure environment variables

**Backend** (`backend/.env`):
```bash
cd backend && cp .env.example .env
```
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env`):
```bash
cd frontend && cp .env.example .env
```
```env
REACT_APP_API_URL=http://localhost:5000
```

### 4. Run in development

```bash
# From project root
npm run dev
```

- Frontend: http://localhost:3000  
- Backend: http://localhost:5000

---

## ✦ API Reference

### `POST /api/verify`
Full pipeline via Server-Sent Events.

**Body:** `{ "text": "...", "detectAI": true }`

**SSE Events:** `stage` · `log` · `claims_extracted` · `ai_detection` · `result` · `error`

**Claim result shape:**
```json
{
  "claim": "...",
  "verdict": "True | False | Partially True | Unverifiable",
  "confidence_score": 87,
  "reasoning": "...",
  "conflicting_sources": false,
  "sources": [{ "title": "...", "snippet": "...", "url": "..." }]
}
```

### `POST /api/url`
Scrape a URL and return article text.  
**Body:** `{ "url": "https://..." }`

### `GET /api/health`
Service status check.

---

## ✦ Pipeline Architecture

```
Input (Text / URL)
      │
      ▼
Claim Extraction  →  Claude CoT: atomic factual statements
      │
      ▼
Evidence Retrieval  →  web_search tool per claim
      │
      ▼
Verification Logic  →  CoT reasoning, conflict detection
      │
      ▼
Accuracy Report  →  Verdicts · Scores · Citations · AI Detection
```

---

## ✦ Deployment

**Frontend** (Vercel/Netlify): `cd frontend && npm run build` → deploy `/build`  
Set: `REACT_APP_API_URL=https://your-api.com`

**Backend** (Railway/Render/Fly.io): deploy `/backend`, set env vars, `npm start`

---

## ✦ License

MIT — see LICENSE for details.

---

<p align="center"><strong>VeriXa</strong> — Engineered for absolute precision. <em>Truth is not negotiable.</em></p>
