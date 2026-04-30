const mongoose = require('mongoose');

const VerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  organization: {
    type: String,
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true
  },
  overallScore: {
    type: Number,
    required: true
  },
  claims: [{
    claim: String,
    verdict: String,
    reasoning: String,
    source: String
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Verification', VerificationSchema);
