# Интеграция каталогов с товарами

## Обзор

Система позволяет корректно распределять существующие товары по структуре каталогов, используя поле `section.name` в модели Product для сопоставления с каталогами.

## Архитектура

### Модели данных

1. **Product** - товары с полем `section.name`
2. **Catalog** - структура каталогов с полем `productSearchField`

### Связь между товарами и каталогами

Товары связываются с каталогами через поле `section.name` в Product и `productSearchField` в Catalog:

```javascript
// В Product
{
  section: {
    name: "Электроника" // Это поле используется для поиска
  }
}

// В Catalog
{
  name: "Электроника",
  slug: "electronics",
  productSearchField: "Электроника|Смартфоны|Телефоны", // Поисковые поля
  searchQueries: ["Электроника", "Смартфоны", "Телефоны"] // Массив поисковых запросов
}
```

## API Эндпоинты

### Получение товаров по каталогам

#### 1. Товары каталога
```
GET /api/products/catalog/:catalogSlug
GET /api/products/catalog/:catalogSlug?group=:groupSlug
GET /api/products/catalog/:catalogSlug?group=:groupSlug&category=:categorySlug
```

#### 2. Товары группы
```
GET /api/products/group/:groupSlug
```

#### 3. Товары категории
```
GET /api/products/category/:categorySlug
```

#### 4. Популярные товары каталога
```
GET /api/products/featured/catalog/:catalogSlug?limit=10
```

#### 5. Статистика каталога
```
GET /api/products/stats/catalog/:catalogSlug
```

### Параметры запроса

- `page` - номер страницы (по умолчанию: 1)
- `limit` - количество товаров на странице (по умолчанию: 20)
- `group` - slug группы (для фильтрации по группе)
- `category` - slug категории (для фильтрации по категории)

### Примеры ответов

#### Товары каталога
```json
{
  "products": [...],
  "totalPages": 5,
  "currentPage": 1,
  "total": 100,
  "catalog": {
    "name": "Электроника",
    "slug": "electronics",
    "description": "Электронные устройства"
  }
}
```

#### Статистика каталога
```json
{
  "catalog": {
    "name": "Электроника",
    "slug": "electronics",
    "totalCount": 1500
  },
  "groups": [
    {
      "name": "Смартфоны",
      "slug": "smartphones",
      "count": 500,
      "categories": [
        {
          "name": "iPhone",
          "slug": "iphone",
          "count": 200
        }
      ]
    }
  ]
}
```

## Клиентская интеграция

### URL параметры

Каталог поддерживает URL параметры для навигации:

```
/catalog.html?catalog=electronics
/catalog.html?catalog=electronics&group=smartphones
/catalog.html?catalog=electronics&group=smartphones&category=iphone
```

### Автоматическая загрузка

При загрузке страницы каталога система автоматически:

1. Определяет параметры из URL
2. Выбирает соответствующий API эндпоинт
3. Загружает товары
4. Обновляет заголовок страницы
5. Отображает хлебные крошки

### Хлебные крошки

Система автоматически генерирует хлебные крошки:

```
Главная > Электроника > Смартфоны > iPhone
```

## Настройка сопоставления

### Запуск скрипта анализа

```bash
node scripts/catalog-mapping.js
```

Скрипт выполняет:

1. **Анализ секций** - показывает все существующие секции товаров
2. **Создание каталогов** - создает недостающие каталоги
3. **Обновление полей поиска** - устанавливает `productSearchField`
4. **Статистика** - показывает количество товаров в каждом каталоге

### Ручное обновление сопоставления

Для обновления сопоставления секций с каталогами отредактируйте объект `sectionToCatalogMapping` в файле `scripts/catalog-mapping.js`:

```javascript
const sectionToCatalogMapping = {
    'Электроника': 'electronics',
    'Смартфоны': 'electronics',
    'Телефоны': 'electronics',
    // ... добавьте новые сопоставления
};
```

## Кэширование

Система поддерживает кэширование каталогов в localStorage:

- **Основные каталоги** - `bifo_catalogs_main`
- **Мега-меню** - `bifo_catalogs_mega`
- **Структуры каталогов** - `bifo_catalogs_structure_{slug}`

### Управление кэшем

```javascript
// Сохранение
app.saveCatalogsToLocalStorage(catalogs, 'main');

// Загрузка
const cached = app.getCatalogsFromLocalStorage('main');

// Очистка
app.clearCatalogsFromLocalStorage('main');

// Обновление
app.refreshCatalogs('main');
```

## Fallback система

При ошибках API система автоматически использует fallback:

1. **Новый API** → Старый API
2. **Каталоги** → Секции товаров
3. **Кэш** → Прямые запросы к серверу

## Производительность

### Оптимизации

1. **Кэширование** - данные каталогов кэшируются на 7 дней
2. **Пагинация** - товары загружаются постранично
3. **Индексы** - MongoDB индексы для быстрого поиска
4. **Lazy loading** - загрузка по требованию

### Мониторинг

Используйте эндпоинт статистики для мониторинга:

```bash
curl /api/products/stats/catalog/electronics
```

## Безопасность

- Валидация входных параметров
- Проверка существования каталогов
- Ограничение размера запросов
- Защита от SQL-инъекций через Mongoose

## Отладка

### Логирование

Включите логирование в консоли браузера:

```javascript
// Просмотр кэша
console.log(app.getCatalogCacheInfo());

// Проверка API
fetch('/api/catalogs/main').then(r => r.json()).then(console.log);
```

### Тестирование

Используйте демо-страницу для тестирования:

```
/mega-menu-demo.html
```

## Миграция

### Пошаговая миграция

1. Запустите скрипт анализа
2. Проверьте сопоставления
3. Обновите каталоги
4. Протестируйте API
5. Обновите клиентскую часть

### Откат

При необходимости можно откатиться к старой системе:

```javascript
// Отключить новые API
const useOldAPI = true;
```

## Поддержка

При возникновении проблем:

1. Проверьте логи сервера
2. Убедитесь в корректности сопоставлений
3. Проверьте кэш браузера
4. Обратитесь к документации API 