#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');

// Исправляем импорт ora для совместимости
let ora = require('ora');
if (typeof ora !== 'function' && ora.default) ora = ora.default;

// Исправляем импорт figlet для совместимости
let figlet = require('figlet');
if (typeof figlet !== 'function' && figlet.default) figlet = figlet.default;

// Исправляем импорт boxen для совместимости
let boxen = require('boxen');
if (typeof boxen !== 'function' && boxen.default) boxen = boxen.default;

const cliProgress = require('cli-progress');
const HotlineParser = require('./hotline-parser');

// Проверяем версию chalk и настраиваем соответственно
if (chalk.level > 0) {
    // chalk v4+ (CommonJS)
    chalk.level = 3; // Включаем все цвета
} else {
    // chalk v5+ (ESM) - используем fallback
    console.log('⚠️  Рекомендуется установить chalk v4: npm install chalk@4.1.2');
}

class HotlineCLI {
    constructor() {
        this.parser = new HotlineParser();
        this.config = {
            batchSize: 15,
            autoGetTokens: true,
            saveProgressively: true,
            saveInterval: 25,
            testPerformance: false,
            maxBatchSize: 25
        };
    }

    // Показываем красивый заголовок
    showHeader() {
        console.clear();
        console.log(
            chalk.cyan(
                figlet.textSync('Hotline Parser', { 
                    horizontalLayout: 'full',
                    font: 'Standard'
                })
            )
        );
        
        console.log(
            boxen(
                chalk.yellow('🚀 Мультикатегорийный парсер Hotline.ua с батчевой обработкой'),
                {
                    padding: 1,
                    margin: 1,
                    borderStyle: 'round',
                    borderColor: 'cyan'
                }
            )
        );
    }

    // Главное меню
    async showMainMenu() {
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Выберите действие:',
                choices: [
                    { name: '📦 Парсить все категории из файла', value: 'parse_all' },
                    { name: '🎯 Парсить одну категорию', value: 'parse_single' },
                    { name: '⚙️  Настройки', value: 'settings' },
                    { name: '🧪 Тестирование производительности', value: 'test_performance' },
                    { name: '🔑 Тестирование токенов', value: 'test_tokens' },
                    { name: '📊 Статистика и отчеты', value: 'reports' },
                    { name: '❌ Выход', value: 'exit' }
                ]
            }
        ]);

        switch (action) {
            case 'parse_all':
                await this.parseAllCategories();
                break;
            case 'parse_single':
                await this.parseSingleCategory();
                break;
            case 'settings':
                await this.showSettings();
                break;
            case 'test_performance':
                await this.testPerformance();
                break;
            case 'test_tokens':
                await this.testTokens();
                break;
            case 'reports':
                await this.showReports();
                break;
            case 'exit':
                this.exit();
                break;
        }
    }

    // Парсинг всех категорий
    async parseAllCategories() {
        this.showHeader();
        console.log(chalk.blue('📦 Парсинг всех категорий из файла'));
        console.log('');

        try {
            // Проверяем наличие файла категорий
            const fs = require('fs').promises;
            let categories;
            
            try {
                const content = await fs.readFile('tctgr/categories.txt', 'utf8');
                categories = content
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0 && !line.startsWith('#'))
                    .filter(line => line.includes('hotline.ua'));
            } catch (error) {
                console.log(chalk.red('❌ Файл categories.txt не найден!'));
                console.log(chalk.yellow('Создайте файл categories.txt с URL категорий (по одному на строку)'));
                await this.waitForEnter();
                return;
            }

            if (categories.length === 0) {
                console.log(chalk.red('❌ В файле categories.txt нет валидных URL!'));
                await this.waitForEnter();
                return;
            }

            console.log(chalk.green(`✅ Найдено ${categories.length} категорий:`));
            categories.forEach((url, index) => {
                const categoryName = this.parser.extractPathFromUrl(url);
                console.log(chalk.cyan(`   ${index + 1}. ${categoryName}`));
            });

            console.log('');
            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Начать парсинг всех категорий?',
                    default: true
                }
            ]);

            if (!confirm) {
                return;
            }

            // Показываем прогресс
            const spinner = ora('🚀 Запуск парсера...').start();
            
            const results = await this.parser.parseAllCategories(
                categories, 
                this.config.saveProgressively, 
                this.config.batchSize, 
                this.config.autoGetTokens
            );

            spinner.succeed('✅ Парсинг завершен!');

            // Показываем результаты
            this.showParseResults(results);

        } catch (error) {
            console.log(chalk.red(`❌ Ошибка: ${error.message}`));
        }

        await this.waitForEnter();
    }

    // Парсинг одной категории
    async parseSingleCategory() {
        this.showHeader();
        console.log(chalk.blue('🎯 Парсинг одной категории'));
        console.log('');

        const { categoryUrl } = await inquirer.prompt([
            {
                type: 'input',
                name: 'categoryUrl',
                message: 'Введите URL категории:',
                default: 'https://hotline.ua/mobile/mobilnye-telefony-i-smartfony/',
                validate: (input) => {
                    if (!input.includes('hotline.ua')) {
                        return 'URL должен содержать hotline.ua';
                    }
                    return true;
                }
            }
        ]);

        try {
            const spinner = ora('🚀 Запуск парсера...').start();
            
            const products = await this.parser.getAllProducts(
                this.config.saveProgressively,
                this.config.saveInterval,
                this.config.batchSize,
                categoryUrl
            );

            spinner.succeed(`✅ Парсинг завершен! Получено ${products.length} товаров`);

            // Показываем статистику
            this.showProductStats(products);

        } catch (error) {
            console.log(chalk.red(`❌ Ошибка: ${error.message}`));
        }

        await this.waitForEnter();
    }

    // Настройки
    async showSettings() {
        this.showHeader();
        console.log(chalk.blue('⚙️  Настройки парсера'));
        console.log('');

        const { setting } = await inquirer.prompt([
            {
                type: 'list',
                name: 'setting',
                message: 'Выберите настройку для изменения:',
                choices: [
                    { name: `📊 Размер батча: ${this.config.batchSize}`, value: 'batch_size' },
                    { name: `🔑 Автополучение токенов: ${this.config.autoGetTokens ? 'ВКЛ' : 'ВЫКЛ'}`, value: 'auto_tokens' },
                    { name: `💾 Постепенное сохранение: ${this.config.saveProgressively ? 'ВКЛ' : 'ВЫКЛ'}`, value: 'save_progressive' },
                    { name: `⏱️  Интервал сохранения: ${this.config.saveInterval}`, value: 'save_interval' },
                    { name: `🧪 Максимальный размер батча для тестов: ${this.config.maxBatchSize}`, value: 'max_batch' },
                    { name: '🔙 Назад', value: 'back' }
                ]
            }
        ]);

        switch (setting) {
            case 'batch_size':
                await this.changeBatchSize();
                break;
            case 'auto_tokens':
                await this.toggleAutoTokens();
                break;
            case 'save_progressive':
                await this.toggleSaveProgressive();
                break;
            case 'save_interval':
                await this.changeSaveInterval();
                break;
            case 'max_batch':
                await this.changeMaxBatchSize();
                break;
            case 'back':
                return;
        }

        await this.showSettings();
    }

    // Изменение размера батча
    async changeBatchSize() {
        const { batchSize } = await inquirer.prompt([
            {
                type: 'number',
                name: 'batchSize',
                message: 'Введите размер батча (5-50):',
                default: this.config.batchSize,
                validate: (input) => {
                    if (input < 1 || input > 50) {
                        return 'Размер батча должен быть от 1 до 50';
                    }
                    return true;
                }
            }
        ]);

        this.config.batchSize = batchSize;
        console.log(chalk.green(`✅ Размер батча изменен на ${batchSize}`));
    }

    // Переключение автополучения токенов
    async toggleAutoTokens() {
        const { autoTokens } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'autoTokens',
                message: 'Включить автоматическое получение токенов для каждой категории?',
                default: this.config.autoGetTokens
            }
        ]);

        this.config.autoGetTokens = autoTokens;
        console.log(chalk.green(`✅ Автополучение токенов: ${autoTokens ? 'ВКЛ' : 'ВЫКЛ'}`));
    }

    // Переключение постепенного сохранения
    async toggleSaveProgressive() {
        const { saveProgressive } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'saveProgressive',
                message: 'Включить постепенное сохранение данных?',
                default: this.config.saveProgressively
            }
        ]);

        this.config.saveProgressively = saveProgressive;
        console.log(chalk.green(`✅ Постепенное сохранение: ${saveProgressive ? 'ВКЛ' : 'ВЫКЛ'}`));
    }

    // Изменение интервала сохранения
    async changeSaveInterval() {
        const { saveInterval } = await inquirer.prompt([
            {
                type: 'number',
                name: 'saveInterval',
                message: 'Введите интервал сохранения (страниц):',
                default: this.config.saveInterval,
                validate: (input) => {
                    if (input < 1) {
                        return 'Интервал должен быть больше 0';
                    }
                    return true;
                }
            }
        ]);

        this.config.saveInterval = saveInterval;
        console.log(chalk.green(`✅ Интервал сохранения изменен на ${saveInterval}`));
    }

    // Изменение максимального размера батча для тестов
    async changeMaxBatchSize() {
        const { maxBatchSize } = await inquirer.prompt([
            {
                type: 'number',
                name: 'maxBatchSize',
                message: 'Введите максимальный размер батча для тестов (5-50):',
                default: this.config.maxBatchSize,
                validate: (input) => {
                    if (input < 5 || input > 50) {
                        return 'Максимальный размер батча должен быть от 5 до 50';
                    }
                    return true;
                }
            }
        ]);

        this.config.maxBatchSize = maxBatchSize;
        console.log(chalk.green(`✅ Максимальный размер батча изменен на ${maxBatchSize}`));
    }

    // Тестирование производительности
    async testPerformance() {
        this.showHeader();
        console.log(chalk.blue('🧪 Тестирование производительности'));
        console.log('');

        const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Запустить тестирование производительности с разными размерами батчей?',
                default: true
            }
        ]);

        if (!confirm) {
            return;
        }

        try {
            const spinner = ora('🧪 Тестирование производительности...').start();
            
            const results = await this.parser.testBatchPerformance(this.config.maxBatchSize);
            
            spinner.succeed('✅ Тестирование завершено!');

            // Показываем результаты
            this.showPerformanceResults(results);

        } catch (error) {
            console.log(chalk.red(`❌ Ошибка: ${error.message}`));
        }

        await this.waitForEnter();
    }

    // Тестирование токенов
    async testTokens() {
        this.showHeader();
        console.log(chalk.blue('🔑 Тестирование токенов'));
        console.log('');

        const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Запустить тестирование получения токенов для разных категорий?',
                default: true
            }
        ]);

        if (!confirm) {
            return;
        }

        try {
            // Импортируем тестовый файл
            const testTokens = require('./test-tokens');
            await testTokens();

        } catch (error) {
            console.log(chalk.red(`❌ Ошибка: ${error.message}`));
        }

        await this.waitForEnter();
    }

    // Показ отчетов
    async showReports() {
        this.showHeader();
        console.log(chalk.blue('📊 Статистика и отчеты'));
        console.log('');

        const fs = require('fs').promises;
        
        try {
            // Проверяем наличие файлов
            const jsonFiles = await this.getFilesInDirectory('JSON');
            const csvFiles = await this.getFilesInDirectory('CSV');

            console.log(chalk.green('📁 JSON файлы:'));
            if (jsonFiles.length > 0) {
                jsonFiles.forEach(file => {
                    console.log(chalk.cyan(`   📄 ${file}`));
                });
            } else {
                console.log(chalk.yellow('   Нет JSON файлов'));
            }

            console.log('');
            console.log(chalk.green('📁 CSV файлы:'));
            if (csvFiles.length > 0) {
                csvFiles.forEach(file => {
                    console.log(chalk.cyan(`   📊 ${file}`));
                });
            } else {
                console.log(chalk.yellow('   Нет CSV файлов'));
            }

        } catch (error) {
            console.log(chalk.red(`❌ Ошибка при чтении файлов: ${error.message}`));
        }

        await this.waitForEnter();
    }

    // Получение файлов в директории
    async getFilesInDirectory(dir) {
        try {
            const fs = require('fs').promises;
            const files = await fs.readdir(dir);
            return files.filter(file => file.endsWith('.json') || file.endsWith('.csv'));
        } catch (error) {
            return [];
        }
    }

    // Показ результатов парсинга
    showParseResults(results) {
        console.log('');
        console.log(chalk.green('📊 Результаты парсинга:'));
        console.log('');

        let totalProducts = 0;
        let successCount = 0;
        let errorCount = 0;

        Object.keys(results).forEach(categoryName => {
            const result = results[categoryName];
            if (result.error) {
                console.log(chalk.red(`❌ ${categoryName}: ${result.error}`));
                errorCount++;
            } else {
                console.log(chalk.green(`✅ ${categoryName}: ${result.count} товаров`));
                totalProducts += result.count;
                successCount++;
            }
        });

        console.log('');
        console.log(chalk.blue('📈 Итоговая статистика:'));
        console.log(chalk.cyan(`   Успешных категорий: ${successCount}`));
        console.log(chalk.red(`   Ошибок: ${errorCount}`));
        console.log(chalk.green(`   Всего товаров: ${totalProducts}`));
    }

    // Показ статистики товаров
    showProductStats(products) {
        console.log('');
        console.log(chalk.blue('📊 Статистика товаров:'));
        console.log(chalk.cyan(`   Всего товаров: ${products.length}`));
        
        if (products.length > 0) {
            const prices = products.filter(p => p.minPrice).map(p => p.minPrice);
            if (prices.length > 0) {
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
                
                console.log(chalk.cyan(`   Минимальная цена: ${minPrice} грн`));
                console.log(chalk.cyan(`   Максимальная цена: ${maxPrice} грн`));
                console.log(chalk.cyan(`   Средняя цена: ${avgPrice} грн`));
            }
        }
    }

    // Показ результатов производительности
    showPerformanceResults(results) {
        console.log('');
        console.log(chalk.green('📊 Результаты тестирования производительности:'));
        console.log('');

        results.results.forEach(result => {
            const color = result.speed > 10 ? chalk.green : result.speed > 5 ? chalk.yellow : chalk.red;
            console.log(color(`   Батч ${result.batchSize}: ${result.duration.toFixed(2)}с, ${result.productsCount} товаров, ${result.speed.toFixed(1)} товаров/с`));
        });

        console.log('');
        console.log(chalk.blue(`🏆 Оптимальный размер батча: ${results.optimal.batchSize} (${results.optimal.speed.toFixed(1)} товаров/с)`));
    }

    // Ожидание нажатия Enter
    async waitForEnter() {
        await inquirer.prompt([
            {
                type: 'input',
                name: 'enter',
                message: 'Нажмите Enter для продолжения...'
            }
        ]);
    }

    // Выход
    exit() {
        console.log(chalk.cyan('👋 До свидания!'));
        process.exit(0);
    }

    // Запуск CLI
    async run() {
        while (true) {
            this.showHeader();
            await this.showMainMenu();
        }
    }
}

// Запускаем CLI
if (require.main === module) {
    const cli = new HotlineCLI();
    cli.run().catch(console.error);
}

module.exports = HotlineCLI; 