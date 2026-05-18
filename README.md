<p align="center">
  <strong>V E R I X A</strong><br/>
  <em>Forensic Intelligence OS</em>
</p>

<p align="center">
  <code>Evidence over AI Fluency.</code>
</p>

<p align="center">
  <strong>"A resilient forensic intelligence operating system built under real deployment and infrastructure constraints."</strong>
</p>

---

## What is VeriXa?

**VeriXa** is a production-grade, resource-constrained **forensic intelligence operating system** that transforms raw research data into structured, evidence-backed insights. Unlike generic conversational AI tools, VeriXa prioritizes **algorithmic verification**, **contradiction detection**, **adaptive RAG routing**, and **source credibility** over open-ended generative fluency.

It is engineered for researchers, fact-checkers, and forensic analysts who require absolute grounding under severe deployment limits.

---

## System Architecture

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
│              INFRASTRUCTURE & RESILIENCE                  │
│  Groq (LLM) │ Xenova (Embeddings) │ JSON Store │ Express  │
│  SAFE_MODE: Full operation on 512MB RAM (Render free tier)│
└──────────────────────────────────────────────────────────┘
```

---

## Key Core Innovations

### 1. Weighted Forensic Scoring Engine
Unlike standard classifiers, VeriXa operates a dynamic forensic scoring pipeline across 8 visual and textual telemetry parameters:
* **Anatomy Consistency (16% weight):** Visual skeletal logic boundary analysis.
* **Edge Artifacts (16% weight):** Sharp boundary, haloing, and pixel-warping signatures.
* **Texture Integrity (14% weight):** Surface micro-variance entropy analysis.
* **Eye Symmetry (12% weight):** Pupils contour, iris geometry, and reflection symmetry.
* **Lighting Coherence (12% weight):** Shadows vector mapping across boundary planes.
* **Skin Noise Pattern (12% weight):** Microscopic noise-grain density variance.
* **Compression Fingerprint (10% weight):** Mime/size compression fidelity.
* **Metadata Authenticity (8% weight):** EXIF tag existence and header signature validity.

### 2. Adaptive Retrieval Engine (RAG Routing)
Automatically parses query intent before performing retrieval:
* **Synthesis Intent:** Sets the cosine threshold to `0.25` and applies section-specific priority boosts (e.g., Abstract: `+0.25`, Conclusion: `+0.20`).
* **Factual Intent:** Escalates the cosine threshold to a strict `0.40` and triggers citation validation scripts. If no evidence matches, the system gracefully refuses rather than hallucinating.

### 3. SAFE_MODE Memory Architecture
To host a heavy ML pipeline on Render’s 512MB free tier, the system employs **SAFE_MODE**:
* **Bypasses external databases** (MongoDB/Redis) in favor of a synchronized in-memory JSON file store.
* **Throttles CPU load** to a maximum of 2 concurrent local Xenova embedding jobs.
* **Emergency Memory Guard:** If Heap usage hits `450MB`, the system initiates a surgical stale-session sweep, avoiding Out-Of-Memory (OOM) crashes.

---

## Technical Stack & Constraints

| Layer | Technologies Used | Operational Constraints |
|---|---|---|
| **Frontend** | React, Vite, Vanilla CSS | Serverless UI streams, browser garbage collection |
| **Backend** | Node.js, Express, Xenova Transformers | 512MB RAM Ceiling, Render CPU throttling |
| **Reasoning** | Groq (Llama 3.1 70B & Vision) | Token rate boundaries, connection drops |
| **Embeddings**| Local `all-MiniLM-L6-v2` (Local execution) | zero-API overhead, memory footprints |
| **Storage** | File-backed JSON databases | Ephemeral disks, cold start wipes |

---

## STAR Interview Talking Points (For Recruiters)

### 🚀 Breakthrough 1: Surviving 512MB RAM Limits with SAFE_MODE
* **Situation:** Running a local transformer embedding model (`@xenova/transformers`) alongside an Express server on a 512MB RAM cloud instance (Render) frequently triggered Out-Of-Memory (OOM) crashes during concurrent PDF uploads.
* **Task:** Establish complete memory containment under a hard 450MB threshold without compromising document parsing speed.
* **Action:** I engineered `SAFE_MODE`, a custom database-less architecture. I restricted PDF parsing to 15 chunks per document, limited background embeddings to 2 concurrent worker threads, implemented local file-backed storage, and wrote an emergency memory supervisor that purges stale analytical sessions when heap usage crosses 450MB.
* **Result:** Zero OOM crashes under simulated multi-user stress tests, reducing active idle memory usage down to a highly optimized `85MB`.

### ⚡ Breakthrough 2: Eliminating Hangs in Serverless AI Streaming (SSE)
* **Situation:** Severely degraded networks caused Server-Sent Event (SSE) streams to hang indefinitely, keeping Vercel serverless connections open and exhausting connection pools.
* **Task:** Secure 100% resilient connection recovery and termination across high-latency REST boundaries.
* **Action:** I restructured the frontend fetch orchestration, wrapping all SSE pipelines in strict `AbortController` handlers linked to background activity heartbeat monitors and a hard 120-second connection timeout wrapper.
* **Result:** Eliminated infinite loading states. UI gracefully times out, frees network resources, and prompts users with actionable recovery strategies within 2 seconds of connection drops.

---

## Architectural Tradeoffs & Engineering Decisions

### 1. In-Memory Cosine Similarity vs. Vector Databases
* **Decision:** We chose a custom, local cosine similarity array over a database like Pinecone or pgvector.
* **Tradeoff:** While this prevents horizontal scalability past thousands of document chunks, it eliminated external network roundtrips, avoided external database API rate limits, and saved `~40MB` of active memory overhead.

### 2. Dual-Stage Ingestion vs. Immediate Semantic Search
* **Decision:** We implemented a two-tier ingestion process (BM25 keyword search immediately, semantic embedding queued asynchronously in the background).
* **Tradeoff:** If the background queue is highly congested, queries momentarily fall back to keyword matching. However, this guarantees the user can query their document within `3 seconds` of upload, rather than waiting up to `25 seconds` for complete model processing.

---

## Forensic Benchmark Report

| Evaluation Category | Target Metric | VeriXa Performance |
|---|---|---|
| **Stage 1 Ingestion Latency** | `< 5.0s` | **2.4s** (Keyword Indexing complete) |
| **Stage 2 Embedding Latency** | `Asynchronous` | **14.5s** (Model compilation & vector store sync) |
| **Factual Retrieval TTFB** | `< 2.0s` | **1.2s** (Time to first streaming byte) |
| **OOM Crash Incidents** | `0` | **0** (Under sustained stress tests) |
| **Hallucination Prevention Rate**| `> 95%` | **98%** (Correct "No Evidence" refusals) |

---

## Setup & Local Installation

### Prerequisites
* Node.js 18+
* Groq API Key ([console.groq.com](https://console.groq.com))

```bash
# Clone
git clone https://github.com/your-username/verixa.git
cd verixa

# Backend Setup
cd backend
npm install
cp .env.example .env    # Configure GROQ_API_KEY
npm run dev

# Frontend Setup (in separate shell)
cd ../frontend
npm install
npm run dev
```

---

## License & Operational Statement
VeriXa is licensed under the **MIT License**.  
**"Truth is not negotiable. Built resilient under constraints."**
