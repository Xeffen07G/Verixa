const express = require('express');
const router = express.Router();
const User = process.env.MONGO_URI ? require('../models/User') : require('../utils/store').User;
const Verification = process.env.MONGO_URI ? require('../models/Verification') : require('../utils/store').Verification;

// @desc Get all members in an organization
// @route GET /api/organization/:orgName/members
router.get('/:orgName/members', async (req, res) => {
  try {
    const { orgName } = req.params;
    console.log(`🔍 Searching members for Organization: "${orgName}"`);
    const members = await User.find({ 
      organization: { $regex: new RegExp(`^${orgName}$`, 'i') } 
    }).select('name email createdAt');
    console.log(`✅ Found ${members.length} members`);
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// @desc Get organization-wide verification history
// @route GET /api/organization/:orgName/history
router.get('/:orgName/history', async (req, res) => {
  try {
    const { orgName } = req.params;
    const history = await Verification.find({ 
      organization: { $regex: new RegExp(`^${orgName}$`, 'i') } 
    }).sort({ timestamp: -1 }).limit(100);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch organization history' });
  }
});

// @desc Save a verification result (Shared Cloud)
// @route POST /api/organization/sync
router.post('/sync', async (req, res) => {
  try {
    const { userId, userName, organization, text, overallScore, claims } = req.body;
    const newVerification = await Verification.create({
      userId, userName, organization, text, overallScore, claims
    });
    res.status(201).json(newVerification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync verification' });
  }
});

module.exports = router;
