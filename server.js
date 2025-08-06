const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
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
            imgSrc: ["'self'", "data:", "https://hotline.ua", "https://via.placeholder.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://use.fontawesome.com", "https://*.hotline.ua", "https://*.cdn.jsdelivr.net", "https://*.cdnjs.cloudflare.com", "https://*.googleusercontent.com", "https://*.amazonaws.com", "https://*.cloudinary.com", "https://*.imgur.com"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com", "https://use.fontawesome.com", "data:"],
            connectSrc: ["'self'", "https://hotline.ua", "https://*.hotline.ua"],
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
mongoose.connect(process.env.MONGO_URI);

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/catalogs', require('./routes/catalogs'));
app.use('/api/filters', require('./routes/filters'));

// Test routes for filters
app.get('/test-filters', async (req, res) => {
    try {
        const Filter = require('./models/Filters');
        
        const filterCount = await Filter.countDocuments();
        const smartphoneFilters = await Filter.find({ 
            categoryUrl: 'smartphones',
            isPublic: true 
        }).sort({ weight: -1, title: 1 });
        
        res.json({
            success: true,
            database: 'connected',
            totalFilters: filterCount,
            smartphoneFilters: smartphoneFilters.length,
            filters: smartphoneFilters
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/create-test-filters', async (req, res) => {
    try {
        const Filter = require('./models/Filters');
        
        // Удаляем существующие тестовые фильтры
        await Filter.deleteMany({ categoryUrl: 'smartphones' });
        
        // Создаем тестовые фильтры
        const testFilters = [
            {
                _id: 'brand-filter',
                title: 'Бренд',
                description: 'Выберите производителя товара',
                type: 'checkbox',
                weight: 100,
                values: [
                    { _id: 'samsung', title: 'Samsung', productsCount: 150 },
                    { _id: 'apple', title: 'Apple', productsCount: 80 },
                    { _id: 'xiaomi', title: 'Xiaomi', productsCount: 120 },
                    { _id: 'huawei', title: 'Huawei', productsCount: 60 }
                ],
                sectionId: 11,
                categoryUrl: 'smartphones',
                categoryName: 'Смартфоны',
                isPublic: true
            },
            {
                _id: 'memory-filter',
                title: 'Объем памяти',
                description: 'Внутренняя память устройства',
                type: 'checkbox',
                weight: 90,
                values: [
                    { _id: '64gb', title: '64 ГБ', productsCount: 45 },
                    { _id: '128gb', title: '128 ГБ', productsCount: 90 },
                    { _id: '256gb', title: '256 ГБ', productsCount: 75 },
                    { _id: '512gb', title: '512 ГБ', productsCount: 30 }
                ],
                sectionId: 11,
                categoryUrl: 'smartphones',
                categoryName: 'Смартфоны',
                isPublic: true
            },
            {
                _id: 'screen-size-filter',
                title: 'Диагональ экрана',
                description: 'Размер экрана в дюймах',
                type: 'range',
                weight: 80,
                sectionId: 11,
                categoryUrl: 'smartphones',
                categoryName: 'Смартфоны',
                isPublic: true
            },
            {
                _id: 'color-filter',
                title: 'Цвет',
                description: 'Цвет корпуса',
                type: 'select',
                weight: 70,
                values: [
                    { _id: 'black', title: 'Черный', productsCount: 200 },
                    { _id: 'white', title: 'Белый', productsCount: 150 },
                    { _id: 'blue', title: 'Синий', productsCount: 80 },
                    { _id: 'red', title: 'Красный', productsCount: 45 }
                ],
                sectionId: 11,
                categoryUrl: 'smartphones',
                categoryName: 'Смартфоны',
                isPublic: true
            }
        ];
        
        await Filter.insertMany(testFilters);
        
        res.json({
            success: true,
            message: 'Тестовые фильтры созданы',
            count: testFilters.length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve category page
app.get('/category.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'category.html'));
});

// Serve test filters page
app.get('/test-filters.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-filters.html'));
});

// Serve test category filters page
app.get('/test-category-filters.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-category-filters.html'));
});

// Serve static files (after specific routes)
app.use(express.static(path.join(__dirname, 'public')));

// Serve product page - handle dynamic product IDs (after static files)
app.get('/product/:productId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Купи слона server running on port ${PORT}`);
    console.log(`📱 Visit: http://localhost:${PORT}`);
}); 