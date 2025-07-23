const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Product = require('../models/Product');

// Middleware to get user from token
const getUserFromToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Get user's cart
router.get('/', getUserFromToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('cart.product', 'title minPrice imageLinks vendor');

        res.json({
            items: user.cart || [],
            total: calculateCartTotal(user.cart || [])
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add item to cart
router.post('/add', getUserFromToken, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        // Validate product
        const product = await Product.findOne({ id: parseInt(productId) });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if product has offers
        if (product.offerCount === 0) {
            return res.status(400).json({ error: 'Product not available' });
        }

        const user = await User.findById(req.user._id);
        
        // Check if product already in cart
        const existingItem = user.cart.find(item => 
            item.product.toString() === productId
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            user.cart.push({
                product: productId,
                quantity,
                price: product.minPrice
            });
        }

        await user.save();

        const updatedUser = await User.findById(user._id)
            .populate('cart.product', 'title minPrice imageLinks vendor');

        res.json({
            message: 'Item added to cart',
            cart: updatedUser.cart,
            total: calculateCartTotal(updatedUser.cart)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update cart item quantity
router.put('/update/:productId', getUserFromToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (quantity <= 0) {
            return res.status(400).json({ error: 'Quantity must be greater than 0' });
        }

        // Validate product stock
        const product = await Product.findOne({ id: parseInt(productId) });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if product has offers
        if (product.offerCount === 0) {
            return res.status(400).json({ error: 'Product not available' });
        }

        const user = await User.findById(req.user._id);
        const cartItem = user.cart.find(item => 
            item.product.toString() === productId
        );

        if (!cartItem) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        cartItem.quantity = quantity;
        await user.save();

        const updatedUser = await User.findById(user._id)
            .populate('cart.product', 'title minPrice imageLinks vendor');

        res.json({
            message: 'Cart updated',
            cart: updatedUser.cart,
            total: calculateCartTotal(updatedUser.cart)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove item from cart
router.delete('/remove/:productId', getUserFromToken, async (req, res) => {
    try {
        const { productId } = req.params;

        const user = await User.findById(req.user._id);
        user.cart = user.cart.filter(item => 
            item.product.toString() !== productId
        );

        await user.save();

        const updatedUser = await User.findById(user._id)
            .populate('cart.product', 'title minPrice imageLinks vendor');

        res.json({
            message: 'Item removed from cart',
            cart: updatedUser.cart,
            total: calculateCartTotal(updatedUser.cart)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Clear cart
router.delete('/clear', getUserFromToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.cart = [];
        await user.save();

        res.json({
            message: 'Cart cleared',
            cart: [],
            total: 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper function to calculate cart total
function calculateCartTotal(cart) {
    return cart.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
}

module.exports = router; 