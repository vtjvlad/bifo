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
            category,
            search,
            minPrice,
            maxPrice,
            sort = 'createdAt',
            order = 'desc',
            featured
        } = req.query;

        const query = { isActive: true };

        // Category filter
        if (category) {
            query.category = category;
        }

        // Search filter
        if (search) {
            query.$text = { $search: search };
        }

        // Price filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        // Featured filter
        if (featured === 'true') {
            query.isFeatured = true;
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sort]: order === 'desc' ? -1 : 1 },
            populate: 'category'
        };

        const products = await Product.paginate(query, options);

        res.json({
            success: true,
            data: products.docs,
            pagination: {
                page: products.page,
                limit: products.limit,
                totalPages: products.totalPages,
                totalDocs: products.totalDocs,
                hasNextPage: products.hasNextPage,
                hasPrevPage: products.hasPrevPage
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category')
            .populate('rating.reviews');

        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get products by category
router.get('/category/:categoryId', async (req, res) => {
    try {
        const { page = 1, limit = 12 } = req.query;
        
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            populate: 'category'
        };

        const products = await Product.paginate(
            { category: req.params.categoryId, isActive: true },
            options
        );

        res.json({
            success: true,
            data: products.docs,
            pagination: {
                page: products.page,
                limit: products.limit,
                totalPages: products.totalPages,
                totalDocs: products.totalDocs
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
        
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            populate: 'category'
        };

        const products = await Product.paginate(
            { 
                $text: { $search: req.params.query },
                isActive: true 
            },
            options
        );

        res.json({
            success: true,
            data: products.docs,
            pagination: {
                page: products.page,
                limit: products.limit,
                totalPages: products.totalPages,
                totalDocs: products.totalDocs
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get featured products
router.get('/featured/list', async (req, res) => {
    try {
        const products = await Product.find({ 
            isFeatured: true, 
            isActive: true 
        })
        .populate('category')
        .limit(8)
        .sort({ createdAt: -1 });

        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new product (Admin only)
router.post('/', [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('category').isMongoId().withMessage('Valid category ID is required'),
    body('sku').notEmpty().withMessage('SKU is required')
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