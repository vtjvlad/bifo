// Диагностический скрипт для проверки товаров и категорий
const mongoose = require('mongoose');
require('dotenv').config();

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Импорт моделей
const Catalog = require('./models/Catalog');
const Product = require('./models/Product');

async function debugProducts() {
    console.log('🔍 Диагностика товаров и категорий...\n');

    try {
        // 1. Проверяем общее количество товаров
        console.log('1. Общая статистика товаров:');
        const totalProducts = await Product.countDocuments();
        console.log(`   Всего товаров в базе: ${totalProducts}`);

        if (totalProducts === 0) {
            console.log('   ❌ Товары не найдены в базе данных');
            return;
        }

        // 2. Проверяем структуру поля section у товаров
        console.log('\n2. Анализ поля section у товаров:');
        const sampleProducts = await Product.find().limit(5);
        
        sampleProducts.forEach((product, index) => {
            console.log(`   Товар ${index + 1}:`);
            console.log(`     ID: ${product.id}`);
            console.log(`     Название: ${product.title}`);
            console.log(`     Section:`, JSON.stringify(product.section, null, 4));
            console.log(`     Current Price: ${product.currentPrice}`);
            console.log('');
        });

        // 3. Проверяем уникальные значения section.id
        console.log('3. Уникальные значения section.id:');
        const uniqueSections = await Product.distinct('section.id');
        console.log(`   Найдено уникальных section.id: ${uniqueSections.length}`);
        console.log('   Примеры section.id:', uniqueSections.slice(0, 10));

        // 4. Проверяем каталоги
        console.log('\n4. Анализ каталогов:');
        const catalogs = await Catalog.find({ isActive: true });
        console.log(`   Всего каталогов: ${catalogs.length}`);

        const mainCatalogs = catalogs.filter(cat => cat.level === 0);
        const groups = catalogs.filter(cat => cat.level === 1 && cat.isGroup);
        const categories = catalogs.filter(cat => cat.level === 2);

        console.log(`   Основных каталогов: ${mainCatalogs.length}`);
        console.log(`   Групп: ${groups.length}`);
        console.log(`   Категорий: ${categories.length}`);

        // 5. Проверяем соответствие между section.id и slug категорий
        console.log('\n5. Проверка соответствия section.id и slug категорий:');
        
        const categorySlugs = categories.map(cat => cat.slug);
        const sectionIds = uniqueSections;
        
        console.log(`   Slug категорий: ${categorySlugs.slice(0, 10)}`);
        console.log(`   Section ID товаров: ${sectionIds.slice(0, 10)}`);

        // Находим пересечения
        const matchingSections = sectionIds.filter(sectionId => 
            categorySlugs.includes(sectionId)
        );
        
        console.log(`   Совпадающих section.id и slug: ${matchingSections.length}`);
        console.log('   Совпадения:', matchingSections.slice(0, 10));

        // 6. Тестируем запрос товаров для конкретной категории
        if (matchingSections.length > 0) {
            console.log('\n6. Тест запроса товаров для категории:');
            const testCategorySlug = matchingSections[0];
            console.log(`   Тестируем категорию: ${testCategorySlug}`);
            
            const productsInCategory = await Product.find({ 'section.id': testCategorySlug });
            console.log(`   Найдено товаров в категории ${testCategorySlug}: ${productsInCategory.length}`);
            
            if (productsInCategory.length > 0) {
                console.log('   Пример товара:');
                const sampleProduct = productsInCategory[0];
                console.log(`     Название: ${sampleProduct.title}`);
                console.log(`     Цена: ${sampleProduct.currentPrice}`);
                console.log(`     Section:`, JSON.stringify(sampleProduct.section, null, 4));
            }
        }

        // 7. Проверяем, есть ли товары с другими структурами section
        console.log('\n7. Анализ других структур section:');
        const productsWithDifferentSection = await Product.find({
            $or: [
                { 'section.id': { $exists: false } },
                { 'section.id': null },
                { 'section.id': '' }
            ]
        }).limit(5);

        console.log(`   Товары без section.id: ${productsWithDifferentSection.length}`);
        
        if (productsWithDifferentSection.length > 0) {
            console.log('   Примеры товаров без section.id:');
            productsWithDifferentSection.forEach((product, index) => {
                console.log(`     ${index + 1}. ${product.title} - Section:`, JSON.stringify(product.section, null, 4));
            });
        }

        // 8. Рекомендации
        console.log('\n8. Рекомендации:');
        
        if (matchingSections.length === 0) {
            console.log('   ❌ ПРОБЛЕМА: Нет соответствия между section.id товаров и slug категорий');
            console.log('   Решение: Проверьте, как заполняется поле section при создании товаров');
        } else {
            console.log('   ✅ Соответствие найдено');
        }

        if (totalProducts > 0 && matchingSections.length === 0) {
            console.log('   ❌ ПРОБЛЕМА: Товары есть, но они не связаны с категориями');
            console.log('   Решение: Обновите товары, установив правильные section.id');
        }

        console.log('\n✅ Диагностика завершена');

    } catch (error) {
        console.error('❌ Ошибка при диагностике:', error.message);
    }
    
    // Закрытие соединения
    mongoose.connection.close();
}

// Запуск диагностики
debugProducts(); 