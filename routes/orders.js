const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { body, validationResult } = require('express-validator');

// Get user orders
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
        const orders = await Order.find({ user: decoded.userId })
            .populate('items.product')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: orders });
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

// Get single order
router.get('/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                error: 'Access token required' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const order = await Order.findOne({ 
            _id: req.params.id, 
            user: decoded.userId 
        }).populate('items.product');

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                error: 'Order not found' 
            });
        }

        res.json({ success: true, data: order });
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

// Create new order
router.post('/', [
    body('shippingAddress').isObject().withMessage('Shipping address is required'),
    body('paymentMethod').isIn(['card', 'cash', 'bank_transfer']).withMessage('Valid payment method is required')
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

        // Check if user has items in cart
        if (!user.cart || user.cart.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cart is empty' 
            });
        }

        // Validate cart items and calculate totals
        const orderItems = [];
        let subtotal = 0;

        for (const cartItem of user.cart) {
            const product = await Product.findById(cartItem.product);
            
            if (!product || !product.isActive) {
                return res.status(400).json({ 
                    success: false, 
                    error: `Product ${product ? product.name : 'Unknown'} is not available` 
                });
            }

            if (product.stock < cartItem.quantity) {
                return res.status(400).json({ 
                    success: false, 
                    error: `Insufficient stock for ${product.name}` 
                });
            }

            const itemTotal = product.price * cartItem.quantity;
            subtotal += itemTotal;

            orderItems.push({
                product: product._id,
                quantity: cartItem.quantity,
                price: product.price,
                total: itemTotal
            });

            // Update product stock
            product.stock -= cartItem.quantity;
            await product.save();
        }

        // Calculate totals
        const tax = subtotal * 0.1; // 10% tax
        const shipping = req.body.shippingCost || 0;
        const total = subtotal + tax + shipping;

        // Create order
        const order = new Order({
            user: user._id,
            items: orderItems,
            subtotal,
            tax,
            shipping,
            total,
            shippingAddress: req.body.shippingAddress,
            billingAddress: req.body.billingAddress || req.body.shippingAddress,
            paymentMethod: req.body.paymentMethod,
            notes: req.body.notes
        });

        await order.save();

        // Clear user cart
        user.cart = [];
        await user.save();

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
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

// Cancel order
router.put('/:id/cancel', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                error: 'Access token required' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const order = await Order.findOne({ 
            _id: req.params.id, 
            user: decoded.userId 
        });

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                error: 'Order not found' 
            });
        }

        // Check if order can be cancelled
        if (order.status === 'delivered' || order.status === 'cancelled') {
            return res.status(400).json({ 
                success: false, 
                error: 'Order cannot be cancelled' 
            });
        }

        // Update order status
        order.status = 'cancelled';
        await order.save();

        // Restore product stock
        for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
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

// Admin: Get all orders
router.get('/admin/all', async (req, res) => {
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

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                error: 'Admin access required' 
            });
        }

        const { page = 1, limit = 20, status } = req.query;
        
        const query = {};
        if (status) {
            query.status = status;
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            populate: ['user', 'items.product'],
            sort: { createdAt: -1 }
        };

        const orders = await Order.paginate(query, options);

        res.json({
            success: true,
            data: orders.docs,
            pagination: {
                page: orders.page,
                limit: orders.limit,
                totalPages: orders.totalPages,
                totalDocs: orders.totalDocs
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

// Admin: Update order status
router.put('/admin/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                error: 'Access token required' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                error: 'Admin access required' 
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                error: 'Order not found' 
            });
        }

        order.status = status;
        if (req.body.trackingNumber) {
            order.trackingNumber = req.body.trackingNumber;
        }
        if (req.body.estimatedDelivery) {
            order.estimatedDelivery = req.body.estimatedDelivery;
        }

        await order.save();

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: order
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