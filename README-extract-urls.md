# Скрипт для извлечения URL из JSON файлов

Этот скрипт извлекает значения поля 'url' из JSON файлов и сохраняет их в текстовый файл, где каждое значение находится на новой строке.

## Использование

```bash
node extract-urls.js <input-json-file> [output-txt-file]
```

### Параметры:
- `input-json-file` - путь к JSON файлу (обязательный)
- `output-txt-file` - путь к выходному текстовому файлу (необязательный, по умолчанию: `extracted-urls.txt`)

### Примеры:

1. Извлечь URL из файла мобильных телефонов:
```bash
node extract-urls.js JSON/hotline-mobilnye-telefony-i-smartfony.json mobile-urls.txt
```

2. Извлечь URL из файла ноутбуков:
```bash
node extract-urls.js JSON/hotline-noutbuki-netbuki.json laptop-urls.txt
```

3. Извлечь URL из файла всех продуктов:
```bash
node extract-urls.js JSON/hotline-products.json all-urls.txt
```

4. Извлечь URL из файла всех категорий:
```bash
node extract-urls.js JSON/hotline-all-categories-report.json categories-urls.txt
```

## Как работает скрипт

1. Читает JSON файл
2. Ищет массив объектов с полем 'url'
3. Извлекает все значения поля 'url'
4. Сохраняет их в текстовый файл, каждое значение на новой строке
5. Показывает статистику и первые 5 URL для проверки

## Поддерживаемые форматы JSON

Скрипт работает с двумя форматами:

1. **Прямой массив объектов:**
```json
[
  {"url": "/product1/", "name": "Product 1"},
  {"url": "/product2/", "name": "Product 2"}
]
```

2. **Объект с массивом внутри:**
```json
{
  "data": [
    {"url": "/product1/", "name": "Product 1"},
    {"url": "/product2/", "name": "Product 2"}
  ]
}
```

## Результат

Скрипт создает текстовый файл с URL, каждое значение на отдельной строке:

```
/product1/
/product2/
/product3/
...
```

## Требования

- Node.js (уже установлен в проекте)
- JSON файл с массивом объектов, содержащих поле 'url' 