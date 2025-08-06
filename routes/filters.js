const express = require('express');
const router = express.Router();
const Filter = require('../models/Filters.js');

// Get filters by section ID
router.get('/section/:sectionId', async (req, res) => {
    try {
        const { sectionId } = req.params;
        
        const filters = await Filter.find({ 
            sectionId: parseInt(sectionId),
            isPublic: true 
        }).sort({ weight: -1, title: 1 });

        res.json({
            success: true,
            data: filters
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get filters by category URL
router.get('/category/:categoryUrl', async (req, res) => {
    try {
        const { categoryUrl } = req.params;
        
        const filters = await Filter.find({ 
            categoryUrl: decodeURIComponent(categoryUrl),
            isPublic: true 
        }).sort({ weight: -1, title: 1 });

        res.json({
            success: true,
            data: filters
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get filters by multiple criteria
router.get('/', async (req, res) => {
    try {
        const { sectionId, categoryUrl, categoryName, type } = req.query;
        
        const query = { isPublic: true };
        
        if (sectionId) {
            query.sectionId = parseInt(sectionId);
        }
        
        if (categoryUrl) {
            query.categoryUrl = decodeURIComponent(categoryUrl);
        }
        
        if (categoryName) {
            query.categoryName = { $regex: categoryName, $options: 'i' };
        }
        
        if (type) {
            query.type = type;
        }

        const filters = await Filter.find(query).sort({ weight: -1, title: 1 });

        res.json({
            success: true,
            data: filters
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get single filter by ID
router.get('/:id', async (req, res) => {
    try {
        const filter = await Filter.findById(req.params.id);

        if (!filter) {
            return res.status(404).json({ 
                success: false, 
                error: 'Filter not found' 
            });
        }

        res.json({ 
            success: true, 
            data: filter 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Create new filter (Admin only)
router.post('/', async (req, res) => {
    try {
        const filter = new Filter(req.body);
        await filter.save();

        res.status(201).json({ 
            success: true, 
            data: filter 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Update filter (Admin only)
router.put('/:id', async (req, res) => {
    try {
        const filter = await Filter.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!filter) {
            return res.status(404).json({ 
                success: false, 
                error: 'Filter not found' 
            });
        }

        res.json({ 
            success: true, 
            data: filter 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Delete filter (Admin only)
router.delete('/:id', async (req, res) => {
    try {
        const filter = await Filter.findByIdAndDelete(req.params.id);

        if (!filter) {
            return res.status(404).json({ 
                success: false, 
                error: 'Filter not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Filter deleted successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;