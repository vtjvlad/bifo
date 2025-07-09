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
        this.loadBrands();
        this.loadProducts();
        this.updateAuthUI();
        this.loadCart();
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
            const categories = await this.apiRequest('/categories');
            this.populateCategoryFilter(categories);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    populateCategoryFilter(categories) {
        const select = document.getElementById('categoryFilter');
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = `${category.icon} ${category.label} (${category.count})`;
            select.appendChild(option);
        });
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
        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            select.appendChild(option);
        });
    }

    // Products
    async loadProducts() {
        this.showLoading(true);
        
        try {
            // Prepare query parameters
            const params = {
                page: this.currentPage,
                limit: this.itemsPerPage
            };

            // Add filters
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

            const queryParams = new URLSearchParams(params);
            const data = await this.apiRequest(`/products?${queryParams}`);
            this.renderProducts(data.products);
            this.updatePagination(data.currentPage, data.totalPages, data.total);
            this.updateResultsCount(data.total);
        } catch (error) {
            console.error('Error loading products:', error);
            this.renderProducts([]);
        } finally {
            this.showLoading(false);
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
        const imageUrl = product.imageLinks && product.imageLinks.length > 0 ? product.imageLinks[0] : '/images/placeholder.jpg';
        const isPromo = product.isPromo || false;
        const isNew = product.isNew === 1;
        
        return `
            <div class="col-lg-4 col-md-6 col-sm-6 mb-4">
                <div class="card product-card h-100">
                    ${isPromo ? `<span class="sale-badge">Акция</span>` : ''}
                    ${isNew ? `<span class="featured-badge">Новинка</span>` : ''}
                    <img src="${imageUrl}" class="card-img-top" alt="${product.title}" onerror="this.src='/images/placeholder.jpg'">
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title">${product.title}</h6>
                        <div class="rating mb-2">
                            <small class="text-muted">Отзывов: ${product.reviewsCount || 0}</small>
                        </div>
                        <p class="card-text text-muted small mb-3">${product.vendor?.name || 'Неизвестный производитель'}</p>
                        <div class="mt-auto">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <span class="product-price">${product.minPrice} ₽</span>
                                    ${product.maxPrice !== product.minPrice ? `<br><small class="text-muted">до ${product.maxPrice} ₽</small>` : ''}
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
        const imageUrl = product.imageLinks && product.imageLinks.length > 0 ? product.imageLinks[0] : '/images/placeholder.jpg';
        const isPromo = product.isPromo || false;
        const isNew = product.isNew === 1;
        
        return `
            <div class="col-12 mb-3">
                <div class="card product-list-item">
                    <div class="row g-0">
                        <div class="col-md-3">
                            <img src="${imageUrl}" class="img-fluid rounded-start" alt="${product.title}" style="height: 200px; object-fit: cover;" onerror="this.src='/images/placeholder.jpg'">
                        </div>
                        <div class="col-md-9">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-8">
                                        <h5 class="card-title">${product.title}</h5>
                                        <div class="rating mb-2">
                                            <small class="text-muted">Отзывов: ${product.reviewsCount || 0}</small>
                                        </div>
                                        <p class="card-text">${product.vendor?.name || 'Неизвестный производитель'}</p>
                                        <div class="d-flex gap-2 mb-2">
                                            ${isPromo ? `<span class="badge bg-danger">Акция</span>` : ''}
                                            ${isNew ? `<span class="badge bg-warning text-dark">Новинка</span>` : ''}
                                            <span class="badge bg-secondary">${product.section?.name || 'Без категории'}</span>
                                        </div>
                                    </div>
                                    <div class="col-md-4 text-end">
                                        <div class="mb-3">
                                            <div class="product-price fs-4">${product.minPrice} ₽</div>
                                            ${product.maxPrice !== product.minPrice ? `<small class="text-muted">до ${product.maxPrice} ₽</small>` : ''}
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

        this.currentPage = 1;
        this.loadProducts();
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
                            <img src="${item.product.imageLinks && item.product.imageLinks.length > 0 ? item.product.imageLinks[0] : '/images/placeholder.jpg'}" class="cart-item-img" alt="${item.product.title}" onerror="this.src='/images/placeholder.jpg'">
                        </div>
                        <div class="col-4">
                            <h6 class="mb-0">${item.product.title}</h6>
                            <small class="text-muted">${item.product.vendor?.name || 'Неизвестный производитель'}</small>
                        </div>
                        <div class="col-3">
                            <div class="quantity-controls">
                                <button class="quantity-btn" onclick="catalogApp.updateCartItemQuantity('${item.product._id}', ${item.quantity - 1})">-</button>
                                <span>${item.quantity}</span>
                                <button class="quantity-btn" onclick="catalogApp.updateCartItemQuantity('${item.product._id}', ${item.quantity + 1})">+</button>
                            </div>
                        </div>
                        <div class="col-2">
                            <span class="fw-bold">${item.price * item.quantity} ₽</span>
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
            document.getElementById('cartTotal').textContent = `${total} ₽`;
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
}

// Initialize catalog app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.catalogApp = new CatalogApp();
}); 