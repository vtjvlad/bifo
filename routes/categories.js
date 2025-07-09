const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get all sections with product counts
router.get('/', async (req, res) => {
    try {
        // Get unique sections from products
        const sections = await Product.aggregate([
            { $group: { _id: '$section.name', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Map sections to display format
        const sectionsWithCounts = sections.map(section => ({
            name: section._id,
            label: section._id,
            icon: getSectionIcon(section._id),
            count: section.count
        }));

        res.json(sectionsWithCounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper function to get section icon
function getSectionIcon(sectionName) {
    const iconMap = {
        'Электроника': '📱',
        'Одежда': '👕',
        'Мебель': '🪑',
        'Спорт': '⚽',
        'Книги': '📚',
        'Игрушки': '🧸',
        'Автотовары': '🚗',
        'Красота': '💄',
        'Здоровье': '💊',
        'Дом': '🏠',
        'Сад': '🌱',
        'Инструменты': '🔧',
        'Украшения': '💍',
        'Часы': '⌚',
        'Сумки': '👜',
        'Обувь': '👟',
        'Аксессуары': '🕶️',
        'Продукты': '🍎',
        'Напитки': '🥤',
        'Товары для животных': '🐕',
        'Детские товары': '👶',
        'Офис': '📁',
        'Искусство': '🎨',
        'Коллекционные': '🏆',
        'Военное снаряжение': '🎖️',
        'Интимные товары': '🔞',
        'Музыка': '🎵',
        'Фильмы': '🎬',
        'Игры': '🎮',
        'Активный отдых': '🏕️',
        'Фитнес': '💪',
        'Медицинские товары': '🏥',
        'Промышленные товары': '🏭',
        'Сельхозтовары': '🚜',
        'Строительные материалы': '🏗️'
    };
    
    return iconMap[sectionName] || '📦';
}

// Get vendors for a specific section
router.get('/:section/vendors', async (req, res) => {
    try {
        const { section } = req.params;
        
        const vendors = await Product.distinct('vendor.name', {
            'section.name': { $regex: section, $options: 'i' },
            'vendor.name': { $exists: true, $ne: '' }
        });

        res.json(vendors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get price range for a specific section
router.get('/:section/price-range', async (req, res) => {
    try {
        const { section } = req.params;
        
        const result = await Product.aggregate([
            {
                $match: {
                    'section.name': { $regex: section, $options: 'i' }
                }
            },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$minPrice' },
                    maxPrice: { $max: '$maxPrice' }
                }
            }
        ]);

        if (result.length === 0) {
            return res.json({ minPrice: 0, maxPrice: 0 });
        }

        res.json(result[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 