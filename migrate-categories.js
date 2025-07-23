const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

// Подключение к MongoDB
async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bifo', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Подключение к MongoDB успешно');
    } catch (error) {
        console.error('❌ Ошибка подключения к MongoDB:', error);
        process.exit(1);
    }
}

// Функция для извлечения категории из productCategoryName
function extractCategoryFromName(productCategoryName) {
    if (!productCategoryName) return null;
    
    // Приводим к нижнему регистру и заменяем пробелы на дефисы
    const normalized = productCategoryName.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    
    // Добавляем префикс bt- если его нет
    return normalized.startsWith('bt-') ? normalized : `bt-${normalized}`;
}

// Функция для извлечения подкатегории из productCategoryName
function extractSubCategoryFromName(productCategoryName) {
    if (!productCategoryName) return null;
    
    // Приводим к нижнему регистру и заменяем пробелы на дефисы
    const normalized = productCategoryName.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    
    // Убираем префикс bt- если он есть
    return normalized.startsWith('bt-') ? normalized.substring(3) : normalized;
}

// Миграция продуктов для добавления полей category и subCategory
async function migrateProducts() {
    try {
        console.log('🔄 Начинаем миграцию продуктов...');
        
        // Получаем все продукты без полей category и subCategory
        const products = await Product.find({
            $or: [
                { 'section.category': { $exists: false } },
                { 'section.subCategory': { $exists: false } },
                { 'section.category': null },
                { 'section.subCategory': null }
            ]
        });
        
        console.log(`📊 Найдено ${products.length} продуктов для миграции`);
        
        let updatedCount = 0;
        let errorCount = 0;
        
        for (const product of products) {
            try {
                const category = extractCategoryFromName(product.section.productCategoryName);
                const subCategory = extractSubCategoryFromName(product.section.productCategoryName);
                
                // Обновляем продукт
                await Product.updateOne(
                    { _id: product._id },
                    {
                        $set: {
                            'section.category': category,
                            'section.subCategory': subCategory
                        }
                    }
                );
                
                updatedCount++;
                console.log(`✅ Обновлен продукт ${product.title}: category=${category}, subCategory=${subCategory}`);
                
            } catch (error) {
                errorCount++;
                console.error(`❌ Ошибка обновления продукта ${product.title}:`, error.message);
            }
        }
        
        console.log(`\n📈 Миграция завершена:`);
        console.log(`   ✅ Обновлено: ${updatedCount} продуктов`);
        console.log(`   ❌ Ошибок: ${errorCount} продуктов`);
        
        return { updatedCount, errorCount };
        
    } catch (error) {
        console.error('❌ Ошибка миграции:', error.message);
        return { updatedCount: 0, errorCount: 1 };
    }
}

// Проверка результатов миграции
async function checkMigrationResults() {
    try {
        console.log('\n🔍 Проверка результатов миграции...');
        
        // Проверяем общее количество продуктов
        const totalProducts = await Product.countDocuments({});
        console.log(`📊 Общее количество продуктов: ${totalProducts}`);
        
        // Проверяем продукты с полями category и subCategory
        const productsWithCategories = await Product.countDocuments({
            'section.category': { $exists: true, $ne: null },
            'section.subCategory': { $exists: true, $ne: null }
        });
        console.log(`✅ Продуктов с категориями: ${productsWithCategories}`);
        
        // Проверяем продукты без полей category и subCategory
        const productsWithoutCategories = await Product.countDocuments({
            $or: [
                { 'section.category': { $exists: false } },
                { 'section.subCategory': { $exists: false } },
                { 'section.category': null },
                { 'section.subCategory': null }
            ]
        });
        console.log(`❌ Продуктов без категорий: ${productsWithoutCategories}`);
        
        // Показываем примеры категорий
        const sampleProducts = await Product.find({
            'section.category': { $exists: true, $ne: null }
        }).limit(5);
        
        console.log('\n📋 Примеры категорий:');
        sampleProducts.forEach(product => {
            console.log(`   ${product.title}:`);
            console.log(`     - productCategoryName: ${product.section.productCategoryName}`);
            console.log(`     - category: ${product.section.category}`);
            console.log(`     - subCategory: ${product.section.subCategory}`);
        });
        
        return {
            totalProducts,
            productsWithCategories,
            productsWithoutCategories
        };
        
    } catch (error) {
        console.error('❌ Ошибка проверки:', error.message);
        return null;
    }
}

// Создание индексов для новых полей
async function createIndexes() {
    try {
        console.log('\n🔧 Создание индексов для новых полей...');
        
        // Создаем индексы для оптимизации запросов
        await Product.collection.createIndex({ 'section.category': 1 });
        await Product.collection.createIndex({ 'section.subCategory': 1 });
        await Product.collection.createIndex({ 'section.category': 1, 'section.subCategory': 1 });
        
        console.log('✅ Индексы созданы успешно');
        
    } catch (error) {
        console.error('❌ Ошибка создания индексов:', error.message);
    }
}

// Основная функция миграции
async function runMigration() {
    try {
        await connectToDatabase();
        
        // Проверяем состояние до миграции
        console.log('📊 Состояние до миграции:');
        await checkMigrationResults();
        
        // Выполняем миграцию
        const migrationResult = await migrateProducts();
        
        // Создаем индексы
        await createIndexes();
        
        // Проверяем состояние после миграции
        console.log('\n📊 Состояние после миграции:');
        await checkMigrationResults();
        
        if (migrationResult.errorCount === 0) {
            console.log('\n🎉 Миграция завершена успешно!');
        } else {
            console.log('\n⚠️ Миграция завершена с ошибками. Проверьте логи выше.');
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка миграции:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Соединение с MongoDB закрыто');
    }
}

// Запуск миграции
if (require.main === module) {
    runMigration();
}

module.exports = {
    connectToDatabase,
    migrateProducts,
    checkMigrationResults,
    createIndexes,
    extractCategoryFromName,
    extractSubCategoryFromName
}; 