const mongoose = require('mongoose');
const Filter = require('./models/Filters');
const Product = require('./models/Product');
require('dotenv').config();

async function testSectionFilters() {
    try {
        // Подключение к MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Проверяем товары и их sectionId
        console.log('\n1. Анализ товаров:');
        const sampleProducts = await Product.find().limit(3);
        
        sampleProducts.forEach((product, index) => {
            console.log(`   Товар ${index + 1}:`);
            console.log(`     Название: ${product.title}`);
            console.log(`     Section ID: ${product.section?._id || product.section?.id || 'НЕ НАЙДЕН'}`);
            console.log(`     Section structure:`, JSON.stringify(product.section, null, 2));
            console.log('');
        });

        // 2. Получаем уникальные sectionId
        const uniqueSectionIds = await Product.distinct('section._id');
        console.log('2. Уникальные section._id:', uniqueSectionIds);

        // 3. Проверяем фильтры по sectionId=11
        console.log('\n3. Проверяем фильтры для sectionId=11:');
        const filtersForSection11 = await Filter.find({ sectionId: 11, isPublic: true });
        console.log(`   Найдено ${filtersForSection11.length} фильтров для sectionId=11`);
        
        filtersForSection11.forEach(filter => {
            console.log(`   - ${filter.title} (${filter.type}) - ${filter.values?.length || 0} значений`);
        });

        // 4. Если фильтров нет, создаем тестовые
        if (filtersForSection11.length === 0) {
            console.log('\n4. Создаем тестовые фильтры для sectionId=11:');
            
            await Filter.deleteMany({ sectionId: 11 });
            
            const testFilters = [
                {
                    _id: 'brand-filter-11',
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
                    categoryUrl: 'mobile-mobilnye-telefony-i-smartfony',
                    categoryName: 'Смартфоны и мобильные телефоны',
                    isPublic: true
                },
                {
                    _id: 'memory-filter-11',
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
                    categoryUrl: 'mobile-mobilnye-telefony-i-smartfony',
                    categoryName: 'Смартфоны и мобильные телефоны',
                    isPublic: true
                }
            ];
            
            await Filter.insertMany(testFilters);
            console.log(`   ✅ Создано ${testFilters.length} тестовых фильтров`);
        }

        // 5. Проверяем API endpoint
        console.log('\n5. Симуляция API запроса /filters/section/11:');
        const apiFilters = await Filter.find({ 
            sectionId: 11,
            isPublic: true 
        }).sort({ weight: -1, title: 1 });
        
        console.log(`   API вернет: ${apiFilters.length} фильтров`);
        apiFilters.forEach(filter => {
            console.log(`   - ${filter.title} (${filter.type})`);
        });

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        mongoose.connection.close();
    }
}

testSectionFilters();