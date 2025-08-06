const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Offer = require('../models/Offer');
const Store = require('../models/Store');
const { body, validationResult } = require('express-validator');

// Поиск товаров с фильтрацией
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            category,
            brand,
            minPrice,
            maxPrice,
            sortBy = 'name',
            sortOrder = 'asc',
            stores
        } = req.query;

        let query = { isActive: true };

        // Поиск по тексту
        if (search) {
            query.$text = { $search: search };
        }

        // Фильтр по категории
        if (category) {
            query.category = category;
        }

        // Фильтр по бренду
        if (brand) {
            query.brand = brand;
        }

        // Сортировка
        let sortOptions = {};
        if (sortBy === 'price') {
            sortOptions['offers.price'] = sortOrder === 'desc' ? -1 : 1;
        } else if (sortBy === 'offers') {
            sortOptions.offersCount = sortOrder === 'desc' ? -1 : 1;
        } else {
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        }

        const products = await Product.find(query)
            .populate({
                path: 'offers',
                populate: {
                    path: 'storeId',
                    select: 'name logo'
                }
            })
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        // Фильтрация по цене и магазинам
        let filteredProducts = products;
        
        if (minPrice || maxPrice || stores) {
            filteredProducts = products.filter(product => {
                const offers = product.offers || [];
                
                // Фильтр по магазинам
                if (stores) {
                    const storeIds = stores.split(',');
                    const hasStore = offers.some(offer => 
                        storeIds.includes(offer.storeId._id.toString())
                    );
                    if (!hasStore) return false;
                }
                
                // Фильтр по цене
                if (minPrice || maxPrice) {
                    const prices = offers.map(offer => offer.price).filter(price => price > 0);
                    if (prices.length === 0) return false;
                    
                    const minProductPrice = Math.min(...prices);
                    const maxProductPrice = Math.max(...prices);
                    
                    if (minPrice && minProductPrice < parseFloat(minPrice)) return false;
                    if (maxPrice && maxProductPrice > parseFloat(maxPrice)) return false;
                }
                
                return true;
            });
        }

        const count = await Product.countDocuments(query);

        res.json({
            products: filteredProducts,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            totalProducts: count
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить товар по ID с детальной информацией о предложениях
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate({
                path: 'offers',
                populate: {
                    path: 'storeId',
                    select: 'name logo description'
                }
            });

        if (!product) {
            return res.status(404).json({ error: 'Товар не найден' });
        }

        // Группировка предложений по магазинам
        const offers = product.offers || [];
        const availableOffers = offers.filter(offer => offer.available);
        const unavailableOffers = offers.filter(offer => !offer.available);

        // Сортировка предложений по цене
        availableOffers.sort((a, b) => a.price - b.price);

        // Статистика цен
        const prices = availableOffers.map(offer => offer.price);
        const priceStats = {
            minPrice: prices.length > 0 ? Math.min(...prices) : 0,
            maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
            averagePrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
            totalOffers: offers.length,
            availableOffers: availableOffers.length,
            unavailableOffers: unavailableOffers.length
        };

        res.json({
            product: {
                id: product._id,
                name: product.name,
                description: product.description,
                category: product.category,
                brand: product.brand,
                image: product.image,
                specs: product.specs,
                sku: product.sku,
                offersCount: product.offersCount
            },
            offers: {
                available: availableOffers,
                unavailable: unavailableOffers
            },
            priceStats
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Поиск товаров по названию
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const { limit = 10 } = req.query;

        const products = await Product.find({
            $text: { $search: query },
            isActive: true
        })
        .populate({
            path: 'offers',
            populate: {
                path: 'storeId',
                select: 'name logo'
            }
        })
        .limit(parseInt(limit))
        .exec();

        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить категории
router.get('/categories/list', async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить бренды
router.get('/brands/list', async (req, res) => {
    try {
        const brands = await Product.distinct('brand');
        res.json(brands.filter(brand => brand));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить статистику цен для товара
router.get('/:id/price-stats', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('offers');

        if (!product) {
            return res.status(404).json({ error: 'Товар не найден' });
        }

        const offers = product.offers || [];
        const availableOffers = offers.filter(offer => offer.available);
        const unavailableOffers = offers.filter(offer => !offer.available);

        const prices = availableOffers.map(offer => offer.price);
        const stats = {
            totalOffers: offers.length,
            availableOffers: availableOffers.length,
            unavailableOffers: unavailableOffers.length,
            minPrice: prices.length > 0 ? Math.min(...prices) : 0,
            maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
            averagePrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Создать новый товар (для админки)
router.post('/', [
    body('name').notEmpty().withMessage('Название товара обязательно'),
    body('category').notEmpty().withMessage('Категория обязательна')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Обновить товар
router.put('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ error: 'Товар не найден' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Удалить товар
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        res.json({ message: 'Товар успешно удален' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 