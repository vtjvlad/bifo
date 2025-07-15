const HotlineParser = require('./simple-hotline-parser');

async function exampleUsage() {
    const parser = new HotlineParser();
    
    // Список продуктов для парсинга
    const products = [
        'samsung-galaxy-s21-fe-5g-6128gb-lavender-sm-g990blvd',
        'samsung-galaxy-a56-5g-8128gb-awesome-graphite-sm-a566bzka'
    ];
    
    console.log('🚀 Запускаем парсер Hotline.ua');
    console.log('=' .repeat(50));
    
    for (const productPath of products) {
        try {
            console.log(`\n📱 Парсим продукт: ${productPath}`);
            const offers = await parser.parseProduct(productPath);
            
            if (offers && offers.length > 0) {
                console.log(`✅ Найдено ${offers.length} предложений`);
                
                // Показываем топ-3 предложения по цене
                const sortedOffers = offers
                    .filter(offer => offer.price)
                    .sort((a, b) => a.price - b.price)
                    .slice(0, 3);
                
                console.log('\n🏆 Топ-3 предложения по цене:');
                sortedOffers.forEach((offer, index) => {
                    console.log(`${index + 1}. ${offer.firmTitle} - ${offer.price} грн`);
                    console.log(`   Состояние: ${offer.condition}`);
                    console.log(`   Доставка: ${offer.delivery}`);
                    console.log('');
                });
            } else {
                console.log('❌ Предложения не найдены');
            }
            
        } catch (error) {
            console.error(`❌ Ошибка при парсинге ${productPath}:`, error.message);
        }
        
        // Небольшая пауза между запросами
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n🎉 Парсинг завершен!');
}

// Запуск примера
if (require.main === module) {
    exampleUsage().catch(console.error);
}

module.exports = { exampleUsage }; 