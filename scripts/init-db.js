const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Catalog = require('../models/Catalog');
const Product = require('../models/Product');

// Load catalogs from files
function loadCatalogsFromFiles() {
    const categoriesDir = path.join(__dirname, '../categories');
    const catalogs = [];
    
    try {
        const files = fs.readdirSync(categoriesDir);
        
        files.forEach((file, groupIndex) => {
            if (file.endsWith('.txt')) {
                const groupName = file.replace('.txt', '');
                const filePath = path.join(categoriesDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Parse group name for display
                const groupDisplayName = getDisplayName(groupName);
                
                // Create main catalog group
                const mainCatalog = {
                    name: groupDisplayName,
                    slug: groupName,
                    description: `Каталог товаров: ${groupDisplayName}`,
                    sortOrder: groupIndex + 1,
                    level: 0,
                    parent: null
                };
                
                catalogs.push(mainCatalog);
                
                // Parse subcatalogs
                const subcatalogs = content.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                
                subcatalogs.forEach((subcatalog, subIndex) => {
                    if (subcatalog) {
                        const subDisplayName = getDisplayName(subcatalog);
                        catalogs.push({
                            name: subDisplayName,
                            slug: subcatalog,
                            description: `Подкаталог: ${subDisplayName}`,
                            sortOrder: subIndex + 1,
                            level: 1,
                            parent: groupName
                        });
                    }
                });
            }
        });
        
        return catalogs;
    } catch (error) {
        console.error('Error loading catalogs from files:', error);
        return [];
    }
}

// Convert slug to display name
function getDisplayName(slug) {
    const nameMap = {
        'computer': 'Компьютеры и электроника',
        'auto': 'Автотовары',
        'fashion': 'Мода и стиль',
        'dom': 'Дом и сад',
        'dacha_sad': 'Дача и сад',
        'deti': 'Детские товары',
        'krasota': 'Красота и здоровье',
        'pobutova_himiia': 'Бытовая химия',
        'musical_instruments': 'Музыкальные инструменты',
        'mobile': 'Мобильные устройства',
        'remont': 'Ремонт и строительство',
        'sport': 'Спорт и отдых',
        'zootovary': 'Зоотовары',
        'tools': 'Инструменты',
        'bt': 'Бытовая техника',
        'av': 'Аудио и видео',
        'adult': 'Интимные товары',
        'military': 'Военное снаряжение'
    };
    
    if (nameMap[slug]) {
        return nameMap[slug];
    }
    
    // Convert slug to readable name
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Sample products with updated structure
const products = [
    {
        id: 1,
        title: 'Смартфон iPhone 15 Pro',
        date: '2024-01-15',
        vendor: { id: 1, name: 'Apple' },
        section: { id: 1, name: 'mobile', displayName: 'Мобильные устройства' },
        isPromo: true,
        toOfficial: true,
        lineName: 'iPhone',
        linePathNew: '/iphone',
        imagesCount: 5,
        videosCount: 2,
        techShortSpecifications: ['6.1" OLED', 'A17 Pro', '128 ГБ'],
        reviewsCount: 156,
        questionsCount: 23,
        url: 'https://example.com/iphone-15-pro',
        imageLinks: ['https://via.placeholder.com/400x300?text=iPhone+15+Pro'],
        minPrice: 89999,
        maxPrice: 129999,
        currentPrice: 89999,
        initPrice: 99999,
        salesCount: 45,
        isNew: 1,
        colorsProduct: [{ name: 'Титановый', code: '#8B7355' }],
        offerCount: 3,
        offers: [
            { price: 89999, store: 'Apple Store' },
            { price: 91999, store: 'М.Видео' },
            { price: 92999, store: 'Эльдорадо' }
        ],
        madeInUkraine: false,
        userSubscribed: false,
        __typename: 'Product'
    },
    {
        id: 2,
        title: 'Ноутбук MacBook Air M2',
        date: '2024-01-10',
        vendor: { id: 1, name: 'Apple' },
        section: { id: 2, name: 'computer', displayName: 'Компьютеры и электроника' },
        isPromo: false,
        toOfficial: true,
        lineName: 'MacBook',
        linePathNew: '/macbook',
        imagesCount: 4,
        videosCount: 1,
        techShortSpecifications: ['13.6" Retina', 'Apple M2', '256 ГБ SSD'],
        reviewsCount: 89,
        questionsCount: 12,
        url: 'https://example.com/macbook-air-m2',
        imageLinks: ['https://via.placeholder.com/400x300?text=MacBook+Air+M2'],
        minPrice: 129999,
        maxPrice: 149999,
        currentPrice: 129999,
        initPrice: 149999,
        salesCount: 23,
        isNew: 0,
        colorsProduct: [{ name: 'Серебристый', code: '#C0C0C0' }],
        offerCount: 2,
        offers: [
            { price: 129999, store: 'Apple Store' },
            { price: 134999, store: 'М.Видео' }
        ],
        madeInUkraine: false,
        userSubscribed: false,
        __typename: 'Product'
    },
    {
        id: 3,
        title: 'Джинсы классические Levi\'s 501',
        date: '2024-01-12',
        vendor: { id: 2, name: 'Levi\'s' },
        section: { id: 3, name: 'fashion', displayName: 'Мода и стиль' },
        isPromo: true,
        toOfficial: false,
        lineName: 'Джинсы',
        linePathNew: '/jeans',
        imagesCount: 3,
        videosCount: 0,
        techShortSpecifications: ['100% хлопок', 'Размеры 28-36', 'Синий'],
        reviewsCount: 234,
        questionsCount: 45,
        url: 'https://example.com/levis-501',
        imageLinks: ['https://via.placeholder.com/400x300?text=Classic+Jeans'],
        minPrice: 2999,
        maxPrice: 3999,
        currentPrice: 2999,
        initPrice: 3999,
        salesCount: 156,
        isNew: 0,
        colorsProduct: [{ name: 'Синий', code: '#000080' }],
        offerCount: 5,
        offers: [
            { price: 2999, store: 'Levi\'s Store' },
            { price: 3199, store: 'Lamoda' },
            { price: 3299, store: 'Wildberries' }
        ],
        madeInUkraine: false,
        userSubscribed: false,
        __typename: 'Product'
    },
    {
        id: 4,
        title: 'Автомобильный аккумулятор Bosch S4',
        date: '2024-01-08',
        vendor: { id: 3, name: 'Bosch' },
        section: { id: 4, name: 'auto', displayName: 'Автотовары' },
        isPromo: true,
        toOfficial: false,
        lineName: 'Аккумуляторы',
        linePathNew: '/akkumulyatory',
        imagesCount: 6,
        videosCount: 1,
        techShortSpecifications: ['60 Ач', '12V', 'Европейский стандарт'],
        reviewsCount: 67,
        questionsCount: 8,
        url: 'https://example.com/bosch-s4',
        imageLinks: ['https://via.placeholder.com/400x300?text=Car+Battery'],
        minPrice: 4599,
        maxPrice: 5999,
        currentPrice: 4599,
        initPrice: 5999,
        salesCount: 12,
        isNew: 1,
        colorsProduct: [{ name: 'Черный', code: '#000000' }],
        offerCount: 3,
        offers: [
            { price: 4599, store: 'Bosch Service' },
            { price: 4799, store: 'Автоцентр' },
            { price: 4999, store: 'АвтоЗапчасти' }
        ],
        madeInUkraine: false,
        userSubscribed: false,
        __typename: 'Product'
    },
    {
        id: 5,
        title: 'Беговая дорожка NordicTrack T6.5',
        date: '2024-01-05',
        vendor: { id: 4, name: 'NordicTrack' },
        section: { id: 5, name: 'sport', displayName: 'Спорт и отдых' },
        isPromo: false,
        toOfficial: true,
        lineName: 'Кардио',
        linePathNew: '/cardio',
        imagesCount: 4,
        videosCount: 2,
        techShortSpecifications: ['3.0 л.с.', '0-20 км/ч', 'до 150 кг'],
        reviewsCount: 45,
        questionsCount: 6,
        url: 'https://example.com/nordictrack-t65',
        imageLinks: ['https://via.placeholder.com/400x300?text=Treadmill'],
        minPrice: 89999,
        maxPrice: 119999,
        currentPrice: 89999,
        initPrice: 119999,
        salesCount: 8,
        isNew: 0,
        colorsProduct: [{ name: 'Черный', code: '#000000' }],
        offerCount: 2,
        offers: [
            { price: 89999, store: 'NordicTrack' },
            { price: 94999, store: 'Спортмастер' }
        ],
        madeInUkraine: false,
        userSubscribed: false,
        __typename: 'Product'
    }
];

async function initDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bifo', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Catalog.deleteMany({});
        await Product.deleteMany({});
        
        // Drop existing indexes to avoid conflicts
        try {
            await Catalog.collection.dropIndexes();
        } catch (error) {
            console.log('No indexes to drop');
        }
        
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

        // Load and create catalogs from files
        const catalogData = loadCatalogsFromFiles();
        const createdCatalogs = [];
        
        for (const catalogDataItem of catalogData) {
            const catalog = new Catalog(catalogDataItem);
            await catalog.save();
            createdCatalogs.push(catalog);
            console.log(`📁 Created catalog: ${catalog.name} (${catalog.level === 0 ? 'Main' : 'Sub'})`);
        }

        // Create products
        for (const productData of products) {
            const product = new Product(productData);
            await product.save();
            console.log(`📦 Created product: ${product.title}`);
        }

        console.log('\n🎉 Database initialization completed successfully!');
        console.log('\n📋 Login credentials:');
        console.log('Admin: admin@bifo.com / admin123');
        console.log('User: user@bifo.com / admin123');
        console.log(`\n📁 Created ${createdCatalogs.length} catalogs from files`);
        console.log(`📦 Created ${products.length} sample products`);
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