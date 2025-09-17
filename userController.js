const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('./User'); // Import the User model

let blacklistedTokens = [];

// Helper function to generate JWT
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Signup controller
const signup = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { firstName, lastName, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user (password will be hashed automatically by the User model)
        const newUser = new User({
            name: `${firstName} ${lastName}`,
            email: email.toLowerCase(),
            password, // This will be hashed by the User model pre-save hook
            role: role || 'client'
        });

        const savedUser = await newUser.save();

        // Generate token
        const token = generateToken(savedUser._id);

        console.log('✅ New user created:', savedUser.email);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            token,
            user: {
                id: savedUser._id,
                email: savedUser.email,
                name: savedUser.name,
                role: savedUser.role
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during signup'
        });
    }
};

// Login controller
const login = async (req, res) => {
    try {
        console.log('🔍 Login attempt for:', req.body.email);
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user by email in database
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password using the User model method
        const passwordValid = await user.comparePassword(password);

        if (!passwordValid) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken(user._id);

        console.log('✅ Login successful for:', email);

        // Send success response
        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

// Logout controller
const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (token) {
            blacklistedTokens.push(token);
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during logout'
        });
    }
};

// Get user profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const { firstName, lastName } = req.body;
        
        if (firstName && lastName) {
            user.name = `${firstName} ${lastName}`;
            await user.save();
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get all users (for testing)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // Exclude password field

        const userList = users.map(user => ({
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role
        }));

        res.json({
            success: true,
            users: userList,
            total: userList.length
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    signup,
    login,
    logout,
    getProfile,
    updateProfile,
    getAllUsers
};