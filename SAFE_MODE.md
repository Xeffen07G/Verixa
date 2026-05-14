# VeriXa SAFE_MODE Strategy

VeriXa is engineered to run reliably on resource-constrained environments (e.g., Render/Vercel free tiers). `SAFE_MODE` is the architectural state that ensures high availability when infrastructure limits are tight.

## 1. Dual-Stage Ingestion
To prevent request timeouts, ingestion is decoupled into two stages:
- **Stage 1 (FAST)**: Immediate text extraction and keyword indexing. Persistence to `SAFE_DOCS` happens instantly. Returns success <5s.
- **Stage 2 (ENHANCEMENT)**: Asynchronous embedding generation and semantic metadata updates. Progressively enhances "READY_BASIC" docs to "READY_SEMANTIC".

## 2. Resource Constraints
- **Concurrent Jobs**: Maximum 2 embedding jobs at once.
- **Memory Trigger**: 450MB heap usage triggers an immediate session purge to prevent process crashes.
- **Chunk Limits**: 
  - Max 15 embedded chunks per document.
  - Max 5 chunks per retrieval context window.

## 3. Reliability Over Depth
If AI systems or embedding services fail:
- VeriXa reverts to **Keyword-Only Retrieval**.
- The system remains fully usable for basic search and verification.
- User feedback (Trust Meter) reflects the reduced confidence in retrieval.

## 4. Local Embeddings
By utilizing `Xenova` (Transformers.js), VeriXa avoids external API latency for vector generation, ensuring the intelligence layer stays responsive and private.

---
*VeriXa: Resilient Intelligence.*
