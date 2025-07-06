# Hotline.ua Parser

Парсер для сайта hotline.ua, который получает данные о товарах через GraphQL API.

## Установка

1. Установите зависимости:
```bash
npm install
```

## Использование

### Быстрый тест (10 товаров)
```bash
node simple-parser.js
```

### Полный парсинг всех товаров
```bash
node hotline-parser.js
```

### Использование в коде

```javascript
const HotlineParser = require('./hotline-parser');

const parser = new HotlineParser();

// Получить одну страницу товаров
const data = await parser.getProducts(1, 48);
const products = data.data.byPathSectionQueryProducts.collection;

// Получить все товары
const allProducts = await parser.getAllProducts();

// Сохранить в JSON
await parser.saveToFile(allProducts, 'products.json');

// Сохранить в CSV
await parser.saveToCSV(allProducts, 'products.csv');

// Фильтрация по цене
const filteredProducts = parser.filterByPrice(allProducts, 5000, 50000);

// Поиск по названию
const searchResults = parser.searchByName(allProducts, 'iPhone');
```

## Функциональность

### Основные методы

- `getProducts(page, itemsPerPage)` - получить товары с конкретной страницы
- `getAllProducts()` - получить все товары со всех страниц
- `saveToFile(products, filename)` - сохранить в JSON файл
- `saveToCSV(products, filename)` - сохранить в CSV файл

### Дополнительные методы

- `filterByPrice(products, minPrice, maxPrice)` - фильтрация по цене
- `searchByName(products, searchTerm)` - поиск по названию
- `getProductDetails(productId)` - получение деталей товара (заготовка)

## Получаемые данные

Для каждого товара парсер получает:

- ID товара
- Название
- Производитель
- Категория
- Минимальная и максимальная цена
- Количество предложений
- URL товара
- Ссылки на изображения
- Технические характеристики
- Количество отзывов и вопросов
- Информация о доставке
- И многое другое

## Настройки

В конструкторе `HotlineParser` можно изменить:

- `baseUrl` - URL GraphQL API
- `headers` - заголовки запросов
- `x-token` - токен авторизации
- `cityId` - ID города (по умолчанию 5394 - Киев)

## Выходные файлы

- `hotline-products.json` - полные данные в JSON формате
- `hotline-products.csv` - основные данные в CSV формате
- `test-products.json` - тестовые данные (10 товаров)

## Примечания

- Парсер использует задержку 1 секунда между запросами для избежания блокировки
- Все запросы отправляются с правильными заголовками для имитации браузера
- Данные сохраняются в UTF-8 кодировке
- CSV файл содержит экранированные кавычки для корректного отображения

## Возможные ошибки

1. **Сетевые ошибки** - проверьте интернет соединение
2. **Ошибки API** - возможно, изменился токен или структура API
3. **Ошибки записи файлов** - проверьте права доступа к папке

## Лицензия

ISC 