// BIFO Catalog Application
class CatalogApp {
    constructor() {
        this.apiBase = '/api';
        this.token = localStorage.getItem('bifo_token');
        this.user = JSON.parse(localStorage.getItem('bifo_user'));
        this.cart = [];
        
        // Catalog state
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.totalPages = 1;
        this.totalProducts = 0;
        this.filters = {
            section: '',
            vendor: '',
            minPrice: '',
            maxPrice: '',
            sort: 'createdAt_desc',
            isPromo: false,
            isNew: false,
            search: ''
        };
        this.viewMode = 'grid'; // 'grid' or 'list'
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCategories();
        this.loadMegaMenu();
        this.loadBrands();
        this.loadProducts();
        this.updateAuthUI();
        this.loadCart();
        
        // Добавляем настройку позиционирования мега меню
        setTimeout(() => {
            this.setupMegaMenuPositioning();
        }, 100);
    }

    setupEventListeners() {
        // Search form
        document.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });

        // Cart button
        document.getElementById('cartBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.showCart();
        });

        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Register form
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Checkout button
        document.getElementById('checkoutBtn').addEventListener('click', () => {
            this.handleCheckout();
        });

        // View mode buttons
        document.getElementById('gridView').addEventListener('click', () => {
            this.setViewMode('grid');
        });

        document.getElementById('listView').addEventListener('click', () => {
            this.setViewMode('list');
        });

        // Items per page
        document.getElementById('itemsPerPage').addEventListener('change', (e) => {
            this.itemsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.loadProducts();
        });

        // Filter inputs
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.filters.section = e.target.value;
            this.currentPage = 1;
            this.loadProducts();
        });

        document.getElementById('brandFilter').addEventListener('change', (e) => {
            this.filters.vendor = e.target.value;
            this.currentPage = 1;
            this.loadProducts();
        });

        document.getElementById('sortFilter').addEventListener('change', (e) => {
            this.filters.sort = e.target.value;
            this.currentPage = 1;
            this.loadProducts();
        });

        // Checkbox filters
        document.getElementById('featuredFilter').addEventListener('change', (e) => {
            this.filters.isPromo = e.target.checked;
            this.currentPage = 1;
            this.loadProducts();
        });

        document.getElementById('saleFilter').addEventListener('change', (e) => {
            this.filters.isNew = e.target.checked;
            this.currentPage = 1;
            this.loadProducts();
        });

        // Price range inputs
        document.getElementById('minPrice').addEventListener('blur', (e) => {
            this.filters.minPrice = e.target.value;
            this.currentPage = 1;
            this.loadProducts();
        });

        document.getElementById('maxPrice').addEventListener('blur', (e) => {
            this.filters.maxPrice = e.target.value;
            this.currentPage = 1;
            this.loadProducts();
        });
    }

    // API Methods
    async apiRequest(endpoint, options = {}) {
        const url = `${this.apiBase}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            this.showToast(error.message, 'error');
            throw error;
        }
    }

    // Authentication
    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const data = await this.apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            this.token = data.token;
            this.user = data.user;
            localStorage.setItem('bifo_token', this.token);
            localStorage.setItem('bifo_user', JSON.stringify(this.user));

            this.updateAuthUI();
            this.showToast('Успешный вход в систему', 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            modal.hide();
        } catch (error) {
            this.showToast('Ошибка входа: ' + error.message, 'error');
        }
    }

    async handleRegister() {
        const firstName = document.getElementById('registerFirstName').value;
        const lastName = document.getElementById('registerLastName').value;
        const email = document.getElementById('registerEmail').value;
        const phone = document.getElementById('registerPhone').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const data = await this.apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ firstName, lastName, email, phone, password })
            });

            this.token = data.token;
            this.user = data.user;
            localStorage.setItem('bifo_token', this.token);
            localStorage.setItem('bifo_user', JSON.stringify(this.user));

            this.updateAuthUI();
            this.showToast('Регистрация успешна!', 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            modal.hide();
        } catch (error) {
            this.showToast('Ошибка регистрации: ' + error.message, 'error');
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('bifo_token');
        localStorage.removeItem('bifo_user');
        this.updateAuthUI();
        this.showToast('Вы вышли из системы', 'info');
    }

    updateAuthUI() {
        const authLink = document.querySelector('.nav-link[data-bs-toggle="modal"]');
        
        if (this.user) {
            authLink.innerHTML = `
                <i class="fas fa-user me-1"></i>${this.user.firstName}
                <div class="dropdown-menu">
                    <a class="dropdown-item" href="#" onclick="catalogApp.logout()">Выйти</a>
                </div>
            `;
            authLink.setAttribute('data-bs-toggle', 'dropdown');
        } else {
            authLink.innerHTML = '<i class="fas fa-user me-1"></i>Войти';
            authLink.setAttribute('data-bs-toggle', 'modal');
        }
    }

    // Categories and Brands
    async loadCategories() {
        try {
            // Try to get from localStorage first
            const cachedData = this.getCatalogsFromLocalStorage('main');
            if (cachedData) {
                this.populateCategoryFilter(cachedData);
                return;
            }

            // If no cache, get from API
            const catalogs = await this.apiRequest('/catalogs/main');
            this.saveCatalogsToLocalStorage(catalogs, 'main');
            this.populateCategoryFilter(catalogs);
        } catch (error) {
            console.error('Error loading categories:', error);
            // Fallback to old categories API
            try {
                const categories = await this.apiRequest('/categories');
                this.populateCategoryFilter(categories);
            } catch (fallbackError) {
                console.error('Fallback error:', fallbackError);
            }
        }
    }

    populateCategoryFilter(catalogs) {
        const select = document.getElementById('categoryFilter');
        const mobileSelect = document.getElementById('mobileCategoryFilter');
        
        const options = catalogs.map(catalog => {
            const option = document.createElement('option');
            option.value = catalog.slug;
            option.textContent = `${this.getCatalogIcon(catalog.name)} ${catalog.name}`;
            return option;
        });
        
        // Clear and populate desktop filter
        select.innerHTML = '<option value="">Все каталоги</option>';
        options.forEach(option => select.appendChild(option.cloneNode(true)));
        
        // Clear and populate mobile filter
        if (mobileSelect) {
            mobileSelect.innerHTML = '<option value="">Все каталоги</option>';
            options.forEach(option => mobileSelect.appendChild(option.cloneNode(true)));
        }
    }

    getCatalogIcon(catalogName) {
        const iconMap = {
            'Электроника': '📱',
            'Одежда': '👕',
            'Мебель': '🪑',
            'Спорт': '⚽',
            'Книги': '📚',
            'Игрушки': '🧸',
            'Автотовары': '🚗',
            'Красота': '💄',
            'Здоровье': '💊',
            'Дом': '🏠',
            'Сад': '🌱',
            'Инструменты': '🔧',
            'Украшения': '💍',
            'Часы': '⌚',
            'Сумки': '👜',
            'Обувь': '👟',
            'Аксессуары': '🕶️',
            'Продукты': '🍎',
            'Напитки': '🥤',
            'Товары для животных': '🐕',
            'Детские товары': '👶',
            'Офис': '📁',
            'Искусство': '🎨',
            'Коллекционные': '🏆',
            'Военное снаряжение': '🎖️',
            'Интимные товары': '🔞',
            'Музыка': '🎵',
            'Фильмы': '🎬',
            'Игры': '🎮',
            'Активный отдых': '🏕️',
            'Фитнес': '💪',
            'Медицинские товары': '🏥',
            'Промышленные товары': '🏭',
            'Сельхозтовары': '🚜',
            'Строительные материалы': '🏗️'
        };
        
        return iconMap[catalogName] || '📦';
    }

    async loadBrands() {
        try {
            const products = await this.apiRequest('/products');
            const uniqueVendors = [...new Set(products.products.map(p => p.vendor?.name).filter(v => v))];
            this.populateBrandFilter(uniqueVendors);
        } catch (error) {
            console.error('Error loading vendors:', error);
        }
    }

    populateBrandFilter(brands) {
        const select = document.getElementById('brandFilter');
        const mobileSelect = document.getElementById('mobileBrandFilter');
        
        const options = brands.map(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            return option;
        });
        
        // Clear and populate desktop filter
        select.innerHTML = '<option value="">Все бренды</option>';
        options.forEach(option => select.appendChild(option.cloneNode(true)));
        
        // Clear and populate mobile filter
        if (mobileSelect) {
            mobileSelect.innerHTML = '<option value="">Все бренды</option>';
            options.forEach(option => mobileSelect.appendChild(option.cloneNode(true)));
        }
    }

    // Products
    async loadProducts() {
        this.showLoading(true);
        
        try {
            // Check if we have catalog parameters in URL
            const urlParams = new URLSearchParams(window.location.search);
            const catalogSlug = urlParams.get('catalog');
            const groupSlug = urlParams.get('group');
            const categorySlug = urlParams.get('category');

            let endpoint = '/products';
            let params = {
                page: this.currentPage,
                limit: this.itemsPerPage
            };

            // If we have catalog parameters, use catalog-specific endpoints
            if (catalogSlug) {
                if (categorySlug) {
                    // Load products by category
                    endpoint = `/products/category/${categorySlug}`;
                } else if (groupSlug) {
                    // Load products by group
                    endpoint = `/products/group/${groupSlug}`;
                } else {
                    // Load products by catalog
                    endpoint = `/products/catalog/${catalogSlug}`;
                    if (groupSlug) params.group = groupSlug;
                    if (categorySlug) params.category = categorySlug;
                }
            } else {
                // Use regular product filtering
                if (this.filters.section) params.section = this.filters.section;
                if (this.filters.vendor) params.vendor = this.filters.vendor;
                if (this.filters.minPrice) params.minPrice = this.filters.minPrice;
                if (this.filters.maxPrice) params.maxPrice = this.filters.maxPrice;
                if (this.filters.search) params.search = this.filters.search;
                if (this.filters.isPromo) params.isPromo = 'true';
                if (this.filters.isNew) params.isNew = 'true';

                // Handle sorting
                if (this.filters.sort) {
                    const [field, order] = this.filters.sort.split('_');
                    params.sort = field;
                    params.order = order;
                }
            }

            // Build query string
            const queryString = new URLSearchParams(params).toString();
            const data = await this.apiRequest(`${endpoint}?${queryString}`);
            
            this.renderProducts(data.products);
            this.updatePagination(data.currentPage, data.totalPages, data.total);
            this.updateResultsCount(data.total);

            // Update page title and breadcrumbs if we have catalog info
            if (data.catalog || data.group || data.category) {
                this.updateCatalogInfo(data);
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showToast('Ошибка загрузки товаров', 'error');
            this.renderProducts([]);
        } finally {
            this.showLoading(false);
        }
    }

    updateCatalogInfo(data) {
        // Update page title
        let title = 'Каталог товаров';
        if (data.category) {
            title = `${data.category.name} - ${title}`;
        } else if (data.group) {
            title = `${data.group.name} - ${title}`;
        } else if (data.catalog) {
            title = `${data.catalog.name} - ${title}`;
        }
        document.title = title;

        // Update breadcrumbs if they exist
        const breadcrumbContainer = document.getElementById('breadcrumbs');
        if (breadcrumbContainer) {
            let breadcrumbHtml = '<nav aria-label="breadcrumb"><ol class="breadcrumb">';
            breadcrumbHtml += '<li class="breadcrumb-item"><a href="/">Главная</a></li>';
            
            if (data.catalog) {
                breadcrumbHtml += `<li class="breadcrumb-item"><a href="/catalog.html?catalog=${data.catalog.slug}">${data.catalog.name}</a></li>`;
            }
            
            if (data.group) {
                breadcrumbHtml += `<li class="breadcrumb-item"><a href="/catalog.html?catalog=${data.catalog?.slug}&group=${data.group.slug}">${data.group.name}</a></li>`;
            }
            
            if (data.category) {
                breadcrumbHtml += `<li class="breadcrumb-item active" aria-current="page">${data.category.name}</li>`;
            } else if (data.group) {
                breadcrumbHtml += `<li class="breadcrumb-item active" aria-current="page">${data.group.name}</li>`;
            } else if (data.catalog) {
                breadcrumbHtml += `<li class="breadcrumb-item active" aria-current="page">${data.catalog.name}</li>`;
            }
            
            breadcrumbHtml += '</ol></nav>';
            breadcrumbContainer.innerHTML = breadcrumbHtml;
        }
    }

    renderProducts(products) {
        const container = document.getElementById('productsGrid');
        
        if (products.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h4>Товары не найдены</h4>
                        <p>Попробуйте изменить параметры фильтрации</p>
                    </div>
                </div>
            `;
            return;
        }

        if (this.viewMode === 'grid') {
            container.innerHTML = products.map(product => this.renderProductCard(product)).join('');
        } else {
            container.innerHTML = products.map(product => this.renderProductList(product)).join('');
        }
    }

    renderProductCard(product) {
        const imageUrl = this.getProductImageUrl(product);
        
        const isPromo = product.isPromo || false;
        const isNew = product.isNew === 1;
        
        return `
            <div class="col-lg-4 col-md-6 col-sm-6 mb-4">
                <div class="card product-card h-100">
                    ${isPromo ? `<span class="sale-badge">Акция</span>` : ''}
                    ${isNew ? `<span class="featured-badge">Новинка</span>` : ''}
                    <img src="${imageUrl}" class="card-img-top" alt="${product.title}" 
                         onerror="this.src='/images/placeholder.jpg'; this.onerror=null;" 
                         onload="this.style.opacity='1';" 
                         style="opacity: 0; transition: opacity 0.3s;">
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title">${product.title}</h6>
                        <div class="rating mb-2">
                            <small class="text-muted">Отзывов: ${product.reviewsCount || 0}</small>
                        </div>
                        <p class="card-text text-muted small mb-3">${product.vendor?.title || 'Неизвестный производитель'}</p>
                        <div class="mt-auto">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <span class="product-price">${product.minPrice} грн.</span>
                                    ${product.maxPrice !== product.minPrice ? `<br><small class="text-muted">до ${product.maxPrice} грн.</small>` : ''}
                                </div>
                                <button class="btn btn-primary btn-sm" onclick="catalogApp.addToCart('${product._id}')">
                                    <i class="fas fa-cart-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderProductList(product) {
        const imageUrl = this.getProductImageUrl(product);
        
        const isPromo = product.isPromo || false;
        const isNew = product.isNew === 1;
        
        return `
            <div class="col-12 mb-3">
                <div class="card product-list-item">
                    <div class="row g-0">
                        <div class="col-md-3">
                            <img src="${imageUrl}" class="img-fluid rounded-start" alt="${product.title}" 
                                 style="height: 200px; object-fit: cover; opacity: 0; transition: opacity 0.3s;" 
                                 onerror="this.src='/images/placeholder.jpg'; this.onerror=null;" 
                                 onload="this.style.opacity='1';">
                        </div>
                        <div class="col-md-9">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-8">
                                        <h5 class="card-title">${product.title}</h5>
                                        <div class="rating mb-2">
                                            <small class="text-muted">Отзывов: ${product.reviewsCount || 0}</small>
                                        </div>
                                        <p class="card-text">${product.vendor?.title || 'Неизвестный производитель'}</p>
                                        <div class="d-flex gap-2 mb-2">
                                            ${isPromo ? `<span class="badge bg-danger">Акция</span>` : ''}
                                            ${isNew ? `<span class="badge bg-warning text-dark">Новинка</span>` : ''}
                                            <span class="badge bg-secondary">${product.section?.productCategoryName || 'Без категории'}</span>
                                            ${product.section?.category ? `<span class="badge bg-info">${product.section.category}</span>` : ''}
                                        </div>
                                    </div>
                                    <div class="col-md-4 text-end">
                                        <div class="mb-3">
                                            <div class="product-price fs-4">${product.minPrice} грн.</div>
                                            ${product.maxPrice !== product.minPrice ? `<small class="text-muted">до ${product.maxPrice} грн.</small>` : ''}
                                        </div>
                                        <button class="btn btn-primary" onclick="catalogApp.addToCart('${product._id}')">
                                            <i class="fas fa-cart-plus me-2"></i>В корзину
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '☆' : '') + 
               '☆'.repeat(emptyStars);
    }

    // Вспомогательная функция для получения URL изображения
    getProductImageUrl(product) {
        if (product.imageLinks && product.imageLinks.length > 0) {
            const firstImage = product.imageLinks[0];
            if (typeof firstImage === 'string') {
                return firstImage;
            } else if (firstImage && firstImage.big) {
                return firstImage.big;
            } else if (firstImage && firstImage.thumb) {
                return firstImage.thumb;
            }
        } 
        return '/images/placeholder.jpg';
    }

    // Mega Menu
    async loadMegaMenu() {
        try {
            // Try to get from localStorage first
            const cachedData = this.getCatalogsFromLocalStorage('mega');
            if (cachedData) {
                this.renderMegaMenu(cachedData);
                return;
            }

            // If no cache, get from API
            const megaStructure = await this.apiRequest('/catalogs/mega');
            this.saveCatalogsToLocalStorage(megaStructure, 'mega');
            this.renderMegaMenu(megaStructure);
        } catch (error) {
            console.error('Error loading mega menu:', error);
            // Fallback to old mega menu parser
            try {
                await megaMenuParser.loadAllCatalogs();
                this.renderMegaMenu();
            } catch (fallbackError) {
                console.error('Fallback error:', fallbackError);
            }
        }
    }

    renderMegaMenu(megaStructure) {
        const container = document.getElementById('megaMenuContent');
        if (!container) return;

        if (megaStructure) {
            container.innerHTML = this.generateMegaMenuHTML(megaStructure);
        } else {
            // Fallback to old mega menu parser
            container.innerHTML = megaMenuParser.generateMegaMenuHTML();
        }
    }

    generateMegaMenuHTML(catalogs) {
        return catalogs.map(catalog => `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="catalog-section">
                    <h5 class="catalog-title">
                        <a href="/catalog.html?catalog=${catalog.slug}" class="text-decoration-none">
                            ${this.getCatalogIcon(catalog.name)} ${catalog.name}
                        </a>
                    </h5>
                    ${catalog.groups && catalog.groups.length > 0 ? `
                        <ul class="catalog-groups list-unstyled">
                            ${catalog.groups.slice(0, 5).map(group => `
                                <li class="catalog-group">
                                    <a href="/catalog.html?catalog=${catalog.slug}&group=${group.slug}" class="text-decoration-none">
                                        ${group.name}
                                    </a>
                                    ${group.categories && group.categories.length > 0 ? `
                                        <ul class="catalog-categories list-unstyled ms-3">
                                            ${group.categories.slice(0, 3).map(category => `
                                                <li class="catalog-category">
                                                    <a href="/catalog.html?catalog=${catalog.slug}&group=${group.slug}&category=${category.slug}" class="text-decoration-none small">
                                                        ${category.name}
                                                    </a>
                                                </li>
                                            `).join('')}
                                            ${group.categories.length > 3 ? `
                                                <li class="catalog-category">
                                                    <a href="/catalog.html?catalog=${catalog.slug}&group=${group.slug}" class="text-decoration-none small text-muted">
                                                        +${group.categories.length - 3} еще...
                                                    </a>
                                                </li>
                                            ` : ''}
                                        </ul>
                                    ` : ''}
                                </li>
                            `).join('')}
                            ${catalog.groups.length > 5 ? `
                                <li class="catalog-group">
                                    <a href="/catalog.html?catalog=${catalog.slug}" class="text-decoration-none text-muted">
                                        +${catalog.groups.length - 5} групп еще...
                                    </a>
                                </li>
                            ` : ''}
                        </ul>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    closeMegaMenu() {
        const dropdown = document.querySelector('.catalogs-btn');
        if (dropdown) {
            const dropdownMenu = bootstrap.Dropdown.getInstance(dropdown);
            if (dropdownMenu) {
                dropdownMenu.hide();
            }
        }
    }

    // Search
    async handleSearch() {
        const query = document.getElementById('searchInput').value.trim();
        if (!query) return;

        this.filters.search = query;
        this.currentPage = 1;
        this.loadProducts();
    }

    // Filters
    applyFilters() {
        this.currentPage = 1;
        this.loadProducts();
    }

    clearFilters() {
        this.filters = {
            section: '',
            vendor: '',
            minPrice: '',
            maxPrice: '',
            sort: 'createdAt_desc',
            isPromo: false,
            isNew: false,
            search: ''
        };

        // Reset form inputs
        document.getElementById('categoryFilter').value = '';
        document.getElementById('brandFilter').value = '';
        document.getElementById('minPrice').value = '';
        document.getElementById('maxPrice').value = '';
        document.getElementById('sortFilter').value = 'createdAt_desc';
        document.getElementById('featuredFilter').checked = false;
        document.getElementById('saleFilter').checked = false;
        document.getElementById('searchInput').value = '';

        // Reset mobile form inputs
        if (document.getElementById('mobileCategoryFilter')) {
            document.getElementById('mobileCategoryFilter').value = '';
            document.getElementById('mobileBrandFilter').value = '';
            document.getElementById('mobileMinPrice').value = '';
            document.getElementById('mobileMaxPrice').value = '';
            document.getElementById('mobileSortFilter').value = 'createdAt_desc';
            document.getElementById('mobileFeaturedFilter').checked = false;
            document.getElementById('mobileSaleFilter').checked = false;
        }

        this.currentPage = 1;
        this.loadProducts();
    }

    // Mobile filters support
    applyMobileFilters() {
        this.filters.section = document.getElementById('mobileCategoryFilter').value;
        this.filters.vendor = document.getElementById('mobileBrandFilter').value;
        this.filters.minPrice = document.getElementById('mobileMinPrice').value;
        this.filters.maxPrice = document.getElementById('mobileMaxPrice').value;
        this.filters.sort = document.getElementById('mobileSortFilter').value;
        this.filters.isPromo = document.getElementById('mobileFeaturedFilter').checked;
        this.filters.isNew = document.getElementById('mobileSaleFilter').checked;
        
        this.currentPage = 1;
        this.loadProducts();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('filtersModal'));
        if (modal) {
            modal.hide();
        }
    }

    // View Mode
    setViewMode(mode) {
        this.viewMode = mode;
        
        const gridBtn = document.getElementById('gridView');
        const listBtn = document.getElementById('listView');
        
        if (mode === 'grid') {
            gridBtn.classList.add('active');
            listBtn.classList.remove('active');
        } else {
            listBtn.classList.add('active');
            gridBtn.classList.remove('active');
        }

        this.loadProducts();
    }

    // Pagination
    updatePagination(currentPage, totalPages, total) {
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.totalProducts = total;

        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="catalogApp.goToPage(${currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="catalogApp.goToPage(1)">1</a>
                </li>
            `;
            if (startPage > 2) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="catalogApp.goToPage(${i})">${i}</a>
                </li>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="catalogApp.goToPage(${totalPages})">${totalPages}</a>
                </li>
            `;
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="catalogApp.goToPage(${currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        pagination.innerHTML = paginationHTML;
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadProducts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    updateResultsCount(total) {
        document.getElementById('resultsCount').textContent = total;
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        const grid = document.getElementById('productsGrid');
        
        if (show) {
            spinner.style.display = 'flex';
            grid.style.opacity = '0.5';
        } else {
            spinner.style.display = 'none';
            grid.style.opacity = '1';
        }
    }

    // Cart
    async loadCart() {
        if (!this.token) return;

        try {
            const data = await this.apiRequest('/cart');
            this.cart = data.items;
            this.updateCartUI();
        } catch (error) {
            console.error('Error loading cart:', error);
        }
    }

    async addToCart(productId) {
        if (!this.token) {
            this.showToast('Войдите в систему для добавления товаров в корзину', 'warning');
            return;
        }

        try {
            const data = await this.apiRequest('/cart/add', {
                method: 'POST',
                body: JSON.stringify({ productId, quantity: 1 })
            });

            this.cart = data.cart;
            this.updateCartUI();
            this.showToast('Товар добавлен в корзину', 'success');
        } catch (error) {
            this.showToast('Ошибка добавления в корзину: ' + error.message, 'error');
        }
    }

    updateCartUI() {
        const cartCount = document.getElementById('cartCount');
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }

    showCart() {
        if (!this.token) {
            this.showToast('Войдите в систему для просмотра корзины', 'warning');
            return;
        }

        const cartItems = document.getElementById('cartItems');
        
        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <h4>Корзина пуста</h4>
                    <p>Добавьте товары в корзину</p>
                </div>
            `;
        } else {
            cartItems.innerHTML = this.cart.map(item => `
                <div class="cart-item">
                    <div class="row align-items-center">
                        <div class="col-2">
                            <img src="${this.getProductImageUrl(item.product)}" class="cart-item-img" alt="${item.product.title}" 
                                 onerror="this.src='/images/placeholder.jpg'; this.onerror=null;" 
                                 onload="this.style.opacity='1';" 
                                 style="opacity: 0; transition: opacity 0.3s;">
                        </div>
                        <div class="col-4">
                                                    <h6 class="mb-0">${item.product.title}</h6>
                        <small class="text-muted">${item.product.vendor?.title || 'Неизвестный производитель'}</small>
                        </div>
                        <div class="col-3">
                            <div class="quantity-controls">
                                <button class="quantity-btn" onclick="catalogApp.updateCartItemQuantity('${item.product._id}', ${item.quantity - 1})">-</button>
                                <span>${item.quantity}</span>
                                <button class="quantity-btn" onclick="catalogApp.updateCartItemQuantity('${item.product._id}', ${item.quantity + 1})">+</button>
                            </div>
                        </div>
                        <div class="col-2">
                            <span class="fw-bold">${item.price * item.quantity} грн.</span>
                        </div>
                        <div class="col-1">
                            <button class="btn btn-sm btn-outline-danger" onclick="catalogApp.removeFromCart('${item.product._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');

            const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            document.getElementById('cartTotal').textContent = `${total} грн.`;
        }

        const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
        cartModal.show();
    }

    async updateCartItemQuantity(productId, quantity) {
        try {
            const data = await this.apiRequest(`/cart/update/${productId}`, {
                method: 'PUT',
                body: JSON.stringify({ quantity })
            });

            this.cart = data.cart;
            this.updateCartUI();
        } catch (error) {
            this.showToast('Ошибка обновления корзины: ' + error.message, 'error');
        }
    }

    async removeFromCart(productId) {
        try {
            const data = await this.apiRequest(`/cart/remove/${productId}`, {
                method: 'DELETE'
            });

            this.cart = data.cart;
            this.updateCartUI();
            this.showToast('Товар удален из корзины', 'success');
        } catch (error) {
            this.showToast('Ошибка удаления из корзины: ' + error.message, 'error');
        }
    }

    async handleCheckout() {
        if (!this.token) {
            this.showToast('Войдите в систему для оформления заказа', 'warning');
            return;
        }

        if (this.cart.length === 0) {
            this.showToast('Корзина пуста', 'warning');
            return;
        }

        this.showToast('Заказ оформлен! Скоро мы свяжемся с вами.', 'success');
        
        try {
            await this.apiRequest('/cart/clear', { method: 'DELETE' });
            this.cart = [];
            this.updateCartUI();
            
            const cartModal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
            cartModal.hide();
        } catch (error) {
            console.error('Error clearing cart:', error);
        }
    }

    // LocalStorage caching methods
    saveCatalogsToLocalStorage(catalogs, type) {
        try {
            const data = {
                catalogs: catalogs,
                timestamp: Date.now(),
                version: '1.0'
            };
            localStorage.setItem(`bifo_catalogs_${type}`, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    getCatalogsFromLocalStorage(type) {
        try {
            const data = localStorage.getItem(`bifo_catalogs_${type}`);
            if (!data) return null;

            const parsed = JSON.parse(data);
            const ageHours = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
            
            // Cache expires after 7 days
            if (ageHours > 168) {
                localStorage.removeItem(`bifo_catalogs_${type}`);
                return null;
            }

            return parsed.catalogs;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            localStorage.removeItem(`bifo_catalogs_${type}`);
            return null;
        }
    }

    clearCatalogsFromLocalStorage(type) {
        localStorage.removeItem(`bifo_catalogs_${type}`);
    }

    clearAllCatalogCache() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('bifo_catalogs_')) {
                localStorage.removeItem(key);
            }
        });
    }

    refreshCatalogs(type) {
        this.clearCatalogsFromLocalStorage(type);
        if (type === 'main') {
            this.loadCategories();
        } else if (type === 'mega') {
            this.loadMegaMenu();
        } else if (type.startsWith('structure_')) {
            const catalogSlug = type.replace('structure_', '');
            this.loadCatalogStructure(catalogSlug);
        }
    }

    async loadCatalogStructure(catalogSlug) {
        try {
            // Try to get from localStorage first
            const cachedData = this.getCatalogsFromLocalStorage(`structure_${catalogSlug}`);
            if (cachedData) {
                return cachedData;
            }

            // If no cache, get from API
            const structure = await this.apiRequest(`/catalogs/structure/${catalogSlug}`);
            this.saveCatalogsToLocalStorage(structure, `structure_${catalogSlug}`);
            return structure;
        } catch (error) {
            console.error('Error loading catalog structure:', error);
            return null;
        }
    }

    getCatalogCacheInfo() {
        const info = {};
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith('bifo_catalogs_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    const ageHours = (Date.now() - data.timestamp) / (1000 * 60 * 60);
                    const type = key.replace('bifo_catalogs_', '');
                    
                    info[type] = {
                        ageHours: Math.round(ageHours),
                        itemCount: Array.isArray(data.catalogs) ? data.catalogs.length : 0,
                        version: data.version,
                        timestamp: data.timestamp
                    };
                } catch (error) {
                    info[key.replace('bifo_catalogs_', '')] = { error: 'Corrupted data' };
                }
            }
        });
        
        return info;
    }

    // Utility methods
    showToast(message, type = 'info') {
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-body">
                <i class="fas fa-${this.getToastIcon(type)} me-2"></i>
                ${message}
            </div>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Улучшенное позиционирование мега меню
    setupMegaMenuPositioning() {
        const megaMenu = document.querySelector('.mega-menu');
        const catalogsBtn = document.querySelector('.catalogs-btn');
        
        if (!megaMenu || !catalogsBtn) return;

        // Функция для проверки и корректировки позиции
        const adjustMegaMenuPosition = () => {
            const btnRect = catalogsBtn.getBoundingClientRect();
            const menuRect = megaMenu.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            
            // Удаляем все классы позиционирования
            megaMenu.classList.remove('position-top', 'position-left', 'position-right');
            
            // Проверяем, не выходит ли меню за нижнюю границу экрана
            if (btnRect.bottom + menuRect.height > viewportHeight) {
                // Если выходит, позиционируем сверху от кнопки
                megaMenu.classList.add('position-top');
            }
            
            // Добавляем класс для анимации
            megaMenu.classList.add('show');
        };

        // Добавляем обработчики событий
        window.addEventListener('resize', adjustMegaMenuPosition);
        window.addEventListener('scroll', adjustMegaMenuPosition);
        
        // Обработчик для Bootstrap dropdown
        catalogsBtn.addEventListener('shown.bs.dropdown', () => {
            // Небольшая задержка для корректного расчета размеров
            setTimeout(adjustMegaMenuPosition, 10);
        });
        
        // Обработчик для скрытия dropdown
        catalogsBtn.addEventListener('hidden.bs.dropdown', () => {
            megaMenu.classList.remove('show', 'position-top', 'position-left', 'position-right');
        });
        
        // Начальная настройка
        adjustMegaMenuPosition();
    }
}

// Initialize catalog app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.catalogApp = new CatalogApp();
}); 