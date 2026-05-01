const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');

const connectDB = require('../config/db');

// Update profile
router.put('/profile', async (req, res) => {
    try {
        // Active Reconnection Logic
        if (mongoose.connection.readyState !== 1) {
            console.log('Database connection inactive (State: ' + mongoose.connection.readyState + '). Attempting emergency reconnection...');
            try {
                await connectDB();
                console.log('Emergency reconnection successful.');
            } catch (connErr) {
                console.error('Emergency reconnection failed:', connErr);
                return res.status(503).json({ error: 'Database is currently unreachable. Please check your Atlas IP Whitelist (Allow Access From Anywhere).' });
            }
        }
        console.log('Profile update request received:', { ...req.body, profilePic: req.body.profilePic ? '[BASE64_IMAGE]' : 'none' });
        
        const { userId, id, _id, name, organization, profilePic, title, bio, location } = req.body;
        const idToUpdate = userId || id || _id;
        
        if (!idToUpdate) {
            console.error('Update failed: No User ID provided');
            return res.status(400).json({ error: 'User ID is required' });
        }

        console.log('Attempting to update user with RAW bypass:', idToUpdate);

        // Using User.collection.findOneAndUpdate to bypass Mongoose's strict ObjectId casting
        // This is necessary to support legacy string/timestamp IDs
        const result = await User.collection.findOneAndUpdate(
            { _id: idToUpdate },
            { $set: { name, organization, profilePic, title, bio, location, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );

        const updatedUser = result.value || result; // Handle different driver version response formats

        if (!updatedUser) {
            // Fallback for very old mock implementations
            const fallbackResult = await User.collection.findOneAndUpdate(
                { id: idToUpdate },
                { $set: { name, organization, profilePic, title, bio, location, updatedAt: new Date() } },
                { returnDocument: 'after' }
            );
            const fallbackUser = fallbackResult.value || fallbackResult;

            if (!fallbackUser) {
                console.error('Update failed: User not found in database for ID:', idToUpdate);
                return res.status(404).json({ error: 'User not found' });
            }
            return res.json(fallbackUser);
        }

        console.log('Profile updated successfully (Bypass Mode)');
        res.json(updatedUser);
    } catch (error) {
        console.error('SERVER ERROR IN /api/user/profile:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

module.exports = router;
