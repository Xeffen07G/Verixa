const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Update profile — uses email as the lookup key (universal, avoids ObjectId issues)
router.post('/profile', async (req, res) => {
    try {
        const { email, name, organization, profilePic, title, bio, location } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required to update profile' });
        }

        console.log('Profile update for:', email);

        const updatedUser = await User.findOneAndUpdate(
            { email },
            { name, organization, profilePic, title, bio, location },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('Profile updated successfully for:', email);
        res.json(updatedUser);
    } catch (error) {
        console.error('Profile update error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
