# VeriXa: Maintenance Directive & Governance

**STATUS: FEATURE COMPLETE & PRODUCTION STABLE (RC-1)**
**MODE: STRATEGIC MAINTENANCE**

This document serves as the permanent governance protocol for the VeriXa repository. From RC-1 onward, the repository is officially in **Maintenance Mode**.

---

## 1. Scope & Expansion
**DO NOT:**
* Add new systems or features.
* Redesign interfaces or alter the aesthetic.
* Alter core architecture or database pipelines.
* Expand the project scope.
* Introduce experimental dependencies or libraries.

**PERMITTED:**
* Critical bug and crash fixes.
* Security patches.
* Deployment configuration fixes.
* Minor UX/UI polish (non-disruptive).
* Documentation improvements.

---

## 2. Repository Rules & Git Hygiene
1. **`main` Branch = Production Stable Only:** The main branch must always represent a fully working, deployable state.
2. **Feature Branches Required:** Any experimental debugging, UI polish, or deployment tests must occur on isolated branches.
3. **No Direct Pushes:** Do not push to `main` without comprehensive local validation.
4. **Mandatory Deployment Checks:** Every deployment candidate MUST pass the following before merge:
   * `npm run build` (zero compilation errors)
   * Backend Boot Test (server starts without exceptions)
   * Frontend Smoke Test (UI renders and connects to backend)

---

## 3. Long-Term Objectives
VeriXa is NOT an endlessly expanding prototype. It is preserved strictly as:
* A flagship technical portfolio project.
* A hackathon and capstone showcase.
* An internship/job differentiator.
* A concrete demonstration of engineering maturity, constraint management, and architectural resilience.

---

## 4. Protected Identities
The following core tenets of the VeriXa platform MUST remain intact and untouched:
* **The Cinematic Aesthetic:** The premium gold-on-black, dark-mode forensic styling.
* **Forensic Intelligence Positioning:** The application is an investigative OS, not a "chatbot".
* **Evidence-First Philosophy:** AI generation must always be grounded in retrieved documentation.
* **Contradiction Intelligence:** The multi-source conflict detection workflows.
* **Adaptive Retrieval:** The intent-classification layer for semantic/factual routing.
* **SAFE_MODE:** The 512MB memory-guarded, zero-external-dependency resilience architecture.

---

## 5. Final Principle
**Trust > Fluency**
**Evidence > Generation**
**Stability > Feature Quantity**

*VeriXa is a finished product.*
