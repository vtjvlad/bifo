// Скрипт для обновления существующих категорий с полем productSearchField
const mongoose = require('mongoose');
require('dotenv').config();

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Импорт модели
const Catalog = require('./models/Catalog');

async function updateCategories() {
    console.log('🔄 Обновление категорий с полем productSearchField...\n');

    try {
        // Получаем все категории (level 2)
        const categories = await Catalog.find({ level: 2, isActive: true });
        console.log(`Найдено категорий для обновления: ${categories.length}`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const category of categories) {
            // Проверяем, есть ли уже productSearchField
            if (category.productSearchField) {
                console.log(`⏭️  Категория "${category.name}" уже имеет productSearchField: ${category.productSearchField}`);
                skippedCount++;
                continue;
            }

            // Создаем productSearchField на основе catalogSlug и slug
            const productSearchField = `${category.catalogSlug}-${category.slug}`;
            
            try {
                await Catalog.findByIdAndUpdate(category._id, {
                    productSearchField: productSearchField
                });
                
                console.log(`✅ Обновлена категория "${category.name}": ${productSearchField}`);
                updatedCount++;
            } catch (error) {
                console.error(`❌ Ошибка обновления категории "${category.name}":`, error.message);
            }
        }

        console.log('\n📊 Результаты обновления:');
        console.log(`   Обновлено: ${updatedCount}`);
        console.log(`   Пропущено: ${skippedCount}`);
        console.log(`   Всего: ${categories.length}`);

        // Показываем примеры обновленных категорий
        console.log('\n📋 Примеры обновленных категорий:');
        const sampleCategories = await Catalog.find({ 
            level: 2, 
            productSearchField: { $exists: true, $ne: null } 
        }).limit(5);
        
        sampleCategories.forEach(cat => {
            console.log(`   ${cat.name}: ${cat.productSearchField}`);
        });

    } catch (error) {
        console.error('❌ Ошибка при обновлении категорий:', error.message);
    }
    
    // Закрытие соединения
    mongoose.connection.close();
}

// Запуск обновления
updateCategories(); 