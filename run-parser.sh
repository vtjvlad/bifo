#!/bin/bash

# Скрипт для запуска парсера с правильными настройками SSL

echo "🚀 Запуск Hotline Parser с настройками SSL..."

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен!"
    exit 1
fi

# Проверяем наличие необходимых файлов
if [ ! -f "cli-parser-simple.js" ]; then
    echo "❌ Файл cli-parser-simple.js не найден!"
    exit 1
fi

# Запускаем парсер с настройками SSL
echo "✅ Запуск CLI парсера..."
node cli-parser-simple.js

echo "✅ Парсер завершен!" 