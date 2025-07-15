const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { body, validationResult } = require('express-validator');

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .populate('parent')
            .sort({ sortOrder: 1, name: 1 });

        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get category tree (hierarchical structure)
router.get('/tree', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .sort({ sortOrder: 1, name: 1 });

        const buildTree = (items, parentId = null) => {
            return items
                .filter(item => String(item.parent) === String(parentId))
                .map(item => ({
                    ...item.toObject(),
                    children: buildTree(items, item._id)
                }));
        };

        const categoryTree = buildTree(categories);

        res.json({ success: true, data: categoryTree });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single category by ID
router.get('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate('parent');

        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get category by slug
router.get('/slug/:slug', async (req, res) => {
    try {
        const category = await Category.findOne({ 
            slug: req.params.slug,
            isActive: true 
        }).populate('parent');

        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get subcategories
router.get('/:id/subcategories', async (req, res) => {
    try {
        const subcategories = await Category.find({ 
            parent: req.params.id,
            isActive: true 
        }).sort({ sortOrder: 1, name: 1 });

        res.json({ success: true, data: subcategories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new category (Admin only)
router.post('/', [
    body('name').notEmpty().withMessage('Name is required'),
    body('slug').notEmpty().withMessage('Slug is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const category = new Category(req.body);
        await category.save();

        res.status(201).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update category (Admin only)
router.put('/:id', async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete category (Admin only)
router.delete('/:id', async (req, res) => {
    try {
        // Check if category has subcategories
        const hasSubcategories = await Category.exists({ parent: req.params.id });
        if (hasSubcategories) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot delete category with subcategories' 
            });
        }

        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router; 