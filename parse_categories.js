const fs = require('fs');
const path = require('path');

// Функция для извлечения названия категории из URL
function extractCategoryName(url) {
    // Извлекаем часть после /ua/ и убираем закрывающую скобку
    const match = url.match(/\/ua\/([^)]+)/);
    if (match) {
        return match[1];
    }
    return 'unknown';
}

// Функция для очистки названия файла от недопустимых символов
function sanitizeFileName(name) {
    return name.replace(/[<>:"/\\|?*]/g, '_');
}

// Основная функция парсинга
function parseCategories(inputFile) {
    try {
        // Читаем файл
        const content = fs.readFileSync(inputFile, 'utf8');
        const lines = content.split('\n');
        
        const categories = [];
        let currentCategory = null;
        let currentLinks = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Пропускаем пустые строки
            if (!line) continue;
            
            // Проверяем, является ли строка заголовком категории (начинается с (https://)
            if (line.startsWith('(https://')) {
                // Если у нас есть предыдущая категория, сохраняем её
                if (currentCategory && currentLinks.length > 0) {
                    categories.push({
                        name: currentCategory,
                        links: [...currentLinks]
                    });
                }
                
                // Начинаем новую категорию
                currentCategory = extractCategoryName(line);
                currentLinks = [];
            } else if (line.startsWith('https://') && currentCategory) {
                // Добавляем ссылку к текущей категории
                currentLinks.push(line);
            }
        }
        
        // Добавляем последнюю категорию
        if (currentCategory && currentLinks.length > 0) {
            categories.push({
                name: currentCategory,
                links: [...currentLinks]
            });
        }
        
        return categories;
        
    } catch (error) {
        console.error('Ошибка при чтении файла:', error.message);
        return [];
    }
}

// Функция для создания файлов категорий
function createCategoryFiles(categories, outputDir = 'categories') {
    // Создаем директорию для выходных файлов, если её нет
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    let createdCount = 0;
    
    categories.forEach(category => {
        try {
            const fileName = sanitizeFileName(category.name) + '.txt';
            const filePath = path.join(outputDir, fileName);
            
            // Создаем содержимое файла
            const content = category.links.join('\n');
            
            // Записываем файл
            fs.writeFileSync(filePath, content, 'utf8');
            
            console.log(`✓ Создан файл: ${fileName} (${category.links.length} ссылок)`);
            createdCount++;
            
        } catch (error) {
            console.error(`✗ Ошибка при создании файла для категории ${category.name}:`, error.message);
        }
    });
    
    return createdCount;
}

// Основная функция
function main() {
    const inputFile = 'pars/categories.txt';
    
    console.log('Начинаю парсинг файла категорий...');
    console.log(`Входной файл: ${inputFile}`);
    
    // Проверяем существование входного файла
    if (!fs.existsSync(inputFile)) {
        console.error(`Ошибка: Файл ${inputFile} не найден!`);
        return;
    }
    
    // Парсим категории
    const categories = parseCategories(inputFile);
    
    if (categories.length === 0) {
        console.log('Категории не найдены в файле.');
        return;
    }
    
    console.log(`\nНайдено категорий: ${categories.length}`);
    
    // Создаем файлы для каждой категории
    const createdCount = createCategoryFiles(categories);
    
    console.log(`\nГотово! Создано файлов: ${createdCount}`);
    
    // Выводим статистику
    console.log('\nСтатистика:');
    categories.forEach(category => {
        console.log(`- ${category.name}: ${category.links.length} ссылок`);
    });
}

// Запускаем скрипт
if (require.main === module) {
    main();
}

module.exports = { parseCategories, createCategoryFiles, extractCategoryName }; 