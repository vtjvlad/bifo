#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Создаем интерфейс для чтения ввода пользователя
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Функция для получения ввода от пользователя
function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

// Функция для проверки существования директории
function directoryExists(dirPath) {
    try {
        return fs.statSync(dirPath).isDirectory();
    } catch (error) {
        return false;
    }
}

// Функция для получения размера файла в байтах
function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.size;
    } catch (error) {
        return 0;
    }
}

// Функция для рекурсивного поиска файлов размером 4KB
function findFiles4KB(directory, files = []) {
    try {
        const items = fs.readdirSync(directory);
        
        for (const item of items) {
            const fullPath = path.join(directory, item);
            
            try {
                const stats = fs.statSync(fullPath);
                
                if (stats.isDirectory()) {
                    // Рекурсивно ищем в поддиректориях
                    findFiles4KB(fullPath, files);
                } else if (stats.isFile()) {
                    // Проверяем размер файла (примерно 4KB: от 3072 до 4096 байт)
                    // Это соответствует команде find -size 4k
                    if (stats.size >= 4096 && stats.size <= 10000) {
                        files.push({
                            name: item,
                            path: fullPath,
                            size: stats.size
                        });
                    }
                }
            } catch (error) {
                // Пропускаем файлы, к которым нет доступа
                console.log(`⚠️  Не удалось получить доступ к: ${fullPath}`);
            }
        }
    } catch (error) {
        console.log(`❌ Ошибка при чтении директории: ${directory}`);
    }
    
    return files;
}

// Функция для сохранения результатов в файл
function saveResultsToFile(files, outputFile) {
    try {
        const content = files.map(file => file.name).join('\n');
        fs.writeFileSync(outputFile, content, 'utf8');
        return true;
    } catch (error) {
        console.error(`❌ Ошибка при сохранении файла: ${error.message}`);
        return false;
    }
}

// Основная функция
async function main() {
    console.log('🔍 Поиск файлов размером ~4 килобайта');
    console.log('=====================================\n');
    
    // Запрашиваем исходную директорию
    let sourceDir = await askQuestion('Введите путь к исходной директории (или нажмите Enter для текущей директории): ');
    
    if (!sourceDir) {
        sourceDir = process.cwd();
    }
    
    // Проверяем существование директории
    if (!directoryExists(sourceDir)) {
        console.log(`❌ Директория не существует: ${sourceDir}`);
        rl.close();
        return;
    }
    
    console.log(`\n📁 Поиск в директории: ${sourceDir}`);
    console.log('⏳ Поиск файлов...\n');
    
    // Ищем файлы размером 4KB
    const files = findFiles4KB(sourceDir);
    
    if (files.length === 0) {
        console.log('❌ Файлы размером ~4 килобайта не найдены.');
        rl.close();
        return;
    }
    
    console.log(`✅ Найдено файлов размером ~4KB: ${files.length}\n`);
    
    // Показываем первые 10 файлов
    console.log('📋 Первые 10 найденных файлов:');
    files.slice(0, 10).forEach((file, index) => {
        console.log(`${index + 1}. ${file.name} (${file.path})`);
    });
    
    if (files.length > 10) {
        console.log(`... и еще ${files.length - 10} файлов`);
    }
    
    // Запрашиваем имя выходного файла
    const outputFile = await askQuestion('\nВведите имя файла для сохранения результатов (по умолчанию: files_4kb.txt): ');
    const finalOutputFile = outputFile || 'files_4kb.txt';
    
    // Сохраняем результаты
    if (saveResultsToFile(files, finalOutputFile)) {
        console.log(`\n✅ Результаты сохранены в файл: ${finalOutputFile}`);
        console.log(`📊 Всего сохранено файлов: ${files.length}`);
    }
    
    rl.close();
}

// Обработка ошибок
process.on('uncaughtException', (error) => {
    console.error('❌ Неожиданная ошибка:', error.message);
    rl.close();
    process.exit(1);
});

// Запускаем скрипт
main().catch((error) => {
    console.error('❌ Ошибка:', error.message);
    rl.close();
    process.exit(1);
}); 