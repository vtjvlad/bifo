const HotlineParser = require('./hotline-parser');

// Пример использования парсера с несколькими категориями
async function exampleUsage() {
    const parser = new HotlineParser();
    
    try {
        // Вариант 1: Парсинг одной категории
        console.log('=== Парсинг одной категории ===');
        const singleCategoryUrl = 'https://hotline.ua/ua/mobile/mobilnye-telefony-i-smartfony/';

        const laptops = await parser.getAllProducts(true, 25, 10, singleCategoryUrl);
        console.log(`Получено ${laptops.length} ноутбуков`);
        
        // Вариант 2: Парсинг всех категорий из файла
        console.log('\n=== Парсинг всех категорий ===');
        const categories = await parser.loadCategoriesFromFile('categories.txt');
        console.log(`Найдено ${categories.length} категорий`);
        
        // Парсим только первые 3 категории для примера
        const limitedCategories = categories.slice(0, 3);
        const allResults = await parser.parseAllCategories(limitedCategories, true, 10);
        
        // Выводим результаты
        Object.keys(allResults).forEach(categoryName => {
            const result = allResults[categoryName];
            if (result.error) {
                console.log(`❌ ${categoryName}: ${result.error}`);
            } else {
                console.log(`✅ ${categoryName}: ${result.count} товаров`);
            }
        });
        
    } catch (error) {
        console.error('Ошибка:', error.message);
    }
}

// Запускаем пример
if (require.main === module) {
    exampleUsage();
}

module.exports = exampleUsage; 