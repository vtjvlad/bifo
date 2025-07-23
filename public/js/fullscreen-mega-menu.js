// Fullscreen Mega Menu Class
class FullscreenMegaMenu {
    constructor() {
        this.apiBase = '/api';
        this.isOpen = false;
        this.currentCatalog = null;
        this.catalogs = [];
        this.searchQuery = '';
        this.searchResults = [];
        
        this.init();
    }

    init() {
        this.createMenuStructure();
        this.setupEventListeners();
        this.loadCatalogs();
    }

    // Создание структуры меню
    createMenuStructure() {
        // Проверяем, не существует ли уже элемент мега меню
        const existingMenu = document.getElementById('fullscreenMegaMenu');
        if (existingMenu) {
            console.log('FullscreenMegaMenu element already exists, using existing one');
            return;
        }

        const menuHTML = `
            <div class="fullscreen-mega-menu" id="fullscreenMegaMenu" style="display: none;">
                <!-- Основной контейнер -->
                <div class="mega-menu-container">
                    <!-- Левая колонка - каталоги -->
                    <div class="mega-menu-sidebar">
                        <ul class="catalog-list" id="catalogList">
                            <!-- Каталоги будут загружены здесь -->
                        </ul>
                    </div>

                    <!-- Правая колонка - контент -->
                    <div class="mega-menu-content">
                        <!-- Верхняя панель с поиском и кнопкой закрытия -->
                        <div class="mega-menu-top-panel">
                            <div class="search-container">
                                <i class="fas fa-search search-icon"></i>
                                <input 
                                    type="text" 
                                    class="search-input" 
                                    id="megaMenuSearch" 
                                    placeholder="Поиск по каталогам и категориям..."
                                    autocomplete="off"
                                >
                            </div>
                            <button class="mega-menu-close" id="megaMenuClose">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div id="megaMenuContent">
                            <!-- Контент будет загружен здесь -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', menuHTML);
        
        // Сохраняем ссылки на элементы
        this.menuElement = document.getElementById('fullscreenMegaMenu');
        this.closeButton = document.getElementById('megaMenuClose');
        this.searchInput = document.getElementById('megaMenuSearch');
        this.catalogList = document.getElementById('catalogList');
        this.contentArea = document.getElementById('megaMenuContent');
        
        // Проверяем, что все элементы найдены
        if (!this.menuElement) console.error('Menu element not found');
        if (!this.closeButton) console.error('Close button not found');
        if (!this.searchInput) console.error('Search input not found');
        if (!this.catalogList) console.error('Catalog list not found');
        if (!this.contentArea) console.error('Content area not found');
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Закрытие меню
        if (this.closeButton) {
            this.closeButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Close button clicked');
                this.close();
            });
        } else {
            console.error('Close button not found');
        }
        
        // Клик вне меню
        this.menuElement.addEventListener('click', (e) => {
            if (e.target === this.menuElement) {
                this.close();
            }
        });

        // Клавиатурная навигация
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            
            switch (e.key) {
                case 'Escape':
                    e.preventDefault();
                    this.close();
                    break;
                case 'Enter':
                    if (document.activeElement.classList.contains('catalog-link')) {
                        e.preventDefault();
                        const catalogSlug = document.activeElement.dataset.slug;
                        this.selectCatalog(catalogSlug);
                    }
                    break;
                case 'ArrowDown':
                case 'ArrowUp':
                    if (document.activeElement.classList.contains('catalog-link')) {
                        e.preventDefault();
                        this.navigateCatalogs(e.key === 'ArrowDown' ? 1 : -1);
                    }
                    break;
            }
        });

        // Поиск
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.trim();
                this.performSearch();
            });
        }

        // Обработка показа/скрытия
        this.menuElement.addEventListener('animationend', () => {
            if (!this.isOpen) {
                this.menuElement.style.display = 'none';
            }
        });
        
        // Альтернативный обработчик закрытия через делегирование
        document.addEventListener('click', (e) => {
            if (e.target && e.target.closest('.mega-menu-close')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Close button clicked via delegation');
                this.close();
            }
        });
    }

    // Загрузка каталогов
    async loadCatalogs() {
        try {
            const response = await fetch(`${this.apiBase}/catalogs/mega`);
            if (!response.ok) throw new Error('Failed to load catalogs');
            
            this.catalogs = await response.json();
            this.renderCatalogs();
            
            // Выбираем первый каталог по умолчанию
            if (this.catalogs.length > 0) {
                this.selectCatalog(this.catalogs[0].slug);
            }
        } catch (error) {
            console.error('Error loading catalogs:', error);
            this.showError('Ошибка загрузки каталогов');
        }
    }

    // Рендеринг списка каталогов
    renderCatalogs() {
        this.catalogList.innerHTML = this.catalogs.map(catalog => `
            <li class="catalog-item">
                <a href="#" 
                   class="catalog-link" 
                   data-slug="${catalog.slug}"
                   tabindex="0"
                   role="button"
                   aria-label="Выбрать каталог ${catalog.name}">
                    <div class="catalog-icon">
                        <i class="${this.getCatalogIcon(catalog.name)}"></i>
                    </div>
                    <div class="catalog-info">
                        <div class="catalog-name">${catalog.name}</div>
                    </div>
                </a>
            </li>
        `).join('');

        // Добавляем обработчики для каталогов
        this.catalogList.querySelectorAll('.catalog-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const catalogSlug = link.dataset.slug;
                this.selectCatalog(catalogSlug);
            });
        });
    }

    // Выбор каталога
    async selectCatalog(catalogSlug) {
        const catalog = this.catalogs.find(c => c.slug === catalogSlug);
        if (!catalog) return;

        this.currentCatalog = catalog;
        
        // Обновляем активное состояние
        this.catalogList.querySelectorAll('.catalog-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.slug === catalogSlug) {
                link.classList.add('active');
                link.focus();
            }
        });

        // Показываем загрузку
        this.showLoading();

        try {
            // Загружаем детали каталога
            const response = await fetch(`${this.apiBase}/catalogs/${catalogSlug}/structure`);
            if (!response.ok) throw new Error('Failed to load catalog structure');
            
            const catalogStructure = await response.json();
            this.renderCatalogContent(catalog, catalogStructure);
        } catch (error) {
            console.error('Error loading catalog structure:', error);
            this.showError('Ошибка загрузки структуры каталога');
        }
    }

    // Рендеринг контента каталога
    renderCatalogContent(catalog, structure) {
        const breadcrumbs = this.generateBreadcrumbs(catalog);
        const groupsHTML = this.generateGroupsHTML(structure.groups || []);

        this.contentArea.innerHTML = `
            ${breadcrumbs}
            <div class="groups-container">
                ${groupsHTML}
            </div>
        `;

        // Добавляем обработчики для категорий
        this.contentArea.querySelectorAll('.category-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href && href !== '#') {
                    window.location.href = href;
                }
            });
        });
    }

    // Генерация хлебных крошек
    generateBreadcrumbs(catalog) {
        return `
            <div class="mega-menu-breadcrumbs">
                <a href="/" class="breadcrumb-item">
                    <i class="fas fa-home"></i>
                    Главная
                </a>
                <span class="breadcrumb-separator">
                    <i class="fas fa-chevron-right"></i>
                </span>
                <span class="breadcrumb-current">
                    <i class="${this.getCatalogIcon(catalog.name)}"></i>
                    ${catalog.name}
                </span>
            </div>
        `;
    }

    // Генерация HTML для групп
    generateGroupsHTML(groups) {
        if (!groups || groups.length === 0) {
            return `
                <div class="group-section">
                    <h3 class="group-title">Нет доступных групп</h3>
                    <p>В данном каталоге пока нет групп категорий.</p>
                </div>
            `;
        }

        return groups.map(group => `
            <div class="group-section">
                <h3 class="group-title">
                    <a href="/catalog.html?catalog=${this.currentCatalog.slug}&group=${group.slug}" 
                       class="text-decoration-none">
                        ${group.name}
                    </a>
                </h3>
                <ul class="categories-list">
                    ${this.generateCategoriesHTML(group.categories || [])}
                </ul>
            </div>
        `).join('');
    }

    // Генерация HTML для категорий
    generateCategoriesHTML(categories) {
        if (!categories || categories.length === 0) {
            return '<li class="category-item"><span class="text-muted">Нет категорий</span></li>';
        }

        return categories.map(category => `
            <li class="category-item">
                <a href="/catalog.html?catalog=${this.currentCatalog.slug}&group=${category.groupSlug}&category=${category.slug}" 
                   class="category-link">
                    ${category.name}
                </a>
            </li>
        `).join('');
    }

    // Поиск
    performSearch() {
        if (!this.searchQuery) {
            this.clearSearch();
            return;
        }

        const query = this.searchQuery.toLowerCase();
        this.searchResults = [];

        // Поиск по каталогам
        this.catalogs.forEach(catalog => {
            if (catalog.name.toLowerCase().includes(query)) {
                this.searchResults.push({
                    type: 'catalog',
                    item: catalog,
                    relevance: this.calculateRelevance(catalog.name, query)
                });
            }
        });

        // Поиск по группам и категориям (если есть текущий каталог)
        if (this.currentCatalog && this.currentCatalog.groups) {
            this.currentCatalog.groups.forEach(group => {
                if (group.name.toLowerCase().includes(query)) {
                    this.searchResults.push({
                        type: 'group',
                        item: group,
                        catalog: this.currentCatalog,
                        relevance: this.calculateRelevance(group.name, query)
                    });
                }

                if (group.categories) {
                    group.categories.forEach(category => {
                        if (category.name.toLowerCase().includes(query)) {
                            this.searchResults.push({
                                type: 'category',
                                item: category,
                                group: group,
                                catalog: this.currentCatalog,
                                relevance: this.calculateRelevance(category.name, query)
                            });
                        }
                    });
                }
            });
        }

        // Сортируем по релевантности
        this.searchResults.sort((a, b) => b.relevance - a.relevance);

        this.renderSearchResults();
    }

    // Расчет релевантности поиска
    calculateRelevance(text, query) {
        const textLower = text.toLowerCase();
        const queryLower = query.toLowerCase();
        
        if (textLower.startsWith(queryLower)) return 100;
        if (textLower.includes(queryLower)) return 50;
        return 10;
    }

    // Рендеринг результатов поиска
    renderSearchResults() {
        if (this.searchResults.length === 0) {
            this.contentArea.innerHTML = `
                <div class="mega-menu-breadcrumbs">
                    <i class="fas fa-search"></i>
                    Результаты поиска: "${this.searchQuery}"
                </div>
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    По запросу "${this.searchQuery}" ничего не найдено.
                </div>
            `;
            return;
        }

        const resultsHTML = this.searchResults.map(result => {
            switch (result.type) {
                case 'catalog':
                    return `
                        <div class="group-section">
                            <h3 class="group-title">
                                <i class="fas fa-th-large me-2"></i>
                                Каталог: ${result.item.name}
                            </h3>
                            <a href="#" class="category-link" data-action="select-catalog" data-slug="${result.item.slug}">
                                Открыть каталог
                            </a>
                        </div>
                    `;
                case 'group':
                    return `
                        <div class="group-section">
                            <h3 class="group-title">
                                <i class="fas fa-folder me-2"></i>
                                Группа: ${result.item.name}
                            </h3>
                            <p class="mb-2">Каталог: ${result.catalog.name}</p>
                            <a href="/catalog.html?catalog=${result.catalog.slug}&group=${result.item.slug}" class="category-link">
                                Открыть группу
                            </a>
                        </div>
                    `;
                case 'category':
                    return `
                        <div class="group-section">
                            <h3 class="group-title">
                                <i class="fas fa-tag me-2"></i>
                                Категория: ${result.item.name}
                            </h3>
                            <p class="mb-2">Группа: ${result.group.name} | Каталог: ${result.catalog.name}</p>
                            <a href="/catalog.html?catalog=${result.catalog.slug}&group=${result.group.slug}&category=${result.item.slug}" class="category-link">
                                Открыть категорию
                            </a>
                        </div>
                    `;
                default:
                    return '';
            }
        }).join('');

        this.contentArea.innerHTML = `
            <div class="mega-menu-breadcrumbs">
                <i class="fas fa-search"></i>
                Результаты поиска: "${this.searchQuery}" (${this.searchResults.length})
            </div>
            <div class="groups-container">
                ${resultsHTML}
            </div>
        `;

        // Добавляем обработчики для результатов поиска
        this.contentArea.querySelectorAll('[data-action="select-catalog"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const catalogSlug = link.dataset.slug;
                this.selectCatalog(catalogSlug);
                this.clearSearch();
            });
        });
    }

    // Очистка поиска
    clearSearch() {
        this.searchQuery = '';
        this.searchResults = [];
        this.searchInput.value = '';
        
        if (this.currentCatalog) {
            this.renderCatalogContent(this.currentCatalog, this.currentCatalog);
        }
    }

    // Навигация по каталогам с клавиатуры
    navigateCatalogs(direction) {
        const catalogLinks = Array.from(this.catalogList.querySelectorAll('.catalog-link'));
        const currentIndex = catalogLinks.findIndex(link => link.classList.contains('active'));
        
        let newIndex = currentIndex + direction;
        if (newIndex < 0) newIndex = catalogLinks.length - 1;
        if (newIndex >= catalogLinks.length) newIndex = 0;
        
        const newLink = catalogLinks[newIndex];
        if (newLink) {
            newLink.focus();
            const catalogSlug = newLink.dataset.slug;
            this.selectCatalog(catalogSlug);
        }
    }

    // Показать загрузку
    showLoading() {
        this.contentArea.innerHTML = `
            <div class="mega-menu-loading">
                <div class="loading-spinner"></div>
                <span class="ms-3">Загрузка...</span>
            </div>
        `;
    }

    // Показать ошибку
    showError(message) {
        this.contentArea.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
            </div>
        `;
    }

    // Получить иконку для каталога
    getCatalogIcon(catalogName) {
        const iconMap = {
            'военное': 'fas fa-military',
            'инструменты': 'fas fa-tools',
            'электроника': 'fas fa-microchip',
            'одежда': 'fas fa-tshirt',
            'обувь': 'fas fa-shoe-prints',
            'спорт': 'fas fa-dumbbell',
            'дом': 'fas fa-home',
            'сад': 'fas fa-seedling',
            'авто': 'fas fa-car',
            'книги': 'fas fa-book',
            'игрушки': 'fas fa-gamepad',
            'красота': 'fas fa-spa',
            'здоровье': 'fas fa-heartbeat',
            'еда': 'fas fa-utensils',
            'напитки': 'fas fa-wine-glass',
            'интим': 'fas fa-heart'
        };

        const nameLower = catalogName.toLowerCase();
        for (const [key, icon] of Object.entries(iconMap)) {
            if (nameLower.includes(key)) {
                return icon;
            }
        }

        return 'fas fa-th-large'; // Иконка по умолчанию
    }

    // Открыть меню
    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.menuElement.style.display = 'block';
        this.menuElement.classList.add('show');
        
        // Фокус на поиск
        setTimeout(() => {
            this.searchInput.focus();
        }, 100);
        
        // Блокируем прокрутку body
        document.body.style.overflow = 'hidden';
        
        // Событие открытия
        this.menuElement.dispatchEvent(new CustomEvent('megaMenuOpened'));
    }

    // Закрыть меню
    close() {
        console.log('Close function called, isOpen:', this.isOpen);
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.menuElement.classList.remove('show');
        
        // Разблокируем прокрутку body
        document.body.style.overflow = '';
        
        // Очищаем поиск
        this.clearSearch();
        
        // Событие закрытия
        this.menuElement.dispatchEvent(new CustomEvent('megaMenuClosed'));
        
        console.log('Menu closed successfully');
    }

    // Переключить состояние меню
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    // Получить состояние
    getState() {
        return {
            isOpen: this.isOpen,
            currentCatalog: this.currentCatalog,
            searchQuery: this.searchQuery,
            searchResultsCount: this.searchResults.length
        };
    }
}

// Экспорт класса
window.FullscreenMegaMenu = FullscreenMegaMenu; 