# Система фильтров

## Как работает система

Фильтры теперь загружаются автоматически на основе `section._id` первого товара в категории:

1. **Загрузка товаров** - сначала загружаются товары категории
2. **Определение sectionId** - берется `section._id` или `section.id` первого товара
3. **Загрузка фильтров** - загружаются фильтры с соответствующим `sectionId`
4. **Отображение** - фильтры динамически отображаются на странице

## Структура фильтров в базе данных

```javascript
{
  _id: "brand-filter-11",
  title: "Бренд",
  description: "Выберите производителя товара",
  type: "checkbox", // checkbox, range, select
  weight: 100, // для сортировки
  values: [
    { _id: "samsung", title: "Samsung", productsCount: 150 }
  ],
  sectionId: 11, // ВАЖНО: должен совпадать с section._id товаров
  categoryUrl: "mobile-mobilnye-telefony-i-smartfony",
  categoryName: "Смартфоны и мобильные телефоны",
  isPublic: true
}
```

## API Endpoints

- `GET /api/filters/section/:sectionId` - получить фильтры по ID секции
- `GET /api/filters/category/:categoryUrl` - получить фильтры по URL категории
- `GET /api/filters` - поиск фильтров с параметрами

## Тестирование

### 1. Тестовая страница фильтров
```
http://localhost:3000/test-category-filters.html
```

### 2. Создание тестовых данных
```
POST http://localhost:3000/create-test-filters
```

### 3. Проверка API фильтров
```
GET http://localhost:3000/api/filters/section/11
```

## Известные sectionId

- `11` - Смартфоны и мобильные телефоны (mobile-mobilnye-telefony-i-smartfony)

## Для разработчиков

### Добавление новых фильтров

1. Определите `sectionId` товаров категории
2. Создайте фильтр в базе данных с соответствующим `sectionId`
3. Фильтры автоматически загрузятся на странице категории

### Типы фильтров

- **checkbox** - множественный выбор с флажками
- **range** - диапазон значений (от/до)  
- **select** - выпадающий список

### Отладка

Для отладки откройте консоль браузера и найдите сообщения:
- `🔍 Loading filters for sectionId: X`
- `✅ Found N filters for section X`
- `❌ No section ID found in first product`