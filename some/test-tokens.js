const HotlineParser = require('./hotline-parser');

// Тестируем получение токенов для разных категорий
async function testTokenExtraction() {
    const parser = new HotlineParser();
    
    const testCategories = [
        'https://hotline.ua/mobile/mobilnye-telefony-i-smartfony/',
        'https://hotline.ua/computer/noutbuki/',
        'https://hotline.ua/computer/planshety/'
    ];
    
    console.log('🧪 Тестируем получение токенов для разных категорий:');
    console.log('=' .repeat(60));
    
    for (let i = 0; i < testCategories.length; i++) {
        const categoryUrl = testCategories[i];
        const categoryName = parser.extractPathFromUrl(categoryUrl);
        
        console.log(`\n📦 [${i + 1}/${testCategories.length}] Категория: ${categoryName}`);
        console.log(`🔗 URL: ${categoryUrl}`);
        
        try {
            const tokens = await parser.getTokensForCategory(categoryUrl);
            
            console.log(`✅ x-token: ${tokens['x-token'] ? tokens['x-token'].substring(0, 20) + '...' : 'НЕ НАЙДЕН'}`);
            console.log(`✅ x-request-id: ${tokens['x-request-id'] ? tokens['x-request-id'].substring(0, 20) + '...' : 'НЕ НАЙДЕН'}`);
            
            // Проверяем, что токены разные для разных категорий
            if (i > 0) {
                const prevTokens = await parser.getTokensForCategory(testCategories[i-1]);
                const tokenChanged = tokens['x-token'] !== prevTokens['x-token'];
                console.log(`🔄 Токены изменились: ${tokenChanged ? 'ДА' : 'НЕТ'}`);
            }
            
        } catch (error) {
            console.log(`❌ Ошибка: ${error.message}`);
        }
        
        console.log('---');
        
        // Пауза между запросами
        if (i < testCategories.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('\n🎉 Тестирование завершено!');
}

testTokenExtraction().catch(console.error); 