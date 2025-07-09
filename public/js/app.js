// BIFO E-commerce Application
class BifoApp {
    constructor() {
        this.apiBase = '/api';
        this.token = localStorage.getItem('bifo_token');
        this.user = JSON.parse(localStorage.getItem('bifo_user'));
        this.cart = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCategories();
        this.loadFeaturedProducts();
        this.loadSaleProducts();
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
            
            // Close modal
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
            
            // Close modal
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
                    <a class="dropdown-item" href="#" onclick="app.logout()">Выйти</a>
                </div>
            `;
            authLink.setAttribute('data-bs-toggle', 'dropdown');
        } else {
            authLink.innerHTML = '<i class="fas fa-user me-1"></i>Войти';
            authLink.setAttribute('data-bs-toggle', 'modal');
        }
    }

    // Categories
    async loadCategories() {
        try {
            const categories = await this.apiRequest('/categories');
            this.renderCategories(categories);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    renderCategories(categories) {
        const container = document.getElementById('categoriesGrid');
        container.innerHTML = categories.map(category => `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="card category-card" onclick="app.showCategory('${category.name}')">
                    <div class="card-body">
                        <span class="category-icon">${category.icon}</span>
                        <h5 class="card-title">${category.label}</h5>
                        <p class="category-count">${category.count} товаров</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Products
    async loadFeaturedProducts() {
        try {
            const products = await this.apiRequest('/products/featured/all');
            this.renderProducts(products, 'featuredProducts');
        } catch (error) {
            console.error('Error loading featured products:', error);
        }
    }

    async loadSaleProducts() {
        try {
            const products = await this.apiRequest('/products/sale/all');
            this.renderProducts(products, 'saleProducts');
        } catch (error) {
            console.error('Error loading sale products:', error);
        }
    }

    renderProducts(products, containerId) {
        const container = document.getElementById(containerId);
        
        if (products.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h4>Товары не найдены</h4>
                        <p>Попробуйте изменить параметры поиска</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="card product-card">
                    ${product.isOnSale ? '<span class="sale-badge">-${product.salePercentage}%</span>' : ''}
                    ${product.isFeatured ? '<span class="featured-badge">Рекомендуем</span>' : ''}
                    <img src="${product.mainImage}" class="card-img-top" alt="${product.name}">
                    <div class="card-body">
                        <h6 class="card-title">${product.name}</h6>
                        <div class="rating mb-2">
                            ${this.generateStars(product.rating.average)}
                            <small class="text-muted">(${product.rating.count})</small>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                ${product.isOnSale ? 
                                    `<span class="product-original-price">${product.originalPrice} ₽</span><br>` : ''
                                }
                                <span class="product-price">${product.price} ₽</span>
                            </div>
                            <button class="btn btn-primary btn-sm" onclick="app.addToCart('${product._id}')">
                                <i class="fas fa-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
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

        try {
            const data = await this.apiRequest(`/products/search/${encodeURIComponent(query)}`);
            this.showSearchResults(data.products, query);
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    showSearchResults(products, query) {
        // Create a new page for search results
        const searchPage = `
            <div class="container mt-5 pt-4">
                <h2>Результаты поиска: "${query}"</h2>
                <div class="row" id="searchResults">
                    ${this.renderProducts(products, 'searchResults')}
                </div>
            </div>
        `;
        
        document.querySelector('main').innerHTML = searchPage;
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
                            <img src="${item.product.mainImage}" class="cart-item-img" alt="${item.product.name}">
                        </div>
                        <div class="col-4">
                            <h6 class="mb-0">${item.product.name}</h6>
                            <small class="text-muted">${item.product.sku}</small>
                        </div>
                        <div class="col-3">
                            <div class="quantity-controls">
                                <button class="quantity-btn" onclick="app.updateCartItemQuantity('${item.product._id}', ${item.quantity - 1})">-</button>
                                <span>${item.quantity}</span>
                                <button class="quantity-btn" onclick="app.updateCartItemQuantity('${item.product._id}', ${item.quantity + 1})">+</button>
                            </div>
                        </div>
                        <div class="col-2">
                            <span class="fw-bold">${item.price * item.quantity} ₽</span>
                        </div>
                        <div class="col-1">
                            <button class="btn btn-sm btn-outline-danger" onclick="app.removeFromCart('${item.product._id}')">
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

    // Checkout
    async handleCheckout() {
        if (!this.token) {
            this.showToast('Войдите в систему для оформления заказа', 'warning');
            return;
        }

        if (this.cart.length === 0) {
            this.showToast('Корзина пуста', 'warning');
            return;
        }

        // For now, just show a success message
        this.showToast('Заказ оформлен! Скоро мы свяжемся с вами.', 'success');
        
        // Clear cart
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

    // Category page
    showCategory(categoryName) {
        // Navigate to category page
        window.location.href = `/category.html?category=${categoryName}`;
    }

    // Utility methods
    showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
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

        // Auto remove after 5 seconds
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

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BifoApp();
}); 