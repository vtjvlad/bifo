const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const { body, validationResult } = require('express-validator');

// Получить все магазины
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, active } = req.query;
        
        let query = {};
        if (active !== undefined) {
            query.isActive = active === 'true';
        }
        
        const stores = await Store.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
            
        const count = await Store.countDocuments(query);
        
        res.json({
            stores,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalStores: count
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить магазин по ID
router.get('/:id', async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);
        if (!store) {
            return res.status(404).json({ error: 'Магазин не найден' });
        }
        res.json(store);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Создать новый магазин
router.post('/', [
    body('name').notEmpty().withMessage('Название магазина обязательно'),
    body('domain').notEmpty().withMessage('Домен обязателен'),
    body('baseUrl').notEmpty().withMessage('Базовый URL обязателен')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const store = new Store(req.body);
        await store.save();
        res.status(201).json(store);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Магазин с таким доменом уже существует' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Обновить магазин
router.put('/:id', async (req, res) => {
    try {
        const store = await Store.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!store) {
            return res.status(404).json({ error: 'Магазин не найден' });
        }
        
        res.json(store);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Удалить магазин
router.delete('/:id', async (req, res) => {
    try {
        const store = await Store.findByIdAndDelete(req.params.id);
        if (!store) {
            return res.status(404).json({ error: 'Магазин не найден' });
        }
        res.json({ message: 'Магазин успешно удален' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить статистику магазина
router.get('/:id/stats', async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);
        if (!store) {
            return res.status(404).json({ error: 'Магазин не найден' });
        }
        
        // Здесь можно добавить логику для получения статистики
        // Например, количество товаров, средняя цена и т.д.
        
        res.json({
            store,
            stats: {
                lastScraped: store.lastScraped,
                isActive: store.isActive
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 