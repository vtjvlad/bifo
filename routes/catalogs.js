const express = require('express');
const router = express.Router();
const Catalog = require('../models/Catalog');

// Get all catalogs
router.get('/', async (req, res) => {
    try {
        const catalogs = await Catalog.find({ isActive: true }).sort({ level: 1, sortOrder: 1 });
        res.json({ success: true, data: catalogs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get main catalogs only
router.get('/main', async (req, res) => {
    try {
        const catalogs = await Catalog.getMainCatalogs();
        res.json({ success: true, data: catalogs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get groups by catalog slug
router.get('/:catalogSlug/groups', async (req, res) => {
    try {
        const { catalogSlug } = req.params;
        const groups = await Catalog.getGroupsByCatalog(catalogSlug);
        res.json({ success: true, data: groups });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get categories by group slug
router.get('/:catalogSlug/groups/:groupSlug/categories', async (req, res) => {
    try {
        const { groupSlug } = req.params;
        const categories = await Catalog.getCategoriesByGroup(groupSlug);
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get references by catalog
router.get('/:catalogSlug/references', async (req, res) => {
    try {
        const { catalogSlug } = req.params;
        const references = await Catalog.getReferencesByCatalog(catalogSlug);
        res.json({ success: true, data: references });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get catalog tree
router.get('/tree', async (req, res) => {
    try {
        const tree = await Catalog.getCatalogTree();
        res.json({ success: true, data: tree });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get catalog by slug
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const catalog = await Catalog.findOne({ slug, isActive: true });
        
        if (!catalog) {
            return res.status(404).json({ success: false, message: 'Catalog not found' });
        }

        let response = { catalog };

        // Get groups if it's a main catalog
        if (catalog.level === 0) {
            const groups = await Catalog.getGroupsByCatalog(slug);
            response.groups = groups;
        }

        // Get categories if it's a group
        if (catalog.level === 1 && catalog.isGroup) {
            const categories = await Catalog.getCategoriesByGroup(slug);
            response.categories = categories;
        }

        res.json({ success: true, data: response });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get full catalog structure
router.get('/:catalogSlug/structure', async (req, res) => {
    try {
        const { catalogSlug } = req.params;
        
        const catalog = await Catalog.findOne({ slug: catalogSlug, level: 0, isActive: true });
        if (!catalog) {
            return res.status(404).json({ success: false, message: 'Catalog not found' });
        }

        const groups = await Catalog.getGroupsByCatalog(catalogSlug);
        const structure = {
            catalog,
            groups: []
        };

        for (const group of groups) {
            const categories = await Catalog.getCategoriesByGroup(group.slug);
            structure.groups.push({
                ...group.toObject(),
                categories
            });
        }

        res.json({ success: true, data: structure });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create catalog (Admin only)
router.post('/', async (req, res) => {
    try {
        const { name, slug, description, level, catalogSlug, groupSlug, isGroup, isReference, referenceTo, sortOrder } = req.body;
        
        // Validate required fields
        if (!name || !slug) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name and slug are required' 
            });
        }

        // Check if slug already exists
        const existingCatalog = await Catalog.findOne({ slug });
        if (existingCatalog) {
            return res.status(400).json({ 
                success: false, 
                message: 'Catalog with this slug already exists' 
            });
        }

        // Validate level and parent relationships
        if (level === 1 && !catalogSlug) {
            return res.status(400).json({ 
                success: false, 
                message: 'Catalog slug is required for groups' 
            });
        }

        if (level === 2 && (!catalogSlug || !groupSlug)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Catalog slug and group slug are required for categories' 
            });
        }

        const catalog = new Catalog({
            name,
            slug,
            description,
            level: level || 0,
            catalogSlug: level > 0 ? catalogSlug : null,
            groupSlug: level === 2 ? groupSlug : null,
            isGroup: isGroup || false,
            isReference: isReference || false,
            referenceTo: isReference ? referenceTo : null,
            sortOrder: sortOrder || 0
        });

        await catalog.save();
        res.status(201).json({ success: true, data: catalog });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update catalog (Admin only)
router.put('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const updateData = req.body;

        const catalog = await Catalog.findOneAndUpdate(
            { slug },
            updateData,
            { new: true, runValidators: true }
        );

        if (!catalog) {
            return res.status(404).json({ success: false, message: 'Catalog not found' });
        }

        res.json({ success: true, data: catalog });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete catalog (Admin only)
router.delete('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const catalog = await Catalog.findOneAndDelete({ slug });

        if (!catalog) {
            return res.status(404).json({ success: false, message: 'Catalog not found' });
        }

        res.json({ success: true, message: 'Catalog deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router; 