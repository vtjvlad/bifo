const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Sample data
const categories = [
    {
        name: 'Электроника',
        slug: 'electronics',
        description: 'Современная электроника и гаджеты',
        sortOrder: 1
    },
    {
        name: 'Одежда',
        slug: 'clothing',
        description: 'Модная одежда для всех возрастов',
        sortOrder: 2
    },
    {
        name: 'Мебель',
        slug: 'furniture',
        description: 'Качественная мебель для дома и офиса',
        sortOrder: 3
    },
    {
        name: 'Спорт и отдых',
        slug: 'sports',
        description: 'Спортивные товары и товары для отдыха',
        sortOrder: 4
    },
    {
        name: 'Книги',
        slug: 'books',
        description: 'Художественная и учебная литература',
        sortOrder: 5
    },
    {
        name: 'Автотовары',
        slug: 'automotive',
        description: 'Товары для автомобилей',
        sortOrder: 6
    },
    {
        name: 'Здоровье и красота',
        slug: 'health',
        description: 'Товары для здоровья и красоты',
        sortOrder: 7
    },
    {
        name: 'Игрушки и игры',
        slug: 'toys',
        description: 'Игрушки для детей и настольные игры',
        sortOrder: 8
    }
];

const products = [
    {
        name: 'Смартфон iPhone 15 Pro',
        description: 'Новейший iPhone с мощным процессором и отличной камерой',
        price: 89999,
        originalPrice: 99999,
        sku: 'IPHONE15PRO',
        stock: 25,
        brand: 'Apple',
        images: ['https://via.placeholder.com/400x300?text=iPhone+15+Pro'],
        tags: ['смартфон', 'apple', 'iphone', 'новинка'],
        specifications: {
            'Экран': '6.1" OLED',
            'Процессор': 'A17 Pro',
            'Память': '128 ГБ',
            'Камера': '48 Мп'
        },
        isFeatured: true,
        rating: { average: 4.8, count: 156 }
    },
    {
        name: 'Ноутбук MacBook Air M2',
        description: 'Легкий и мощный ноутбук с чипом M2',
        price: 129999,
        originalPrice: 149999,
        sku: 'MACBOOKAIRM2',
        stock: 15,
        brand: 'Apple',
        images: ['https://via.placeholder.com/400x300?text=MacBook+Air+M2'],
        tags: ['ноутбук', 'apple', 'macbook', 'm2'],
        specifications: {
            'Экран': '13.6" Retina',
            'Процессор': 'Apple M2',
            'Память': '256 ГБ SSD',
            'Оперативная память': '8 ГБ'
        },
        isFeatured: true,
        rating: { average: 4.9, count: 89 }
    },
    {
        name: 'Джинсы классические',
        description: 'Классические джинсы из качественного денима',
        price: 2999,
        originalPrice: 3999,
        sku: 'JEANS001',
        stock: 50,
        brand: 'Levi\'s',
        images: ['https://via.placeholder.com/400x300?text=Classic+Jeans'],
        tags: ['джинсы', 'одежда', 'levis'],
        specifications: {
            'Материал': '100% хлопок',
            'Размеры': '28-36',
            'Цвет': 'Синий'
        },
        rating: { average: 4.5, count: 234 }
    },
    {
        name: 'Диван угловой',
        description: 'Удобный угловой диван для гостиной',
        price: 45999,
        originalPrice: 59999,
        sku: 'SOFA001',
        stock: 8,
        brand: 'IKEA',
        images: ['https://via.placeholder.com/400x300?text=Corner+Sofa'],
        tags: ['диван', 'мебель', 'гостиная'],
        specifications: {
            'Материал': 'Ткань',
            'Размер': '280x180 см',
            'Цвет': 'Серый'
        },
        isFeatured: true,
        rating: { average: 4.6, count: 67 }
    },
    {
        name: 'Беговая дорожка',
        description: 'Профессиональная беговая дорожка для дома',
        price: 89999,
        originalPrice: 119999,
        sku: 'TREADMILL001',
        stock: 5,
        brand: 'NordicTrack',
        images: ['https://via.placeholder.com/400x300?text=Treadmill'],
        tags: ['спорт', 'кардио', 'беговая дорожка'],
        specifications: {
            'Мощность': '3.0 л.с.',
            'Скорость': '0-20 км/ч',
            'Вес пользователя': 'до 150 кг'
        },
        rating: { average: 4.7, count: 45 }
    },
    {
        name: 'Книга "Война и мир"',
        description: 'Классический роман Льва Толстого',
        price: 899,
        originalPrice: 1299,
        sku: 'BOOK001',
        stock: 100,
        brand: 'АСТ',
        images: ['https://via.placeholder.com/400x300?text=War+and+Peace'],
        tags: ['книга', 'классика', 'литература'],
        specifications: {
            'Автор': 'Лев Толстой',
            'Страниц': '1225',
            'Переплет': 'Твердый'
        },
        rating: { average: 4.9, count: 567 }
    },
    {
        name: 'Автомобильный держатель для телефона',
        description: 'Универсальный держатель для телефона в автомобиль',
        price: 1299,
        originalPrice: 1999,
        sku: 'CARHOLDER001',
        stock: 75,
        brand: 'Baseus',
        images: ['https://via.placeholder.com/400x300?text=Car+Phone+Holder'],
        tags: ['авто', 'держатель', 'телефон'],
        specifications: {
            'Тип крепления': 'Присоска',
            'Размер телефона': '4-7"',
            'Материал': 'Пластик + металл'
        },
        rating: { average: 4.3, count: 189 }
    },
    {
        name: 'Крем для лица увлажняющий',
        description: 'Интенсивно увлажняющий крем для всех типов кожи',
        price: 2499,
        originalPrice: 3499,
        sku: 'CREAM001',
        stock: 60,
        brand: 'La Roche-Posay',
        images: ['https://via.placeholder.com/400x300?text=Face+Cream'],
        tags: ['крем', 'уход', 'лицо'],
        specifications: {
            'Объем': '50 мл',
            'Тип кожи': 'Все типы',
            'SPF': '30'
        },
        rating: { average: 4.6, count: 312 }
    }
];

async function initDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bifo', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Category.deleteMany({});
        await Product.deleteMany({});
        
        console.log('🗑️ Cleared existing data');

        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const adminUser = new User({
            email: 'admin@bifo.com',
            password: hashedPassword,
            firstName: 'Администратор',
            lastName: 'BIFO',
            role: 'admin',
            phone: '+7 (999) 123-45-67'
        });
        await adminUser.save();
        console.log('👤 Created admin user: admin@bifo.com / admin123');

        // Create test user
        const testUser = new User({
            email: 'user@bifo.com',
            password: hashedPassword,
            firstName: 'Тестовый',
            lastName: 'Пользователь',
            role: 'user',
            phone: '+7 (999) 987-65-43'
        });
        await testUser.save();
        console.log('👤 Created test user: user@bifo.com / admin123');

        // Create categories
        const createdCategories = [];
        for (const categoryData of categories) {
            const category = new Category(categoryData);
            await category.save();
            createdCategories.push(category);
            console.log(`📁 Created category: ${category.name}`);
        }

        // Create products
        for (const productData of products) {
            // Assign random category
            const randomCategory = createdCategories[Math.floor(Math.random() * createdCategories.length)];
            const product = new Product({
                ...productData,
                category: randomCategory._id
            });
            await product.save();
            console.log(`📦 Created product: ${product.name}`);
        }

        console.log('\n🎉 Database initialization completed successfully!');
        console.log('\n📋 Login credentials:');
        console.log('Admin: admin@bifo.com / admin123');
        console.log('User: user@bifo.com / admin123');
        console.log('\n🚀 You can now start the server with: npm start');

    } catch (error) {
        console.error('❌ Error initializing database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run initialization
initDatabase(); 