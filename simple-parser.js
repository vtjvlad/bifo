const HotlineParser = require('./hotline-parser');

// Простой пример использования парсера
async function simpleExample() {
    const parser = new HotlineParser();
    
    try {
        console.log('🚀 Запуск простого парсера...');
        
        // Получаем только первую страницу для тестирования
        const data = await parser.getProducts(1, 10);
        
        // Проверяем структуру данных
        if (!data.data || !data.data.byPathSectionQueryProducts) {
            throw new Error('Неверная структура данных от API');
        }
        
        const products = data.data.byPathSectionQueryProducts.collection;
        
        if (!products || !Array.isArray(products)) {
            console.error('Полученные данные:', JSON.stringify(data, null, 2));
            throw new Error('Коллекция товаров не найдена или не является массивом');
        }
        
        console.log(`✅ Получено ${products.length} товаров`);
        
        // Выводим информацию о каждом товаре
        products.forEach((product, index) => {
            console.log(`\n${index + 1}. ${product.title}`);
            console.log(`   Производитель: ${product.vendor?.title || 'Не указан'}`);
            console.log(`   Цена: ${product.minPrice || 'Не указана'} грн`);
            console.log(`   Предложений: ${product.offerCount || 0}`);
            console.log(`   URL: ${product.url || 'Не указан'}`);
        });
        
        // Сохраняем в файл
        await parser.saveToFile(products, 'test-products.json');
        console.log('\n💾 Данные сохранены в test-products.json');
        
        // Также сохраняем полный ответ для отладки
        await parser.saveToFile(data, 'full-response.json');
        console.log('💾 Полный ответ сохранен в full-response.json');
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        console.error('Стек ошибки:', error.stack);
    }
}

// Запускаем простой пример
simpleExample(); 