const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { body, validationResult } = require('express-validator');

// Get all products with pagination and filters
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            section,
            search,
            minPrice,
            maxPrice,
            sort = 'createdAt',
            order = 'desc',
            isPromo
        } = req.query;

        const query = {};

        // Section filter
        if (section) {
            query['section.id'] = section;
        }

        // Search filter
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { 'vendor.name': { $regex: search, $options: 'i' } }
            ];
        }

        // Price filter
        if (minPrice || maxPrice) {
            query.currentPrice = {};
            if (minPrice) query.currentPrice.$gte = parseFloat(minPrice);
            if (maxPrice) query.currentPrice.$lte = parseFloat(maxPrice);
        }

        // Promo filter
        if (isPromo === 'true') {
            query.isPromo = true;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortObj = { [sort]: order === 'desc' ? -1 : 1 };

        const products = await Product.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(query);

        res.json({
            success: true,
            data: products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalDocs: total,
                hasNextPage: skip + products.length < total,
                hasPrevPage: parseInt(page) > 1
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get products by section
router.get('/section/:sectionId', async (req, res) => {
    try {
        const { page = 1, limit = 12 } = req.query;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const products = await Product.find(
            { 'section.id': req.params.sectionId }
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

        const total = await Product.countDocuments({ 'section.id': req.params.sectionId });

        res.json({
            success: true,
            data: products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalDocs: total
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Search products
router.get('/search/:query', async (req, res) => {
    try {
        const { page = 1, limit = 12 } = req.query;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = {
            $or: [
                { title: { $regex: req.params.query, $options: 'i' } },
                { 'vendor.name': { $regex: req.params.query, $options: 'i' } }
            ]
        };

        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(query);

        res.json({
            success: true,
            data: products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalDocs: total
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get promo products
router.get('/promo/list', async (req, res) => {
    try {
        const products = await Product.find({ 
            isPromo: true 
        })
        .limit(8)
        .sort({ createdAt: -1 });

        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new product (Admin only)
router.post('/', [
    body('title').notEmpty().withMessage('Title is required'),
    body('currentPrice').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('vendor').isObject().withMessage('Vendor information is required'),
    body('section').isObject().withMessage('Section information is required'),
    body('url').isURL().withMessage('Valid URL is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const product = new Product(req.body);
        await product.save();

        res.status(201).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update product (Admin only)
router.put('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete product (Admin only)
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router; 