# Инструкция по обновлению категорий для поиска товаров

## Проблема
Товары не отображаются на страницах категорий, потому что:
- В товарах поле `section.category` содержит полный путь (например, `"bt-elektrochajniki"`)
- В каталогах slug категории содержит только часть пути (например, `"elektrochajniki"`)
- API не может найти соответствие между ними

## Решение
Добавлено поле `productSearchField` в модель категорий, которое содержит точное значение для поиска товаров.

## Что было изменено

### 1. Модель Catalog (`models/Catalog.js`)
Добавлено поле:
```javascript
productSearchField: {
    type: String,
    trim: true
}
```

### 2. API маршрут (`routes/products.js`)
Обновлена логика поиска товаров:
- Сначала ищет категорию по slug
- Если у категории есть `productSearchField`, использует его для поиска товаров
- Ищет товары где `section.category` равно `productSearchField`

### 3. Скрипт init-catalogs (`scripts/init-catalogs.js`)
Обновлен для автоматического создания `productSearchField` при создании новых категорий:
```javascript
productSearchField: `${catalogSlug}-${categorySlug}`
```

### 4. Скрипт обновления (`update-categories.js`)
Создан для обновления существующих категорий.

## Как применить изменения

### Шаг 1: Обновить существующие категории
```bash
node update-categories.js
```

### Шаг 2: Перезапустить сервер
```bash
npm start
```

### Шаг 3: Проверить работу
Откройте страницу категории и убедитесь, что товары отображаются.

## Пример работы

### До изменений:
- Категория slug: `"elektrochajniki"`
- Товар section.category: `"bt-elektrochajniki"`
- Результат: ❌ Товары не найдены

### После изменений:
- Категория slug: `"elektrochajniki"`
- Категория productSearchField: `"bt-elektrochajniki"`
- Товар section.category: `"bt-elektrochajniki"`
- Результат: ✅ Товары найдены

## Структура данных

### Категория в базе:
```json
{
  "name": "Электрочайники",
  "slug": "elektrochajniki",
  "catalogSlug": "bt",
  "productSearchField": "bt-elektrochajniki"
}
```

### Товар в базе:
```json
{
  "title": "RKT90-G",
  "section": {
    "category": "bt-elektrochajniki"
  }
}
```

## Проверка

### 1. Проверить обновление категорий:
```bash
node update-categories.js
```

### 2. Проверить API:
```bash
curl "http://localhost:3000/api/products/catalog/bt/group/bt/category/elektrochajniki"
```

### 3. Проверить страницу:
```
http://localhost:3000/category.html?catalog=bt&group=bt&category=elektrochajniki
```

## Возможные проблемы

### 1. Категории не обновились
- Проверьте подключение к базе данных
- Убедитесь, что скрипт `update-categories.js` выполнился без ошибок

### 2. Товары все еще не отображаются
- Проверьте консоль сервера на наличие ошибок
- Убедитесь, что `productSearchField` создался правильно
- Проверьте, что товары действительно имеют поле `section.category`

### 3. Неправильные значения productSearchField
- Проверьте логику создания в `init-catalogs.js`
- Убедитесь, что формат соответствует структуре товаров

## Дополнительные улучшения

### 1. Добавить индексы для производительности:
```javascript
catalogSchema.index({ productSearchField: 1 });
```

### 2. Добавить валидацию:
```javascript
productSearchField: {
    type: String,
    trim: true,
    validate: {
        validator: function(v) {
            return v && v.length > 0;
        },
        message: 'ProductSearchField is required for categories'
    }
}
```

### 3. Добавить логирование:
```javascript
console.log('Searching products with field:', category.productSearchField);
```

## Резюме

После применения этих изменений:
1. ✅ Категории получат поле `productSearchField`
2. ✅ API будет использовать это поле для поиска товаров
3. ✅ Товары будут отображаться на страницах категорий
4. ✅ Система станет более гибкой и расширяемой 