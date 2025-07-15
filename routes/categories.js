const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ level: 1, sortOrder: 1 });
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get main categories only
router.get('/main', async (req, res) => {
    try {
        const categories = await Category.getMainCategories();
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get subcategories by parent slug
router.get('/subcategories/:parentSlug', async (req, res) => {
    try {
        const { parentSlug } = req.params;
        const subcategories = await Category.getSubcategoriesByParent(parentSlug);
        res.json({ success: true, data: subcategories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get category tree
router.get('/tree', async (req, res) => {
    try {
        const tree = await Category.getCategoryTree();
        res.json({ success: true, data: tree });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get category by slug
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const category = await Category.findOne({ slug, isActive: true });
        
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Get subcategories if it's a main category
        let subcategories = [];
        if (category.level === 0) {
            subcategories = await Category.getSubcategoriesByParent(slug);
        }

        res.json({ 
            success: true, 
            data: { 
                category, 
                subcategories 
            } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create category (Admin only)
router.post('/', async (req, res) => {
    try {
        const { name, slug, description, level, parent, sortOrder } = req.body;
        
        // Validate required fields
        if (!name || !slug) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name and slug are required' 
            });
        }

        // Check if slug already exists
        const existingCategory = await Category.findOne({ slug });
        if (existingCategory) {
            return res.status(400).json({ 
                success: false, 
                message: 'Category with this slug already exists' 
            });
        }

        // Validate level and parent
        if (level === 1 && !parent) {
            return res.status(400).json({ 
                success: false, 
                message: 'Parent category is required for subcategories' 
            });
        }

        if (level === 1) {
            const parentCategory = await Category.findOne({ slug: parent, level: 0 });
            if (!parentCategory) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Parent category not found' 
                });
            }
        }

        const category = new Category({
            name,
            slug,
            description,
            level: level || 0,
            parent: level === 1 ? parent : null,
            sortOrder: sortOrder || 0
        });

        await category.save();
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update category (Admin only)
router.put('/:id', async (req, res) => {
    try {
        const { name, description, sortOrder, isActive } = req.body;
        
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, description, sortOrder, isActive },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete category (Admin only)
router.delete('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Check if category has subcategories
        if (category.level === 0) {
            const subcategories = await Category.find({ parent: category.slug });
            if (subcategories.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot delete category with subcategories' 
                });
            }
        }

        await Category.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router; 