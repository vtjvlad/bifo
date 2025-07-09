# Простой парсер Hotline.ua

Простой парсер для получения предложений товаров с сайта Hotline.ua на основе GraphQL API.

## Возможности

- ✅ Получение предложений товаров через GraphQL API
- ✅ Парсинг информации о магазинах, ценах, условиях
- ✅ Сохранение результатов в JSON и CSV форматах
- ✅ Обработка ошибок и повторные попытки
- ✅ Генерация уникальных request-id для каждого запроса

## Установка

Убедитесь, что у вас установлены необходимые зависимости:

```bash
npm install axios
```

## Использование

### Базовое использование

```javascript
const HotlineParser = require('./simple-hotline-parser');

const parser = new HotlineParser();

// Парсим один продукт
const offers = await parser.parseProduct('samsung-galaxy-s21-fe-5g-6128gb-lavender-sm-g990blvd');
```

### Запуск примера

```bash
# Запуск основного парсера
node simple-hotline-parser.js

# Запуск примера с несколькими продуктами
node example-usage-simple.js
```

## Структура данных

Каждое предложение содержит следующие поля:

```javascript
{
    id: "уникальный_идентификатор",
    firmTitle: "Название магазина",
    price: 15000, // Цена в гривнах
    condition: "Новый", // Состояние товара
    description: "Краткое описание",
    guarantee: "Гарантия производителя", // Тип гарантии
    delivery: "Новая Почта", // Способ доставки
    hasFreeDelivery: false, // Бесплатная доставка
    conversionUrl: "https://...", // Ссылка на товар
    reviews: {
        positive: 15, // Количество положительных отзывов
        negative: 2   // Количество отрицательных отзывов
    }
}
```

## Методы класса HotlineParser

### `parseProduct(productPath, cityId = 5394)`
Основной метод для парсинга продукта.

**Параметры:**
- `productPath` (string) - путь к продукту (например, 'samsung-galaxy-s21-fe-5g-6128gb-lavender-sm-g990blvd')
- `cityId` (number) - ID города (по умолчанию 5394 - Киев)

**Возвращает:** массив предложений

### `getOffers(productPath, cityId)`
Получает сырые данные от API.

### `parseOffers(data)`
Парсит сырые данные в удобный формат.

### `saveToJson(data, filename)`
Сохраняет данные в JSON файл.

### `saveToCsv(offers, filename)`
Сохраняет данные в CSV файл.

## Примеры файлов

### JSON файл
```json
{
  "productPath": "samsung-galaxy-s21-fe-5g-6128gb-lavender-sm-g990blvd",
  "offers": [
    {
      "id": "12345",
      "firmTitle": "Магазин Техники",
      "price": 15000,
      "condition": "Новый",
      "description": "Samsung Galaxy S21 FE 5G",
      "guarantee": "Гарантия производителя",
      "delivery": "Новая Почта",
      "hasFreeDelivery": false,
      "conversionUrl": "https://...",
      "reviews": {
        "positive": 15,
        "negative": 2
      }
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### CSV файл
```csv
ID,Магазин,Цена,Состояние,Описание,Гарантия,Доставка,Бесплатная доставка,Положительные отзывы,Отрицательные отзывы,Ссылка
12345,"Магазин Техники",15000,"Новый","Samsung Galaxy S21 FE 5G","Гарантия производителя","Новая Почта",Нет,15,2,"https://..."
```

## Настройка

### Изменение города
```javascript
const parser = new HotlineParser();
const offers = await parser.parseProduct('product-path', 5394); // Киев
```

### Изменение заголовков запроса
```javascript
const parser = new HotlineParser();
parser.headers['x-token'] = 'ваш-новый-токен';
```

## Обработка ошибок

Парсер автоматически обрабатывает ошибки и выводит информативные сообщения:

- Ошибки сети
- Неверные пути к продуктам
- Проблемы с API
- Ошибки сохранения файлов

## Ограничения

- Токен может устареть и потребовать обновления
- API может иметь ограничения на количество запросов
- Некоторые продукты могут быть недоступны

## Обновление токена

Если получаете ошибки авторизации, обновите токен в конструкторе класса:

```javascript
this.headers = {
    // ... другие заголовки
    'x-token': 'новый-токен-здесь'
};
```

## Лицензия

ISC 