const mongoose = require('mongoose');

/**
 * Workspace Schema
 * Represents a persistent research session or collection.
 */
const workspaceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  userId: { type: String, required: true, index: true },
  documentIds: [String],
  findings: [{
    query: String,
    answer: String,
    timestamp: { type: Date, default: Date.now },
    citations: [Object]
  }],
  annotations: [{
    chunkId: String,
    text: String,
    comment: String,
    timestamp: { type: Date, default: Date.now }
  }],
  timeline: [{
    event: String,
    date: Date,
    sourceId: String
  }],
  metadata: {
    lastAccessed: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'archived'], default: 'active' }
  }
});

module.exports = mongoose.model('Workspace', workspaceSchema);
