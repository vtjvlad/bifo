const express = require('express');
const router = express.Router();
const PriceAlert = require('../models/PriceAlert');
const Product = require('../models/Product');
const { body, validationResult } = require('express-validator');

// Получить все уведомления пользователя
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        
        if (!userId) {
            return res.status(400).json({ error: 'ID пользователя обязателен' });
        }

        const alerts = await PriceAlert.find({ userId, isActive: true })
            .populate('productId', 'name images averagePrice minPrice maxPrice')
            .populate('storeId', 'name domain logo')
            .sort({ createdAt: -1 });

        res.json(alerts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Создать новое уведомление
router.post('/', [
    body('userId').notEmpty().withMessage('ID пользователя обязателен'),
    body('productId').notEmpty().withMessage('ID товара обязателен'),
    body('targetPrice').isFloat({ min: 0 }).withMessage('Целевая цена должна быть положительным числом'),
    body('condition').isIn(['below', 'above', 'change']).withMessage('Неверное условие уведомления')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Проверяем, существует ли товар
        const product = await Product.findById(req.body.productId);
        if (!product) {
            return res.status(404).json({ error: 'Товар не найден' });
        }

        // Проверяем, не существует ли уже такое уведомление
        const existingAlert = await PriceAlert.findOne({
            userId: req.body.userId,
            productId: req.body.productId,
            targetPrice: req.body.targetPrice,
            condition: req.body.condition,
            isActive: true
        });

        if (existingAlert) {
            return res.status(400).json({ error: 'Такое уведомление уже существует' });
        }

        const alert = new PriceAlert(req.body);
        await alert.save();

        const populatedAlert = await PriceAlert.findById(alert._id)
            .populate('productId', 'name images averagePrice minPrice maxPrice')
            .populate('storeId', 'name domain logo');

        res.status(201).json(populatedAlert);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Обновить уведомление
router.put('/:id', async (req, res) => {
    try {
        const alert = await PriceAlert.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
        .populate('productId', 'name images averagePrice minPrice maxPrice')
        .populate('storeId', 'name domain logo');

        if (!alert) {
            return res.status(404).json({ error: 'Уведомление не найдено' });
        }

        res.json(alert);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Удалить уведомление
router.delete('/:id', async (req, res) => {
    try {
        const alert = await PriceAlert.findByIdAndDelete(req.params.id);
        if (!alert) {
            return res.status(404).json({ error: 'Уведомление не найдено' });
        }
        res.json({ message: 'Уведомление успешно удалено' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Деактивировать уведомление
router.patch('/:id/deactivate', async (req, res) => {
    try {
        const alert = await PriceAlert.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!alert) {
            return res.status(404).json({ error: 'Уведомление не найдено' });
        }

        res.json(alert);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Активировать уведомление
router.patch('/:id/activate', async (req, res) => {
    try {
        const alert = await PriceAlert.findByIdAndUpdate(
            req.params.id,
            { isActive: true },
            { new: true }
        );

        if (!alert) {
            return res.status(404).json({ error: 'Уведомление не найдено' });
        }

        res.json(alert);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить статистику уведомлений
router.get('/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const totalAlerts = await PriceAlert.countDocuments({ userId });
        const activeAlerts = await PriceAlert.countDocuments({ userId, isActive: true });
        const triggeredAlerts = await PriceAlert.countDocuments({ 
            userId, 
            lastTriggered: { $ne: null } 
        });

        const recentAlerts = await PriceAlert.find({ userId })
            .populate('productId', 'name images')
            .sort({ lastTriggered: -1 })
            .limit(5);

        res.json({
            totalAlerts,
            activeAlerts,
            triggeredAlerts,
            recentAlerts
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 