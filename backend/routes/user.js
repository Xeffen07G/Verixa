const express = require('express');
const router = express.Router();
const User = process.env.MONGO_URI ? require('../models/User') : require('../utils/store').User;

// Update profile
router.put('/profile', async (req, res) => {
    try {
        const { userId, name, organization, profilePic } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, organization, profilePic },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(updatedUser);
    } catch (error) {
        console.error('Profile update failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
