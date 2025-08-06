const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const FeedProcessor = require('../scripts/feedProcessor');
const { body, validationResult } = require('express-validator');

// Middleware для проверки авторизации (можно заменить на JWT)
const requireAuth = (req, res, next) => {
    // Простая проверка через заголовок (в продакшене использовать JWT)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    // Здесь должна быть проверка JWT токена
    // Пока просто пропускаем
    next();
};

// Получить все магазины с ошибками
router.get('/stores', requireAuth, async (req, res) => {
    try {
        const stores = await Store.find({})
            .sort({ createdAt: -1 });
        
        res.json(stores);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Добавить новый магазин и фид
router.post('/stores', requireAuth, [
    body('name').notEmpty().withMessage('Название магазина обязательно'),
    body('feedUrl').notEmpty().withMessage('URL фида обязателен'),
    body('feedType').isIn(['xml', 'json', 'csv']).withMessage('Тип фида должен быть xml, json или csv')
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
        res.status(500).json({ error: error.message });
    }
});

// Обновить магазин
router.put('/stores/:id', requireAuth, async (req, res) => {
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
router.delete('/stores/:id', requireAuth, async (req, res) => {
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

// Ручной запуск импорта фида
router.post('/fetch/:storeId', requireAuth, async (req, res) => {
    try {
        const store = await Store.findById(req.params.storeId);
        if (!store) {
            return res.status(404).json({ error: 'Магазин не найден' });
        }

        // Запускаем обработку фида
        const processor = new FeedProcessor();
        await processor.init();
        
        console.log(`🔄 Ручной запуск обработки фида: ${store.name}`);
        await processor.processFeed(store);
        
        // Обновляем время последнего обновления
        await Store.findByIdAndUpdate(store._id, { 
            lastUpdated: new Date(),
            $pull: { errorLog: {} } // Очищаем старые ошибки
        });

        res.json({ 
            message: `Фид магазина ${store.name} обработан успешно`,
            lastUpdated: new Date()
        });
    } catch (error) {
        console.error('Ошибка при обработке фида:', error);
        
        // Логируем ошибку
        await Store.findByIdAndUpdate(req.params.storeId, {
            $push: {
                errorLog: {
                    message: error.message,
                    timestamp: new Date()
                }
            }
        });
        
        res.status(500).json({ error: error.message });
    }
});

// Запуск обработки всех фидов
router.post('/fetch-all', requireAuth, async (req, res) => {
    try {
        const processor = new FeedProcessor();
        await processor.init();
        
        console.log('🔄 Ручной запуск обработки всех фидов');
        await processor.processAllFeeds();

        res.json({ 
            message: 'Все фиды обработаны успешно',
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Ошибка при обработке фидов:', error);
        res.status(500).json({ error: error.message });
    }
});

// Получить журнал ошибок
router.get('/errors', requireAuth, async (req, res) => {
    try {
        const stores = await Store.find({
            'errorLog.0': { $exists: true }
        }).select('name errorLog lastUpdated');

        const errors = stores.map(store => ({
            storeName: store.name,
            storeId: store._id,
            lastUpdated: store.lastUpdated,
            errors: store.errorLog
        }));

        res.json(errors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить статистику системы
router.get('/stats', requireAuth, async (req, res) => {
    try {
        const Product = require('../models/Product');
        const Offer = require('../models/Offer');
        const Store = require('../models/Store');

        const totalProducts = await Product.countDocuments({ isActive: true });
        const totalStores = await Store.countDocuments({ isActive: true });
        const totalOffers = await Offer.countDocuments();
        const activeStores = await Store.countDocuments({ isActive: true });

        // Статистика по категориям
        const categories = await Product.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Статистика по брендам
        const brands = await Product.aggregate([
            { $match: { isActive: true, brand: { $ne: null } } },
            { $group: { _id: '$brand', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Статистика по магазинам
        const storeStats = await Store.aggregate([
            {
                $lookup: {
                    from: 'offers',
                    localField: '_id',
                    foreignField: 'storeId',
                    as: 'offers'
                }
            },
            {
                $project: {
                    name: 1,
                    offersCount: { $size: '$offers' },
                    lastUpdated: 1,
                    isActive: 1
                }
            },
            { $sort: { offersCount: -1 } }
        ]);

        res.json({
            totalProducts,
            totalStores,
            totalOffers,
            activeStores,
            topCategories: categories,
            topBrands: brands,
            storeStats
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Очистить ошибки магазина
router.delete('/stores/:id/errors', requireAuth, async (req, res) => {
    try {
        const store = await Store.findByIdAndUpdate(
            req.params.id,
            { $pull: { errorLog: {} } },
            { new: true }
        );

        if (!store) {
            return res.status(404).json({ error: 'Магазин не найден' });
        }

        res.json({ message: 'Ошибки очищены' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 