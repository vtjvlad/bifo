#!/bin/bash

# Скрипт для извлечения URL из JSON файлов
# Использование: ./extract-urls.sh <input-json-file> [output-txt-file]

if [ $# -eq 0 ]; then
    echo "Использование: $0 <input-json-file> [output-txt-file]"
    echo "Пример: $0 JSON/hotline-mobilnye-telefony-i-smartfony.json mobile-urls.txt"
    exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="${2:-extracted-urls.txt}"

# Проверяем существование входного файла
if [ ! -f "$INPUT_FILE" ]; then
    echo "Ошибка: Файл '$INPUT_FILE' не найден"
    exit 1
fi

# Проверяем, что это JSON файл
if [[ ! "$INPUT_FILE" =~ \.json$ ]]; then
    echo "Предупреждение: Файл '$INPUT_FILE' не имеет расширения .json"
fi

echo "Извлекаем URL из файла: $INPUT_FILE"
echo "Результат будет сохранен в: $OUTPUT_FILE"
echo ""

# Запускаем Node.js скрипт
node extract-urls.js "$INPUT_FILE" "$OUTPUT_FILE"

# Проверяем результат
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Извлечение завершено успешно!"
    echo "📁 Файл создан: $OUTPUT_FILE"
    
    # Показываем количество строк в выходном файле
    if [ -f "$OUTPUT_FILE" ]; then
        LINE_COUNT=$(wc -l < "$OUTPUT_FILE")
        echo "📊 Количество URL: $LINE_COUNT"
    fi
else
    echo ""
    echo "❌ Ошибка при извлечении URL"
    exit 1
fi 