const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');
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

// Create new order
router.post('/', getUserFromToken, async (req, res) => {
    try {
        const {
            items,
            shippingAddress,
            billingAddress,
            paymentMethod,
            notes
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Validate items and calculate totals
        const orderItems = [];
        let subtotal = 0;

        for (const item of items) {
            const product = await Product.findOne({ id: parseInt(item.product) });
            if (!product) {
                return res.status(404).json({ error: `Product ${item.product} not found` });
            }

            if (product.offerCount === 0) {
                return res.status(400).json({ 
                    error: `Product ${product.title} not available` 
                });
            }

            const itemTotal = product.minPrice * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                product: item.product,
                quantity: item.quantity,
                price: product.minPrice,
                total: itemTotal
            });
        }

        // Calculate shipping and tax
        const shipping = subtotal > 5000 ? 0 : 500; // Free shipping over 5000
        const tax = subtotal * 0.2; // 20% tax
        const total = subtotal + shipping + tax;

        // Create order
        const order = new Order({
            user: req.user._id,
            items: orderItems,
            subtotal,
            shipping,
            tax,
            total,
            shippingAddress,
            billingAddress,
            paymentMethod,
            notes
        });

        await order.save();

        // Clear user's cart
        req.user.cart = [];
        await req.user.save();

        // Populate order with product details
        const populatedOrder = await Order.findById(order._id)
            .populate('items.product', 'title imageLinks vendor')
            .populate('user', 'firstName lastName email');

        res.status(201).json({
            message: 'Order created successfully',
            order: populatedOrder
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's orders
router.get('/', getUserFromToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const query = { user: req.user._id };
        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .populate('items.product', 'title imageLinks vendor')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const total = await Order.countDocuments(query);

        res.json({
            orders,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single order
router.get('/:id', getUserFromToken, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id
        })
        .populate('items.product', 'title imageLinks vendor techShortSpecifications')
        .populate('user', 'firstName lastName email phone');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel order
router.put('/:id/cancel', getUserFromToken, async (req, res) => {
    try {
        const { reason } = req.body;

        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status !== 'pending' && order.status !== 'confirmed') {
            return res.status(400).json({ 
                error: 'Order cannot be cancelled at this stage' 
            });
        }

        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancelledBy = req.user._id;
        order.cancelReason = reason;

        // Note: In this model we don't track stock, so we just cancel the order

        await order.save();

        res.json({
            message: 'Order cancelled successfully',
            order
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get order tracking
router.get('/:id/tracking', getUserFromToken, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id
        }).select('status trackingNumber estimatedDelivery');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const trackingInfo = {
            status: order.status,
            trackingNumber: order.trackingNumber,
            estimatedDelivery: order.estimatedDelivery,
            statusHistory: [
                {
                    status: 'pending',
                    date: order.createdAt,
                    description: 'Заказ создан'
                },
                {
                    status: 'confirmed',
                    date: order.status === 'confirmed' ? order.updatedAt : null,
                    description: 'Заказ подтвержден'
                },
                {
                    status: 'processing',
                    date: order.status === 'processing' ? order.updatedAt : null,
                    description: 'Заказ обрабатывается'
                },
                {
                    status: 'shipped',
                    date: order.status === 'shipped' ? order.updatedAt : null,
                    description: 'Заказ отправлен'
                },
                {
                    status: 'delivered',
                    date: order.deliveredAt,
                    description: 'Заказ доставлен'
                }
            ].filter(item => item.date !== null)
        };

        res.json(trackingInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 