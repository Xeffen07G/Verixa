<p align="center">
  <strong>V E R I X A</strong><br/>
  <em>Forensic Intelligence OS</em>
</p>

<p align="center">
  <code>Evidence over AI Fluency.</code>
</p>

---

## What is VeriXa?

**VeriXa** is a production-grade forensic intelligence platform that transforms raw research data into structured, evidence-backed insights. Unlike conversational AI tools, VeriXa prioritizes **verification**, **contradiction detection**, and **source credibility** over generative fluency.

It is designed for researchers, fact-checkers, and intelligence analysts who need to:

- **Verify claims** against multi-source evidence
- **Detect contradictions** across research papers
- **Map consensus vs. minority views** in scientific literature
- **Generate forensic reports** with full citation chains

---

## Core Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    VERIXA INTELLIGENCE OS                  │
├────────────────┬─────────────────┬────────────────────────┤
│ Verification   │ Research        │ Intelligence           │
│ Lab            │ Workspace       │ Lab                    │
│ ─ Claim audit  │ ─ Deep analysis │ ─ Telemetry dashboard  │
│ ─ URL/PDF/Text │ ─ Contradiction │ ─ Session oversight    │
│ ─ Score report │   hunting       │ ─ Retrieval analytics  │
│                │ ─ Forensic      │ ─ System health        │
│                │   export        │                        │
├────────────────┴─────────────────┴────────────────────────┤
│              ADAPTIVE RETRIEVAL ENGINE                     │
│  ┌─────────┐  ┌──────────┐  ┌─────────────┐             │
│  │ Intent  │→ │ Hybrid   │→ │ Contradiction│             │
│  │ Classify│  │ Search   │  │ Engine       │             │
│  │         │  │ BM25 +   │  │              │             │
│  │ SYNTH / │  │ Semantic │  │ Cross-doc    │             │
│  │ FACTUAL │  │ + Section│  │ conflict     │             │
│  │         │  │ Boost    │  │ detection    │             │
│  └─────────┘  └──────────┘  └─────────────┘             │
├──────────────────────────────────────────────────────────┤
│              DUAL-STAGE INGESTION                         │
│  Stage 1: Fast (< 5s) — Extract → Chunk → Keyword Index  │
│  Stage 2: Background — Semantic Embedding (Xenova)        │
├──────────────────────────────────────────────────────────┤
│              INFRASTRUCTURE                               │
│  Groq (LLM) │ Xenova (Embeddings) │ JSON Store │ Express  │
│  SAFE_MODE: Full operation on 512MB RAM (Render free tier)│
└──────────────────────────────────────────────────────────┘
```

---

## Key Features

| Feature | Description |
|---|---|
| **Adaptive Intent Classification** | Automatically routes queries — broad synthesis vs. strict factual verification |
| **Contradiction Intelligence** | Cross-document conflict detection with consensus mapping |
| **Anti-Hallucination Pipeline** | Grounded retrieval with citation-first prompts. Refuses speculation. |
| **Dual-Stage Ingestion** | Instant keyword indexing (< 5s) + async semantic embedding |
| **SAFE_MODE** | Full operation within 512MB RAM. No external databases required. |
| **Investigation Continuity** | Global session state across all workspaces |
| **Forensic Reports (v2)** | Executive summaries, evidence ledgers, methodology risk, consensus analysis |
| **Document Deduplication** | Filename-based dedup prevents vault bloat |
| **Section-Aware Retrieval** | Tiered boosts for Abstract (+0.25), Conclusion (+0.20), Introduction (+0.15) |
| **Synthesis Fallback** | Broad queries never fail when documents exist in vault |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Reasoning** | Groq — Llama 3.1 70B Versatile |
| **Embeddings** | Xenova/all-MiniLM-L6-v2 (local, no API calls) |
| **Backend** | Node.js / Express |
| **Frontend** | React + Vite |
| **Persistence** | JSON-backed store (free-tier compatible) |
| **Deployment** | Render (backend) + Vercel (frontend) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Groq API key ([console.groq.com](https://console.groq.com))

### Installation

```bash
# Clone
git clone https://github.com/your-username/verixa.git
cd verixa

# Backend
cd backend
npm install
cp .env.example .env    # Add GROQ_API_KEY
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables

```env
# backend/.env
GROQ_API_KEY=gsk_...
SAFE_MODE=true
PORT=5000
```

### SAFE_MODE

Set `SAFE_MODE=true` for resource-constrained environments:
- Uses in-memory document store (no MongoDB)
- Limits to 15 chunks/doc and 2 concurrent embedding jobs
- Auto-purges sessions after 30 minutes
- Memory guard at 450MB triggers emergency session cleanup

See [SAFE_MODE.md](./SAFE_MODE.md) for full documentation.

---

## Key Engineering Challenges

* **Adaptive Retrieval Pipeline:** Building a RAG system that gracefully distinguishes between synthesis ("Summarize this paper") and factual lookup ("What is the specific methodology in section 3?") required an intent-classification layer. By dynamically shifting vector similarity thresholds and section boosts, we eliminated the typical "No evidence found" dead ends while strictly preventing hallucinations.
* **Dual-Stage Ingestion:** Semantic embedding (using Xenova all-MiniLM) is CPU-heavy. To provide users with instant feedback, we built a dual-stage pipeline that runs a fast BM25 keyword index within 3-5 seconds, pushing heavy vector embedding to background asynchronous workers.
* **Contradiction Detection Engine:** Standard LLMs merge conflicting sources into unified summaries. VeriXa utilizes a specialized cross-document conflict detection engine that explicitly surfaces inconsistencies in methodologies or claims, badging them in the UI with severity ratings.

---

## Production Constraints

This application was engineered to run seamlessly on severe free-tier constraints (e.g. Render / Vercel).
* **512MB Hard Memory Limit:** No external databases are used. The platform operates a custom in-memory cosine similarity array with aggressive garbage collection protocols that purge stale investigation sessions if memory usage exceeds 450MB.
* **Serverless UI Streams:** AI streaming (SSE) across Vercel serverless boundaries is notoriously fragile. To prevent the frontend from hanging indefinitely on network drops, all fetching relies on 120-second background `AbortControllers`.
* **Zero Persistence Dependencies:** To circumvent cloud database DNS throttles, VeriXa implements a resilient, auto-recovering JSON filesystem storage that guarantees 100% startup reliability.

---

## Demo Investigations

VeriXa ships with 4 pre-configured forensic investigations:

| Demo | Topic | Demonstrates |
|---|---|---|
| **LLM Bias & Safety** | Safety alignment trade-offs | Contradiction mapping between sources |
| **Climate Data Audit** | Arctic ice melt rates | Consensus vs. minority metrics |
| **Vaccine Misinfo Audit** | mRNA efficacy claims | Misinformation cross-referencing |
| **Replication Crisis** | Psychology priming studies | Methodology conflict chains |

Access via **Research Workspace → Demo Investigation** cards.

---

## Project Structure

```
verixa/
├── backend/
│   ├── server.js              # Core server + RAG engine
│   ├── services/
│   │   ├── groq.js            # LLM orchestration
│   │   ├── contradictionService.js  # Cross-doc conflict detection
│   │   ├── investigationService.js  # Session + evidence ledger
│   │   └── rerank.js          # Retrieval reranking
│   ├── prompts/               # Versioned prompt templates
│   │   ├── researchPrompts.js
│   │   ├── contradictionPrompts.js
│   │   ├── verificationPrompts.js
│   │   └── exportPrompts.js
│   ├── internal/evals/        # Forensic benchmark suite
│   └── utils/                 # Store, RAG utilities
├── frontend/
│   ├── src/pages/
│   │   ├── LandingPage.jsx    # Product positioning
│   │   ├── VerifyPage.jsx     # Verification Lab
│   │   ├── ResearchWorkspace.jsx  # Deep analysis workspace
│   │   └── IntelligenceLab.jsx    # Command center
│   └── src/components/
│       ├── InvestigationPanel.jsx  # Evidence ledger + timeline
│       └── Navbar.jsx         # System status indicator
├── demo/                      # Pre-configured investigations
├── ARCHITECTURE.md
├── SAFE_MODE.md
└── PORTFOLIO_CASE_STUDY.md
```

---

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — System design, retrieval pipeline, contradiction engine
- **[SAFE_MODE.md](./SAFE_MODE.md)** — Resource-constrained deployment strategy
- **[PORTFOLIO_CASE_STUDY.md](./PORTFOLIO_CASE_STUDY.md)** — Engineering case study for technical portfolios

---

<p align="center"><em>Evidence-backed intelligence. No speculation.</em></p>
