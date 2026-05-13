/**
 * CostGovernanceService: Manages token budgets, adaptive routing, and execution profiling.
 * Prevents runaway agent chains and excessive resource consumption.
 */
class CostGovernanceService {
  constructor() {
    this.budgets = new Map(); // sessionId -> { tokens, cost, startTime }
    this.LIMITS = {
      MAX_TOKENS_PER_SESSION: 500000,
      MAX_RECURSIVE_LOOPS: 3,
      MAX_RETRIEVAL_TOP_K: 50,
      MAX_LATENCY_MS: 30000 // 30 seconds
    };
  }

  /**
   * Check if a session is within budget.
   */
  checkBudget(sessionId) {
    const budget = this.budgets.get(sessionId) || { tokens: 0, cost: 0, startTime: Date.now() };
    
    if (budget.tokens > this.LIMITS.MAX_TOKENS_PER_SESSION) {
      throw new Error(`Token budget exceeded for session ${sessionId}`);
    }

    const elapsed = Date.now() - budget.startTime;
    if (elapsed > this.LIMITS.MAX_LATENCY_MS) {
      console.warn(`[Governance] Latency warning for session ${sessionId}: ${elapsed}ms`);
    }

    return true;
  }

  /**
   * Log resource usage.
   */
  logUsage(sessionId, model, tokens) {
    const budget = this.budgets.get(sessionId) || { tokens: 0, cost: 0, startTime: Date.now() };
    
    // Simple cost estimation (example prices)
    const costPer1k = model.includes('70b') ? 0.0008 : 0.0001;
    const sessionCost = (tokens / 1000) * costPer1k;

    budget.tokens += tokens;
    budget.cost += sessionCost;
    
    this.budgets.set(sessionId, budget);
    
    // Log to observability if available
    try {
      const { logTokenUsage } = require('../utils/observability');
      logTokenUsage(sessionId, model, tokens);
    } catch (e) {}
  }

  /**
   * Adaptive Model Routing.
   * Decides which model to use based on task complexity and budget.
   */
  routeModel(taskType, remainingBudget) {
    if (remainingBudget < 1000) return "llama-3.1-8b-instant";
    
    switch (taskType) {
      case 'synthesis':
      case 'contradiction':
        return "llama-3.3-70b-versatile";
      case 'extraction':
      case 'summarization':
      default:
        return "llama-3.1-8b-instant";
    }
  }

  getBudget(sessionId) {
    return this.budgets.get(sessionId) || { tokens: 0, cost: 0 };
  }
}

module.exports = new CostGovernanceService();
