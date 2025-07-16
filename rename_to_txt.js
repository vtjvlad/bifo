#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Переименовывает HTML файлы в TXT
 * @param {string} directoryPath - путь к директории
 */
function renameHtmlToTxt(directoryPath) {
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

        console.log(`Найдено ${htmlFiles.length} HTML файлов для переименования\n`);
        
        let successCount = 0;
        let errorCount = 0;
        
        htmlFiles.forEach((file, index) => {
            const oldPath = path.join(directoryPath, file);
            const newFileName = file.replace(/\.html$/, '.txt');
            const newPath = path.join(directoryPath, newFileName);
            
            try {
                fs.renameSync(oldPath, newPath);
                console.log(`✅ ${index + 1}/${htmlFiles.length}: ${file} → ${newFileName}`);
                successCount++;
            } catch (error) {
                console.error(`❌ ${index + 1}/${htmlFiles.length}: Ошибка при переименовании ${file}: ${error.message}`);
                errorCount++;
            }
        });
        
        console.log('\n' + '─'.repeat(50));
        console.log(`📊 Результат:`);
        console.log(`   Успешно переименовано: ${successCount}`);
        console.log(`   Ошибок: ${errorCount}`);
        console.log(`   Всего файлов: ${htmlFiles.length}`);
        
    } catch (error) {
        console.error('Ошибка при обработке директории:', error.message);
        process.exit(1);
    }
}

/**
 * Переименовывает конкретный файл
 * @param {string} filePath - путь к файлу
 */
function renameSingleFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`Ошибка: файл ${filePath} не найден`);
            process.exit(1);
        }

        if (!filePath.endsWith('.html')) {
            console.error('Ошибка: файл должен иметь расширение .html');
            process.exit(1);
        }

        const directory = path.dirname(filePath);
        const fileName = path.basename(filePath);
        const newFileName = fileName.replace(/\.html$/, '.txt');
        const newPath = path.join(directory, newFileName);

        fs.renameSync(filePath, newPath);
        console.log(`✅ Файл успешно переименован:`);
        console.log(`   ${fileName} → ${newFileName}`);
        
    } catch (error) {
        console.error('Ошибка при переименовании файла:', error.message);
        process.exit(1);
    }
}

// Обработка аргументов командной строки
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Использование:');
    console.log('  node rename_to_txt.js <путь_к_файлу.html>');
    console.log('  node rename_to_txt.js --dir <путь_к_директории>');
    console.log('');
    console.log('Примеры:');
    console.log('  node rename_to_txt.js catalogs/auto.html');
    console.log('  node rename_to_txt.js --dir catalogs/');
    process.exit(0);
}

if (args[0] === '--dir') {
    if (args.length < 2) {
        console.error('Ошибка: укажите путь к директории после --dir');
        process.exit(1);
    }
    renameHtmlToTxt(args[1]);
} else {
    renameSingleFile(args[0]);
} 