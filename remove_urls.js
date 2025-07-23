const fs = require('fs');
const path = require('path');

// Функция для извлечения последнего сегмента пути из URL
function extractLastSegment(filePath, regexPattern) {
    try {
        // Читаем файл
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Разбиваем на строки
        const lines = content.split('\n');
        
        console.log(`Обрабатываю файл: ${filePath} (${lines.length} строк)`);
        
        // Извлекаем последний сегмент пути из URL
        const processedLines = lines.map((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine === '') return '';
            
            // Ищем совпадение с регулярным выражением
            const match = trimmedLine.match(regexPattern);
            if (match) {
                // Извлекаем последний сегмент пути
                const urlParts = trimmedLine.split('/');
                const lastSegment = urlParts[urlParts.length - 1];
                console.log(`  Строка ${index + 1}: '${trimmedLine}' => '${lastSegment}'`);
                return lastSegment;
            }
            
            return trimmedLine;
        });
        
        // Записываем обратно в файл
        const newContent = processedLines.join('\n');
        fs.writeFileSync(filePath, newContent, 'utf8');
        
        console.log(`  Файл ${path.basename(filePath)} успешно обработан!\n`);
        return true;
    } catch (error) {
        console.error(`Ошибка при обработке файла ${filePath}:`, error.message);
        return false;
    }
}

// Функция для обработки всех файлов в папке
function processDirectory(directoryPath, regexPattern) {
    try {
        // Проверяем существование папки
        if (!fs.existsSync(directoryPath)) {
            console.error(`Папка не найдена: ${directoryPath}`);
            return false;
        }
        
        // Получаем список файлов в папке
        const files = fs.readdirSync(directoryPath);
        
        if (files.length === 0) {
            console.log(`Папка ${directoryPath} пуста`);
            return true;
        }
        
        console.log(`Найдено файлов в папке: ${files.length}`);
        console.log('=' * 50);
        
        let processedCount = 0;
        let errorCount = 0;
        
        // Обрабатываем каждый файл
        files.forEach(file => {
            const filePath = path.join(directoryPath, file);
            const stats = fs.statSync(filePath);
            
            // Обрабатываем только файлы (не папки)
            if (stats.isFile()) {
                const success = extractLastSegment(filePath, regexPattern);
                if (success) {
                    processedCount++;
                } else {
                    errorCount++;
                }
            }
        });
        
        console.log('=' * 50);
        console.log(`Обработка завершена!`);
        console.log(`Успешно обработано: ${processedCount} файлов`);
        if (errorCount > 0) {
            console.log(`Ошибок: ${errorCount} файлов`);
        }
        
        return true;
    } catch (error) {
        console.error('Ошибка при обработке папки:', error.message);
        return false;
    }
}

// Основная функция
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Использование: node remove_urls.js <путь_к_папке>');
        console.log('Пример: node remove_urls.js categories/');
        console.log('Пример: node remove_urls.js ./categories');
        return;
    }
    
    const directoryPath = args[0];
    
    // Регулярное выражение для поиска URL с ровно тремя сегментами пути
    const regex = /https:\/\/[^\/]+\/[^\/]+\/[^\/]+\/[^\/]+/;
    
    console.log(`Обрабатываю папку: ${directoryPath}`);
    console.log(`Регулярное выражение: ${regex}`);
    console.log('');
    
    const success = processDirectory(directoryPath, regex);
    
    if (!success) {
        console.log('Произошла ошибка при обработке папки.');
    }
}

// Запускаем скрипт
if (require.main === module) {
    main();
}

module.exports = { extractLastSegment, processDirectory }; 