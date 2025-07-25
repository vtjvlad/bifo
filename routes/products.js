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

// Get single product by URL
router.get('/url/:productUrl(*)', async (req, res) => {
    try {
        const productUrl = req.params.productUrl;
        
        console.log('🔍 API Debug - Product URL Request:');
        console.log('   Raw URL param:', productUrl);
        
        // Decode URL if it was encoded
        const decodedUrl = decodeURIComponent(productUrl);
        console.log('   Decoded URL:', decodedUrl);
        
        const product = await Product.findOne({ url: decodedUrl });
        console.log('   Found product:', product ? 'Yes' : 'No');

        if (!product) {
            console.log('   ❌ Product not found in database');
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        console.log('   ✅ Product found, returning data');
        res.json({ success: true, data: product });
    } catch (error) {
        console.error('   ❌ Error in URL product lookup:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get product detailed specifications
router.get('/:id/specifications', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        // Extract and format productValues preserving original order
        const specifications = {
            basic: [],
            detailed: [],
            technical: [],
            // Новое поле для сохранения исходного порядка
            ordered: []
        };

        if (product.productValues && Array.isArray(product.productValues)) {
            product.productValues.forEach(group => {
                if (group.edges && Array.isArray(group.edges)) {
                    group.edges.forEach(edge => {
                        if (edge.node) {
                            const spec = {
                                title: edge.node.title || '',
                                value: edge.node.value || '',
                                type: edge.node.type || '',
                                h1Text: edge.node.h1Text || '',
                                help: edge.node.help || '',
                                isHeader: edge.node.isHeader || false,
                                url: edge.node.url || ''
                            };

                            // Сохраняем исходный порядок
                            specifications.ordered.push(spec);

                            // Также сохраняем категоризацию для обратной совместимости
                            if (spec.isHeader) {
                                specifications.detailed.push(spec);
                            } else if (spec.type && spec.type.toLowerCase().includes('технич')) {
                                specifications.technical.push(spec);
                            } else {
                                specifications.basic.push(spec);
                            }
                        }
                    });
                }
            });
        }

        res.json({ 
            success: true, 
            data: {
                productId: product._id,
                specifications,
                techShortSpecifications: product.techShortSpecifications || [],
                techShortSpecificationsList: product.techShortSpecificationsList || []
            }
        });
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

// Get products by category
router.get('/catalog/:catalogSlug/group/:groupSlug/category/:categorySlug', async (req, res) => {
    try {
        const { catalogSlug, groupSlug, categorySlug } = req.params;
        const { page = 1, limit = 12, sort = 'createdAt', order = 'desc', minPrice, maxPrice, isPromo } = req.query;
        
        console.log('🔍 API Debug - Category Products Request:');
        console.log('   Params:', { catalogSlug, groupSlug, categorySlug });
        console.log('   Query:', req.query);
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortObj = { [sort]: order === 'desc' ? -1 : 1 };

        // First, try to get the category to find the productSearchField
        let category = null;
        try {
            category = await require('../models/Catalog').findOne({ 
                slug: categorySlug, 
                level: 2,
                isActive: true 
            });
        } catch (error) {
            console.log('   Could not find category:', error.message);
        }

        // Build query based on category - try multiple possible field structures
        const query = {
            $or: [
                // If category has productSearchField, use it
                ...(category && category.productSearchField ? [
                    { 'section.category': category.productSearchField },
                    { 'section.category': { $regex: category.productSearchField + '$', $options: 'i' } }
                ] : []),
                // Fallback to original logic
                { 'section.category': { $regex: categorySlug + '$', $options: 'i' } },
                { 'section.category': categorySlug },
                { 'section.id': categorySlug },
                { 'section.slug': categorySlug },
                { 'section.name': categorySlug },
                { 'category': categorySlug },
                { 'categorySlug': categorySlug },
                { 'categoryId': categorySlug }
            ]
        };
        
        console.log('   MongoDB Query:', JSON.stringify(query, null, 2));

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

// Create new product (Admin only)
router.post('/', [
    body('id').isInt().withMessage('ID is required and must be an integer'),
    body('hlSectionId').isInt().withMessage('hlSectionId is required and must be an integer'),
    body('date').notEmpty().withMessage('Date is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('currentPrice').optional().isFloat({ min: 0 }).withMessage('Valid price is required'),
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