# 🏪 Прайс-агрегатор

Современная платформа для сравнения цен на товары из разных интернет-магазинов через фиды.

## 📋 Техническое задание

### Цель проекта
Сравнение цен на одни и те же товары, полученных через фиды магазинов.

### Технологический стек
- **Бэкенд**: Node.js (Express.js)
- **База данных**: MongoDB + Mongoose
- **Фронтенд**: Чистый HTML + CSS + JavaScript
- **Обновление цен**: Через фиды (XML/CSV/JSON от магазинов)

## 🚀 Быстрый старт

### Установка зависимостей

```bash
npm install
```

### Настройка окружения

Создайте файл `.env` в корне проекта:

```env
MONGO_URI=mongodb://localhost:27017/price-aggregator
PORT=3000
NODE_ENV=development
```

### Инициализация базы данных

```bash
npm run init-db
```

### Запуск сервера

```bash
# Режим разработки
npm run dev

# Продакшн режим
npm start
```

### Обработка фидов

```bash
# Ручной запуск обработки фидов
npm run process-feeds
```

## 📊 API Endpoints

### Товары
- `GET /api/products` - список товаров с фильтрацией
- `GET /api/products/:id` - детальная информация о товаре
- `GET /api/products/search/:query` - поиск товаров
- `GET /api/products/categories/list` - список категорий
- `GET /api/products/brands/list` - список брендов

### Магазины
- `GET /api/stores` - список магазинов
- `GET /api/stores/:id` - информация о магазине
- `POST /api/stores` - добавление магазина
- `PUT /api/stores/:id` - обновление магазина
- `DELETE /api/stores/:id` - удаление магазина

### Админка
- `GET /api/admin/stores` - управление магазинами
- `POST /api/admin/stores` - добавление магазина и фида
- `POST /api/admin/fetch/:storeId` - ручной запуск импорта фида
- `POST /api/admin/fetch-all` - обработка всех фидов
- `GET /api/admin/errors` - журнал ошибок
- `GET /api/admin/stats` - статистика системы

### Статистика
- `GET /api/stats` - общая статистика системы

## 🏗️ Архитектура

### Модели данных

#### Store (Магазин)
```javascript
{
  name: String,
  feedUrl: String, // URL или путь к локальному файлу
  feedType: "xml" | "json" | "csv",
  logo: String,
  description: String,
  feedMapping: {
    productName: String,
    productDescription: String,
    productCategory: String,
    productBrand: String,
    productImage: String,
    productSku: String,
    productSpecs: String,
    offerPrice: String,
    offerCurrency: String,
    offerUrl: String,
    offerAvailability: String
  },
  isActive: Boolean,
  lastUpdated: Date,
  errorLog: [{
    message: String,
    timestamp: Date
  }]
}
```

#### Product (Товар)
```javascript
{
  name: String,
  description: String,
  category: String,
  brand: String,
  image: String,
  specs: Map,
  sku: String,
  offers: [ObjectId], // ссылки на предложения
  isActive: Boolean,
  searchKeywords: [String]
}
```

#### Offer (Предложение)
```javascript
{
  productId: ObjectId,
  storeId: ObjectId,
  price: Number,
  currency: String,
  url: String,
  available: Boolean,
  lastUpdated: Date
}
```

## 🔧 Обработка фидов

### Поддерживаемые форматы
- **JSON** - структурированные данные
- **XML** - RSS, Atom, кастомные форматы
- **CSV** - табличные данные

### Настраиваемая маппинг-конфигурация
Каждый магазин может иметь свою структуру фида. Система поддерживает настройку маппинга полей:

```javascript
feedMapping: {
  productName: 'title',           // Название товара
  productDescription: 'desc',     // Описание
  productCategory: 'category',    // Категория
  productBrand: 'brand',          // Бренд
  productImage: 'image_url',      // Изображение
  productSku: 'sku',              // SKU
  productSpecs: 'specifications', // Характеристики
  offerPrice: 'price',            // Цена
  offerCurrency: 'currency',      // Валюта
  offerUrl: 'product_url',        // Ссылка на товар
  offerAvailability: 'in_stock'   // Наличие
}
```

### Автоматическое обновление
- **По расписанию**: каждый час (cron)
- **Ручной запуск**: через админку
- **Логирование ошибок**: для каждого магазина

## 📁 Структура сайта

### Главная страница
- Поисковая строка
- Популярные товары
- Категории

### Категория
- Список товаров
- Фильтры (цена, бренд, магазин)
- Сортировка

### Карточка товара
- Фото, описание, характеристики
- Таблица цен из разных магазинов
- Ссылки на источники

### Страница магазина
- Информация о магазине
- Список товаров из фида

### Админ-панель
- Добавление магазинов и фидов
- Управление загрузкой фидов
- Журнал ошибок и логов

## 🔒 Безопасность

- **Авторизация для админки** (JWT или Basic Auth)
- **Валидация данных** из фидов
- **Очистка HTML-контента**
- **CORS настройки**
- **Защита от SQL-инъекций**

## 📈 Мониторинг

### Логи
- Обработка фидов
- Ошибки и предупреждения
- Статистика производительности

### Метрики
- Количество товаров
- Количество магазинов
- Количество предложений
- Популярные категории и бренды

## 🚀 Развертывание

### Хостинг
- **Бэкенд**: VPS
- **MongoDB**: локально или в облаке
- **Фронтенд**: статические файлы через Nginx

### Автоматизация
- **Загрузка фидов**: node-cron или systemd timers
- **Мониторинг**: логи и метрики
- **Резервное копирование**: база данных

## 🔮 Расширение в будущем

- Регистрация пользователей
- Сохранение товаров в избранное
- Уведомления об изменении цен
- Импорт с Google Merchant
- Мобильное приложение
- API для партнеров

## 📝 Примеры использования

### Добавление нового магазина через API

```bash
curl -X POST http://localhost:3000/api/admin/stores \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Новый магазин",
    "feedUrl": "https://store.com/feed.xml",
    "feedType": "xml",
    "feedMapping": {
      "productName": "title",
      "offerPrice": "price"
    }
  }'
```

### Ручной запуск обработки фида

```bash
curl -X POST http://localhost:3000/api/admin/fetch/STORE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📞 Поддержка

- Email: support@price-aggregator.com
- Issues: GitHub Issues
- Документация: `/docs`

---

**Прайс-агрегатор** - ваш надежный помощник в поиске лучших цен через фиды магазинов! 🛒💰 