const mongoose = require('mongoose');

/**
 * Investigation Schema
 * Tracks findings that require human review and validation.
 */
const investigationSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  findingId: String,
  query: String,
  proposedAnswer: String,
  citations: [Object],
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'modified'], 
    default: 'pending' 
  },
  reviewerId: String,
  reviewerNotes: String,
  confidenceScore: Number, // AI generated
  humanConfidenceScore: Number, // Reviewer assigned
  metadata: {
    hallucinationSuspected: Boolean,
    contradictionsFound: Boolean
  },
  timestamp: { type: Date, default: Date.now },
  reviewedAt: Date
});

module.exports = mongoose.model('Investigation', investigationSchema);
