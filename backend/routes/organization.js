const express = require('express');
const router = express.Router();
const User = process.env.MONGO_URI ? require('../models/User') : require('../utils/store').User;

// @desc Get all members in an organization
// @route GET /api/organization/:orgName/members
router.get('/:orgName/members', async (req, res) => {
  try {
    const { orgName } = req.params;
    
    if (!orgName) {
      return res.status(400).json({ error: 'Organization name is required' });
    }

    // Find all users belonging to this organization
    const members = await User.find({ 
      organization: { $regex: new RegExp(`^${orgName}$`, 'i') } 
    }).select('name email createdAt verifications'); // We can add verification stats later

    res.json(members);
  } catch (error) {
    console.error('Fetch members error:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

module.exports = router;
