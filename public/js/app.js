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
        this.updateUI();
        this.loadCart();
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('loginBtn').addEventListener('click', () => this.showLoginModal());
        document.getElementById('cartBtn').addEventListener('click', () => this.showCartModal());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        // Search
        document.getElementById('searchForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.searchProducts();
        });
        
        // Modals
        document.getElementById('showRegisterForm').addEventListener('click', () => this.showRegisterModal());
        document.getElementById('showLoginForm').addEventListener('click', () => this.showLoginModal());
        
        // Forms
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });
        
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });
        
        // Checkout
        document.getElementById('checkoutBtn').addEventListener('click', () => this.checkout());
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
            this.showAlert(error.message, 'danger');
            throw error;
        }
    }

    // Authentication
    async login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

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
        const formData = {
            email: document.getElementById('registerEmail').value,
            password: document.getElementById('registerPassword').value,
            firstName: document.getElementById('registerFirstName').value,
            lastName: document.getElementById('registerLastName').value,
            phone: document.getElementById('registerPhone').value
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

    // Categories
    async loadCategories() {
        try {
            const response = await this.apiRequest('/categories');
            this.renderCategories(response.data);
            this.renderCategoriesDropdown(response.data);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    renderCategories(categories) {
        const container = document.getElementById('categoriesGrid');
        const categoryIcons = {
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
            'military': 'fas fa-shield-alt'
        };

        // Filter only main categories (level 0)
        const mainCategories = categories.filter(cat => cat.level === 0).slice(0, 8);

        container.innerHTML = mainCategories.map(category => `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="category-card" onclick="app.showCategory('${category.slug}')">
                    <div class="category-icon">
                        <i class="${categoryIcons[category.slug] || 'fas fa-box'}"></i>
                    </div>
                    <h5>${category.name}</h5>
                    <p class="text-muted">${category.description || 'Широкий ассортимент товаров'}</p>
                </div>
            </div>
        `).join('');
    }

    renderCategoriesDropdown(categories) {
        const container = document.getElementById('categoriesDropdown');
        
        // Group categories by parent
        const mainCategories = categories.filter(cat => cat.level === 0);
        const subCategories = categories.filter(cat => cat.level === 1);
        
        let dropdownHTML = '';
        
        mainCategories.forEach(mainCat => {
            const subCats = subCategories.filter(subCat => subCat.parent === mainCat.slug);
            
            if (subCats.length > 0) {
                dropdownHTML += `
                    <li><h6 class="dropdown-header">${mainCat.name}</h6></li>
                    ${subCats.slice(0, 5).map(subCat => `
                        <li><a class="dropdown-item" href="#" onclick="app.showCategory('${subCat.slug}')">${subCat.name}</a></li>
                    `).join('')}
                    ${subCats.length > 5 ? `<li><a class="dropdown-item text-muted" href="#" onclick="app.showCategory('${mainCat.slug}')">Показать все...</a></li>` : ''}
                    <li><hr class="dropdown-divider"></li>
                `;
            } else {
                dropdownHTML += `
                    <li><a class="dropdown-item" href="#" onclick="app.showCategory('${mainCat.slug}')">${mainCat.name}</a></li>
                `;
            }
        });
        
        container.innerHTML = dropdownHTML;
    }

    // Products
    async loadFeaturedProducts() {
        try {
            const response = await this.apiRequest('/products/promo/list');
            this.renderFeaturedProducts(response.data);
        } catch (error) {
            console.error('Error loading promo products:', error);
        }
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
                        <button class="btn btn-primary btn-sm w-100" 
                                onclick="app.addToCart('${product._id}')">
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
        const query = document.getElementById('searchInput').value.trim();
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
                    <div class="cart-item-price">${item.product.currentPrice.toLocaleString()} ₽</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="app.updateCartItem('${item.product._id}', ${item.quantity - 1})">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" 
                           onchange="app.updateCartItem('${item.product._id}', this.value)" min="1">
                    <button class="quantity-btn" onclick="app.updateCartItem('${item.product._id}', ${item.quantity + 1})">+</button>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="app.removeFromCart('${item.product._id}')">
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

        if (this.user) {
            loginBtn.style.display = 'none';
            userDropdown.style.display = 'block';
            userName.textContent = this.user.firstName;
        } else {
            loginBtn.style.display = 'block';
            userDropdown.style.display = 'none';
        }
    }

    // Modal Controls
    showLoginModal() {
        const modal = new bootstrap.Modal(document.getElementById('loginModal'));
        modal.show();
    }

    hideLoginModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        modal.hide();
    }

    showRegisterModal() {
        this.hideLoginModal();
        const modal = new bootstrap.Modal(document.getElementById('registerModal'));
        modal.show();
    }

    hideRegisterModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
        modal.hide();
    }

    showCartModal() {
        this.renderCart();
        const modal = new bootstrap.Modal(document.getElementById('cartModal'));
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
            const modal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
            modal.hide();
            
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

    showCategory(categorySlug) {
        // Find category by slug
        const category = this.categories.find(cat => cat.slug === categorySlug);
        if (!category) {
            console.error('Category not found:', categorySlug);
            return;
        }

        let categoryProducts = [];
        
        if (category.level === 0) {
            // Main category - show all products from this category and its subcategories
            const subCategories = this.categories.filter(cat => cat.parent === category.slug);
            const allCategorySlugs = [category.slug, ...subCategories.map(sub => sub.slug)];
            
            categoryProducts = this.products.filter(product => 
                product.section && allCategorySlugs.includes(product.section.name)
            );
        } else {
            // Subcategory - show only products from this specific subcategory
            categoryProducts = this.products.filter(product => 
                product.section && product.section.name === category.slug
            );
        }

        this.renderProducts(categoryProducts, `Товары в категории: ${category.name}`);
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
                            <button class="btn btn-primary btn-sm w-100" 
                                    onclick="app.addToCart('${product._id}')">
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
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BifoApp();
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