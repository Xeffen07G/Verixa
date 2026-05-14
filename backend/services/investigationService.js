const { readStore, writeStore } = require("../utils/store");

/**
 * Investigation Session Manager
 * Orchestrates global context across Verification, Research, and Intelligence workspaces.
 */
class InvestigationSessionManager {
  constructor() {
    this.sessions = {};
  }

  getOrCreateSession(sessionId) {
    if (!this.sessions[sessionId]) {
      this.sessions[sessionId] = {
        id: sessionId,
        startTime: Date.now(),
        lastActive: Date.now(),
        claims: [],
        evidenceLedger: [],
        contradictions: [],
        timeline: [],
        trustScore: 0,
        context: {
          activePapers: [],
          topics: []
        }
      };
      this.logEvent(sessionId, "SESSION_CREATED", "Investigation session initialized.");
    }
    return this.sessions[sessionId];
  }

  logEvent(sessionId, type, description, metadata = {}) {
    const session = this.getOrCreateSession(sessionId);
    session.timeline.push({
      id: Math.random().toString(36).slice(2, 9),
      timestamp: Date.now(),
      type,
      description,
      metadata
    });
    session.lastActive = Date.now();
  }

  addEvidence(sessionId, evidence) {
    const session = this.getOrCreateSession(sessionId);
    // Avoid duplicates
    if (!session.evidenceLedger.some(e => e.id === evidence.id)) {
      session.evidenceLedger.push({
        ...evidence,
        timestamp: Date.now()
      });
      this.logEvent(sessionId, "EVIDENCE_ADDED", `New evidence artifact from ${evidence.source || 'unknown source'}`, { evidenceId: evidence.id });
      this.calculateTrustScore(sessionId);
    }
  }

  addContradiction(sessionId, contradiction) {
    const session = this.getOrCreateSession(sessionId);
    session.contradictions.push({
      ...contradiction,
      timestamp: Date.now()
    });
    this.logEvent(sessionId, "CONTRADICTION_DETECTED", contradiction.explanation, { type: contradiction.type });
    this.calculateTrustScore(sessionId);
  }

  calculateTrustScore(sessionId) {
    const session = this.getOrCreateSession(sessionId);
    const evidenceCount = session.evidenceLedger.length;
    const contradictionCount = session.contradictions.length;
    
    if (evidenceCount === 0) {
      session.trustScore = 0;
      return;
    }

    // Heuristic: More evidence increases trust, contradictions penalize it
    let score = 50; // Base score
    score += (evidenceCount * 5); // Each evidence +5
    score -= (contradictionCount * 15); // Each contradiction -15
    
    // Bounds
    session.trustScore = Math.max(0, Math.min(100, score));
  }

  getSessionPackage(sessionId) {
    return this.getOrCreateSession(sessionId);
  }
}

const manager = new InvestigationSessionManager();
module.exports = manager;
