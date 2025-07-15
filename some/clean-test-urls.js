#!/usr/bin/env node

const fs = require('fs');

/**
 * Скрипт для извлечения только URL'ов из файла test-allurls.txt
 */

function extractUrls(inputFile, outputFile = null) {
    try {
        // Читаем содержимое файла
        const content = fs.readFileSync(inputFile, 'utf8');
        const lines = content.split('\n');
        
        const urls = new Set(); // Используем Set для автоматического удаления дубликатов
        
        // Регулярное выражение для поиска URL'ов
        const urlRegex = /https?:\/\/[^\s\[\]]+/g;
        
        lines.forEach((line, index) => {
            // Ищем все URL'ы в строке
            const foundUrls = line.match(urlRegex);
            
            if (foundUrls) {
                foundUrls.forEach(url => {
                    // Очищаем URL от лишних символов в конце
                    let cleanUrl = url.replace(/[:\]]+$/, '');
                    
                    // Убираем trailing слэш если он есть
                    if (cleanUrl.endsWith('/')) {
                        cleanUrl = cleanUrl.slice(0, -1);
                    }
                    
                    // Добавляем только валидные URL'ы
                    if (cleanUrl.startsWith('http')) {
                        urls.add(cleanUrl);
                    }
                });
            }
        });
        
        // Конвертируем Set в отсортированный массив
        const uniqueUrls = Array.from(urls).sort();
        
        console.log(`Найдено ${uniqueUrls.length} уникальных URL'ов`);
        
        // Формируем результат - каждый URL на новой строке
        const result = uniqueUrls.join('\n') + '\n';
        
        // Определяем выходной файл
        const finalOutputFile = outputFile || inputFile;
        
        // Записываем результат
        fs.writeFileSync(finalOutputFile, result, 'utf8');
        
        console.log(`URL'ы успешно сохранены в файл: ${finalOutputFile}`);
        console.log(`Примеры найденных URL'ов:`);
        uniqueUrls.slice(0, 10).forEach(url => console.log(`  ${url}`));
        
        if (uniqueUrls.length > 10) {
            console.log(`  ... и еще ${uniqueUrls.length - 10} URL'ов`);
        }
        
    } catch (error) {
        console.error('Ошибка при обработке файла:', error.message);
        process.exit(1);
    }
}

// Проверяем аргументы командной строки
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Использование:');
    console.log('  node clean-test-urls.js <входной_файл> [выходной_файл]');
    console.log('');
    console.log('Примеры:');
    console.log('  node clean-test-urls.js test-allurls.txt');
    console.log('  node clean-test-urls.js test-allurls.txt clean-urls.txt');
    console.log('');
    console.log('Если выходной файл не указан, результат будет записан в исходный файл.');
    process.exit(0);
}

const inputFile = args[0];
const outputFile = args[1];

// Проверяем существование входного файла
if (!fs.existsSync(inputFile)) {
    console.error(`Ошибка: Файл "${inputFile}" не найден`);
    process.exit(1);
}

// Запускаем извлечение URL'ов
extractUrls(inputFile, outputFile); 