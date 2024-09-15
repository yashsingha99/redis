const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/auth.model');
const client = require("../redis")
const router = express.Router();


// Register a new user
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save the new user
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
        });

        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        console.error('Error registering user:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const cachedUser = await client.get(email);
        let user;

        if (cachedUser) {
            console.log(cachedUser);
            
            user = JSON.parse(cachedUser);
        } else {
            user = await User.findOne({ email });
            if (!user) return res.status(400).json({ message: 'Invalid credentials' });
            
            client.setex(user, 3600, JSON.stringify(user));
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (err) {
        console.error('Error logging in:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
