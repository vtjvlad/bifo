#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs').promises;
const HotlineParser = require('./hotline-parser');

class SimpleCLI {
    constructor() {
        this.parser = new HotlineParser();
        this.config = {
            batchSize: 15,
            autoGetTokens: true,
            saveProgressively: true,
            saveInterval: 25,
            maxBatchSize: 25
        };
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    // Простые цвета
    colors = {
        blue: (text) => `\x1b[34m${text}\x1b[0m`,
        green: (text) => `\x1b[32m${text}\x1b[0m`,
        red: (text) => `\x1b[31m${text}\x1b[0m`,
        yellow: (text) => `\x1b[33m${text}\x1b[0m`,
        cyan: (text) => `\x1b[36m${text}\x1b[0m`
    };

    // Показываем заголовок
    showHeader() {
        console.clear();
        console.log(this.colors.cyan('🚀 HOTLINE PARSER CLI'));
        console.log(this.colors.yellow('Мультикатегорийный парсер с батчевой обработкой'));
        console.log('='.repeat(60));
        console.log('');
    }

    // Вопрос пользователю
    async question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }

    // Главное меню
    async showMainMenu() {
        this.showHeader();
        console.log('Выберите действие:');
        console.log('1. 📦 Парсить все категории из файла');
        console.log('2. 🎯 Парсить одну категорию');
        console.log('3. ⚙️  Настройки');
        console.log('4. 🧪 Тестирование производительности');
        console.log('5. 🔑 Тестирование токенов');
        console.log('6. 📊 Статистика и отчеты');
        console.log('0. ❌ Выход');
        console.log('');

        const choice = await this.question('Введите номер (0-6): ');

        switch (choice.trim()) {
            case '1':
                await this.parseAllCategories();
                break;
            case '2':
                await this.parseSingleCategory();
                break;
            case '3':
                await this.showSettings();
                break;
            case '4':
                await this.testPerformance();
                break;
            case '5':
                await this.testTokens();
                break;
            case '6':
                await this.showReports();
                break;
            case '0':
                this.exit();
                break;
            default:
                console.log(this.colors.red('❌ Неверный выбор!'));
                await this.waitForEnter();
        }
    }

    // Парсинг всех категорий
    async parseAllCategories() {
        this.showHeader();
        console.log(this.colors.blue('📦 Парсинг всех категорий из файла'));
        console.log('');

        try {
            // Проверяем наличие файла категорий
            let categories;
            
            try {
                const content = await fs.readFile('categories.txt', 'utf8');
                categories = content
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0 && !line.startsWith('#'))
                    .filter(line => line.includes('hotline.ua'));
            } catch (error) {
                console.log(this.colors.red('❌ Файл categories.txt не найден!'));
                console.log(this.colors.yellow('Создайте файл categories.txt с URL категорий (по одному на строку)'));
                await this.waitForEnter();
                return;
            }

            if (categories.length === 0) {
                console.log(this.colors.red('❌ В файле categories.txt нет валидных URL!'));
                await this.waitForEnter();
                return;
            }

            console.log(this.colors.green(`✅ Найдено ${categories.length} категорий:`));
            categories.forEach((url, index) => {
                const categoryName = this.parser.extractPathFromUrl(url);
                console.log(this.colors.cyan(`   ${index + 1}. ${categoryName}`));
            });

            console.log('');
            const confirm = await this.question('Начать парсинг всех категорий? (y/n): ');

            if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
                return;
            }

            console.log('🚀 Запуск парсера...');
            
            const results = await this.parser.parseAllCategories(
                categories, 
                this.config.saveProgressively, 
                this.config.batchSize, 
                this.config.autoGetTokens
            );

            console.log(this.colors.green('✅ Парсинг завершен!'));

            // Показываем результаты
            this.showParseResults(results);

        } catch (error) {
            console.log(this.colors.red(`❌ Ошибка: ${error.message}`));
        }

        await this.waitForEnter();
    }

    // Парсинг одной категории
    async parseSingleCategory() {
        this.showHeader();
        console.log(this.colors.blue('🎯 Парсинг одной категории'));
        console.log('');

        const categoryUrl = await this.question('Введите URL категории (или Enter для телефонов): ');
        const url = categoryUrl.trim() || 'https://hotline.ua/mobile/mobilnye-telefony-i-smartfony/';

        if (!url.includes('hotline.ua')) {
            console.log(this.colors.red('❌ URL должен содержать hotline.ua'));
            await this.waitForEnter();
            return;
        }

        try {
            console.log('🚀 Запуск парсера...');
            
            const products = await this.parser.getAllProducts(
                this.config.saveProgressively,
                this.config.saveInterval,
                this.config.batchSize,
                url
            );

            console.log(this.colors.green(`✅ Парсинг завершен! Получено ${products.length} товаров`));

            // Показываем статистику
            this.showProductStats(products);

        } catch (error) {
            console.log(this.colors.red(`❌ Ошибка: ${error.message}`));
        }

        await this.waitForEnter();
    }

    // Настройки
    async showSettings() {
        this.showHeader();
        console.log(this.colors.blue('⚙️  Настройки парсера'));
        console.log('');

        console.log('Текущие настройки:');
        console.log(`1. 📊 Размер батча: ${this.config.batchSize}`);
        console.log(`2. 🔑 Автополучение токенов: ${this.config.autoGetTokens ? 'ВКЛ' : 'ВЫКЛ'}`);
        console.log(`3. 💾 Постепенное сохранение: ${this.config.saveProgressively ? 'ВКЛ' : 'ВЫКЛ'}`);
        console.log(`4. ⏱️  Интервал сохранения: ${this.config.saveInterval}`);
        console.log(`5. 🧪 Максимальный размер батча для тестов: ${this.config.maxBatchSize}`);
        console.log('0. 🔙 Назад');
        console.log('');

        const choice = await this.question('Выберите настройку для изменения (0-5): ');

        switch (choice.trim()) {
            case '1':
                await this.changeBatchSize();
                break;
            case '2':
                await this.toggleAutoTokens();
                break;
            case '3':
                await this.toggleSaveProgressive();
                break;
            case '4':
                await this.changeSaveInterval();
                break;
            case '5':
                await this.changeMaxBatchSize();
                break;
            case '0':
                return;
            default:
                console.log(this.colors.red('❌ Неверный выбор!'));
                await this.waitForEnter();
        }

        await this.showSettings();
    }

    // Изменение размера батча
    async changeBatchSize() {
        const input = await this.question(`Введите размер батча (5-50) [${this.config.batchSize}]: `);
        const batchSize = parseInt(input.trim()) || this.config.batchSize;
        
        if (batchSize < 1 || batchSize > 50) {
            console.log(this.colors.red('❌ Размер батча должен быть от 1 до 50'));
            return;
        }

        this.config.batchSize = batchSize;
        console.log(this.colors.green(`✅ Размер батча изменен на ${batchSize}`));
    }

    // Переключение автополучения токенов
    async toggleAutoTokens() {
        const input = await this.question(`Автополучение токенов: ${this.config.autoGetTokens ? 'ВКЛ' : 'ВЫКЛ'} (y/n): `);
        const autoTokens = input.toLowerCase() === 'y' || input.toLowerCase() === 'yes';
        
        this.config.autoGetTokens = autoTokens;
        console.log(this.colors.green(`✅ Автополучение токенов: ${autoTokens ? 'ВКЛ' : 'ВЫКЛ'}`));
    }

    // Переключение постепенного сохранения
    async toggleSaveProgressive() {
        const input = await this.question(`Постепенное сохранение: ${this.config.saveProgressively ? 'ВКЛ' : 'ВЫКЛ'} (y/n): `);
        const saveProgressive = input.toLowerCase() === 'y' || input.toLowerCase() === 'yes';
        
        this.config.saveProgressively = saveProgressive;
        console.log(this.colors.green(`✅ Постепенное сохранение: ${saveProgressive ? 'ВКЛ' : 'ВЫКЛ'}`));
    }

    // Изменение интервала сохранения
    async changeSaveInterval() {
        const input = await this.question(`Введите интервал сохранения (страниц) [${this.config.saveInterval}]: `);
        const saveInterval = parseInt(input.trim()) || this.config.saveInterval;
        
        if (saveInterval < 1) {
            console.log(this.colors.red('❌ Интервал должен быть больше 0'));
            return;
        }

        this.config.saveInterval = saveInterval;
        console.log(this.colors.green(`✅ Интервал сохранения изменен на ${saveInterval}`));
    }

    // Изменение максимального размера батча для тестов
    async changeMaxBatchSize() {
        const input = await this.question(`Введите максимальный размер батча для тестов (5-50) [${this.config.maxBatchSize}]: `);
        const maxBatchSize = parseInt(input.trim()) || this.config.maxBatchSize;
        
        if (maxBatchSize < 5 || maxBatchSize > 50) {
            console.log(this.colors.red('❌ Максимальный размер батча должен быть от 5 до 50'));
            return;
        }

        this.config.maxBatchSize = maxBatchSize;
        console.log(this.colors.green(`✅ Максимальный размер батча изменен на ${maxBatchSize}`));
    }

    // Тестирование производительности
    async testPerformance() {
        this.showHeader();
        console.log(this.colors.blue('🧪 Тестирование производительности'));
        console.log('');

        const confirm = await this.question('Запустить тестирование производительности? (y/n): ');

        if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
            return;
        }

        try {
            console.log('🧪 Тестирование производительности...');
            
            const results = await this.parser.testBatchPerformance(this.config.maxBatchSize);
            
            console.log(this.colors.green('✅ Тестирование завершено!'));

            // Показываем результаты
            this.showPerformanceResults(results);

        } catch (error) {
            console.log(this.colors.red(`❌ Ошибка: ${error.message}`));
        }

        await this.waitForEnter();
    }

    // Тестирование токенов
    async testTokens() {
        this.showHeader();
        console.log(this.colors.blue('🔑 Тестирование токенов'));
        console.log('');

        const confirm = await this.question('Запустить тестирование токенов? (y/n): ');

        if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
            return;
        }

        try {
            // Импортируем тестовый файл
            const testTokens = require('./test-tokens');
            await testTokens();

        } catch (error) {
            console.log(this.colors.red(`❌ Ошибка: ${error.message}`));
        }

        await this.waitForEnter();
    }

    // Показ отчетов
    async showReports() {
        this.showHeader();
        console.log(this.colors.blue('📊 Статистика и отчеты'));
        console.log('');

        try {
            // Проверяем наличие файлов
            const jsonFiles = await this.getFilesInDirectory('JSON');
            const csvFiles = await this.getFilesInDirectory('CSV');

            console.log(this.colors.green('📁 JSON файлы:'));
            if (jsonFiles.length > 0) {
                jsonFiles.forEach(file => {
                    console.log(this.colors.cyan(`   📄 ${file}`));
                });
            } else {
                console.log(this.colors.yellow('   Нет JSON файлов'));
            }

            console.log('');
            console.log(this.colors.green('📁 CSV файлы:'));
            if (csvFiles.length > 0) {
                csvFiles.forEach(file => {
                    console.log(this.colors.cyan(`   📊 ${file}`));
                });
            } else {
                console.log(this.colors.yellow('   Нет CSV файлов'));
            }

        } catch (error) {
            console.log(this.colors.red(`❌ Ошибка при чтении файлов: ${error.message}`));
        }

        await this.waitForEnter();
    }

    // Получение файлов в директории
    async getFilesInDirectory(dir) {
        try {
            const files = await fs.readdir(dir);
            return files.filter(file => file.endsWith('.json') || file.endsWith('.csv'));
        } catch (error) {
            return [];
        }
    }

    // Показ результатов парсинга
    showParseResults(results) {
        console.log('');
        console.log(this.colors.green('📊 Результаты парсинга:'));
        console.log('');

        let totalProducts = 0;
        let successCount = 0;
        let errorCount = 0;

        Object.keys(results).forEach(categoryName => {
            const result = results[categoryName];
            if (result.error) {
                console.log(this.colors.red(`❌ ${categoryName}: ${result.error}`));
                errorCount++;
            } else {
                console.log(this.colors.green(`✅ ${categoryName}: ${result.count} товаров`));
                totalProducts += result.count;
                successCount++;
            }
        });

        console.log('');
        console.log(this.colors.blue('📈 Итоговая статистика:'));
        console.log(this.colors.cyan(`   Успешных категорий: ${successCount}`));
        console.log(this.colors.red(`   Ошибок: ${errorCount}`));
        console.log(this.colors.green(`   Всего товаров: ${totalProducts}`));
    }

    // Показ статистики товаров
    showProductStats(products) {
        console.log('');
        console.log(this.colors.blue('📊 Статистика товаров:'));
        console.log(this.colors.cyan(`   Всего товаров: ${products.length}`));
        
        if (products.length > 0) {
            const prices = products.filter(p => p.minPrice).map(p => p.minPrice);
            if (prices.length > 0) {
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
                
                console.log(this.colors.cyan(`   Минимальная цена: ${minPrice} грн`));
                console.log(this.colors.cyan(`   Максимальная цена: ${maxPrice} грн`));
                console.log(this.colors.cyan(`   Средняя цена: ${avgPrice} грн`));
            }
        }
    }

    // Показ результатов производительности
    showPerformanceResults(results) {
        console.log('');
        console.log(this.colors.green('📊 Результаты тестирования производительности:'));
        console.log('');

        results.results.forEach(result => {
            const color = result.speed > 10 ? this.colors.green : result.speed > 5 ? this.colors.yellow : this.colors.red;
            console.log(color(`   Батч ${result.batchSize}: ${result.duration.toFixed(2)}с, ${result.productsCount} товаров, ${result.speed.toFixed(1)} товаров/с`));
        });

        console.log('');
        console.log(this.colors.blue(`🏆 Оптимальный размер батча: ${results.optimal.batchSize} (${results.optimal.speed.toFixed(1)} товаров/с)`));
    }

    // Ожидание нажатия Enter
    async waitForEnter() {
        await this.question('Нажмите Enter для продолжения...');
    }

    // Выход
    exit() {
        console.log(this.colors.cyan('👋 До свидания!'));
        this.rl.close();
        process.exit(0);
    }

    // Запуск CLI
    async run() {
        while (true) {
            await this.showMainMenu();
        }
    }
}

// Запускаем CLI
if (require.main === module) {
    const cli = new SimpleCLI();
    cli.run().catch(console.error);
}

module.exports = SimpleCLI; 