const express = require('express');
const router = express.Router();
const Catalog = require('../models/Catalog');

// Get main catalogs (level 0)
router.get('/main', async (req, res) => {
    try {
        const catalogs = await Catalog.getMainCatalogs();
        res.json(catalogs);
    } catch (error) {
        console.error('Error getting main catalogs:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get mega menu structure (all catalogs with hierarchy)
router.get('/mega', async (req, res) => {
    try {
        const catalogs = await Catalog.find({ isActive: true }).sort({ level: 1, sortOrder: 1 });
        
        // Build hierarchy
        const mainCatalogs = catalogs.filter(c => c.level === 0);
        const groups = catalogs.filter(c => c.level === 1);
        const categories = catalogs.filter(c => c.level === 2);
        
        const megaStructure = mainCatalogs.map(mainCatalog => {
            const catalogGroups = groups.filter(g => g.catalogSlug === mainCatalog.slug);
            
            const groupsWithCategories = catalogGroups.map(group => {
                const groupCategories = categories.filter(c => c.groupSlug === group.slug);
                return {
                    ...group.toObject(),
                    categories: groupCategories
                };
            });
            
            return {
                ...mainCatalog.toObject(),
                groups: groupsWithCategories
            };
        });
        
        res.json(megaStructure);
    } catch (error) {
        console.error('Error getting mega menu:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get catalog structure by slug
router.get('/structure/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        
        // Get main catalog
        const mainCatalog = await Catalog.findOne({ slug, level: 0, isActive: true });
        if (!mainCatalog) {
            return res.status(404).json({ error: 'Catalog not found' });
        }
        
        // Get groups in this catalog
        const groups = await Catalog.getGroupsByCatalog(slug);
        
        // Get categories for each group
        const groupsWithCategories = await Promise.all(
            groups.map(async (group) => {
                const categories = await Catalog.getCategoriesByGroup(group.slug);
                return {
                    ...group.toObject(),
                    categories: categories
                };
            })
        );
        
        const structure = {
            ...mainCatalog.toObject(),
            groups: groupsWithCategories
        };
        
        res.json(structure);
    } catch (error) {
        console.error('Error getting catalog structure:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get groups by catalog slug
router.get('/:catalogSlug/groups', async (req, res) => {
    try {
        const { catalogSlug } = req.params;
        const groups = await Catalog.getGroupsByCatalog(catalogSlug);
        res.json(groups);
    } catch (error) {
        console.error('Error getting groups:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get categories by group slug
router.get('/groups/:groupSlug/categories', async (req, res) => {
    try {
        const { groupSlug } = req.params;
        const categories = await Catalog.getCategoriesByGroup(groupSlug);
        res.json(categories);
    } catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get catalog by slug
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const catalog = await Catalog.findOne({ slug, isActive: true });
        
        if (!catalog) {
            return res.status(404).json({ error: 'Catalog not found' });
        }
        
        res.json(catalog);
    } catch (error) {
        console.error('Error getting catalog:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all catalogs (for admin purposes)
router.get('/', async (req, res) => {
    try {
        const { level, parent, catalogSlug, groupSlug } = req.query;
        
        let query = { isActive: true };
        
        if (level !== undefined) query.level = parseInt(level);
        if (parent) query.parent = parent;
        if (catalogSlug) query.catalogSlug = catalogSlug;
        if (groupSlug) query.groupSlug = groupSlug;
        
        const catalogs = await Catalog.find(query).sort({ level: 1, sortOrder: 1 });
        res.json(catalogs);
    } catch (error) {
        console.error('Error getting catalogs:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 