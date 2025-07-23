const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Catalog = require('../models/Catalog');

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
            isNew,
            category,
            subCategory
        } = req.query;

        const query = {};

        // Section filter (по productCategoryName)
        if (section) {
            query['section.productCategoryName'] = { $regex: section, $options: 'i' };
        }

        // Category filter (по section.category)
        if (category) {
            query['section.category'] = { $regex: category, $options: 'i' };
        }

        // SubCategory filter (по section.subCategory)
        if (subCategory) {
            query['section.subCategory'] = { $regex: subCategory, $options: 'i' };
        }

        // Vendor filter
        if (vendor) {
            query['vendor.title'] = { $regex: vendor, $options: 'i' };
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
                { 'vendor.title': { $regex: search, $options: 'i' } },
                { 'section.productCategoryName': { $regex: search, $options: 'i' } },
                { 'section.category': { $regex: search, $options: 'i' } },
                { 'section.subCategory': { $regex: search, $options: 'i' } }
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
        const product = await Product.findOne({ id: parseInt(req.params.id) });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get products by section (productCategoryName)
router.get('/section/:section', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        
        const products = await Product.find({ 
            'section.productCategoryName': { $regex: req.params.section, $options: 'i' }
        })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

        const total = await Product.countDocuments({ 
            'section.productCategoryName': { $regex: req.params.section, $options: 'i' }
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

// Get products by category (section.category)
router.get('/category/:category', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        
        const products = await Product.find({ 
            'section.category': { $regex: req.params.category, $options: 'i' }
        })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

        const total = await Product.countDocuments({ 
            'section.category': { $regex: req.params.category, $options: 'i' }
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

// Get products by subcategory (section.subCategory)
router.get('/subcategory/:subCategory', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        
        const products = await Product.find({ 
            'section.subCategory': { $regex: req.params.subCategory, $options: 'i' }
        })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

        const total = await Product.countDocuments({ 
            'section.subCategory': { $regex: req.params.subCategory, $options: 'i' }
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
        const product = await Product.findOne({ id: parseInt(req.params.id) });
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
                { 'vendor.title': { $regex: req.params.query, $options: 'i' } },
                { 'section.productCategoryName': { $regex: req.params.query, $options: 'i' } },
                { 'section.category': { $regex: req.params.query, $options: 'i' } },
                { 'section.subCategory': { $regex: req.params.query, $options: 'i' } }
            ]
        })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

        const total = await Product.countDocuments({
            $or: [
                { title: { $regex: req.params.query, $options: 'i' } },
                { 'vendor.title': { $regex: req.params.query, $options: 'i' } },
                { 'section.productCategoryName': { $regex: req.params.query, $options: 'i' } },
                { 'section.category': { $regex: req.params.query, $options: 'i' } },
                { 'section.subCategory': { $regex: req.params.query, $options: 'i' } }
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

// Get products by catalog
router.get('/catalog/:catalogSlug', async (req, res) => {
    try {
        const { page = 1, limit = 20, group, category } = req.query;
        const { catalogSlug } = req.params;

        // Get catalog structure
        const catalog = await Catalog.findOne({ slug: catalogSlug, level: 0, isActive: true });
        if (!catalog) {
            return res.status(404).json({ error: 'Catalog not found' });
        }

        let query = {};

        // If group is specified, filter by group
        if (group) {
            const groupCatalog = await Catalog.findOne({ 
                slug: group, 
                catalogSlug: catalogSlug, 
                level: 1, 
                isActive: true 
            });
            
            if (!groupCatalog) {
                return res.status(404).json({ error: 'Group not found' });
            }

            // If category is specified, filter by category
            if (category) {
                const categoryCatalog = await Catalog.findOne({ 
                    slug: category, 
                    groupSlug: group, 
                    level: 2, 
                    isActive: true 
                });
                
                if (!categoryCatalog) {
                    return res.status(404).json({ error: 'Category not found' });
                }

                // Use category's productSearchField if available, otherwise use category name
                const searchField = categoryCatalog.productSearchField || categoryCatalog.name;
                query['section.category'] = { $regex: searchField, $options: 'i' };
            } else {
                // Use group's productSearchField if available, otherwise use group name
                const searchField = groupCatalog.productSearchField || groupCatalog.name;
                query['section.category'] = { $regex: searchField, $options: 'i' };
            }
        } else {
            // Use catalog's productSearchField if available, otherwise use catalog name
            const searchField = catalog.productSearchField || catalog.name;
            query['section.category'] = { $regex: searchField, $options: 'i' };
        }

        const products = await Product.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 })
            .exec();

        const total = await Product.countDocuments(query);

        res.json({
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total,
            catalog: {
                name: catalog.name,
                slug: catalog.slug,
                description: catalog.description
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get products by group
router.get('/group/:groupSlug', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const { groupSlug } = req.params;

        // Get group
        const group = await Catalog.findOne({ slug: groupSlug, level: 1, isActive: true });
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const searchField = group.productSearchField || group.name;
        const query = { 'section.category': { $regex: searchField, $options: 'i' } };

        const products = await Product.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 })
            .exec();

        const total = await Product.countDocuments(query);

        res.json({
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total,
            group: {
                name: group.name,
                slug: group.slug,
                description: group.description
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get products by category
router.get('/category/:categorySlug', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const { categorySlug } = req.params;

        // Get category
        const category = await Catalog.findOne({ slug: categorySlug, level: 2, isActive: true });
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const searchField = category.productSearchField || category.name;
        const query = { 'section.category': { $regex: searchField, $options: 'i' } };

        const products = await Product.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 })
            .exec();

        const total = await Product.countDocuments(query);

        res.json({
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total,
            category: {
                name: category.name,
                slug: category.slug,
                description: category.description
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get featured products for catalog
router.get('/featured/catalog/:catalogSlug', async (req, res) => {
    try {
        const { catalogSlug } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        // Get catalog
        const catalog = await Catalog.findOne({ slug: catalogSlug, level: 0, isActive: true });
        if (!catalog) {
            return res.status(404).json({ error: 'Catalog not found' });
        }

        const searchField = catalog.productSearchField || catalog.name;
        const query = { 'section.category': { $regex: searchField, $options: 'i' } };

        const products = await Product.find(query)
            .sort({ salesCount: -1, createdAt: -1 })
            .limit(limit)
            .exec();

        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get products count by catalog structure
router.get('/stats/catalog/:catalogSlug', async (req, res) => {
    try {
        const { catalogSlug } = req.params;

        // Get catalog structure
        const catalog = await Catalog.findOne({ slug: catalogSlug, level: 0, isActive: true });
        if (!catalog) {
            return res.status(404).json({ error: 'Catalog not found' });
        }

        const groups = await Catalog.getGroupsByCatalog(catalogSlug);
        
        const stats = await Promise.all(groups.map(async (group) => {
            const categories = await Catalog.getCategoriesByGroup(group.slug);
            
            const groupStats = await Promise.all(categories.map(async (category) => {
                const searchField = category.productSearchField || category.name;
                const count = await Product.countDocuments({ 
                    'section.category': { $regex: searchField, $options: 'i' } 
                });
                
                return {
                    name: category.name,
                    slug: category.slug,
                    count
                };
            }));

            const groupSearchField = group.productSearchField || group.name;
            const groupCount = await Product.countDocuments({ 
                'section.category': { $regex: groupSearchField, $options: 'i' } 
            });

            return {
                name: group.name,
                slug: group.slug,
                count: groupCount,
                categories: groupStats
            };
        }));

        const catalogSearchField = catalog.productSearchField || catalog.name;
        const totalCount = await Product.countDocuments({ 
            'section.category': { $regex: catalogSearchField, $options: 'i' } 
        });

        res.json({
            catalog: {
                name: catalog.name,
                slug: catalog.slug,
                totalCount
            },
            groups: stats
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get categories statistics
router.get('/stats/categories', async (req, res) => {
    try {
        const stats = await Product.aggregate([
            {
                $group: {
                    _id: {
                        category: '$section.category',
                        subCategory: '$section.subCategory',
                        productCategoryName: '$section.productCategoryName'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.category',
                    subCategories: {
                        $push: {
                            subCategory: '$_id.subCategory',
                            productCategoryName: '$_id.productCategoryName',
                            count: '$count'
                        }
                    },
                    totalCount: { $sum: '$count' }
                }
            },
            { $sort: { totalCount: -1 } }
        ]);

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 