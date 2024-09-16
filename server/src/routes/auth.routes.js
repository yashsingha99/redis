const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/auth.model');
// const client = require("../redis")
const router = express.Router();
const {connectRedis} = require("../redis")
let redisConnectionClient ;

(async() => {
    redisConnectionClient = await connectRedis()
})();

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

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

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const cachedUser = await redisConnectionClient.get(`user:${email}`);
        let user;

        if (cachedUser) {
            console.log('User found in cache:', cachedUser);
            user = JSON.parse(cachedUser);
        } else {
            user = await User.findOne({ email });
            if (!user) return res.status(400).json({ message: 'Invalid credentials' });

            await redisConnectionClient.set(
                `user:${email}`, 
                JSON.stringify({
                    _id: user._id,
                    email: user.email,
                    password: user.password
                }),
                {
                    EX: 3600 // Expire after 1 hour
                }
            );
        }

        // Check password match
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('JWT Token generated:', token);

        // Send token back to client
        res.status(200).json({ token });
    } catch (err) {
        console.error('Error logging in:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});


module.exports = router;
