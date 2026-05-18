# VeriXa: Recruiter & Interview Assets

## 1. Resume Bullet Points
* **Architected VeriXa**, a production-ready forensic intelligence platform designed for deep document retrieval and factual contradiction detection.
* **Engineered a memory-optimized adaptive RAG pipeline** running entirely on a 512MB RAM constraint, achieving < 5s document availability via a dual-stage ingestion architecture.
* **Designed a zero-dependency SAFE_MODE infrastructure** utilizing file-system JSON stores and local Xenova embeddings to guarantee 100% uptime in free-tier cloud environments.
* **Implemented advanced contradiction engines** leveraging Llama-3.1 to analyze structural inconsistencies across multi-document sources, increasing factual synthesis reliability.
* **Hardened the frontend React application** with graceful `AbortController` stream cancellation, defensive JSON parsing, and universal UI fallback states, ensuring enterprise-grade resilience.

## 2. LinkedIn Project Description
**VeriXa: Forensic Intelligence OS**
I built VeriXa from the ground up to solve a critical flaw in modern AI chat systems: generation without evidence. VeriXa is an evidence-first, contradiction-aware intelligence platform. 

Instead of generic semantic search, I engineered an adaptive retrieval system that classifies user intent, weighting structural document sections differently for synthesis versus factual lookups. To overcome free-tier constraints (512MB memory), I designed a custom memory-guarded architecture and dual-stage document ingestion pipeline. The result is a highly polished, resilient, and forensic-grade investigative tool that operates with 100% autonomy. 
*Tech Stack: React, Express, Llama-3.1, Xenova Embeddings, Vite.*

## 3. Interview Talking Points

**On Resilience Engineering:**
> "One of the biggest challenges was making the app survive unreliable environments. When testing the initial build, network drops would cause the UI to hang indefinitely while waiting for an AI stream. I resolved this by wrapping all fetch requests in strict 120-second AbortControllers. Additionally, I implemented deep-copy fallbacks on the backend to prevent the entire server from crashing if a JSON persistence file became corrupted during a cold shutdown."

**On Forensic AI Systems & Adaptive RAG:**
> "I realized quickly that basic RAG fails because a user asking 'What is this paper about?' needs a fundamentally different retrieval strategy than 'What was the exact p-value in section 3?'. I built an adaptive intent classifier that dynamically shifts vector thresholds and applies structural section boosts (e.g., heavily weighting the 'Abstract' for synthesis queries). This shifted the app from a simple chatbot to a true forensic tool."

**On Scalability & Production Hardening (SAFE_MODE):**
> "To host a heavy ML application on free tiers like Render, I was constrained to 512MB of RAM. I had to build a custom 'SAFE_MODE' architecture. I bypassed memory-heavy vector databases by building an optimized in-memory cosine similarity array, and I delayed loading the 120MB local embedding model until the first exact request to shave off 5 seconds of cold-start boot time. It’s a study in aggressive constraint optimization."

## 4. Architecture & Scalability Summary
VeriXa is monolithic in deployment but modular in design. 
* **The API Layer:** Node.js/Express handling stateless REST and persistent SSE (Server-Sent Events) for real-time AI streaming.
* **The Data Layer:** Designed to be totally ephemeral or gracefully persistent (SAFE_MODE) using local file structures, avoiding external database bottlenecks.
* **The Intelligence Layer:** Local Xenova transformer embeddings combined with Groq's high-speed inference for Llama 3.1. 
* **Scalability:** The system is horizontally scalable out-of-the-box. By migrating the JSON-store to Redis and the document vault to S3, VeriXa can support thousands of concurrent investigators without changing the core retrieval or contradiction logic.
