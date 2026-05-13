/**
 * VeriXa Intelligence Observability Layer.
 * Tracks token usage, latency, and agent execution traces.
 */

const telemetry = {
  sessions: {},
};

function startTrace(sessionId, operation) {
  const traceId = `${operation}_${Date.now()}`;
  if (!telemetry.sessions[sessionId]) telemetry.sessions[sessionId] = [];
  
  const entry = {
    traceId,
    operation,
    startTime: Date.now(),
    status: 'running',
  };
  
  telemetry.sessions[sessionId].push(entry);
  return traceId;
}

function endTrace(sessionId, traceId, metadata = {}) {
  const session = telemetry.sessions[sessionId];
  if (!session) return;
  
  const entry = session.find(e => e.traceId === traceId);
  if (entry) {
    entry.endTime = Date.now();
    entry.latency = entry.endTime - entry.startTime;
    entry.status = 'completed';
    entry.metadata = metadata;
  }
}

function logTokenUsage(sessionId, model, tokens) {
  if (!telemetry.sessions[sessionId]) telemetry.sessions[sessionId] = [];
  telemetry.sessions[sessionId].push({
    type: 'token_usage',
    model,
    tokens,
    timestamp: Date.now()
  });
}

function getSessionTelemetry(sessionId) {
  return telemetry.sessions[sessionId] || [];
}

module.exports = {
  startTrace,
  endTrace,
  logTokenUsage,
  getSessionTelemetry
};
