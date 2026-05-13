# VeriXa Engineering Roadmap & Strategic Upgrade

## 1. Vision
Transform VeriXa from a high-fidelity forensic prototype into a technically trustworthy AI Evidence Intelligence Platform. Prioritize systemic integrity, citation grounding, and architectural scalability over simulated capabilities.

## 2. Architecture Overview

### Current Architecture (Legacy/Prototype)
- **Frontend**: Monolithic React pages, heavy inline styling, direct API calls, manual state management.
- **Backend**: Express monolith, linear RAG (brute-force cosine similarity in JS), simulated media forensics (hallucinated LLM reports).
- **AI Stack**: Groq (Llama 3), Tavily Search, local CPU embeddings (Xenova).
- **Storage**: MongoDB + local JSON fallback.

### Target Architecture (Production-Grade)
- **Frontend**: Modular React + Tailwind CSS, Atomic Design components, specialized Research Workspace UI.
- **Backend**: Modular Service Architecture.
    - **Ingestion Service**: Specialized parsers (PDF, OCR) with semantic chunking.
    - **Intelligence Service**: Vector DB (MongoDB Atlas Vector Search), Reranking (Cohere/Groq), Citation Engine.
    - **Forensic Service**: Probabilistic analysis (explicitly labeled), real metadata extraction.
    - **Orchestration**: Agent-based verification pipelines.
- **Scale**: Background workers for document indexing, streaming-first responses.

## 3. Implementation Phases

### Phase 1: Foundation & Trust (Completed)
- [x] **Audit & Reframe**: Downgrade forensic certainty language in Image/Video routes.
- [x] **RAG Overhaul**: Implement semantic chunking and modular retrieval.
- [x] **Research Workspace**: Create a dedicated UI for document-grounded intelligence.
- [x] **Architecture Separation**: Decouple ingestion, retrieval, and reasoning.

### Phase 2: Intelligence Depth (Completed)
- [x] **Hybrid Retrieval**: Implementation of RRF-based Vector + Keyword search.
- [x] **Research Orchestrator**: Modular agent coordination (Summarization, Methodology, etc.).
- [x] **Real Media Foundation**: Real metadata and keyframe extraction via FFmpeg.
- [x] **Async Pipelines**: Redis/BullMQ implementation for background ingestion.

### Phase 3: Knowledge Intelligence (Completed)
- [x] **Knowledge Graph**: Entity relationship mapping and citation dependency graphs.
- [x] **Consensus Engine**: Identifying dominant vs. minority findings.
- [x] **Persistent Memory**: Workspace collections and research state persistence.
- [x] **Observability**: Trace tracking and token usage diagnostics.
- [x] **Agent Runtime**: Parallel and recursive agent coordination.

### Phase 4: Hardening & Productization (Completed)
- [x] **Evaluation Framework**: Measurable intelligence quality benchmarks.
- [x] **Cost Governance**: Token budgeting and execution profiling.
- [x] **Security Hardening**: Audit logging and RBAC scaffolding.
- [x] **Human-in-the-Loop**: Investigation review and validation workflows.
- [x] **Deployment**: Dockerization and enterprise-ready orchestration.

## 4. System Integrity Status: PRODUCTION-READY
The VeriXa Intelligence System has been transitioned from a simulated prototype into a technically rigorous, evidence-centric analysis platform. All forensic claims are explicitly probabilistic, grounded in verifiable source citations, and measurable via the Evaluation Engine.

