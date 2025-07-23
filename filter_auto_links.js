#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Регулярное выражение для поиска ссылок на авто
const autoLinkRegex = /href\s*=\s*["']\/ua\/[^\/]+\/[^\/]+(?:\/\d+)?\/?["']/;

/**
 * Фильтрует файл, оставляя только строки с совпадениями по регулярному выражению
 * @param {string} filePath - путь к файлу для обработки
 * @param {string} outputPath - путь для сохранения результата (опционально)
 */
function filterFileByRegex(filePath, outputPath = null) {
    try {
        // Проверяем существование файла
        if (!fs.existsSync(filePath)) {
            console.error(`Ошибка: файл ${filePath} не найден`);
            process.exit(1);
        }

        // Читаем файл
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Разбиваем на строки, учитывая возможные длинные строки без переносов
        let lines = content.split('\n');
        
        // Если файл содержит очень длинные строки, разбиваем их на более мелкие части
        const processedLines = [];
        for (let line of lines) {
            if (line.length > 1000) {
                // Разбиваем длинные строки на части по тегам
                const parts = line.split(/(<\/?[^>]+>)/);
                let currentPart = '';
                
                for (let part of parts) {
                    if (currentPart.length + part.length > 500) {
                        if (currentPart.trim()) {
                            processedLines.push(currentPart.trim());
                        }
                        currentPart = part;
                    } else {
                        currentPart += part;
                    }
                }
                
                if (currentPart.trim()) {
                    processedLines.push(currentPart.trim());
                }
            } else {
                processedLines.push(line);
            }
        }
        
        // Фильтруем строки
        const filteredLines = processedLines.filter(line => {
            return line.trim() && autoLinkRegex.test(line);
        });

        // Определяем путь для сохранения
        const targetPath = outputPath || filePath;
        
        // Сохраняем результат
        const result = filteredLines.join('\n');
        fs.writeFileSync(targetPath, result, 'utf8');
        
        console.log(`Обработка завершена:`);
        console.log(`- Исходный файл: ${filePath}`);
        console.log(`- Обработано строк: ${processedLines.length}`);
        console.log(`- Сохранено строк: ${filteredLines.length}`);
        console.log(`- Удалено строк: ${processedLines.length - filteredLines.length}`);
        console.log(`- Результат сохранен в: ${targetPath}`);
        
        // Показываем примеры найденных ссылок
        if (filteredLines.length > 0) {
            console.log('\nПримеры найденных ссылок:');
            filteredLines.slice(0, 3).forEach((line, index) => {
                const match = line.match(autoLinkRegex);
                if (match) {
                    console.log(`${index + 1}. ${match[0]}`);
                }
            });
        }
        
    } catch (error) {
        console.error('Ошибка при обработке файла:', error.message);
        process.exit(1);
    }
}

/**
 * Обрабатывает все HTML файлы в указанной директории
 * @param {string} directoryPath - путь к директории
 */
function processDirectory(directoryPath) {
    try {
        if (!fs.existsSync(directoryPath)) {
            console.error(`Ошибка: директория ${directoryPath} не найдена`);
            process.exit(1);
        }

        const files = fs.readdirSync(directoryPath);
        const htmlFiles = files.filter(file => file.endsWith('.html'));
        
        if (htmlFiles.length === 0) {
            console.log('HTML файлы не найдены в указанной директории');
            return;
        }

        console.log(`Найдено ${htmlFiles.length} HTML файлов для обработки`);
        
        htmlFiles.forEach(file => {
            const filePath = path.join(directoryPath, file);
            console.log(`\nОбрабатываю файл: ${file}`);
            filterFileByRegex(filePath);
        });
        
    } catch (error) {
        console.error('Ошибка при обработке директории:', error.message);
        process.exit(1);
    }
}

// Обработка аргументов командной строки
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Использование:');
    console.log('  node filter_auto_links.js <путь_к_файлу> [путь_для_сохранения]');
    console.log('  node filter_auto_links.js --dir <путь_к_директории>');
    console.log('');
    console.log('Примеры:');
    console.log('  node filter_auto_links.js catalogs/categories/123.html');
    console.log('  node filter_auto_links.js catalogs/categories/123.html output.html');
    console.log('  node filter_auto_links.js --dir catalogs/categories/');
    process.exit(0);
}

if (args[0] === '--dir') {
    if (args.length < 2) {
        console.error('Ошибка: укажите путь к директории после --dir');
        process.exit(1);
    }
    processDirectory(args[1]);
} else {
    const filePath = args[0];
    const outputPath = args[1] || null;
    filterFileByRegex(filePath, outputPath);
} 