const mongoose = require('mongoose');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Offer = require('../models/Offer');
require('dotenv').config();

async function initDatabase() {
    try {
        console.log('🚀 Инициализация базы данных...');
        
        // Подключение к MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Подключение к MongoDB установлено');

        // Очищаем существующие данные
        await Store.deleteMany({});
        await Product.deleteMany({});
        await Offer.deleteMany({});
        console.log('🗑️ Очищены существующие данные');

        // Создаем примеры магазинов с фидами
        const stores = [
            {
                name: 'Rozetka',
                feedUrl: 'https://rozetka.com.ua/api/products.json',
                feedType: 'json',
                logo: 'https://via.placeholder.com/150x50/FF6B35/FFFFFF?text=Rozetka',
                description: 'Крупнейший украинский интернет-магазин',
                feedMapping: {
                    productName: 'title',
                    productDescription: 'description',
                    productCategory: 'category',
                    productBrand: 'brand',
                    productImage: 'image',
                    productSku: 'sku',
                    productSpecs: 'specifications',
                    offerPrice: 'price',
                    offerCurrency: 'currency',
                    offerUrl: 'url',
                    offerAvailability: 'available'
                }
            },
            {
                name: 'Comfy',
                feedUrl: 'https://comfy.ua/api/products.xml',
                feedType: 'xml',
                logo: 'https://via.placeholder.com/150x50/00A3E0/FFFFFF?text=Comfy',
                description: 'Интернет-магазин бытовой техники и электроники',
                feedMapping: {
                    productName: 'name',
                    productDescription: 'description',
                    productCategory: 'category',
                    productBrand: 'brand',
                    productImage: 'image_url',
                    productSku: 'sku',
                    productSpecs: 'specs',
                    offerPrice: 'price',
                    offerCurrency: 'currency',
                    offerUrl: 'product_url',
                    offerAvailability: 'in_stock'
                }
            },
            {
                name: 'Allo',
                feedUrl: 'feeds/allo-products.csv',
                feedType: 'csv',
                logo: 'https://via.placeholder.com/150x50/FF6B00/FFFFFF?text=Allo',
                description: 'Магазин мобильной техники и аксессуаров',
                feedMapping: {
                    productName: 'Product Name',
                    productDescription: 'Description',
                    productCategory: 'Category',
                    productBrand: 'Brand',
                    productImage: 'Image URL',
                    productSku: 'SKU',
                    productSpecs: 'Specifications',
                    offerPrice: 'Price',
                    offerCurrency: 'Currency',
                    offerUrl: 'Product URL',
                    offerAvailability: 'Availability'
                }
            }
        ];

        // Сохраняем магазины
        const createdStores = await Store.insertMany(stores);
        console.log(`✅ Создано ${createdStores.length} магазинов`);

        // Создаем примеры товаров
        const sampleProducts = [
            {
                name: 'iPhone 15 Pro 128GB',
                description: 'Смартфон Apple iPhone 15 Pro с 128 ГБ памяти',
                category: 'Смартфоны',
                brand: 'Apple',
                image: 'https://via.placeholder.com/300x300/000000/FFFFFF?text=iPhone+15+Pro',
                sku: 'IP15P-128',
                specs: new Map([
                    ['Экран', '6.1" OLED'],
                    ['Процессор', 'A17 Pro'],
                    ['Память', '128 ГБ'],
                    ['Камера', '48 Мп + 12 Мп + 12 Мп']
                ]),
                searchKeywords: ['iphone', 'apple', 'смартфон', 'телефон']
            },
            {
                name: 'Samsung Galaxy S24 Ultra',
                description: 'Флагманский смартфон Samsung с S Pen',
                category: 'Смартфоны',
                brand: 'Samsung',
                image: 'https://via.placeholder.com/300x300/000000/FFFFFF?text=Galaxy+S24+Ultra',
                sku: 'SGS24U-256',
                specs: new Map([
                    ['Экран', '6.8" Dynamic AMOLED'],
                    ['Процессор', 'Snapdragon 8 Gen 3'],
                    ['Память', '256 ГБ'],
                    ['Камера', '200 Мп + 12 Мп + 50 Мп + 10 Мп']
                ]),
                searchKeywords: ['samsung', 'galaxy', 'смартфон', 'телефон']
            },
            {
                name: 'MacBook Air M2 13"',
                description: 'Ноутбук Apple MacBook Air с чипом M2',
                category: 'Ноутбуки',
                brand: 'Apple',
                image: 'https://via.placeholder.com/300x300/000000/FFFFFF?text=MacBook+Air+M2',
                sku: 'MBA-M2-13',
                specs: new Map([
                    ['Экран', '13.6" Liquid Retina'],
                    ['Процессор', 'Apple M2'],
                    ['Память', '8 ГБ'],
                    ['SSD', '256 ГБ']
                ]),
                searchKeywords: ['macbook', 'apple', 'ноутбук', 'laptop']
            }
        ];

        // Сохраняем товары
        const createdProducts = await Product.insertMany(sampleProducts);
        console.log(`✅ Создано ${createdProducts.length} товаров`);

        // Создаем предложения для товаров
        const offers = [];
        
        for (let i = 0; i < createdProducts.length; i++) {
            const product = createdProducts[i];
            
            // Создаем предложения от каждого магазина
            for (let j = 0; j < createdStores.length; j++) {
                const store = createdStores[j];
                const basePrice = 40000 + (i * 10000) + (j * 2000); // Разные цены для демонстрации
                
                offers.push({
                    productId: product._id,
                    storeId: store._id,
                    price: basePrice,
                    currency: 'UAH',
                    url: `https://${store.name.toLowerCase()}.com.ua/product/${product.sku}`,
                    available: true,
                    lastUpdated: new Date()
                });
            }
        }

        // Сохраняем предложения
        const createdOffers = await Offer.insertMany(offers);
        console.log(`✅ Создано ${createdOffers.length} предложений`);

        // Обновляем товары с ссылками на предложения
        for (const product of createdProducts) {
            const productOffers = createdOffers.filter(offer => 
                offer.productId.toString() === product._id.toString()
            );
            
            product.offers = productOffers.map(offer => offer._id);
            await product.save();
        }

        console.log('🎉 Инициализация базы данных завершена успешно!');
        console.log('📊 Статистика:');
        console.log(`   - Магазинов: ${createdStores.length}`);
        console.log(`   - Товаров: ${createdProducts.length}`);
        console.log(`   - Предложений: ${createdOffers.length}`);

    } catch (error) {
        console.error('❌ Ошибка при инициализации базы данных:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Отключение от MongoDB');
    }
}

// Запуск инициализации
if (require.main === module) {
    initDatabase().then(() => {
        console.log('🏁 Инициализация завершена');
        process.exit(0);
    }).catch(error => {
        console.error('💥 Критическая ошибка:', error);
        process.exit(1);
    });
}

module.exports = { initDatabase }; 