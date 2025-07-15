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
    contentSecurityPolicy: false, // Отключаем для разработки
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// Подключение к MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bifo';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Подключение к MongoDB успешно');
  })
  .catch((error) => {
    console.error('❌ Ошибка подключения к MongoDB:', error);
    process.exit(1);
  });

// Импорт моделей
const Product = require('./models/Product');
const Category = require('./models/Category');

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'BIFO API работает', 
    timestamp: new Date().toISOString() 
  });
});

// Получение товаров с пагинацией и фильтрацией
app.get('/api/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const category = req.query.category;
    const search = req.query.search;
    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;
    const vendor = req.query.vendor;
    const sort = req.query.sort || 'createdAt';

    // Построение фильтра
    const filter = {};
    
    if (category) {
      filter['section.title'] = new RegExp(category, 'i');
    }
    
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { 'techShortSpecifications': new RegExp(search, 'i') }
      ];
    }
    
    if (minPrice || maxPrice) {
      filter.currentPrice = {};
      if (minPrice) filter.currentPrice.$gte = parseInt(minPrice);
      if (maxPrice) filter.currentPrice.$lte = parseInt(maxPrice);
    }
    
    if (vendor) {
      filter['vendor.title'] = new RegExp(vendor, 'i');
    }

    // Построение сортировки
    let sortObj = {};
    switch (sort) {
      case 'price_asc':
        sortObj = { currentPrice: 1 };
        break;
      case 'price_desc':
        sortObj = { currentPrice: -1 };
        break;
      case 'popular':
        sortObj = { salesCount: -1 };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    // Подсчет общего количества товаров
    const totalItems = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    // Получение товаров
    const products = await Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();
    
    res.json({
      products: products,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Ошибка получения товаров:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение конкретного товара
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: parseInt(req.params.id) });
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    res.json(product);
  } catch (error) {
    console.error('Ошибка получения товара:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение списка производителей
app.get('/api/vendors', async (req, res) => {
  try {
    const vendors = await Product.distinct('vendor.title');
    res.json(vendors.filter(vendor => vendor).sort());
  } catch (error) {
    console.error('Ошибка получения производителей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение ценового диапазона
app.get('/api/price-range', async (req, res) => {
  try {
    const priceRange = await Product.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: '$currentPrice' },
          maxPrice: { $max: '$currentPrice' }
        }
      }
    ]);

    if (priceRange.length > 0) {
      res.json({
        min: priceRange[0].minPrice,
        max: priceRange[0].maxPrice
      });
    } else {
      res.json({ min: 0, max: 0 });
    }
  } catch (error) {
    console.error('Ошибка получения ценового диапазона:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение всех категорий
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ group: 1, order: 1 })
      .lean();
    
    // Группируем категории по группам
    const groupedCategories = categories.reduce((acc, category) => {
      if (!acc[category.group]) {
        acc[category.group] = [];
      }
      acc[category.group].push(category);
      return acc;
    }, {});

    res.json(groupedCategories);
  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение категорий конкретной группы
app.get('/api/categories/:group', async (req, res) => {
  try {
    const categories = await Category.find({ 
      group: req.params.group,
      isActive: true 
    })
    .sort({ order: 1 })
    .lean();
    
    res.json(categories);
  } catch (error) {
    console.error('Ошибка получения категорий группы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Поиск категорий
app.get('/api/categories/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const categories = await Category.find({
      $text: { $search: query },
      isActive: true
    })
    .sort({ score: { $meta: 'textScore' } })
    .limit(10)
    .lean();
    
    res.json(categories);
  } catch (error) {
    console.error('Ошибка поиска категорий:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Страница каталога
app.get('/catalog', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'catalog.html'));
});

// Страница товара
app.get('/product/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

// 404 для неизвестных маршрутов
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Страница не найдена' });
});

// Обработка ошибок
app.use((error, req, res, next) => {
  console.error('Глобальная ошибка:', error);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 BIFO сервер запущен на порту ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
});

module.exports = app; 