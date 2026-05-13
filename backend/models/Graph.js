const mongoose = require('mongoose');

/**
 * GraphNode Schema
 * Represents entities in the intelligence graph.
 */
const nodeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { 
    type: String, 
    enum: ['Document', 'Claim', 'Citation', 'Author', 'Concept', 'Evidence', 'Organization', 'Dataset'],
    required: true 
  },
  label: { type: String, required: true },
  properties: { type: Map, of: mongoose.Schema.Types.Mixed },
  metadata: {
    documentId: String,
    confidence: { type: Number, default: 1.0 },
    lastUpdated: { type: Date, default: Date.now }
  }
});

/**
 * GraphEdge Schema
 * Represents directional relationships between entities.
 */
const edgeSchema = new mongoose.Schema({
  from: { type: String, required: true, index: true },
  to: { type: String, required: true, index: true },
  relationship: {
    type: String,
    enum: ['SUPPORTS', 'CONTRADICTS', 'REFERENCES', 'DERIVED_FROM', 'EXPANDS_ON', 'CITES', 'AUTHORED_BY'],
    required: true
  },
  weight: { type: Number, default: 1.0 },
  properties: { type: Map, of: mongoose.Schema.Types.Mixed },
  metadata: {
    sourceId: String, // The chunk or document ID that established this link
    timestamp: { type: Date, default: Date.now }
  }
});

// Indexes for fast traversal
edgeSchema.index({ from: 1, relationship: 1 });
edgeSchema.index({ to: 1, relationship: 1 });

const GraphNode = mongoose.model('GraphNode', nodeSchema);
const GraphEdge = mongoose.model('GraphEdge', edgeSchema);

module.exports = { GraphNode, GraphEdge };
