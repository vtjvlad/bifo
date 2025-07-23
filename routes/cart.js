const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Product = require('../models/Product');

// Get user cart
router.get('/', async (req, res) => {
    try {
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

        // Get cart from user document or initialize empty cart
        const cart = user.cart || [];
        
        // Populate product details for cart items
        const populatedCart = await Promise.all(
            cart.map(async (item) => {
                const product = await Product.findById(item.product).select('name price images stock isActive');
                if (product && product.isActive) {
                    return {
                        product: product,
                        quantity: item.quantity,
                        total: product.price * item.quantity
                    };
                }
                return null;
            })
        );

        // Filter out null items (products that don't exist or are inactive)
        const validCartItems = populatedCart.filter(item => item !== null);

        // Calculate totals
        const subtotal = validCartItems.reduce((sum, item) => sum + item.total, 0);
        const itemCount = validCartItems.reduce((sum, item) => sum + item.quantity, 0);

        res.json({
            success: true,
            data: {
                items: validCartItems,
                subtotal,
                itemCount
            }
        });
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

// Add item to cart
router.post('/add', async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                error: 'Access token required' 
            });
        }

        if (!productId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Product ID is required' 
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

        // Check if product exists and is active
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            return res.status(404).json({ 
                success: false, 
                error: 'Product not found or unavailable' 
            });
        }

        // Check stock availability
        if (product.stock < quantity) {
            return res.status(400).json({ 
                success: false, 
                error: 'Insufficient stock' 
            });
        }

        // Initialize cart if it doesn't exist
        if (!user.cart) {
            user.cart = [];
        }

        // Check if product already in cart
        const existingItemIndex = user.cart.findIndex(
            item => item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
            // Update quantity
            user.cart[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            user.cart.push({ product: productId, quantity });
        }

        await user.save();

        res.json({
            success: true,
            message: 'Item added to cart successfully',
            data: {
                productId,
                quantity: existingItemIndex > -1 ? user.cart[existingItemIndex].quantity : quantity
            }
        });
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

// Update cart item quantity
router.put('/update', async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                error: 'Access token required' 
            });
        }

        if (!productId || quantity === undefined) {
            return res.status(400).json({ 
                success: false, 
                error: 'Product ID and quantity are required' 
            });
        }

        if (quantity < 1) {
            return res.status(400).json({ 
                success: false, 
                error: 'Quantity must be at least 1' 
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

        // Check if product exists and is active
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            return res.status(404).json({ 
                success: false, 
                error: 'Product not found or unavailable' 
            });
        }

        // Check stock availability
        if (product.stock < quantity) {
            return res.status(400).json({ 
                success: false, 
                error: 'Insufficient stock' 
            });
        }

        // Find and update cart item
        const cartItemIndex = user.cart.findIndex(
            item => item.product.toString() === productId
        );

        if (cartItemIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                error: 'Item not found in cart' 
            });
        }

        user.cart[cartItemIndex].quantity = quantity;
        await user.save();

        res.json({
            success: true,
            message: 'Cart updated successfully',
            data: {
                productId,
                quantity
            }
        });
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

// Remove item from cart
router.delete('/remove/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
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

        // Remove item from cart
        user.cart = user.cart.filter(
            item => item.product.toString() !== productId
        );

        await user.save();

        res.json({
            success: true,
            message: 'Item removed from cart successfully'
        });
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

// Clear cart
router.delete('/clear', async (req, res) => {
    try {
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

        user.cart = [];
        await user.save();

        res.json({
            success: true,
            message: 'Cart cleared successfully'
        });
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