#!/usr/bin/env node

const fs = require('fs');

/**
 * Скрипт для извлечения ссылок на категории из файла с URL'ами
 */

function extractCategories(inputFile, outputFile = 'categories.txt') {
    try {
        // Читаем содержимое файла
        const content = fs.readFileSync(inputFile, 'utf8');
        const lines = content.split('\n');
        
        const categories = new Set();
        const urlRegex = /https?:\/\/[^\s\[\]]+/g;
        
        lines.forEach((line) => {
            // Ищем все URL'ы в строке
            const foundUrls = line.match(urlRegex);
            
            if (foundUrls) {
                foundUrls.forEach(url => {
                    // Очищаем URL от лишних символов
                    let cleanUrl = url.replace(/[:\]]+$/, '');
                    
                    // Проверяем, является ли это ссылкой на категорию
                    if (isCategory(cleanUrl)) {
                        categories.add(cleanUrl);
                    }
                });
            }
        });
        
        // Конвертируем Set в отсортированный массив
        const uniqueCategories = Array.from(categories).sort();
        
        console.log(`Найдено ${uniqueCategories.length} уникальных категорий`);
        
        // Формируем результат
        const result = uniqueCategories.join('\n') + '\n';
        
        // Записываем результат
        fs.writeFileSync(outputFile, result, 'utf8');
        
        console.log(`Категории сохранены в файл: ${outputFile}`);
        console.log(`\nНайденные категории:`);
        uniqueCategories.forEach(category => {
            console.log(`  ${category}`);
        });
        
    } catch (error) {
        console.error('Ошибка при обработке файла:', error.message);
        process.exit(1);
    }
}

/**
 * Определяет, является ли URL ссылкой на категорию
 */
function isCategory(url) {
    try {
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        
        // Паттерны для категорий hotline.ua
        const categoryPatterns = [
            // Основные категории типа /ua/mobile/, /ua/computer/ и т.д.
            /^\/ua\/[a-zA-Z_-]+\/?$/,
            
            // Категории без /ua/ типа /mobile/, /computer/
            /^\/[a-zA-Z_-]+\/?$/,
            
            // Подкатегории первого уровня типа /ua/mobile/mobilnye-telefony/
            /^\/ua\/[a-zA-Z_-]+\/[a-zA-Z_-]+\/?$/
        ];
        
        // Исключаем статические ресурсы и специальные страницы
        const excludePatterns = [
            /\/img\//,
            /\/frontend\//,
            /\/static\//,
            /\/public\//,
            /\.(js|css|png|jpg|jpeg|gif|svg|ico|xml|json)$/,
            /\/robots\.txt/,
            /\/manifest\.json/,
            /\/favicon/,
            /\/login/,
            /\/register/,
            /\/help/,
            /\/page\//,
            /\/reviews\//,
            /\/guides/,
            /\/form/,
            /\/about/,
            /\/feedback/,
            /\/vendors/,
            /\/place-ad/,
            // Исключаем конкретные товары (содержат цифры или длинные пути)
            /\/[a-zA-Z-]+-\d+/,
            /\/\d+/,
            /-\d{6,}/
        ];
        
        // Проверяем исключения
        for (const pattern of excludePatterns) {
            if (pattern.test(path) || pattern.test(url)) {
                return false;
            }
        }
        
        // Проверяем соответствие паттернам категорий
        for (const pattern of categoryPatterns) {
            if (pattern.test(path)) {
                return true;
            }
        }
        
        return false;
        
    } catch (error) {
        return false;
    }
}

// Проверяем аргументы командной строки
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Использование:');
    console.log('  node extract-categories.js <входной_файл> [выходной_файл]');
    console.log('');
    console.log('Примеры:');
    console.log('  node extract-categories.js test-allurls.txt');
    console.log('  node extract-categories.js test-allurls.txt categories.txt');
    console.log('  node extract-categories.js clean-urls.txt my-categories.txt');
    console.log('');
    console.log('По умолчанию результат сохраняется в файл categories.txt');
    process.exit(0);
}

const inputFile = args[0];
const outputFile = args[1] || 'categories.txt';

// Проверяем существование входного файла
if (!fs.existsSync(inputFile)) {
    console.error(`Ошибка: Файл "${inputFile}" не найден`);
    process.exit(1);
}

// Запускаем извлечение категорий
extractCategories(inputFile, outputFile); 