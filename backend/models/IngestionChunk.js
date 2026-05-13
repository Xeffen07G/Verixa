const mongoose = require('mongoose');

const IngestionChunkSchema = new mongoose.Schema({
  documentId: { type: String, required: true, index: true },
  chunkIndex: { type: Number, required: true },
  text: { type: String, required: true },
  embedding: { type: [Number], default: [] },
  metadata: { type: Object, default: {} },
  status: { type: String, enum: ['pending', 'embedded', 'indexed'], default: 'pending' }
}, { timestamps: true });

IngestionChunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true });

module.exports = mongoose.model('IngestionChunk', IngestionChunkSchema);
