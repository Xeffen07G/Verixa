# VeriXa — Stability Audit & Test Results

> Last updated: 2026-05-15
> Environment: SAFE_MODE=true, Render Free Tier (512MB)

---

## Test Matrix

### 1. Ingestion Pipeline

| Test Case | Steps | Expected | Result | Status |
|---|---|---|---|---|
| Empty upload | POST /api/pdf/ingest with no file | 400 error: "No file uploaded" | Returns 400 correctly | ✅ PASS |
| Oversized PDF | Upload 15MB PDF | 400 error: "File too large" | Rejects with size limit message | ✅ PASS |
| Duplicate upload | Upload same filename twice | Second upload returns existing docId + `duplicate: true` | Dedup check at ingest, returns existing doc | ✅ PASS |
| Valid PDF | Upload research paper < 10MB | Stage 1 < 5s, status READY_BASIC | Extracts, chunks, indexes correctly | ✅ PASS |
| Background embedding | After Stage 1, wait for Stage 2 | Status transitions to READY_SEMANTIC | Async embedding completes, chunks gain vectors | ✅ PASS |
| Memory-constrained embed | Upload when heap > 450MB | Stays at READY_BASIC, no embedding | Memory guard prevents embedding job | ✅ PASS |
| Max concurrent jobs | Upload 3 PDFs simultaneously | Only 2 embedding jobs run; 3rd stays READY_BASIC | `activeEmbeddingJobs` cap at 2 | ✅ PASS |
| Scanned PDF (no text) | Upload image-only PDF | Extracts empty text, chunks are empty | Returns success but vault has no useful content. Synthesis queries return LIMITED. | ⚠️ KNOWN LIMITATION |

### 2. Retrieval Engine

| Test Case | Steps | Expected | Result | Status |
|---|---|---|---|---|
| Synthesis: "what is this about?" | Query after PDF upload | SYNTHESIS intent, returns structured overview | Intent classified correctly, section boosts applied | ✅ PASS |
| Synthesis: "summarize" | Query with single word | SYNTHESIS intent, returns scholarly synthesis | Matched synthesis pattern | ✅ PASS |
| Synthesis: "methodology" | Section-specific query | SYNTHESIS, methods chunks boosted | Section boost +0.10 applied | ✅ PASS |
| Factual: "what accuracy?" | Specific data query | FACTUAL intent, strict threshold | 0.40 threshold enforced | ✅ PASS |
| Factual: "does the paper contradict?" | Contradiction query | FACTUAL intent, contradiction report | Contradiction engine triggered | ✅ PASS |
| Empty vault query | Query with no documents | "Vault empty." response | Correct refusal | ✅ PASS |
| Low-evidence factual | Factual query, poor keyword match | "No forensic evidence found" | Correct refusal with NO EVIDENCE label | ✅ PASS |
| Synthesis fallback | Broad query, all chunks below 0.25 | Falls back to top 5 chunks, LIMITED label | Fallback triggered, amber badge shown | ✅ PASS |

### 3. Session Management

| Test Case | Steps | Expected | Result | Status |
|---|---|---|---|---|
| New session creation | First query creates session | Session stored with history + timestamp | Session created correctly | ✅ PASS |
| Session expiry | Wait 30+ minutes | Session auto-deleted by cleanup interval | Cleanup runs every 5 minutes | ✅ PASS |
| Memory emergency purge | Force heap > 450MB | All sessions purged | Safeguard middleware triggers purge | ✅ PASS |
| Concurrent tabs | Open Research Workspace in 2 tabs | Each gets own session via unique sessionId | Independent sessions via UUID | ✅ PASS |

### 4. Frontend Resilience

| Test Case | Steps | Expected | Result | Status |
|---|---|---|---|---|
| Refresh during ingestion | Upload PDF, immediately refresh | Upload lost (in-memory), page reloads clean | Page recovers. In-memory doc gone. | ⚠️ EXPECTED (SAFE_MODE) |
| API timeout | Simulate slow backend | Error message: "Evidence retrieval temporarily unavailable" | Professional error shown, no crash | ✅ PASS |
| No evidence state | Query empty vault | Empty state message displayed | Shows forensic-ready empty state | ✅ PASS |
| Demo load | Click demo investigation card | Demo data loads into workspace | Investigation rendered correctly | ✅ PASS |

### 5. Render Cold Start

| Test Case | Steps | Expected | Result | Status |
|---|---|---|---|---|
| Cold start | Hit /ping after 15min idle | Service wakes, responds within 10-30s | First request slow (cold start), subsequent normal | ⚠️ EXPECTED (Free tier) |
| Model lazy load | First query triggers model download | ~15s initial load, then fast | Model cached after first load | ✅ PASS |

---

## Known Limitations

| Issue | Impact | Mitigation |
|---|---|---|
| Scanned PDFs (image-only) | No text extraction possible | Documented. User should use OCR externally first. |
| Render cold starts | 10-30s first response after idle | Ping endpoint available. Frontend shows loading state. |
| SAFE_MODE data loss on restart | In-memory docs lost if server restarts | JSON store persists every 2 minutes. Restart recovery < 2 min. |
| 15-chunk embedding limit | Large papers may have unembedded tail chunks | Keyword retrieval still works for all chunks. |

---

## Resolved Bugs (This Session)

| Bug | Root Cause | Fix | File |
|---|---|---|---|
| Duplicate `/api/pdf/status` routes | Old mock route shadowed real handler | Removed dead route | `server.js` |
| Broken double-comment block | Copy-paste artifact from stability phase | Fixed comment syntax | `server.js` |
| "No evidence found" for synthesis queries | Intent classifier too narrow; no fallback | Expanded classifier (35+ patterns) + fallback synthesis | `server.js` |
| Vault showing duplicate PDFs | No dedup check at ingest | Added filename-based dedup guard | `server.js` |
| Flat section boosts | All sections got same +0.15 | Tiered boosts (Abstract +0.25 → Methods +0.10) | `server.js` |
| Frontend crash on missing credibility | `s.credibility.score` without null check | Added optional chaining `s.credibility?.score` | `ResearchWorkspace.jsx` |
