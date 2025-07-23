// BIFO E-commerce Application
class BifoApp {
    constructor() {
        this.apiBase = '/api';
        this.token = localStorage.getItem('bifo_token');
        this.user = JSON.parse(localStorage.getItem('bifo_user'));
        this.cart = [];
        
        this.init();
    }

    // LocalStorage methods for catalogs
    saveCatalogsToLocalStorage(catalogs, type = 'main') {
        try {
            const key = `bifo_catalogs_${type}`;
            const timestamp = Date.now();
            const data = {
                catalogs: catalogs,
                timestamp: timestamp,
                version: '1.0'
            };
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`Catalogs saved to localStorage: ${key}`, data);
        } catch (error) {
            console.error('Error saving catalogs to localStorage:', error);
        }
    }

    getCatalogsFromLocalStorage(type = 'main') {
        try {
            const key = `bifo_catalogs_${type}`;
            const data = localStorage.getItem(key);
            if (!data) return null;

            const parsed = JSON.parse(data);
            
            // Check if data is not too old (7 days)
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
            if (Date.now() - parsed.timestamp > maxAge) {
                console.log(`LocalStorage data for ${key} is too old, removing`);
                localStorage.removeItem(key);
                return null;
            }

            console.log(`Catalogs loaded from localStorage: ${key}`, parsed);
            return parsed.catalogs;
        } catch (error) {
            console.error('Error loading catalogs from localStorage:', error);
            return null;
        }
    }

    clearCatalogsFromLocalStorage(type = 'main') {
        try {
            const key = `bifo_catalogs_${type}`;
            localStorage.removeItem(key);
            console.log(`Catalogs cleared from localStorage: ${key}`);
        } catch (error) {
            console.error('Error clearing catalogs from localStorage:', error);
        }
    }

    // Force refresh catalogs from server
    async refreshCatalogs(type = 'main') {
        console.log(`Forcing refresh of catalogs: ${type}`);
        
        // Clear cached data
        this.clearCatalogsFromLocalStorage(type);
        
        // Reload based on type
        if (type === 'main') {
            await this.loadCatalogs();
        } else if (type === 'mega') {
            await this.loadMegaMenuCategories();
        } else if (type.startsWith('structure_')) {
            const catalogSlug = type.replace('structure_', '');
            const catalog = this.catalogs ? this.catalogs.find(cat => cat.slug === catalogSlug) : null;
            if (catalog) {
                await this.loadCatalogStructure(catalogSlug, catalog.name);
            }
        }
    }

    // Clear all catalog cache
    clearAllCatalogCache() {
        try {
            const keys = Object.keys(localStorage);
            const catalogKeys = keys.filter(key => key.startsWith('bifo_catalogs_'));
            catalogKeys.forEach(key => {
                localStorage.removeItem(key);
                console.log(`Cleared catalog cache: ${key}`);
            });
            console.log('All catalog cache cleared');
        } catch (error) {
            console.error('Error clearing all catalog cache:', error);
        }
    }

    // Get catalog cache info
    getCatalogCacheInfo() {
        try {
            const keys = Object.keys(localStorage);
            const catalogKeys = keys.filter(key => key.startsWith('bifo_catalogs_'));
            const cacheInfo = {};
            
            catalogKeys.forEach(key => {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    const age = Date.now() - data.timestamp;
                    const ageHours = Math.floor(age / (1000 * 60 * 60));
                    
                    cacheInfo[key] = {
                        timestamp: data.timestamp,
                        age: age,
                        ageHours: ageHours,
                        version: data.version,
                        itemCount: Array.isArray(data.catalogs) ? data.catalogs.length : 'N/A'
                    };
                } catch (e) {
                    cacheInfo[key] = { error: 'Invalid data' };
                }
            });
            
            console.log('Catalog cache info:', cacheInfo);
            return cacheInfo;
        } catch (error) {
            console.error('Error getting catalog cache info:', error);
            return {};
        }
    }

    async init() {
        // Ждем загрузки компонентов
        await this.waitForComponents();
        
        this.setupEventListeners();
        this.loadCatalogs();
        this.loadFeaturedProducts();
        this.updateUI();
        this.loadCart();
    }

    async waitForComponents() {
        return new Promise((resolve) => {
            const requiredComponents = ['header', 'footer', 'modals', 'mega-menu'];
            const checkComponents = () => {
                if (window.componentLoader && 
                    requiredComponents.every(comp => window.componentLoader.isComponentLoaded(comp))) {
                    resolve();
                } else {
                    setTimeout(checkComponents, 100);
                }
            };
            checkComponents();
        });
    }

    setupEventListeners() {
        // Navigation - добавляем проверки на существование элементов
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }
        
        const cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => this.showCartModal());
        }
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Mega Menu
        const megaMenuBtn = document.getElementById('megaMenuBtn');
        if (megaMenuBtn) {
            megaMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showMegaMenu();
            });
        }
        
        // Search
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.searchProducts();
            });
        }
        
        // Modals
        const showRegisterForm = document.getElementById('showRegisterForm');
        if (showRegisterForm) {
            showRegisterForm.addEventListener('click', () => this.showRegisterModal());
        }
        
        const showLoginForm = document.getElementById('showLoginForm');
        if (showLoginForm) {
            showLoginForm.addEventListener('click', () => this.showLoginModal());
        }
        
        // Forms
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }
        
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.register();
            });
        }
        
        // Checkout
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.checkout());
        }
        
        // Mega Menu Events
        document.addEventListener('click', (e) => {
            if (e.target.id === 'megaMenuClose' || e.target.id === 'megaMenuOverlay') {
                this.hideMegaMenu();
            }
        });
        
        // Keyboard events for mega menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('megaMenuWrapper').style.display !== 'none') {
                this.hideMegaMenu();
            }
        });

        // Add to cart buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart-btn')) {
                const productId = e.target.closest('.add-to-cart-btn').dataset.productId;
                this.addToCart(productId);
            }
        });

        // Cart quantity buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.decrease-btn')) {
                const productId = e.target.closest('.decrease-btn').dataset.productId;
                const quantity = parseInt(e.target.closest('.decrease-btn').dataset.quantity);
                this.updateCartItem(productId, quantity);
            }
            if (e.target.closest('.increase-btn')) {
                const productId = e.target.closest('.increase-btn').dataset.productId;
                const quantity = parseInt(e.target.closest('.increase-btn').dataset.quantity);
                this.updateCartItem(productId, quantity);
            }
            if (e.target.closest('.remove-from-cart-btn')) {
                const productId = e.target.closest('.remove-from-cart-btn').dataset.productId;
                this.removeFromCart(productId);
            }
        });

        // Cart quantity input
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('quantity-input')) {
                const productId = e.target.dataset.productId;
                const quantity = parseInt(e.target.value);
                this.updateCartItem(productId, quantity);
            }
        });

        // Category links
        document.addEventListener('click', (e) => {
            if (e.target.closest('.show-category-link')) {
                e.preventDefault();
                const link = e.target.closest('.show-category-link');
                const catalogSlug = link.dataset.catalog;
                const groupSlug = link.dataset.group;
                const categorySlug = link.dataset.category;
                
                if (catalogSlug && groupSlug && categorySlug) {
                    this.showCategory(catalogSlug, groupSlug, categorySlug);
                } else if (link.dataset.slug) {
                    // Fallback for old structure
                    this.showCatalog(link.dataset.slug);
                }
            }
        });
    }

    // API Methods
    async apiRequest(endpoint, options = {}) {
        const url = `${this.apiBase}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
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
            // Don't show alert for API errors in mega menu context
            if (!endpoint.includes('/categories')) {
                this.showAlert(error.message, 'danger');
            }
            throw error;
        }
    }

    // Authentication
    async login() {
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        
        if (!emailInput || !passwordInput) return;
        
        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            const response = await this.apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            this.token = response.data.token;
            this.user = response.data.user;
            
            localStorage.setItem('bifo_token', this.token);
            localStorage.setItem('bifo_user', JSON.stringify(this.user));
            
            this.updateUI();
            this.hideLoginModal();
            this.showAlert('Успешный вход в систему!', 'success');
            
        } catch (error) {
            console.error('Login error:', error);
        }
    }

    async register() {
        const emailInput = document.getElementById('registerEmail');
        const passwordInput = document.getElementById('registerPassword');
        const firstNameInput = document.getElementById('registerFirstName');
        const lastNameInput = document.getElementById('registerLastName');
        const phoneInput = document.getElementById('registerPhone');
        
        if (!emailInput || !passwordInput || !firstNameInput || !lastNameInput) return;
        
        const formData = {
            email: emailInput.value,
            password: passwordInput.value,
            firstName: firstNameInput.value,
            lastName: lastNameInput.value,
            phone: phoneInput ? phoneInput.value : ''
        };

        try {
            const response = await this.apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            this.token = response.data.token;
            this.user = response.data.user;
            
            localStorage.setItem('bifo_token', this.token);
            localStorage.setItem('bifo_user', JSON.stringify(this.user));
            
            this.updateUI();
            this.hideRegisterModal();
            this.showAlert('Регистрация успешна!', 'success');
            
        } catch (error) {
            console.error('Register error:', error);
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('bifo_token');
        localStorage.removeItem('bifo_user');
        this.updateUI();
        this.showAlert('Вы вышли из системы', 'info');
    }

    // Catalogs
    async loadCatalogs() {
        // First try to load from localStorage
        const cachedCatalogs = this.getCatalogsFromLocalStorage('main');
        if (cachedCatalogs) {
            console.log('Using cached catalogs from localStorage');
            this.catalogs = cachedCatalogs;
            this.renderCatalogs(cachedCatalogs);
            this.renderCatalogsDropdown(cachedCatalogs);
            return;
        }

        // If no cached data, check server availability
        if (!this.isServerAvailable()) {
            console.log('Server not available, using mock catalogs');
            const mockCatalogs = this.getMockCatalogs();
            this.saveCatalogsToLocalStorage(mockCatalogs, 'main');
            this.catalogs = mockCatalogs;
            this.renderCatalogs(mockCatalogs);
            this.renderCatalogsDropdown(mockCatalogs);
            return;
        }

        try {
            const response = await this.apiRequest('/catalogs/main');
            this.catalogs = response.data;
            // Save to localStorage for future use
            this.saveCatalogsToLocalStorage(response.data, 'main');
            this.renderCatalogs(response.data);
            this.renderCatalogsDropdown(response.data);
        } catch (error) {
            console.log('API error, using mock catalogs');
            const mockCatalogs = this.getMockCatalogs();
            this.saveCatalogsToLocalStorage(mockCatalogs, 'main');
            this.catalogs = mockCatalogs;
            this.renderCatalogs(mockCatalogs);
            this.renderCatalogsDropdown(mockCatalogs);
        }
    }

    renderCatalogs(catalogs) {
        const container = document.getElementById('categoriesGrid');
        const catalogIcons = {
            'computer': 'fas fa-laptop',
            'auto': 'fas fa-car',
            'fashion': 'fas fa-tshirt',
            'dom': 'fas fa-home',
            'dacha_sad': 'fas fa-seedling',
            'deti': 'fas fa-baby',
            'krasota': 'fas fa-heartbeat',
            'pobutova_himiia': 'fas fa-spray-can',
            'musical_instruments': 'fas fa-music',
            'mobile': 'fas fa-mobile-alt',
            'remont': 'fas fa-tools',
            'sport': 'fas fa-dumbbell',
            'zootovary': 'fas fa-paw',
            'tools': 'fas fa-wrench',
            'bt': 'fas fa-tv',
            'av': 'fas fa-headphones',
            'adult': 'fas fa-gift',
            'military': 'fas fa-shield-alt',
            'power': 'fas fa-bolt',
            'constructors-lego': 'fas fa-cubes'
        };

        // Filter only main catalogs (level 0)
        const mainCatalogs = catalogs.filter(cat => cat.level === 0).slice(0, 8);

        container.innerHTML = mainCatalogs.map(catalog => `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="category-card" data-action="show-catalog" data-slug="${catalog.slug}">
                    <div class="category-icon">
                        <i class="${catalogIcons[catalog.slug] || 'fas fa-box'}"></i>
                    </div>
                    <h5>${catalog.name}</h5>
                    <p class="text-muted">${catalog.description || 'Широкий ассортимент товаров'}</p>
                </div>
            </div>
        `).join('');

        // Add event listeners for catalog cards
        container.querySelectorAll('[data-action="show-catalog"]').forEach(element => {
            element.addEventListener('click', (e) => {
                const slug = e.currentTarget.dataset.slug;
                this.showCatalog(slug);
            });
        });
    }

    renderCatalogsDropdown(catalogs) {
        const container = document.getElementById('categoriesDropdown');
        if (!container) return;

        const catalogIcons = {
            'computer': 'fas fa-laptop',
            'auto': 'fas fa-car',
            'fashion': 'fas fa-tshirt',
            'dom': 'fas fa-home',
            'dacha_sad': 'fas fa-seedling',
            'deti': 'fas fa-baby',
            'krasota': 'fas fa-heartbeat',
            'pobutova_himiia': 'fas fa-spray-can',
            'musical_instruments': 'fas fa-music',
            'mobile': 'fas fa-mobile-alt',
            'remont': 'fas fa-tools',
            'sport': 'fas fa-dumbbell',
            'zootovary': 'fas fa-paw',
            'tools': 'fas fa-wrench',
            'bt': 'fas fa-tv',
            'av': 'fas fa-headphones',
            'adult': 'fas fa-gift',
            'military': 'fas fa-shield-alt',
            'power': 'fas fa-bolt',
            'constructors-lego': 'fas fa-cubes'
        };

        const mainCatalogs = catalogs.filter(cat => cat.level === 0);

        container.innerHTML = mainCatalogs.map(catalog => `
            <a class="dropdown-item" href="#" data-action="show-catalog" data-slug="${catalog.slug}">
                <i class="${catalogIcons[catalog.slug] || 'fas fa-box'} me-2"></i>
                ${catalog.name}
            </a>
        `).join('');

        // Add event listeners
        container.querySelectorAll('[data-action="show-catalog"]').forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const slug = e.currentTarget.dataset.slug;
                this.showCatalog(slug);
            });
        });
    }

    renderCategoriesDropdown(categories) {
        // This method is now deprecated in favor of mega menu
        // Keeping for backward compatibility
    }

    // Mega Menu Methods
    showMegaMenu() {
        const wrapper = document.getElementById('megaMenuWrapper');
        if (!wrapper) return;
        wrapper.style.display = 'block';
        document.body.style.overflow = 'hidden';
        this.loadMegaMenuCategories();
    }

    hideMegaMenu() {
        const wrapper = document.getElementById('megaMenuWrapper');
        if (!wrapper) return;
        wrapper.style.display = 'none';
        document.body.style.overflow = '';
    }

    async loadMegaMenuCategories() {
        // First try to load from localStorage
        const cachedCatalogs = this.getCatalogsFromLocalStorage('mega');
        if (cachedCatalogs) {
            console.log('Using cached mega menu catalogs from localStorage');
            this.renderMegaMenuCatalogs(cachedCatalogs);
            return;
        }

        // Check if server is available
        if (!(await this.isServerAvailable())) {
            console.log('Server not available, using mock data for mega menu');
            const mockCatalogs = this.getMockMegaMenuData();
            this.saveCatalogsToLocalStorage(mockCatalogs, 'mega');
            this.renderMegaMenuCatalogs(mockCatalogs);
            return;
        }

        try {
            const response = await this.apiRequest('/catalogs');
            // Save to localStorage for future use
            this.saveCatalogsToLocalStorage(response.data, 'mega');
            this.renderMegaMenuCatalogs(response.data);
        } catch (error) {
            console.log('API error, using mock data for mega menu');
            const mockCatalogs = this.getMockMegaMenuData();
            this.saveCatalogsToLocalStorage(mockCatalogs, 'mega');
            this.renderMegaMenuCatalogs(mockCatalogs);
        }
    }

    async isServerAvailable() {
        // Check if server is running by making a test request
        try {
            const response = await fetch('/api/catalogs', { 
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    getMockCatalogs() {
        return [
            { slug: 'computer', name: 'Компьютеры и электроника', level: 0, productCount: 1250 },
            { slug: 'auto', name: 'Автотовары', level: 0, productCount: 890 },
            { slug: 'fashion', name: 'Одежда и мода', level: 0, productCount: 2100 },
            { slug: 'dom', name: 'Дом и сад', level: 0, productCount: 1560 },
            { slug: 'dacha_sad', name: 'Дача и сад', level: 0, productCount: 720 },
            { slug: 'deti', name: 'Детские товары', level: 0, productCount: 980 },
            { slug: 'krasota', name: 'Красота и здоровье', level: 0, productCount: 650 },
            { slug: 'pobutova_himiia', name: 'Бытовая химия', level: 0, productCount: 320 },
            { slug: 'musical_instruments', name: 'Музыкальные инструменты', level: 0, productCount: 450 },
            { slug: 'mobile', name: 'Мобильные устройства', level: 0, productCount: 1100 },
            { slug: 'remont', name: 'Ремонт и строительство', level: 0, productCount: 830 },
            { slug: 'sport', name: 'Спорт и отдых', level: 0, productCount: 1200 },
            { slug: 'zootovary', name: 'Зоотовары', level: 0, productCount: 540 },
            { slug: 'tools', name: 'Инструменты', level: 0, productCount: 670 },
            { slug: 'bt', name: 'Бытовая техника', level: 0, productCount: 890 },
            { slug: 'av', name: 'Аудио и видео', level: 0, productCount: 760 },
            { slug: 'adult', name: 'Товары для взрослых', level: 0, productCount: 420 },
            { slug: 'military', name: 'Военное снаряжение', level: 0, productCount: 380 }
        ];
    }

    getMockSubcategories(categorySlug) {
        const subcategoriesMap = {
            'computer': [
                { slug: 'noutbuki-netbuki', name: 'Ноутбуки и нетбуки', description: 'Портативные компьютеры для работы и учебы', productCount: 150 },
                { slug: 'nastolnye-kompyutery', name: 'Настольные компьютеры', description: 'Мощные ПК для игр и работы', productCount: 120 },
                { slug: 'monitory', name: 'Мониторы', description: 'Экраны для компьютеров и ноутбуков', productCount: 200 },
                { slug: 'klaviatury', name: 'Клавиатуры', description: 'Устройства ввода для компьютеров', productCount: 180 },
                { slug: 'myshi-klaviatury', name: 'Мыши', description: 'Компьютерные мыши и аксессуары', productCount: 160 },
                { slug: 'printery-kopiry-mfu', name: 'Принтеры и МФУ', description: 'Печатающие устройства', productCount: 90 }
            ],
            'dom': [
                { slug: 'mebel', name: 'Мебель', description: 'Мебель для дома и офиса', productCount: 300 },
                { slug: 'osveschenie-electrica', name: 'Освещение', description: 'Светильники и лампы', productCount: 250 },
                { slug: 'posuda', name: 'Посуда', description: 'Кухонная посуда и столовые приборы', productCount: 400 },
                { slug: 'tekstil', name: 'Текстиль', description: 'Постельное белье и домашний текстиль', productCount: 280 },
                { slug: 'dekor', name: 'Декор', description: 'Предметы декора для дома', productCount: 200 }
            ],
            'sport': [
                { slug: 'futbol', name: 'Футбол', description: 'Футбольное снаряжение и мячи', productCount: 150 },
                { slug: 'basketbol', name: 'Баскетбол', description: 'Баскетбольные мячи и кольца', productCount: 120 },
                { slug: 'tennis', name: 'Теннис', description: 'Теннисные ракетки и мячи', productCount: 100 },
                { slug: 'fitness', name: 'Фитнес', description: 'Тренажеры и спортивное питание', productCount: 300 },
                { slug: 'turizm', name: 'Туризм', description: 'Туристическое снаряжение', productCount: 250 }
            ],
            'auto': [
                { slug: 'avtohimia', name: 'Автохимия', description: 'Средства для ухода за автомобилем', productCount: 200 },
                { slug: 'avtoaksessuary', name: 'Автоаксессуары', description: 'Аксессуары для автомобиля', productCount: 350 },
                { slug: 'avtozapchasti', name: 'Автозапчасти', description: 'Запчасти для автомобилей', productCount: 400 },
                { slug: 'avtoelektronika', name: 'Автоэлектроника', description: 'Электроника для автомобиля', productCount: 180 }
            ],
            'fashion': [
                { slug: 'muzhskaya-odezhda', name: 'Мужская одежда', description: 'Одежда для мужчин', productCount: 500 },
                { slug: 'zhenskaia-odezhda', name: 'Женская одежда', description: 'Одежда для женщин', productCount: 800 },
                { slug: 'detskaia-odezhda', name: 'Детская одежда', description: 'Одежда для детей', productCount: 400 },
                { slug: 'obuv', name: 'Обувь', description: 'Обувь для всей семьи', productCount: 600 },
                { slug: 'aksessuary', name: 'Аксессуары', description: 'Сумки, ремни, украшения', productCount: 350 }
            ],
            'dacha_sad': [
                { slug: 'sadovye-instrumenty', name: 'Садовые инструменты', description: 'Инструменты для сада', productCount: 200 },
                { slug: 'semena-i-rassada', name: 'Семена и рассада', description: 'Семена растений и рассада', productCount: 300 },
                { slug: 'udobreniia', name: 'Удобрения', description: 'Удобрения для растений', productCount: 150 },
                { slug: 'sadovaia-mebel', name: 'Садовая мебель', description: 'Мебель для сада и дачи', productCount: 100 }
            ],
            'deti': [
                { slug: 'igrushki', name: 'Игрушки', description: 'Игрушки для детей всех возрастов', productCount: 600 },
                { slug: 'detskaia-mebel', name: 'Детская мебель', description: 'Мебель для детской комнаты', productCount: 200 },
                { slug: 'detskoe-pitanie', name: 'Детское питание', description: 'Питание для детей', productCount: 300 },
                { slug: 'detskaia-odezhda', name: 'Детская одежда', description: 'Одежда для детей', productCount: 400 }
            ],
            'krasota': [
                { slug: 'kosmetika', name: 'Косметика', description: 'Декоративная косметика', productCount: 400 },
                { slug: 'ukhod-za-kozhei', name: 'Уход за кожей', description: 'Средства по уходу за кожей', productCount: 350 },
                { slug: 'ukhod-za-volosami', name: 'Уход за волосами', description: 'Средства по уходу за волосами', productCount: 300 },
                { slug: 'parfumeria', name: 'Парфюмерия', description: 'Духи и туалетная вода', productCount: 250 }
            ],
            'pobutova_himiia': [
                { slug: 'stirka', name: 'Стирка', description: 'Средства для стирки', productCount: 200 },
                { slug: 'uborka', name: 'Уборка', description: 'Средства для уборки', productCount: 250 },
                { slug: 'posuda', name: 'Мытье посуды', description: 'Средства для мытья посуды', productCount: 150 }
            ],
            'musical_instruments': [
                { slug: 'gitary', name: 'Гитары', description: 'Акустические и электрогитары', productCount: 100 },
                { slug: 'klavishnye', name: 'Клавишные', description: 'Пианино и синтезаторы', productCount: 80 },
                { slug: 'dukhovye', name: 'Духовые', description: 'Духовые инструменты', productCount: 60 },
                { slug: 'udarnye', name: 'Ударные', description: 'Барабаны и перкуссия', productCount: 70 }
            ],
            'mobile': [
                { slug: 'smartfony', name: 'Смартфоны', description: 'Мобильные телефоны', productCount: 300 },
                { slug: 'planshety', name: 'Планшеты', description: 'Планшетные компьютеры', productCount: 150 },
                { slug: 'aksessuary-dlia-telefonov', name: 'Аксессуары', description: 'Чехлы, зарядки, наушники', productCount: 400 }
            ],
            'remont': [
                { slug: 'instrumenty', name: 'Инструменты', description: 'Строительные инструменты', productCount: 300 },
                { slug: 'materialy', name: 'Материалы', description: 'Строительные материалы', productCount: 500 },
                { slug: 'santehnika', name: 'Сантехника', description: 'Сантехническое оборудование', productCount: 200 }
            ],
            'zootovary': [
                { slug: 'korm-dlia-koshek', name: 'Корм для кошек', description: 'Питание для кошек', productCount: 150 },
                { slug: 'korm-dlia-sobak', name: 'Корм для собак', description: 'Питание для собак', productCount: 200 },
                { slug: 'aksessuary-dlia-zhivotnykh', name: 'Аксессуары', description: 'Игрушки, поводки, миски', productCount: 250 }
            ],
            'tools': [
                { slug: 'ruchnye-instrumenty', name: 'Ручные инструменты', description: 'Молотки, отвертки, ключи', productCount: 200 },
                { slug: 'elektroinstrumenty', name: 'Электроинструменты', description: 'Дрели, пилы, шлифмашины', productCount: 150 },
                { slug: 'izmeritelnye-pribory', name: 'Измерительные приборы', description: 'Линейки, уровни, рулетки', productCount: 100 }
            ],
            'bt': [
                { slug: 'televizory', name: 'Телевизоры', description: 'Телевизоры и Smart TV', productCount: 200 },
                { slug: 'kamera', name: 'Камеры', description: 'Фото и видеокамеры', productCount: 150 },
                { slug: 'proektory', name: 'Проекторы', description: 'Мультимедийные проекторы', productCount: 80 }
            ],
            'av': [
                { slug: 'naushniki', name: 'Наушники', description: 'Наушники и гарнитуры', productCount: 300 },
                { slug: 'kolonki', name: 'Колонки', description: 'Акустические системы', productCount: 200 },
                { slug: 'mikrofony', name: 'Микрофоны', description: 'Микрофоны и звуковое оборудование', productCount: 100 }
            ],
            'adult': [
                { slug: 'podarki', name: 'Подарки', description: 'Подарки для взрослых', productCount: 200 },
                { slug: 'hobby', name: 'Хобби', description: 'Товары для хобби', productCount: 300 }
            ],
            'military': [
                { slug: 'voennaia-forma', name: 'Военная форма', description: 'Военная одежда и обувь', productCount: 100 },
                { slug: 'voennoe-snaryazhenie', name: 'Военное снаряжение', description: 'Снаряжение для военных', productCount: 150 }
            ]
        };
        
        return subcategoriesMap[categorySlug] || [
            { slug: 'podkategoriya-1', name: 'Подкатегория 1', description: 'Описание подкатегории', productCount: 50 },
            { slug: 'podkategoriya-2', name: 'Подкатегория 2', description: 'Описание подкатегории', productCount: 75 },
            { slug: 'podkategoriya-3', name: 'Подкатегория 3', description: 'Описание подкатегории', productCount: 60 }
        ];
    }

    renderMegaMenuCatalogs(catalogs) {
        const catalogsContainer = document.getElementById('megaMenuCatalogs');
        const categoriesContainer = document.getElementById('megaMenuCategories');
        
        if (!catalogsContainer || !categoriesContainer) return;

        // Фильтрация
        const mainCatalogs = catalogs.filter(cat => cat.level === 0);
        const groups = catalogs.filter(cat => cat.level === 1 && cat.isGroup);
        const categories = catalogs.filter(cat => cat.level === 2);

        // Диагностика
        console.log('ВСЕ КАТАЛОГИ:', catalogs);
        console.log('mainCatalogs:', mainCatalogs);
        console.log('groups:', groups);
        console.log('categories:', categories);

        // Render main catalogs
        catalogsContainer.innerHTML = mainCatalogs.map(catalog => {
            const catalogGroups = groups.filter(group => group.catalogSlug === catalog.slug);
            const totalCategories = categories.filter(cat => 
                catalogGroups.some(group => group.slug === cat.groupSlug)
            ).length;
            
            return `
                <div class="mega-menu-catalog" data-slug="${catalog.slug}">
                    <div class="mega-menu-catalog-icon">
                        <i class="${this.getCatalogIcon(catalog.slug)}"></i>
                    </div>
                    <div class="mega-menu-catalog-name">${catalog.name}</div>
                    <div class="mega-menu-catalog-count">${catalogGroups.length}</div>
                </div>
            `;
        }).join('');

        // Add event listeners for main catalogs
        catalogsContainer.querySelectorAll('.mega-menu-catalog').forEach(element => {
            element.addEventListener('click', () => {
                const slug = element.dataset.slug;
                this.selectMegaMenuCatalog(slug, catalogs);
            });
        });

        // Select first catalog by default
        if (mainCatalogs.length > 0) {
            this.selectMegaMenuCatalog(mainCatalogs[0].slug, catalogs);
        }
    }

    selectMegaMenuCatalog(catalogSlug, catalogs) {
        // Update active state
        document.querySelectorAll('.mega-menu-catalog').forEach(el => {
            el.classList.remove('active');
        });
        document.querySelector(`[data-slug="${catalogSlug}"]`)?.classList.add('active');

        // Get groups for this catalog
        const groups = catalogs.filter(cat => cat.level === 1 && cat.isGroup && cat.catalogSlug === catalogSlug);
        const categories = catalogs.filter(cat => cat.level === 2);
        const catalog = catalogs.find(cat => cat.slug === catalogSlug);
        
        const categoriesContainer = document.getElementById('megaMenuCategories');
        if (!categoriesContainer) return;

        if (groups.length === 0) {
            // No groups - show empty state
            categoriesContainer.innerHTML = `
                <div class="mega-menu-group-section">
                    <div class="mega-menu-group-title">
                        <i class="fas fa-folder-open"></i>
                        ${catalog?.name || 'Каталог'}
                    </div>
                    <div class="p-3 text-center text-muted">
                        <i class="fas fa-info-circle"></i>
                        Нет групп в этом каталоге
                    </div>
                </div>
            `;
            return;
        }

        // Render all groups as sections with their categories
        categoriesContainer.innerHTML = groups.map(group => {
            const groupCategories = categories.filter(cat => cat.groupSlug === group.slug);
            return `
                <div class="mega-menu-group-section">
                    <div class="mega-menu-group-title">
                        <i class="mega-menu-group-icon fas fa-layer-group"></i>
                        ${group.name}
                        <div class="mega-menu-group-count">${groupCategories.length}</div>
                    </div>
                    <div class="mega-menu-category-grid">
                        ${groupCategories.map(category => `
                            <div class="mega-menu-category-item" 
                                 data-catalog="${catalogSlug}" 
                                 data-group="${group.slug}" 
                                 data-category="${category.slug}">
                                <div class="mega-menu-category-name">
                                    ${category.name}
                                    ${category.isReference ? '<i class="fas fa-external-link-alt"></i>' : ''}
                                </div>
                                <div class="mega-menu-category-count">
                                    <i class="fas fa-box"></i>
                                    ${Math.floor(Math.random() * 100) + 10}
                                </div>
                                ${category.isReference ? '<div class="mega-menu-category-reference">Ссылка</div>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners for categories
        categoriesContainer.querySelectorAll('.mega-menu-category-item').forEach(element => {
            element.addEventListener('click', () => {
                const catalogSlug = element.dataset.catalog;
                const groupSlug = element.dataset.group;
                const categorySlug = element.dataset.category;
                this.showCategory(catalogSlug, groupSlug, categorySlug);
                this.hideMegaMenu();
            });
        });
    }



    renderMegaMenuSubcategories(subcategories, categorySlug) {
        const container = document.getElementById('megaMenuSubcategories');
        
        // Check if subcategories is valid array
        if (!Array.isArray(subcategories) || subcategories.length === 0) {
            container.innerHTML = `
                <div class="mega-menu-subcategory-section">
                    <h3 class="mega-menu-subcategory-title">Нет подкатегорий</h3>
                    <p style="color: rgba(255, 255, 255, 0.7);">В этой категории пока нет подкатегорий</p>
                </div>
            `;
            return;
        }

        // Group subcategories by sections (if they have sections)
        const sections = this.groupSubcategoriesBySections(subcategories);
        
        container.innerHTML = sections.map(section => `
            <div class="mega-menu-subcategory-section">
                <h3 class="mega-menu-subcategory-title">${section.title}</h3>
                <div class="mega-menu-subcategory-grid">
                    ${section.items.map(item => `
                        <div class="mega-menu-subcategory-item" data-action="show-subcategory" data-slug="${item.slug}">
                            <div class="mega-menu-subcategory-name">${item.name}</div>
                            <div class="mega-menu-subcategory-description">${item.description || 'Описание отсутствует'}</div>
                            <div class="mega-menu-subcategory-count">${item.productCount || 0} товаров</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        // Add event listeners for subcategory selection
        container.querySelectorAll('[data-action="show-subcategory"]').forEach(element => {
            element.addEventListener('click', (e) => {
                const slug = e.currentTarget.dataset.slug;
                this.showCategory(slug);
                this.hideMegaMenu();
            });
        });
    }

    groupSubcategoriesBySections(subcategories) {
        // For now, just return all subcategories in one section
        // This can be enhanced later to group by actual sections
        return [{
            title: 'Подкатегории',
            items: subcategories
        }];
    }

    // Products
    async loadFeaturedProducts() {
        if (!this.isServerAvailable()) {
            console.log('Server not available, using mock featured products');
            const mockProducts = this.getMockFeaturedProducts();
            this.renderFeaturedProducts(mockProducts);
            return;
        }

        try {
            const response = await this.apiRequest('/products/promo/list');
            this.renderFeaturedProducts(response.data);
        } catch (error) {
            console.log('API error, using mock featured products');
            const mockProducts = this.getMockFeaturedProducts();
            this.renderFeaturedProducts(mockProducts);
        }
    }

    getMockFeaturedProducts() {
        return [
            {
                _id: 'mock-1',
                title: 'Ноутбук игровой ASUS ROG',
                currentPrice: 89990,
                initPrice: 99990,
                imageLinks: ['https://via.placeholder.com/300x200?text=Gaming+Laptop'],
                vendor: { name: 'ASUS' },
                isPromo: true,
                reviewsCount: 45
            },
            {
                _id: 'mock-2',
                title: 'Смартфон iPhone 15 Pro',
                currentPrice: 129990,
                initPrice: 139990,
                imageLinks: ['https://via.placeholder.com/300x200?text=iPhone+15+Pro'],
                vendor: { name: 'Apple' },
                isPromo: true,
                reviewsCount: 128
            },
            {
                _id: 'mock-3',
                title: 'Наушники Sony WH-1000XM5',
                currentPrice: 29990,
                initPrice: 34990,
                imageLinks: ['https://via.placeholder.com/300x200?text=Sony+Headphones'],
                vendor: { name: 'Sony' },
                isPromo: true,
                reviewsCount: 89
            },
            {
                _id: 'mock-4',
                title: 'Умные часы Apple Watch Series 9',
                currentPrice: 45990,
                initPrice: 49990,
                imageLinks: ['https://via.placeholder.com/300x200?text=Apple+Watch'],
                vendor: { name: 'Apple' },
                isPromo: false,
                reviewsCount: 67
            }
        ];
    }

    renderFeaturedProducts(products) {
        const container = document.getElementById('featuredProducts');
        
        if (products.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h4>Товары загружаются...</h4>
                        <p>Пожалуйста, подождите</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="product-card">
                    <img src="${product.imageLinks && product.imageLinks[0] ? product.imageLinks[0] : 'https://via.placeholder.com/300x200?text=No+Image'}" 
                         alt="${product.title}" class="product-image">
                    <div class="product-info">
                        <h6 class="product-title">${product.title}</h6>
                        <div class="product-vendor">
                            <small class="text-muted">${product.vendor ? product.vendor.name : 'Неизвестный производитель'}</small>
                        </div>
                        <div class="product-price">
                            ${product.currentPrice.toLocaleString()} грн.
                            ${product.initPrice && product.initPrice > product.currentPrice ? 
                                `<span class="product-original-price">${product.initPrice.toLocaleString()} ₽</span>` : ''}
                        </div>
                        ${product.isPromo ? '<span class="badge bg-danger mb-2">Акция</span>' : ''}
                        <div class="product-reviews">
                            <small class="text-muted">
                                <i class="fas fa-star text-warning"></i>
                                Отзывов: ${product.reviewsCount || 0}
                            </small>
                        </div>
                        <button class="btn btn-primary btn-sm w-100 add-to-cart-btn" 
                                data-product-id="${product._id}">
                            <i class="fas fa-cart-plus me-2"></i>
                            В корзину
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '☆' : '') + 
               '☆'.repeat(emptyStars);
    }

    async searchProducts() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;
        
        const query = searchInput.value.trim();
        if (!query) return;

        try {
            const response = await this.apiRequest(`/products/search/${encodeURIComponent(query)}`);
            this.showSearchResults(response.data, query);
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    showSearchResults(products, query) {
        // Create a new page or modal to show search results
        const modal = new bootstrap.Modal(document.createElement('div'));
        // Implementation for search results display
    }

    // Cart
    async loadCart() {
        if (!this.token) return;

        try {
            const response = await this.apiRequest('/cart');
            this.cart = response.data.items;
            this.updateCartUI();
        } catch (error) {
            console.error('Error loading cart:', error);
        }
    }

    async addToCart(productId, quantity = 1) {
        if (!this.token) {
            this.showLoginModal();
            return;
        }

        try {
            await this.apiRequest('/cart/add', {
                method: 'POST',
                body: JSON.stringify({ productId, quantity })
            });
            
            this.loadCart();
            this.showAlert('Товар добавлен в корзину!', 'success');
        } catch (error) {
            console.error('Error adding to cart:', error);
        }
    }

    async updateCartItem(productId, quantity) {
        try {
            await this.apiRequest('/cart/update', {
                method: 'PUT',
                body: JSON.stringify({ productId, quantity })
            });
            
            this.loadCart();
        } catch (error) {
            console.error('Error updating cart:', error);
        }
    }

    async removeFromCart(productId) {
        try {
            await this.apiRequest(`/cart/remove/${productId}`, {
                method: 'DELETE'
            });
            
            this.loadCart();
        } catch (error) {
            console.error('Error removing from cart:', error);
        }
    }

    updateCartUI() {
        const badge = document.getElementById('cartBadge');
        if (!badge) return;
        
        const total = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        if (total > 0) {
            badge.textContent = total;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }

    renderCart() {
        const container = document.getElementById('cartItems');
        const totalElement = document.getElementById('cartTotal');
        
        if (!container || !totalElement) return;
        
        if (this.cart.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <h4>Корзина пуста</h4>
                    <p>Добавьте товары в корзину</p>
                </div>
            `;
            totalElement.textContent = '0';
            return;
        }

        container.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <img src="${item.product.imageLinks && item.product.imageLinks[0] ? item.product.imageLinks[0] : 'https://via.placeholder.com/60x60?text=No+Image'}" 
                     alt="${item.product.title}" class="cart-item-image">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.product.title}</div>
                    <div class="cart-item-price">${item.product.currentPrice.toLocaleString()} грн.</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn decrease-btn" data-product-id="${item.product._id}" data-quantity="${item.quantity - 1}">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" 
                           data-product-id="${item.product._id}" min="1">
                    <button class="quantity-btn increase-btn" data-product-id="${item.product._id}" data-quantity="${item.quantity + 1}">+</button>
                </div>
                <button class="btn btn-sm btn-outline-danger remove-from-cart-btn" data-product-id="${item.product._id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        const total = this.cart.reduce((sum, item) => sum + item.total, 0);
        totalElement.textContent = total.toLocaleString();
    }

    // UI Updates
    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const userDropdown = document.getElementById('userDropdown');
        const userName = document.getElementById('userName');

        if (loginBtn && userDropdown && userName) {
            if (this.user) {
                loginBtn.style.display = 'none';
                userDropdown.style.display = 'block';
                userName.textContent = this.user.firstName;
            } else {
                loginBtn.style.display = 'block';
                userDropdown.style.display = 'none';
            }
        }
    }

    // Modal Controls
    showLoginModal() {
        const modalElement = document.getElementById('loginModal');
        if (!modalElement) return;
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }

    hideLoginModal() {
        const modalElement = document.getElementById('loginModal');
        if (!modalElement) return;
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
    }

    showRegisterModal() {
        this.hideLoginModal();
        const modalElement = document.getElementById('registerModal');
        if (!modalElement) return;
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }

    hideRegisterModal() {
        const modalElement = document.getElementById('registerModal');
        if (!modalElement) return;
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
    }

    showCartModal() {
        this.renderCart();
        const modalElement = document.getElementById('cartModal');
        if (!modalElement) return;
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }

    // Checkout
    async checkout() {
        if (!this.token) {
            this.showLoginModal();
            return;
        }

        if (this.cart.length === 0) {
            this.showAlert('Корзина пуста', 'warning');
            return;
        }

        // Simple checkout - in real app would have address form, payment, etc.
        try {
            const orderData = {
                shippingAddress: {
                    firstName: this.user.firstName,
                    lastName: this.user.lastName,
                    street: 'Улица Примерная, 1',
                    city: 'Москва',
                    state: 'Московская область',
                    zipCode: '123456',
                    country: 'Россия',
                    phone: this.user.phone || '+7 (999) 123-45-67'
                },
                paymentMethod: 'card'
            };

            const response = await this.apiRequest('/orders', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });

            this.showAlert(`Заказ оформлен! Номер заказа: ${response.data.orderNumber}`, 'success');
            
            // Close cart modal
            const modalElement = document.getElementById('cartModal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }
            
        } catch (error) {
            console.error('Checkout error:', error);
        }
    }

    // Utility Methods
    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    showCatalog(catalogSlug) {
        // Try to find catalog in loaded catalogs first
        let catalog = this.catalogs ? this.catalogs.find(cat => cat.slug === catalogSlug) : null;
        
        if (!catalog) {
            // Fallback to mock catalogs
            const mockCatalogs = this.getMockCatalogs();
            catalog = mockCatalogs.find(cat => cat.slug === catalogSlug);
        }
        
        if (!catalog) {
            console.error('Catalog not found:', catalogSlug);
            return;
        }

        // Load catalog structure (groups and categories)
        this.loadCatalogStructure(catalogSlug, catalog.name);
    }

    async loadCatalogStructure(catalogSlug, catalogName) {
        // First try to load from localStorage
        const cachedStructure = this.getCatalogsFromLocalStorage(`structure_${catalogSlug}`);
        if (cachedStructure) {
            console.log(`Using cached catalog structure from localStorage: ${catalogSlug}`);
            this.renderCatalogStructure(cachedStructure, catalogName);
            return;
        }

        if (!this.isServerAvailable()) {
            console.log('Server not available, using mock catalog structure');
            const mockStructure = this.getMockCatalogStructure(catalogSlug);
            this.saveCatalogsToLocalStorage(mockStructure, `structure_${catalogSlug}`);
            this.renderCatalogStructure(mockStructure, catalogName);
            return;
        }

        try {
            const response = await this.apiRequest(`/catalogs/${catalogSlug}/structure`);
            // Save to localStorage for future use
            this.saveCatalogsToLocalStorage(response.data, `structure_${catalogSlug}`);
            this.renderCatalogStructure(response.data, catalogName);
        } catch (error) {
            console.log('API error, using mock catalog structure');
            const mockStructure = this.getMockCatalogStructure(catalogSlug);
            this.saveCatalogsToLocalStorage(mockStructure, `structure_${catalogSlug}`);
            this.renderCatalogStructure(mockStructure, catalogName);
        }
    }

    renderCatalogStructure(structure, catalogName) {
        // Create modal for catalog structure display
        const modalId = 'catalogStructureModal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = modalId;
            modal.innerHTML = `
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="catalogStructureModalTitle">${catalogName}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row" id="catalogStructureGrid">
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const titleElement = modal.querySelector('#catalogStructureModalTitle');
        const gridElement = modal.querySelector('#catalogStructureGrid');
        
        titleElement.textContent = catalogName;
        
        if (!structure.groups || structure.groups.length === 0) {
            gridElement.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="fas fa-folder-open"></i>
                        <h4>Группы не найдены</h4>
                        <p>В данном каталоге пока нет групп</p>
                    </div>
                </div>
            `;
        } else {
            gridElement.innerHTML = structure.groups.map(group => `
                <div class="col-lg-6 col-md-12 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-primary text-white">
                            <h6 class="mb-0">
                                <i class="fas fa-layer-group me-2"></i>
                                ${group.name}
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                ${group.categories ? group.categories.map(category => `
                                    <div class="col-6 mb-2">
                                        <a href="#" class="text-decoration-none show-category-link" 
                                           data-catalog="${structure.catalog.slug}" 
                                           data-group="${group.slug}" 
                                           data-category="${category.slug}">
                                            <i class="fas fa-chevron-right me-1 text-primary"></i>
                                            ${category.name}
                                            ${category.isReference ? '<i class="fas fa-external-link-alt ms-1 text-muted"></i>' : ''}
                                        </a>
                                    </div>
                                `).join('') : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Add event listeners for category links
        gridElement.querySelectorAll('.show-category-link').forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const catalogSlug = e.currentTarget.dataset.catalog;
                const groupSlug = e.currentTarget.dataset.group;
                const categorySlug = e.currentTarget.dataset.category;
                this.showCategory(catalogSlug, groupSlug, categorySlug);
            });
        });

        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    showCategory(catalogSlug, groupSlug, categorySlug) {
        // Navigate to category page instead of showing modal
        const url = `/category.html?catalog=${catalogSlug}&group=${groupSlug}&category=${categorySlug}`;
        window.location.href = url;
    }

    async loadCategoryProducts(catalogSlug, groupSlug, categorySlug) {
        if (!this.isServerAvailable()) {
            console.log('Server not available, using mock category products');
            const mockProducts = this.getMockCategoryProducts(categorySlug);
            this.renderProducts(mockProducts, `Товары в категории: ${categorySlug}`);
            return;
        }

        try {
            const response = await this.apiRequest(`/products/catalog/${catalogSlug}/group/${groupSlug}/category/${categorySlug}`);
            this.renderProducts(response.data, `Товары в категории: ${categorySlug}`);
        } catch (error) {
            console.log('API error, using mock category products');
            const mockProducts = this.getMockCategoryProducts(categorySlug);
            this.renderProducts(mockProducts, `Товары в категории: ${categorySlug}`);
        }
    }

    getMockCatalogStructure(catalogSlug) {
        return {
            catalog: { slug: catalogSlug, name: 'Компьютеры и электроника' },
            groups: [
                {
                    slug: 'laptop-notebook',
                    name: 'Ноутбуки и планшеты',
                    categories: [
                        { slug: 'noutbuki', name: 'Ноутбуки', isReference: false },
                        { slug: 'netbuki', name: 'Нетбуки', isReference: false },
                        { slug: 'planshety', name: 'Планшеты', isReference: false }
                    ]
                },
                {
                    slug: 'monitory',
                    name: 'Мониторы',
                    categories: [
                        { slug: 'monitory-14', name: '14"', isReference: false },
                        { slug: 'monitory-15', name: '15"', isReference: false },
                        { slug: 'monitory-17', name: '17"', isReference: false }
                    ]
                },
                {
                    slug: 'klaviatury',
                    name: 'Клавиатуры',
                    categories: [
                        { slug: 'klaviatury-mehanicheskie', name: 'Механические', isReference: false },
                        { slug: 'klaviatury-membrannye', name: 'Мембранные', isReference: false },
                        { slug: 'klaviatury-garnitury', name: 'Гарнитуры', isReference: false }
                    ]
                }
            ]
        };
    }

    getMockCategoryProducts(categorySlug) {
        return [
            { _id: 'prod-1', title: 'Ноутбук ASUS ROG', currentPrice: 89990, imageLinks: ['https://via.placeholder.com/300x200?text=ASUS+ROG'], vendor: { name: 'ASUS' }, reviewsCount: 45 },
            { _id: 'prod-2', title: 'Монитор Samsung 27"', currentPrice: 25990, imageLinks: ['https://via.placeholder.com/300x200?text=Samsung+Monitor'], vendor: { name: 'Samsung' }, reviewsCount: 56 },
            { _id: 'prod-3', title: 'Клавиатура Logitech MX Keys', currentPrice: 8990, imageLinks: ['https://via.placeholder.com/300x200?text=Logitech+Keyboard'], vendor: { name: 'Logitech' }, reviewsCount: 23 },
            { _id: 'prod-4', title: 'Мышь Logitech MX Master 3', currentPrice: 5990, imageLinks: ['https://via.placeholder.com/300x200?text=Logitech+Mouse'], vendor: { name: 'Logitech' }, reviewsCount: 45 }
        ];
    }

    renderProducts(products, title = 'Товары') {
        // Create modal for products display
        const modalId = 'productsModal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = modalId;
            modal.innerHTML = `
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="productsModalTitle">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row" id="productsModalGrid">
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const titleElement = modal.querySelector('#productsModalTitle');
        const gridElement = modal.querySelector('#productsModalGrid');
        
        titleElement.textContent = title;
        
        if (products.length === 0) {
            gridElement.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h4>Товары не найдены</h4>
                        <p>В данной категории пока нет товаров</p>
                    </div>
                </div>
            `;
        } else {
            gridElement.innerHTML = products.map(product => `
                <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                    <div class="product-card">
                        <img src="${product.imageLinks && product.imageLinks[0] ? product.imageLinks[0] : 'https://via.placeholder.com/300x200?text=No+Image'}" 
                             alt="${product.title}" class="product-image">
                        <div class="product-info">
                            <h6 class="product-title">${product.title}</h6>
                            <div class="product-vendor">
                                <small class="text-muted">${product.vendor ? product.vendor.name : 'Неизвестный производитель'}</small>
                            </div>
                            <div class="product-price">
                                ${product.currentPrice.toLocaleString()} ₽
                                ${product.initPrice && product.initPrice > product.currentPrice ? 
                                    `<span class="product-original-price">${product.initPrice.toLocaleString()} ₽</span>` : ''}
                            </div>
                            ${product.isPromo ? '<span class="badge bg-danger mb-2">Акция</span>' : ''}
                            <div class="product-reviews">
                                <small class="text-muted">
                                    <i class="fas fa-star text-warning"></i>
                                    Отзывов: ${product.reviewsCount || 0}
                                </small>
                            </div>
                            <button class="btn btn-primary btn-sm w-100 add-to-cart-btn" 
                                    data-product-id="${product._id}">
                                <i class="fas fa-cart-plus me-2"></i>
                                В корзину
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    renderAllCatalogs(catalogs) {
        const container = document.getElementById('allCategoriesGrid');
        if (!container) return;

        const catalogIcons = {
            'computer': 'fas fa-laptop',
            'auto': 'fas fa-car',
            'fashion': 'fas fa-tshirt',
            'dom': 'fas fa-home',
            'dacha_sad': 'fas fa-seedling',
            'deti': 'fas fa-baby',
            'krasota': 'fas fa-heartbeat',
            'pobutova_himiia': 'fas fa-spray-can',
            'musical_instruments': 'fas fa-music',
            'mobile': 'fas fa-mobile-alt',
            'remont': 'fas fa-tools',
            'sport': 'fas fa-dumbbell',
            'zootovary': 'fas fa-paw',
            'tools': 'fas fa-wrench',
            'bt': 'fas fa-tv',
            'av': 'fas fa-headphones',
            'adult': 'fas fa-gift',
            'military': 'fas fa-shield-alt',
            'power': 'fas fa-bolt',
            'constructors-lego': 'fas fa-cubes'
        };

        // Группируем каталоги по уровням
        const mainCatalogs = catalogs.filter(cat => cat.level === 0);
        const groups = catalogs.filter(cat => cat.level === 1 && cat.isGroup);
        const categories = catalogs.filter(cat => cat.level === 2);

        let html = '';

        mainCatalogs.forEach(mainCat => {
            const catalogGroups = groups.filter(group => group.catalogSlug === mainCat.slug);
            const totalCategories = categories.filter(cat => 
                catalogGroups.some(group => group.slug === cat.groupSlug)
            ).length;
            
            html += `
                <div class="col-lg-4 col-md-6 col-sm-12 mb-4">
                    <div class="catalog-card">
                        <div class="catalog-card-header">
                            <div class="catalog-icon">
                                <i class="${catalogIcons[mainCat.slug] || 'fas fa-box'}"></i>
                            </div>
                            <div class="catalog-info">
                                <h5 class="catalog-title">${mainCat.name}</h5>
                                <div class="catalog-stats">
                                    <span class="catalog-groups">${catalogGroups.length} групп</span>
                                    <span class="catalog-categories">${totalCategories} категорий</span>
                                </div>
                            </div>
                        </div>
                        <div class="catalog-card-body">
                            <p class="catalog-description">${mainCat.description || 'Широкий ассортимент товаров'}</p>
                            
                            ${catalogGroups.length > 0 ? `
                                <div class="catalog-groups-list">
                                    ${catalogGroups.slice(0, 3).map(group => {
                                        const groupCategories = categories.filter(cat => cat.groupSlug === group.slug);
                                        return `
                                            <div class="catalog-group-item">
                                                <div class="group-header">
                                                    <i class="fas fa-layer-group"></i>
                                                    <span class="group-name">${group.name}</span>
                                                    <span class="group-count">${groupCategories.length}</span>
                                                </div>
                                                <div class="group-categories">
                                                    ${groupCategories.slice(0, 4).map(category => `
                                                        <a href="#" class="category-link" 
                                                           data-catalog="${mainCat.slug}" 
                                                           data-group="${group.slug}" 
                                                           data-category="${category.slug}">
                                                            ${category.name}
                                                            ${category.isReference ? '<i class="fas fa-external-link-alt"></i>' : ''}
                                                        </a>
                                                    `).join('')}
                                                    ${groupCategories.length > 4 ? `
                                                        <span class="more-categories">+${groupCategories.length - 4} еще</span>
                                                    ` : ''}
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                    ${catalogGroups.length > 3 ? `
                                        <div class="more-groups">
                                            <a href="#" class="show-all-groups" data-catalog="${mainCat.slug}">
                                                Показать все ${catalogGroups.length} групп
                                                <i class="fas fa-chevron-right"></i>
                                            </a>
                                        </div>
                                    ` : ''}
                                </div>
                            ` : `
                                <div class="empty-catalog">
                                    <i class="fas fa-folder-open"></i>
                                    <p>В данном каталоге пока нет групп</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Add event listeners for category links
        container.querySelectorAll('.category-link').forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const catalogSlug = e.currentTarget.dataset.catalog;
                const groupSlug = e.currentTarget.dataset.group;
                const categorySlug = e.currentTarget.dataset.category;
                this.showCategory(catalogSlug, groupSlug, categorySlug);
            });
        });

        // Add event listeners for "show all groups" links
        container.querySelectorAll('.show-all-groups').forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const catalogSlug = e.currentTarget.dataset.catalog;
                this.showCatalog(catalogSlug);
            });
        });
    }

    getCatalogIcon(slug) {
        const icons = {
            'computer': 'fas fa-laptop',
            'auto': 'fas fa-car',
            'fashion': 'fas fa-tshirt',
            'dom': 'fas fa-home',
            'dacha_sad': 'fas fa-seedling',
            'deti': 'fas fa-baby',
            'krasota': 'fas fa-heartbeat',
            'pobutova_himiia': 'fas fa-spray-can',
            'musical_instruments': 'fas fa-music',
            'mobile': 'fas fa-mobile-alt',
            'remont': 'fas fa-tools',
            'sport': 'fas fa-dumbbell',
            'zootovary': 'fas fa-paw',
            'tools': 'fas fa-wrench',
            'bt': 'fas fa-tv',
            'av': 'fas fa-headphones',
            'adult': 'fas fa-gift',
            'military': 'fas fa-shield-alt',
            'power': 'fas fa-bolt',
            'constructors-lego': 'fas fa-cubes'
        };
        return icons[slug] || 'fas fa-box';
    }

    getMockMegaMenuData() {
        return [
            // Main catalogs (level 0)
            { slug: 'computer', name: 'Компьютеры и электроника', level: 0, description: 'Компьютеры, ноутбуки, планшеты' },
            { slug: 'dom', name: 'Дом и сад', level: 0, description: 'Товары для дома' },
            { slug: 'sport', name: 'Спорт и отдых', level: 0, description: 'Спортивные товары' },
            
            // Groups (level 1)
            { slug: 'laptop-notebook', name: 'Ноутбуки и планшеты', level: 1, isGroup: true, catalogSlug: 'computer', description: 'Портативные устройства' },
            { slug: 'monitory', name: 'Мониторы', level: 1, isGroup: true, catalogSlug: 'computer', description: 'Дисплеи и экраны' },
            { slug: 'klaviatury', name: 'Клавиатуры', level: 1, isGroup: true, catalogSlug: 'computer', description: 'Устройства ввода' },
            { slug: 'mebel', name: 'Мебель', level: 1, isGroup: true, catalogSlug: 'dom', description: 'Мебель для дома' },
            { slug: 'dekor', name: 'Декор', level: 1, isGroup: true, catalogSlug: 'dom', description: 'Украшения для дома' },
            { slug: 'fitness', name: 'Фитнес', level: 1, isGroup: true, catalogSlug: 'sport', description: 'Тренажеры и оборудование' },
            { slug: 'outdoor', name: 'Активный отдых', level: 1, isGroup: true, catalogSlug: 'sport', description: 'Туризм и походы' },
            
            // Categories (level 2)
            { slug: 'noutbuki', name: 'Ноутбуки', level: 2, groupSlug: 'laptop-notebook', description: 'Портативные компьютеры' },
            { slug: 'planshety', name: 'Планшеты', level: 2, groupSlug: 'laptop-notebook', description: 'Планшетные компьютеры' },
            { slug: 'monitory-14', name: '14"', level: 2, groupSlug: 'monitory', description: 'Мониторы 14 дюймов' },
            { slug: 'monitory-15', name: '15"', level: 2, groupSlug: 'monitory', description: 'Мониторы 15 дюймов' },
            { slug: 'klaviatury-mehanicheskie', name: 'Механические', level: 2, groupSlug: 'klaviatury', description: 'Механические клавиатуры' },
            { slug: 'klaviatury-membrannye', name: 'Мембранные', level: 2, groupSlug: 'klaviatury', description: 'Мембранные клавиатуры' },
            { slug: 'stoly', name: 'Столы', level: 2, groupSlug: 'mebel', description: 'Столы для дома и офиса' },
            { slug: 'stulya', name: 'Стулья', level: 2, groupSlug: 'mebel', description: 'Стулья и кресла' },
            { slug: 'svechi', name: 'Свечи', level: 2, groupSlug: 'dekor', description: 'Декоративные свечи' },
            { slug: 'vazy', name: 'Вазы', level: 2, groupSlug: 'dekor', description: 'Вазы и цветочные горшки' },
            { slug: 'trenazhery', name: 'Тренажеры', level: 2, groupSlug: 'fitness', description: 'Спортивные тренажеры' },
            { slug: 'ganteli', name: 'Гантели', level: 2, groupSlug: 'fitness', description: 'Гантели и гири' },
            { slug: 'palatki', name: 'Палатки', level: 2, groupSlug: 'outdoor', description: 'Туристические палатки' },
            { slug: 'ryukzaki', name: 'Рюкзаки', level: 2, groupSlug: 'outdoor', description: 'Туристические рюкзаки' }
        ];
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new BifoApp();
    await window.app.init();
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add scroll to top button
window.addEventListener('scroll', () => {
    const scrollBtn = document.querySelector('.scroll-to-top') || createScrollToTopButton();
    
    if (window.pageYOffset > 300) {
        scrollBtn.classList.add('show');
    } else {
        scrollBtn.classList.remove('show');
    }
});

function createScrollToTopButton() {
    const btn = document.createElement('div');
    btn.className = 'scroll-to-top';
    btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(btn);
    return btn;
} 