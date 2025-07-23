const fs = require('fs');
const path = require('path');

// Функция для извлечения URL из JSON файла
function extractUrlsFromJson(inputFile, outputFile) {
    try {
        // Читаем JSON файл
        console.log(`Читаем файл: ${inputFile}`);
        const jsonData = fs.readFileSync(inputFile, 'utf8');
        const data = JSON.parse(jsonData);
        
        let urls = [];
        
        // Проверяем, является ли data массивом
        if (Array.isArray(data)) {
            urls = data
                .filter(item => item && typeof item === 'object' && item.url)
                .map(item => item.url);
        } 
        // Если data - объект, ищем массив внутри него
        else if (typeof data === 'object' && data !== null) {
            // Ищем массив в корне объекта
            for (const key in data) {
                if (Array.isArray(data[key])) {
                    urls = data[key]
                        .filter(item => item && typeof item === 'object' && item.url)
                        .map(item => item.url);
                    if (urls.length > 0) break;
                }
            }
        }
        
        if (urls.length === 0) {
            console.log('URL не найдены в файле');
            return;
        }
        
        // Сохраняем URL в текстовый файл
        const urlText = urls.join('\n');
        fs.writeFileSync(outputFile, urlText, 'utf8');
        
        console.log(`Найдено ${urls.length} URL`);
        console.log(`URL сохранены в файл: ${outputFile}`);
        
        // Показываем первые несколько URL для проверки
        console.log('\nПервые 5 URL:');
        urls.slice(0, 5).forEach((url, index) => {
            console.log(`${index + 1}. ${url}`);
        });
        
    } catch (error) {
        console.error('Ошибка:', error.message);
    }
}

// Получаем аргументы командной строки
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Использование: node extract-urls.js <input-json-file> [output-txt-file]');
    console.log('Пример: node extract-urls.js JSON/hotline-mobilnye-telefony-i-smartfony.json urls.txt');
    process.exit(1);
}

const inputFile = args[0];
let outputFile = args[1] || 'extracted-urls.txt';

// Проверяем существование входного файла
if (!fs.existsSync(inputFile)) {
    console.error(`Файл не найден: ${inputFile}`);
    process.exit(1);
}

// Запускаем извлечение URL
extractUrlsFromJson(inputFile, outputFile); 