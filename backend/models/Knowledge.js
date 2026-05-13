const mongoose = require('mongoose');

const knowledgeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  text: { type: String, required: true },
  metadata: {
    documentId: { type: String, index: true },
    filename: String,
    page: Number,
    section: String,
    charStart: Number,
    charEnd: Number,
    author: String,
    timestamp: Date,
    entities: [String],
    sourceReliability: { type: Number, default: 1.0 }
  },
  embedding: { type: [Number], required: true },
  timestamp: { type: Date, default: Date.now }
});

// Add text index for keyword search (BM25-like behavior in MongoDB)
knowledgeSchema.index({ text: 'text' });

// Ensure documentId is indexed for fast filtering
knowledgeSchema.index({ 'metadata.documentId': 1 });

module.exports = mongoose.model('Knowledge', knowledgeSchema);

