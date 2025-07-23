const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// Register new user
router.post('/register', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { email, password, firstName, lastName, phone } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                error: 'User with this email already exists' 
            });
        }

        // Create new user
        const user = new User({
            email,
            password,
            firstName,
            lastName,
            phone
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                },
                token
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Login user
router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ 
                success: false, 
                error: 'Account is deactivated' 
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                },
                token
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get current user profile
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                error: 'Access token required' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        res.json({ success: true, data: user });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid token' 
            });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update user profile
router.put('/profile', [
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                error: 'Access token required' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findByIdAndUpdate(
            decoded.userId,
            req.body,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        res.json({ success: true, data: user });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid token' 
            });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// Change password
router.put('/change-password', [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                error: 'Access token required' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(req.body.currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ 
                success: false, 
                error: 'Current password is incorrect' 
            });
        }

        // Update password
        user.password = req.body.newPassword;
        await user.save();

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid token' 
            });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router; 