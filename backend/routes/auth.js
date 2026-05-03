const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = process.env.MONGO_URI ? require('../models/User') : require('../utils/store').User;

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d'
    });
};

// @desc Register a new user
// @route POST /api/auth/register
router.post('/register', async (req, res) => {
    const { email, password, name, organization, role, designation } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const user = await User.create({ 
            email, 
            password, 
            name, 
            organization, 
            role: role || 'employee',
            designation: designation || 'Individual'
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                organization: user.organization,
                role: user.role,
                designation: user.designation,
                title: user.title,
                bio: user.bio,
                location: user.location,
                profilePic: user.profilePic,
                createdAt: user.createdAt,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ error: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @desc Auth user & get token
// @route POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        const isMatch = user && (user.matchPassword ? await user.matchPassword(password) : user.password === password);

        if (isMatch) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                organization: user.organization,
                role: user.role,
                title: user.title,
                bio: user.bio,
                location: user.location,
                profilePic: user.profilePic,
                createdAt: user.createdAt,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
