#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Массив замен: [текст для поиска, текст для замены]
const replacements = [
    ['" class="m_b-10 navigation-block__title" data-v-23587d63><a href="', '\n___________'],
    ['</div></a></div></div></div><div class="navigation-block" data-v-23587d63 data-v-4c3420a9><div id="', '\n______________'],
    ['" class="text-x-lg col-xs-12" data-v-23587d63>', '___________'],
    ['<!----> <div class="blocks-container" data-v-4c3420a9><div class="navigation-block" data-v-23587d63 data-v-4c3420a9><div id="', '\n______________'],
    ['</a></div> <!----> <div class="catalog-links" data-v-23587d63><div class="section-navigation__item content" data-v-5a2f1b58 data-v-23587d63><a href="', ' '],
    ['" class="section-navigation__link link--black" data-v-5a2f1b58><img src=', '-----'],
    ['</div></a></div><div class="section-navigation__item content" data-v-5a2f1b58 data-v-23587d63><a href="', ' '],
    ['loading="lazy" data-v-5a2f1b58> <div class="section-navigation__link-text" data-v-5a2f1b58>', '-----'],
    ['', '']
];

/**
 * Заменяет указанные тексты в файле
 * @param {string} filePath - путь к файлу для обработки
 * @param {string} outputPath - путь для сохранения результата (опционально)
 */
function replaceTextInFile(filePath, outputPath = null) {
    try {
        // Проверяем существование файла
        if (!fs.existsSync(filePath)) {
            console.error(`Ошибка: файл ${filePath} не найден`);
            process.exit(1);
        }

        // Читаем файл
        let content = fs.readFileSync(filePath, 'utf8');
        
        console.log(`Обработка файла: ${filePath}`);
        
        // Выполняем все замены
        replacements.forEach(([textToReplace, replacementText], index) => {
            // Подсчитываем количество вхождений
            const matches = content.match(new RegExp(textToReplace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
            const matchCount = matches ? matches.length : 0;
            
            // Выполняем замену
            content = content.replace(new RegExp(textToReplace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacementText);
            
            console.log(`Замена ${index + 1}:`);
            console.log(`  Найдено вхождений: ${matchCount}`);
            console.log(`  Заменено "${textToReplace}" на "${replacementText}"`);
            
            if (matchCount > 0) {
                console.log(`  Пример: "${textToReplace}" → "${replacementText}"`);
            }
            console.log('');
        });
        
        // Определяем путь для сохранения
        const targetPath = outputPath || filePath;
        
        // Сохраняем результат
        fs.writeFileSync(targetPath, content, 'utf8');
        
        console.log(`✅ Все замены завершены и сохранены в: ${targetPath}`);
        
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

        console.log(`Найдено ${htmlFiles.length} HTML файлов для обработки\n`);
        
        htmlFiles.forEach((file, index) => {
            const filePath = path.join(directoryPath, file);
            console.log(`📁 Файл ${index + 1}/${htmlFiles.length}: ${file}`);
            replaceTextInFile(filePath);
            console.log('─'.repeat(50));
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
    console.log('  node replace_text.js <путь_к_файлу> [путь_для_сохранения]');
    console.log('  node replace_text.js --dir <путь_к_директории>');
    console.log('');
    console.log('Примеры:');
    console.log('  node replace_text.js catalogs/categories/123.html');
    console.log('  node replace_text.js catalogs/categories/123.html output.html');
    console.log('  node replace_text.js --dir catalogs/categories/');
    console.log('');
    console.log('Выполняемые замены:');
    replacements.forEach(([textToReplace, replacementText], index) => {
        console.log(`${index + 1}. "${textToReplace}" → "${replacementText}"`);
    });
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
    replaceTextInFile(filePath, outputPath);
} 