# Модульная система компонентов BIFO

## Обзор

Система компонентов BIFO позволяет создавать переиспользуемые HTML блоки, которые автоматически загружаются и вставляются в страницы. Это упрощает поддержку кода и обеспечивает единообразие интерфейса.

## Структура файлов

```
public/
├── components/           # HTML компоненты
│   ├── header.html      # Шапка сайта
│   ├── footer.html      # Подвал сайта
│   └── modals.html      # Модальные окна
├── js/
│   ├── components.js    # Загрузчик компонентов
│   └── app.js          # Основная логика приложения
└── index.html          # Главная страница
```

## Как использовать компоненты

### 1. Создание компонента

Создайте HTML файл в папке `public/components/`:

```html
<!-- components/my-component.html -->
<div class="my-component">
    <h2>Заголовок компонента</h2>
    <p>Содержимое компонента</p>
</div>
```

### 2. Использование компонента на странице

Добавьте элемент с атрибутом `data-component`:

```html
<!-- В любом HTML файле -->
<div data-component="my-component"></div>
```

### 3. Автоматическая загрузка

Компоненты автоматически загружаются при загрузке страницы. Загрузчик ищет все элементы с атрибутом `data-component` и загружает соответствующие HTML файлы.

## API загрузчика компонентов

### Основные методы

```javascript
// Загрузка компонента
await window.componentLoader.loadComponent('component-name', '#selector');

// Получение HTML компонента без вставки
const html = await window.componentLoader.getComponentHTML('component-name');

// Проверка загрузки компонента
const isLoaded = window.componentLoader.isComponentLoaded('component-name');

// Очистка кэша
window.componentLoader.clearCache();
```

### События

```javascript
// Слушатель события загрузки компонента
document.addEventListener('componentLoaded', (event) => {
    const { componentName, element } = event.detail;
    console.log(`Компонент ${componentName} загружен`);
});
```

## Существующие компоненты

### Header (`header.html`)
Шапка сайта с навигацией, поиском и пользовательским меню.

**Использование:**
```html
<div data-component="header"></div>
```

### Footer (`footer.html`)
Подвал сайта с информацией о компании.

**Использование:**
```html
<div data-component="footer"></div>
```

### Modals (`modals.html`)
Модальные окна для входа, регистрации и корзины.

**Использование:**
```html
<div data-component="modals"></div>
```

## Создание новых страниц

### Пример страницы с компонентами

```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Новая страница - BIFO</title>
    
    <!-- CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <!-- Компоненты -->
    <div data-component="header"></div>
    
    <!-- Контент страницы -->
    <div class="container mt-5 pt-5">
        <h1>Содержимое страницы</h1>
        <!-- Ваш контент -->
    </div>
    
    <div data-component="footer"></div>
    <div data-component="modals"></div>
    
    <!-- JavaScript -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/components.js"></script>
    <script src="js/app.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', async () => {
            await window.app.init();
            // Дополнительная логика страницы
        });
    </script>
</body>
</html>
```

## Преимущества модульной системы

1. **Переиспользование**: Один компонент используется на множестве страниц
2. **Единообразие**: Изменения в компоненте автоматически применяются везде
3. **Простота поддержки**: Изменения вносятся в одном месте
4. **Кэширование**: Компоненты загружаются один раз и кэшируются
5. **Асинхронность**: Компоненты загружаются параллельно

## Лучшие практики

### 1. Именование компонентов
- Используйте понятные имена: `header`, `footer`, `product-card`
- Избегайте пробелов и специальных символов

### 2. Структура компонентов
- Каждый компонент должен быть самодостаточным
- Используйте семантические HTML теги
- Добавляйте комментарии для сложных компонентов

### 3. JavaScript взаимодействие
- Ждите загрузки компонентов перед инициализацией
- Используйте события для взаимодействия между компонентами

```javascript
// Правильная инициализация
async init() {
    await this.waitForComponents();
    this.setupEventListeners();
    // Остальная логика
}
```

### 4. Стилизация
- Используйте уникальные классы для компонентов
- Избегайте глобальных стилей, которые могут конфликтовать

```css
/* Хорошо */
.my-component {
    /* стили компонента */
}

/* Плохо */
.container {
    /* может конфликтовать с другими компонентами */
}
```

## Отладка

### Проверка загрузки компонентов

```javascript
// В консоли браузера
console.log(window.componentLoader.loadedComponents);
console.log(window.componentLoader.components);
```

### Обработка ошибок

```javascript
try {
    await window.componentLoader.loadComponent('missing-component', '#selector');
} catch (error) {
    console.error('Ошибка загрузки компонента:', error);
}
```

## Расширение системы

### Добавление новых типов компонентов

Вы можете расширить систему, добавив поддержку:
- Динамических компонентов с параметрами
- Компонентов с JavaScript логикой
- Компонентов с CSS стилями

### Пример расширенного компонента

```javascript
// Расширенный загрузчик компонентов
class ExtendedComponentLoader extends ComponentLoader {
    async loadComponentWithData(componentName, selector, data) {
        const html = await this.getComponentHTML(componentName);
        const processedHtml = this.processTemplate(html, data);
        
        const element = document.querySelector(selector);
        if (element) {
            element.innerHTML = processedHtml;
            return processedHtml;
        }
    }
    
    processTemplate(template, data) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] || match;
        });
    }
}
```

## Заключение

Модульная система компонентов BIFO обеспечивает гибкость и масштабируемость проекта. Используйте её для создания переиспользуемых блоков интерфейса и упрощения поддержки кода. 