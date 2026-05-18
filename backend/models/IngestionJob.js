const mongoose = require('mongoose');

const IngestionJobSchema = new mongoose.Schema({
  documentId: { type: String, required: true, unique: true },
  jobId: { type: String }, // BullMQ job ID of the CURRENT stage
  filename: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'extracting', 'chunking', 'embedding', 'indexing', 'completed', 'failed'],
    default: 'pending' 
  },
  stage: { type: String, default: 'extraction' },
  progress: { type: Number, default: 0 },
  chunksCount: { type: Number, default: 0 },
  path: { type: String }, // Local path for temporary storage
  error: { type: String },
  metadata: { type: Object, default: {} },
  extractionFailed: { type: Boolean, default: false },
  forensicStatus: { type: String },
  failureType: { type: String },
  reasoning: { type: String },
  recoverySuggestion: { type: String },
  timing: {
    start: { type: Date, default: Date.now },
    extraction: Number,
    chunking: Number,
    embedding: Number,
    indexing: Number,
    end: Date
  },
  metrics: {
    rss: Number,
    heapUsed: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('IngestionJob', IngestionJobSchema);
