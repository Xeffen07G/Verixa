const mongoose = require('mongoose');

const knowledgeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  text: { type: String, required: true },
  metadata: { type: Object, default: {} },
  embedding: { type: [Number], required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Knowledge', knowledgeSchema);
