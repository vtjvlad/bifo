# Миграция категорий продуктов

## Обзор изменений

Обновлена схема продукта для правильной работы с категориями товаров. Теперь каждый продукт имеет четкую структуру категорий:

### Новая структура поля `section`:

```javascript
section: {
    _id: Number,                    // ID секции
    productCategoryName: String,    // Человекочитаемое название категории
    category: String,               // Код категории (например: "bt-elektrochajniki")
    subCategory: String,            // Подкатегория товара
    __typename: "Section"
}
```

### Логика категорий:

- **`section.category`** - содержит код категории в формате `bt-{название}`
  - Примеры: `bt-elektrochajniki`, `bt-aksessuary-dlya-vytyazhek`
  - Первая часть до дефиса - это название каталога
  - Все после дефиса - название категории

- **`section.subCategory`** - содержит подкатегорию товара
  - Примеры: `iphone`, `galaxy`, `electric-kettles`

- **`section.productCategoryName`** - человекочитаемое название категории
  - Примеры: "Смартфоны", "Электрические чайники"

## Виртуальные поля

Добавлены виртуальные поля для удобного доступа к категориям:

- **`catalogName`** - название каталога (первая часть до дефиса)
- **`categoryName`** - название категории (все после первого дефиса)

## Новые API endpoints

### Фильтрация по категориям:

```javascript
// Поиск по категории
GET /api/products?category=bt-smartphones

// Поиск по подкатегории
GET /api/products?subCategory=iphone

// Поиск по секции (productCategoryName)
GET /api/products?section=Смартфоны
```

### Новые маршруты:

```javascript
// Продукты по категории
GET /api/products/category/:category

// Продукты по подкатегории
GET /api/products/subcategory/:subCategory

// Статистика по категориям
GET /api/products/stats/categories
```

## Миграция существующих данных

### 1. Запуск миграции:

```bash
node migrate-categories.js
```

Этот скрипт:
- Найдет все продукты без полей `category` и `subCategory`
- Автоматически создаст эти поля на основе `productCategoryName`
- Создаст необходимые индексы для оптимизации

### 2. Проверка результатов:

```bash
node test-updated-schema.js
```

Этот скрипт проверит:
- Создание продуктов с новой схемой
- Поиск по категориям
- Агрегацию по категориям
- Виртуальные поля

## Обновленные файлы

### Backend:
- `models/Product.js` - обновленная схема с новыми полями
- `routes/products.js` - новые маршруты для работы с категориями
- `seed-products.js` - обновленные тестовые данные
- `test-updated-schema.js` - расширенные тесты

### Frontend:
- `public/js/catalog.js` - обновлен для отображения новых полей категорий

### Утилиты:
- `migrate-categories.js` - скрипт миграции существующих данных

## Примеры использования

### Создание продукта:

```javascript
const product = new Product({
    id: 12345,
    title: "Электрический чайник",
    section: {
        _id: 1,
        productCategoryName: "Электрические чайники",
        category: "bt-elektrochajniki",
        subCategory: "electric-kettles",
        __typename: "Section"
    },
    // ... остальные поля
});
```

### Поиск по категориям:

```javascript
// Поиск всех смартфонов
const smartphones = await Product.find({
    'section.category': 'bt-smartphones'
});

// Поиск iPhone
const iphones = await Product.find({
    'section.subCategory': 'iphone'
});

// Поиск по названию категории
const kettles = await Product.find({
    'section.productCategoryName': { $regex: 'чайник', $options: 'i' }
});
```

### Использование виртуальных полей:

```javascript
const product = await Product.findOne({ id: 12345 });
console.log(product.catalogName);    // "bt"
console.log(product.categoryName);   // "elektrochajniki"
```

## Индексы

Созданы индексы для оптимизации запросов:

```javascript
productSchema.index({ 'section.category': 1 });
productSchema.index({ 'section.subCategory': 1 });
productSchema.index({ 'section.category': 1, 'section.subCategory': 1 });
```

## Обратная совместимость

Все существующие запросы продолжают работать:
- `section.productCategoryName` - для поиска по названию категории
- `vendor.title` - для поиска по производителю
- `section._id` - для поиска по ID секции

Новые поля являются дополнительными и не нарушают существующую функциональность. 