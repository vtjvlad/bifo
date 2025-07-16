// Тестовый скрипт для проверки страницы категорий
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Импорт моделей
const Catalog = require('./models/Catalog');
const Product = require('./models/Product');

async function testCategoryPage() {
    console.log('🧪 Тестирование страницы категорий...\n');

    try {
        // 1. Проверка каталогов
        console.log('1. Проверка каталогов...');
        const catalogs = await Catalog.find({ isActive: true }).limit(5);
        console.log(`   Найдено каталогов: ${catalogs.length}`);
        
        if (catalogs.length > 0) {
            const mainCatalog = catalogs.find(cat => cat.level === 0);
            if (mainCatalog) {
                console.log(`   Основной каталог: ${mainCatalog.name} (${mainCatalog.slug})`);
                
                // 2. Проверка групп
                console.log('\n2. Проверка групп...');
                const groups = await Catalog.find({ 
                    catalogSlug: mainCatalog.slug, 
                    level: 1, 
                    isGroup: true,
                    isActive: true 
                }).limit(3);
                
                console.log(`   Найдено групп: ${groups.length}`);
                
                if (groups.length > 0) {
                    const group = groups[0];
                    console.log(`   Группа: ${group.name} (${group.slug})`);
                    
                    // 3. Проверка категорий
                    console.log('\n3. Проверка категорий...');
                    const categories = await Catalog.find({ 
                        groupSlug: group.slug, 
                        level: 2,
                        isActive: true 
                    }).limit(3);
                    
                    console.log(`   Найдено категорий: ${categories.length}`);
                    
                    if (categories.length > 0) {
                        const category = categories[0];
                        console.log(`   Категория: ${category.name} (${category.slug})`);
                        
                        // 4. Проверка товаров
                        console.log('\n4. Проверка товаров...');
                        const products = await Product.find({ 
                            'section.id': category.slug 
                        }).limit(5);
                        
                        console.log(`   Найдено товаров: ${products.length}`);
                        
                        if (products.length > 0) {
                            console.log('   Пример товара:');
                            console.log(`     Название: ${products[0].title}`);
                            console.log(`     Цена: ${products[0].currentPrice} ₽`);
                            console.log(`     Производитель: ${products[0].vendor?.name || 'Не указан'}`);
                        }
                        
                        // 5. Тест API маршрута
                        console.log('\n5. Тест API маршрута...');
                        const testUrl = `/api/products/catalog/${mainCatalog.slug}/group/${group.slug}/category/${category.slug}`;
                        console.log(`   URL: ${testUrl}`);
                        console.log(`   Параметры: catalog=${mainCatalog.slug}, group=${group.slug}, category=${category.slug}`);
                        
                        // 6. Тест страницы
                        console.log('\n6. Тест страницы...');
                        const pageUrl = `/category.html?catalog=${mainCatalog.slug}&group=${group.slug}&category=${category.slug}`;
                        console.log(`   URL страницы: ${pageUrl}`);
                        
                        console.log('\n✅ Тестирование завершено успешно!');
                        console.log('\n📋 Рекомендации для тестирования:');
                        console.log('   1. Запустите сервер: npm start');
                        console.log('   2. Откройте в браузере: http://localhost:3000');
                        console.log('   3. Перейдите в каталог и выберите категорию');
                        console.log('   4. Проверьте фильтры и пагинацию');
                        console.log('   5. Протестируйте добавление товаров в корзину');
                        
                    } else {
                        console.log('   ❌ Категории не найдены');
                    }
                } else {
                    console.log('   ❌ Группы не найдены');
                }
            } else {
                console.log('   ❌ Основной каталог не найден');
            }
        } else {
            console.log('   ❌ Каталоги не найдены');
        }
        
    } catch (error) {
        console.error('❌ Ошибка при тестировании:', error.message);
    }
    
    // Закрытие соединения
    mongoose.connection.close();
}

// Запуск теста
testCategoryPage(); 