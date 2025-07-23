#!/usr/bin/env node

const fs = require('fs').promises;
const SimpleCLI = require('./cli-simple');

// Тестовые данные
const testCategories = [
    'https://hotline.ua/mobile/mobilnye-telefony-i-smartfony/',
    'https://hotline.ua/computer/noutbuki-netbuki/',
    'https://hotline.ua/computer/planshety/'
];

async function runTests() {
    console.log('🧪 Тестирование CLI интерфейса...\n');

    // Тест 1: Создание файла категорий
    console.log('📝 Тест 1: Создание файла категорий');
    try {
        await fs.writeFile('categories.txt', testCategories.join('\n'));
        console.log('✅ Файл categories.txt создан');
    } catch (error) {
        console.log('❌ Ошибка создания файла:', error.message);
    }

    // Тест 2: Проверка чтения файла
    console.log('\n📖 Тест 2: Чтение файла категорий');
    try {
        const content = await fs.readFile('categories.txt', 'utf8');
        const categories = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('#'))
            .filter(line => line.includes('hotline.ua'));
        
        console.log(`✅ Прочитано ${categories.length} категорий:`);
        categories.forEach((url, index) => {
            console.log(`   ${index + 1}. ${url}`);
        });
    } catch (error) {
        console.log('❌ Ошибка чтения файла:', error.message);
    }

    // Тест 3: Проверка CLI класса
    console.log('\n🎮 Тест 3: Проверка CLI класса');
    try {
        const cli = new SimpleCLI();
        console.log('✅ CLI класс создан');
        console.log(`   Размер батча: ${cli.config.batchSize}`);
        console.log(`   Автополучение токенов: ${cli.config.autoGetTokens}`);
        console.log(`   Постепенное сохранение: ${cli.config.saveProgressively}`);
    } catch (error) {
        console.log('❌ Ошибка создания CLI:', error.message);
    }

    // Тест 4: Проверка цветов
    console.log('\n🎨 Тест 4: Проверка цветов');
    try {
        const cli = new SimpleCLI();
        console.log(cli.colors.blue('Синий текст'));
        console.log(cli.colors.green('Зеленый текст'));
        console.log(cli.colors.red('Красный текст'));
        console.log(cli.colors.yellow('Желтый текст'));
        console.log(cli.colors.cyan('Голубой текст'));
        console.log('✅ Цвета работают');
    } catch (error) {
        console.log('❌ Ошибка цветов:', error.message);
    }

    // Тест 5: Проверка парсера
    console.log('\n🔧 Тест 5: Проверка парсера');
    try {
        const HotlineParser = require('./hotline-parser');
        const parser = new HotlineParser();
        console.log('✅ Парсер создан');
        
        // Тест извлечения пути
        const testUrl = 'https://hotline.ua/mobile/mobilnye-telefony-i-smartfony/';
        const path = parser.extractPathFromUrl(testUrl);
        console.log(`   Извлеченный путь: ${path}`);
    } catch (error) {
        console.log('❌ Ошибка парсера:', error.message);
    }

    // Тест 6: Проверка папок
    console.log('\n📁 Тест 6: Проверка папок');
    try {
        const folders = ['JSON', 'CSV'];
        for (const folder of folders) {
            try {
                await fs.access(folder);
                console.log(`✅ Папка ${folder} существует`);
            } catch {
                await fs.mkdir(folder, { recursive: true });
                console.log(`✅ Папка ${folder} создана`);
            }
        }
    } catch (error) {
        console.log('❌ Ошибка папок:', error.message);
    }

    console.log('\n🎉 Все тесты завершены!');
    console.log('\n📋 Рекомендации:');
    console.log('1. Запустите: node cli-simple.js');
    console.log('2. Выберите опцию 2 для парсинга одной категории');
    console.log('3. Нажмите Enter для парсинга телефонов');
    console.log('4. Проверьте результаты в папках JSON/ и CSV/');
}

// Запуск тестов
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = runTests; 