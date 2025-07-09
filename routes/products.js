const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get all products with filtering and pagination
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            section,
            vendor,
            minPrice,
            maxPrice,
            search,
            sort = 'createdAt',
            order = 'desc',
            isPromo,
            isNew
        } = req.query;

        const query = {};

        // Section filter
        if (section) {
            query['section.name'] = { $regex: section, $options: 'i' };
        }

        // Vendor filter
        if (vendor) {
            query['vendor.name'] = { $regex: vendor, $options: 'i' };
        }

        // Price range filter
        if (minPrice || maxPrice) {
            query.minPrice = {};
            if (minPrice) query.minPrice.$gte = parseFloat(minPrice);
            if (maxPrice) query.minPrice.$lte = parseFloat(maxPrice);
        }

        // Search filter
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { 'vendor.name': { $regex: search, $options: 'i' } },
                { 'section.name': { $regex: search, $options: 'i' } }
            ];
        }

        // Promo filter
        if (isPromo === 'true') {
            query.isPromo = true;
        }

        // New products filter
        if (isNew === 'true') {
            query.isNew = 1;
        }

        const sortOptions = {};
        if (sort === 'price') {
            sortOptions.minPrice = order === 'desc' ? -1 : 1;
        } else if (sort === 'title') {
            sortOptions.title = order === 'desc' ? -1 : 1;
        } else if (sort === 'sales') {
            sortOptions.salesCount = order === 'desc' ? -1 : 1;
        } else {
            sortOptions.createdAt = order === 'desc' ? -1 : 1;
        }

        const products = await Product.find(query)
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const total = await Product.countDocuments(query);

        res.json({
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findOne({ _id: parseInt(req.params.id) });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get products by section
router.get('/section/:section', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        
        const products = await Product.find({ 
            'section.name': { $regex: req.params.section, $options: 'i' }
        })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

        const total = await Product.countDocuments({ 
            'section.name': { $regex: req.params.section, $options: 'i' }
        });

        res.json({
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get promo products
router.get('/promo/all', async (req, res) => {
    try {
        const products = await Product.find({ 
            isPromo: true 
        }).limit(10);
        
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get new products
router.get('/new/all', async (req, res) => {
    try {
        const products = await Product.find({ 
            isNew: 1 
        }).limit(10);
        
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get product reviews count
router.get('/:id/reviews', async (req, res) => {
    try {
        const product = await Product.findOne({ _id: parseInt(req.params.id) });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ reviewsCount: product.reviewsCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search products
router.get('/search/:query', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        
        const products = await Product.find({
            $or: [
                { title: { $regex: req.params.query, $options: 'i' } },
                { 'vendor.name': { $regex: req.params.query, $options: 'i' } },
                { 'section.name': { $regex: req.params.query, $options: 'i' } }
            ]
        })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

        const total = await Product.countDocuments({
            $or: [
                { title: { $regex: req.params.query, $options: 'i' } },
                { 'vendor.name': { $regex: req.params.query, $options: 'i' } },
                { 'section.name': { $regex: req.params.query, $options: 'i' } }
            ]
        });

        res.json({
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 