#!/bin/bash

# Скрипт для создания резервной копии style.css и его удаления

echo "Создание резервной копии style.css..."
cp style.css style.css.backup

echo "Резервная копия создана: style.css.backup"
echo "Размер оригинального файла: $(du -h style.css | cut -f1)"
echo "Размер резервной копии: $(du -h style.css.backup | cut -f1)"

echo ""
echo "Удаление оригинального style.css..."
rm style.css

echo "Готово! Оригинальный style.css удален."
echo "Если нужно восстановить, используйте: cp style.css.backup style.css"
