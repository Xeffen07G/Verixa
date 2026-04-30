const express = require('express');
const router = express.Router();
const User = process.env.MONGO_URI ? require('../models/User') : require('../utils/store').User;

// Update profile
router.put('/profile', async (req, res) => {
    try {
        console.log('Profile update request received:', { ...req.body, profilePic: req.body.profilePic ? '[BASE64_IMAGE]' : 'none' });
        
        const { userId, id, _id, name, organization, profilePic, title, bio, location } = req.body;
        const idToUpdate = userId || id || _id;
        
        if (!idToUpdate) {
            console.error('Update failed: No User ID provided');
            return res.status(400).json({ error: 'User ID is required' });
        }

        console.log('Attempting to update user:', idToUpdate);

        const updatedUser = await User.findByIdAndUpdate(
            idToUpdate,
            { name, organization, profilePic, title, bio, location },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            console.error('Update failed: User not found in database for ID:', idToUpdate);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('Profile updated successfully for:', updatedUser.email);
        res.json(updatedUser);
    } catch (error) {
        console.error('SERVER ERROR IN /api/user/profile:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

module.exports = router;
