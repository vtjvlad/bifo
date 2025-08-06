const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "https://use.fontawesome.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https://via.placeholder.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://use.fontawesome.com", "https://*.cdn.jsdelivr.net", "https://*.cdnjs.cloudflare.com", "https://*.googleusercontent.com", "https://*.amazonaws.com", "https://*.cloudinary.com", "https://*.imgur.com"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com", "https://use.fontawesome.com", "data:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    }
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Подключение к MongoDB установлено'))
    .catch(err => console.error('❌ Ошибка подключения к MongoDB:', err));

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));

// API для статистики
app.get('/api/stats', async (req, res) => {
    try {
        const Product = require('./models/Product');
        const Store = require('./models/Store');
        const Offer = require('./models/Offer');

        const totalProducts = await Product.countDocuments({ isActive: true });
        const totalStores = await Store.countDocuments({ isActive: true });
        const totalOffers = await Offer.countDocuments();

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

        res.json({
            totalProducts,
            totalStores,
            totalOffers,
            topCategories: categories,
            topBrands: brands
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve product page - handle dynamic product IDs
app.get('/product/:productId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

// Serve category page
app.get('/category/:categorySlug', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'category.html'));
});

// Serve search page
app.get('/search', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'search.html'));
});

// Serve store page
app.get('/store/:storeId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'store.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Что-то пошло не так!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Прайс-агрегатор запущен на порту ${PORT}`);
    console.log(`📱 Посетите: http://localhost:${PORT}`);
    console.log(`🔍 API доступен по адресу: http://localhost:${PORT}/api`);
    console.log(`⚙️ Админка: http://localhost:${PORT}/api/admin`);
});

// Планировщик задач для обновления фидов
if (process.env.NODE_ENV === 'production') {
    // Обновление фидов каждый час
    cron.schedule('0 * * * *', async () => {
        console.log('🔄 Запуск автоматического обновления фидов...');
        try {
            const FeedProcessor = require('./scripts/feedProcessor');
            const processor = new FeedProcessor();
            await processor.run();
        } catch (error) {
            console.error('❌ Ошибка при обновлении фидов:', error);
        }
    });

    // Проверка ошибок каждые 30 минут
    cron.schedule('*/30 * * * *', async () => {
        console.log('🔍 Проверка ошибок обработки фидов...');
        try {
            const Store = require('./models/Store');
            const storesWithErrors = await Store.find({
                'errorLog.0': { $exists: true }
            });
            
            if (storesWithErrors.length > 0) {
                console.log(`⚠️ Найдено ${storesWithErrors.length} магазинов с ошибками`);
                storesWithErrors.forEach(store => {
                    console.log(`   - ${store.name}: ${store.errorLog.length} ошибок`);
                });
            }
        } catch (error) {
            console.error('❌ Ошибка при проверке ошибок:', error);
        }
    });
} 