const mongoose = require('mongoose');

/**
 * AuditLog Schema
 * Tracks every critical system action for security and compliance.
 */
const auditLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: String,
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now }
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

/**
 * RBAC Middleware
 * Enforces role-based access control.
 */
function authorize(roles = []) {
  return (req, res, next) => {
    // Placeholder for actual user role extraction from JWT/Auth context
    const userRole = req.user?.role || 'user'; 
    
    if (roles.length && !roles.includes(userRole)) {
      return res.status(403).json({ error: "Access denied. Insufficient permissions." });
    }
    
    next();
  };
}

/**
 * Log a security event.
 */
async function logAuditEvent(data) {
  try {
    await AuditLog.create(data);
  } catch (err) {
    console.error("[Security] Audit logging failed:", err);
  }
}

module.exports = {
  AuditLog,
  authorize,
  logAuditEvent
};
