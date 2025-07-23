const HotlineParser = require('./hotline-parser');

// Тестируем извлечение пути
function testPathExtraction() {
    const parser = new HotlineParser();
    
    const testUrls = [
        'https://hotline.ua/mobile/mobilnye-telefony-i-smartfony/',
        'https://hotline.ua/ua/computer/noutbuki-netbuki/',
        'https://hotline.ua/computer/planshety/',
        'https://hotline.ua/computer/kompyutery/',
        'https://hotline.ua/computer/monitory/'
    ];
    
    console.log('🧪 Тестируем извлечение пути из URL:');
    console.log('=' .repeat(50));
    
    testUrls.forEach(url => {
        try {
            const extractedPath = parser.extractPathFromUrl(url);
            console.log(`📥 ${url}`);
            console.log(`📤 ${extractedPath}`);
            console.log('---');
        } catch (error) {
            console.log(`❌ Ошибка: ${url} - ${error.message}`);
        }
    });
}

testPathExtraction(); 