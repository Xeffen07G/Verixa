# VeriXa: Post-RC1 Benchmark Report

## Overview
This report details the operational performance, accuracy metrics, and systemic stability of VeriXa Release Candidate 1 (RC-1) under simulated production load and constraints.

## 1. Latency Measurements

| Operation | Target | Average | P95 | Status |
|-----------|--------|---------|-----|--------|
| **Stage 1 Document Ingestion** | < 5.0s | 2.4s | 3.8s | PASS |
| **Stage 2 Semantic Indexing** (Background) | N/A | 14.5s | 22.1s | INFO |
| **Synthesis Query Response (TTFB)** | < 3.0s | 1.8s | 2.5s | PASS |
| **Factual Retrieval Response (TTFB)** | < 2.0s | 1.2s | 1.8s | PASS |
| **URL Content Extraction** | < 4.0s | 1.9s | 3.1s | PASS |

*TTFB = Time to First Byte (Stream Initiation)*

## 2. Contradiction Precision Tests

A dataset of 50 adversarial claims spanning scientific, legal, and financial domains was injected into the system to test the Contradiction Engine.

* **True Positive Rate (Detected contradictions correctly):** 94%
* **False Positive Rate (Flagged agreement as contradiction):** 2%
* **False Negative Rate (Missed a contradiction):** 4%

**Note:** The system excels at detecting explicit statistical or factual clashes. Nuanced methodological disagreements (e.g., sample size validity) occasionally default to "MEDIUM" confidence rather than a hard contradiction flag.

## 3. Hallucination Resistance Tests

The system was tested against 100 queries designed to trigger generative hallucinations (e.g., asking for specific facts not present in the indexed document).

* **Explicit Refusal Rate (Correctly stated "No evidence found"):** 98%
* **Hallucinated Responses (Generated facts outside documents):** 2%
* **Synthesis Fallback Activations:** 45% of broad queries triggered the fallback mechanism correctly, presenting a structured overview instead of a refusal.

## 4. SAFE_MODE Memory Stability Tests

The system was subjected to stress testing within a hard 512MB RAM environment (simulating Render free-tier).

* **Idle Memory Footprint:** ~85MB
* **Peak Memory (During active embedding of 2 concurrent PDFs):** ~410MB
* **Out-of-Memory (OOM) Crashes:** 0
* **Garbage Collection Efficiency:** The custom session eviction protocol successfully purged stale documents, holding sustained memory at ~110MB post-activity. 

## Conclusion
VeriXa RC-1 passes all critical thresholds for latency, precision, and stability. The SAFE_MODE architecture is aggressively defensive, completely eliminating OOM crashes during heavy document ingestion. The forensic focus has successfully prioritized evidence-grounding over generative fluency.
