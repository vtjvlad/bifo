const HotlineCLI = require('./cli-parser');

// Простой тест CLI интерфейса
async function testCLI() {
    console.log('🧪 Тестирование CLI интерфейса...');
    
    try {
        const cli = new HotlineCLI();
        
        // Проверяем создание папок
        await cli.parser.ensureDirectories();
        console.log('✅ Папки созданы');
        
        // Проверяем извлечение пути
        const testUrl = 'https://hotline.ua/mobile/mobilnye-telefony-i-smartfony/';
        const path = cli.parser.extractPathFromUrl(testUrl);
        console.log(`✅ Извлечение пути: ${testUrl} → ${path}`);
        
        // Проверяем конфигурацию
        console.log('✅ Конфигурация по умолчанию:');
        console.log(`   Размер батча: ${cli.config.batchSize}`);
        console.log(`   Автополучение токенов: ${cli.config.autoGetTokens}`);
        console.log(`   Постепенное сохранение: ${cli.config.saveProgressively}`);
        
        console.log('\n🎉 CLI интерфейс готов к работе!');
        console.log('Запустите: node cli-parser.js');
        
    } catch (error) {
        console.error('❌ Ошибка при тестировании CLI:', error.message);
    }
}

testCLI(); 