#!/bin/bash

# Hotline Parser CLI Launcher
echo "🚀 Запуск Hotline Parser CLI..."

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен!"
    echo "Установите Node.js с https://nodejs.org/"
    exit 1
fi

# Проверяем наличие необходимых файлов
if [ ! -f "cli-parser.js" ]; then
    echo "❌ Файл cli-parser.js не найден!"
    exit 1
fi

if [ ! -f "hotline-parser.js" ]; then
    echo "❌ Файл hotline-parser.js не найден!"
    exit 1
fi

# Запускаем CLI
echo "✅ Запуск CLI интерфейса..."
node cli-parser.js 