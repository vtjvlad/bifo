// Category Page JavaScript
class CategoryPage {
    constructor() {
        this.apiBase = '/api';
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentFilters = {};
        this.currentSort = 'createdAt:desc';
        this.viewMode = 'list'; // 'grid' or 'list' - по умолчанию список
        this.currentProducts = []; // Добавляем для хранения текущих товаров
        
        // Get category parameters from URL
        this.categoryParams = this.getCategoryParamsFromURL();
        
        this.init();
    }

    async init() {
        // Wait for components to load
        await this.waitForComponents();
        
        this.setupEventListeners();
        this.updateBreadcrumb();
        this.loadCategoryInfo();
        this.loadProducts();
        
        // Initialize enhanced interactions after a short delay
        setTimeout(() => {
            this.initEnhancedInteractions();
        }, 1000);
    }

    async waitForComponents() {
        return new Promise((resolve) => {
            // Упрощаем ожидание - просто ждем немного для загрузки DOM
            setTimeout(resolve, 500);
        });
    }

    getCategoryParamsFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            catalogSlug: urlParams.get('catalog'),
            groupSlug: urlParams.get('group'),
            categorySlug: urlParams.get('category')
        };
    }

    setupEventListeners() {
        // Filter events
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyFilters();
        });

        // Sort events
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.currentPage = 1;
            this.loadProducts();
        });

        // View mode events
        document.getElementById('gridView').addEventListener('click', () => {
            this.setViewMode('grid');
        });

        document.getElementById('listView').addEventListener('click', () => {
            this.setViewMode('list');
        });

        // Enter key in price inputs
        document.getElementById('minPrice').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.applyFilters();
        });

        document.getElementById('maxPrice').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.applyFilters();
        });

        // Add to cart events (delegated)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart-btn')) {
                const productId = e.target.closest('.add-to-cart-btn').dataset.productId;
                if (window.app && window.app.addToCart) {
                    window.app.addToCart(productId);
                }
            }
            
            // Quick view events
            if (e.target.closest('.quick-view-btn')) {
                const productId = e.target.closest('.quick-view-btn').dataset.productId;
                this.showQuickView(productId);
            }
            
            // Favorite events
            if (e.target.closest('.favorite-btn')) {
                const productId = e.target.closest('.favorite-btn').dataset.productId;
                this.toggleFavorite(productId);
            }
        });
    }

    updateBreadcrumb() {
        const breadcrumb = document.getElementById('breadcrumb');
        if (!breadcrumb || !this.categoryParams.catalogSlug) return;

        const { catalogSlug, groupSlug, categorySlug } = this.categoryParams;
        
        breadcrumb.innerHTML = `
            <li class="breadcrumb-item"><a href="/">Главная</a></li>
            <li class="breadcrumb-item"><a href="/catalog.html">Каталоги</a></li>
            <li class="breadcrumb-item"><a href="#" onclick="return false;">${this.capitalizeFirst(catalogSlug)}</a></li>
            ${groupSlug ? `<li class="breadcrumb-item"><a href="#" onclick="return false;">${this.capitalizeFirst(groupSlug)}</a></li>` : ''}
            <li class="breadcrumb-item active" aria-current="page">${this.capitalizeFirst(categorySlug)}</li>
        `;
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
    }

    async loadCategoryInfo() {
        if (!this.categoryParams.categorySlug) return;

        try {
            const response = await this.apiRequest(`/catalogs/${this.categoryParams.categorySlug}`);
            if (response.success && response.data.catalog) {
                const category = response.data.catalog;
                document.getElementById('categoryTitle').textContent = category.name;
                document.title = `${category.name} - BIFO`;
                
                // Update meta description
                const metaDescription = document.querySelector('meta[name="description"]');
                if (metaDescription) {
                    metaDescription.setAttribute('content', `Товары в категории ${category.name} - интернет-магазин BIFO`);
                }
            }
        } catch (error) {
            console.error('Error loading category info:', error);
            // Fallback to URL parameter
            document.getElementById('categoryTitle').textContent = this.capitalizeFirst(this.categoryParams.categorySlug);
        }
    }

    async loadProducts() {
        if (!this.categoryParams.categorySlug) {
            this.showEmptyState();
            return;
        }

        this.showLoading();

        try {
            const { catalogSlug, groupSlug, categorySlug } = this.categoryParams;
            const [sortField, sortOrder] = this.currentSort.split(':');
            
            const queryParams = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                sort: sortField,
                order: sortOrder,
                ...this.currentFilters
            });

            const response = await this.apiRequest(
                `/products/catalog/${catalogSlug}/group/${groupSlug}/category/${categorySlug}?${queryParams}`
            );

            if (response.success) {
                this.renderProducts(response.data, response.pagination);
            } else {
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showEmptyState();
        }
    }

    applyFilters() {
        this.currentFilters = {};
        
        const minPrice = document.getElementById('minPrice').value;
        const maxPrice = document.getElementById('maxPrice').value;
        const isPromo = document.getElementById('promoFilter').checked;

        if (minPrice) this.currentFilters.minPrice = minPrice;
        if (maxPrice) this.currentFilters.maxPrice = maxPrice;
        if (isPromo) this.currentFilters.isPromo = 'true';

        this.currentPage = 1;
        this.loadProducts();
    }

    setViewMode(mode) {
        this.viewMode = mode;
        const gridBtn = document.getElementById('gridView');
        const listBtn = document.getElementById('listView');
        const productsGrid = document.getElementById('productsGrid');

        if (mode === 'grid') {
            gridBtn.classList.add('active');
            listBtn.classList.remove('active');
            productsGrid.classList.remove('list-view');
        } else {
            listBtn.classList.add('active');
            gridBtn.classList.remove('active');
            productsGrid.classList.add('list-view');
        }

        // Re-render products with new view mode
        this.renderProducts(this.currentProducts, this.currentPagination);
    }

    showLoading() {
        document.getElementById('loadingSpinner').style.display = 'block';
        document.getElementById('productsGrid').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('pagination').style.display = 'none';
    }

    showEmptyState() {
        document.getElementById('loadingSpinner').style.display = 'none';
        document.getElementById('productsGrid').style.display = 'none';
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('pagination').style.display = 'none';
        document.getElementById('totalProducts').textContent = '0';
    }

    renderProducts(products, pagination) {
        this.currentProducts = products;
        this.currentPagination = pagination;

        document.getElementById('loadingSpinner').style.display = 'none';
        document.getElementById('productsGrid').style.display = 'block';
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('pagination').style.display = 'block';

        document.getElementById('totalProducts').textContent = pagination.totalDocs;

        const productsGrid = document.getElementById('productsGrid');
        
        if (products.length === 0) {
            this.showEmptyState();
            return;
        }

        if (this.viewMode === 'grid') {
            productsGrid.innerHTML = products.map(product => this.renderProductCard(product)).join('');
            productsGrid.classList.remove('list-view');
        } else {
            productsGrid.innerHTML = products.map(product => this.renderProductListItem(product)).join('');
            productsGrid.classList.add('list-view');
        }

        this.renderPagination(pagination);
        
        // Обновляем состояние кнопок избранного
        this.updateFavoriteButtons();
        
        // Add animation to new product cards
        setTimeout(() => {
            const cards = productsGrid.querySelectorAll('.product-card');
            cards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }, 100);
    }

    renderProductCard(product) {
        const discount = product.initPrice && product.initPrice > product.currentPrice 
            ? Math.round(((product.initPrice - product.currentPrice) / product.initPrice) * 100)
            : 0;

        // Получаем основное изображение
        const mainImage = this.getProductImage(product);
        
        // Получаем название производителя
        const vendorName = this.getVendorName(product);
        
        // Получаем технические характеристики
        const specs = this.getProductSpecs(product);

        return `
            <div class="col-lg-4 col-md-6 col-sm-6">
                <div class="product-card h-100">
                    <div class="product-image-container">
                        <img src="${mainImage}" 
                             alt="${product.title}" 
                             class="product-image"
                             onerror="this.src='https://via.placeholder.com/300x200?text=Ошибка+загрузки'">
                        ${discount > 0 ? `<span class="badge bg-danger position-absolute top-0 start-0 m-2">-${discount}%</span>` : ''}
                        ${product.isPromo ? '<span class="badge bg-warning position-absolute top-0 end-0 m-2">Акция</span>' : ''}
                        ${product.isNew ? '<span class="badge bg-success position-absolute top-0 end-0 m-2">Новинка</span>' : ''}
                        ${product.madeInUkraine ? '<span class="badge bg-info position-absolute bottom-0 start-0 m-2">🇺🇦 Украина</span>' : ''}
                    </div>
                    <div class="product-info">
                        <h6 class="product-title">
                            <a href="/product/${product.url}" class="text-decoration-none text-dark">
                                ${product.title}
                            </a>
                        </h6>
                        
                        <div class="product-vendor">
                            <i class="fas fa-industry me-1"></i>
                            ${vendorName}
                        </div>
                        
                        ${specs ? `
                            <div class="product-specs">
                                <i class="fas fa-info-circle me-1"></i>
                                ${specs}
                            </div>
                        ` : ''}
                        
                        <div class="product-price">
                            <span class="product-price-current">${product.currentPrice.toLocaleString()} грн.</span>
                            ${product.initPrice && product.initPrice > product.currentPrice ? 
                                `<span class="product-original-price">${product.initPrice.toLocaleString()} ₴</span>` : ''}
                        </div>
                        
                        <div class="product-reviews">
                            <i class="fas fa-star text-warning me-1"></i>
                            ${product.reviewsCount || 0} отзывов
                            <span class="ms-3">
                                <i class="fas fa-shopping-cart me-1"></i>
                                ${product.offerCount || 0} предложений
                            </span>
                        </div>
                        
                        <div class="product-actions">
                            <button class="btn btn-primary add-to-cart-btn" 
                                    data-product-id="${product._id}">
                                <i class="fas fa-cart-plus me-2"></i>
                                В корзину
                            </button>
                            <div class="d-flex gap-2">
                                <button class="btn btn-outline-secondary quick-view-btn" 
                                        data-product-id="${product._id}"
                                        title="Быстрый просмотр">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-outline-secondary favorite-btn" 
                                        data-product-id="${product._id}"
                                        title="В избранное">
                                    <i class="fas fa-heart"></i>
                                </button>
                                <a href="${product.url}" target="_blank" class="btn btn-outline-secondary"
                                   title="Открыть на сайте">
                                    <i class="fas fa-external-link-alt"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderProductListItem(product) {
        const discount = product.initPrice && product.initPrice > product.currentPrice 
            ? Math.round(((product.initPrice - product.currentPrice) / product.initPrice) * 100)
            : 0;

        // Получаем основное изображение
        const mainImage = this.getProductImage(product);
        
        // Получаем название производителя
        const vendorName = this.getVendorName(product);
        
        // Получаем технические характеристики
        const specs = this.getProductSpecs(product);

        return `
            <div class="col-12">
                <div class="product-card">
                    <div class="product-image-container">
                        <img src="${mainImage}" 
                             alt="${product.title}" 
                             class="product-image"
                             onerror="this.src='https://via.placeholder.com/300x200?text=Ошибка+загрузки'">
                        ${discount > 0 ? `<span class="badge bg-danger position-absolute top-0 start-0 m-2">-${discount}%</span>` : ''}
                        ${product.isPromo ? '<span class="badge bg-warning position-absolute top-0 end-0 m-2">Акция</span>' : ''}
                        ${product.isNew ? '<span class="badge bg-success position-absolute top-0 end-0 m-2">Новинка</span>' : ''}
                        ${product.madeInUkraine ? '<span class="badge bg-info position-absolute bottom-0 start-0 m-2">🇺🇦 Украина</span>' : ''}
                    </div>
                    <div class="product-info">
                        <h6 class="product-title">
                            <a href="/product/${product.url}" class="text-decoration-none text-dark">
                                ${product.title}
                            </a>
                        </h6>
                        
                        <div class="product-vendor">
                            <i class="fas fa-industry me-1"></i>
                            ${vendorName}
                        </div>
                        
                        ${specs ? `
                            <div class="product-specs">
                                <i class="fas fa-info-circle me-1"></i>
                                ${specs}
                            </div>
                        ` : ''}
                        
                        <div class="product-price">
                            <span class="product-price-current">${product.currentPrice.toLocaleString()} грн.</span>
                            ${product.initPrice && product.initPrice > product.currentPrice ? 
                                `<span class="product-original-price">${product.initPrice.toLocaleString()} ₴</span>` : ''}
                        </div>
                        
                        <div class="product-reviews">
                            <i class="fas fa-star text-warning me-1"></i>
                            ${product.reviewsCount || 0} отзывов
                            <span class="ms-3">
                                <i class="fas fa-shopping-cart me-1"></i>
                                ${product.offerCount || 0} предложений
                            </span>
                        </div>
                        
                        <div class="product-actions">
                            <button class="btn btn-primary add-to-cart-btn" 
                                    data-product-id="${product._id}">
                                <i class="fas fa-cart-plus me-2"></i>
                                В корзину
                            </button>
                            <div class="d-flex gap-2">
                                <button class="btn btn-outline-secondary quick-view-btn" 
                                        data-product-id="${product._id}"
                                        title="Быстрый просмотр">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-outline-secondary favorite-btn" 
                                        data-product-id="${product._id}"
                                        title="В избранное">
                                    <i class="fas fa-heart"></i>
                                </button>
                                <a href="${product.url}" target="_blank" class="btn btn-outline-secondary"
                                   title="Открыть на сайте">
                                    <i class="fas fa-external-link-alt"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderPagination(pagination) {
        const paginationElement = document.getElementById('pagination');
        
        if (pagination.totalPages <= 1) {
            paginationElement.style.display = 'none';
            return;
        }

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <li class="page-item ${pagination.page === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${pagination.page - 1}">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        const startPage = Math.max(1, pagination.page - 2);
        const endPage = Math.min(pagination.totalPages, pagination.page + 2);

        if (startPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="1">1</a>
                </li>
            `;
            if (startPage > 2) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === pagination.page ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        if (endPage < pagination.totalPages) {
            if (endPage < pagination.totalPages - 1) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${pagination.totalPages}">${pagination.totalPages}</a>
                </li>
            `;
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${pagination.page + 1}">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        paginationElement.innerHTML = paginationHTML;

        // Add event listeners to pagination
        paginationElement.addEventListener('click', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('page-link') && !e.target.parentElement.classList.contains('disabled')) {
                const page = parseInt(e.target.dataset.page);
                if (page && page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadProducts();
                    // Scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        });
    }

    // Вспомогательные методы для обработки данных товара
    getProductImage(product) {
        if (!product.imageLinks || product.imageLinks.length === 0) {
            return 'https://via.placeholder.com/300x200?text=No+Image';
        }
        
        const firstImage = product.imageLinks[0];
        
        // Если imageLinks - массив объектов с разными размерами
        if (typeof firstImage === 'object' && firstImage !== null) {
            // Приоритет: big > thumb > basic >  small
            if (firstImage.big) {
                return firstImage.big;
            }
            
            if (firstImage.thumb) {
                return firstImage.thumb;
            }
            
            if (firstImage.basic) {
                return firstImage.basic;
            }
            
            if (firstImage.small) {
                return firstImage.small;
            }
            
            if (firstImage.original) {
                return firstImage.original;
            }
            
            if (firstImage.url) {
                return firstImage.url;
            }
            
            if (firstImage.src) {
                return firstImage.src;
            }
            
            // Если объект содержит URL как строку
            const urlKeys = Object.keys(firstImage).filter(key => 
                typeof firstImage[key] === 'string' && 
                (firstImage[key].startsWith('http') || firstImage[key].startsWith('//'))
            );
            
            if (urlKeys.length > 0) {
                return firstImage[urlKeys[0]];
            }
        }
        
        // Если imageLinks - массив строк
        if (typeof firstImage === 'string') {
            return firstImage;
        }
        
        return 'https://via.placeholder.com/300x200?text=No+Image';
    }

    getVendorName(product) {
        if (product.vendor) {
            // Если vendor - объект с полем name
            if (product.vendor.name) {
                return product.vendor.name;
            }
            // Если vendor - объект с полем title
            if (product.vendor.title) {
                return product.vendor.title;
            }
            // Если vendor - объект с полем id
            if (product.vendor.id) {
                return `Производитель ${product.vendor.id}`;
            }
            // Если vendor - строка
            if (typeof product.vendor === 'string') {
                return product.vendor;
            }
        }
        return 'Неизвестный производитель';
    }

    getProductSpecs(product) {
        if (product.techShortSpecifications && product.techShortSpecifications.length > 0) {
            // Берем первые 2 характеристики
            return product.techShortSpecifications.slice(0, 2).join(', ');
        }
        
        if (product.techShortSpecificationsList && product.techShortSpecificationsList.length > 0) {
            // Берем первые 2 характеристики из списка объектов
            const specs = product.techShortSpecificationsList.slice(0, 2).map(spec => {
                if (spec.key && spec.value) {
                    return `${spec.key}: ${spec.value}`;
                }
                return spec.value || spec.key;
            });
            return specs.join(', ');
        }
        
        return null;
    }

    // Методы для дополнительной функциональности
    showQuickView(productId) {
        // Находим товар в текущем списке
        const product = this.currentProducts.find(p => p._id === productId);
        if (!product) return;

        // Создаем модальное окно для быстрого просмотра
        const modalId = 'quickViewModal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = modalId;
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Быстрый просмотр</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="quickViewContent">
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const content = modal.querySelector('#quickViewContent');
        const mainImage = this.getProductImage(product);
        const vendorName = this.getVendorName(product);
        const specs = this.getProductSpecs(product);
        const discount = product.initPrice && product.initPrice > product.currentPrice 
            ? Math.round(((product.initPrice - product.currentPrice) / product.initPrice) * 100)
            : 0;

        content.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <img src="${mainImage}" 
                         alt="${product.title}" 
                         class="img-fluid rounded"
                         onerror="this.src='https://via.placeholder.com/400x300?text=Ошибка+загрузки'">
                    ${product.imagesCount > 1 ? `
                        <div class="mt-2">
                            <small class="text-muted">
                                <i class="fas fa-images"></i>
                                Еще ${product.imagesCount - 1} фото
                            </small>
                        </div>
                    ` : ''}
                </div>
                <div class="col-md-6">
                    <h4>${product.title}</h4>
                    <p class="text-muted">
                        <i class="fas fa-industry me-1"></i>
                        ${vendorName}
                    </p>
                    
                    ${specs ? `
                        <div class="mb-3">
                            <h6>Характеристики:</h6>
                            <small class="text-muted">${specs}</small>
                        </div>
                    ` : ''}
                    
                    <div class="mb-3">
                        <div class="h3 text-primary">${product.currentPrice.toLocaleString()} ₽</div>
                        ${product.initPrice && product.initPrice > product.currentPrice ? 
                            `<div class="text-muted text-decoration-line-through">${product.initPrice.toLocaleString()} ₽</div>` : ''}
                        ${discount > 0 ? `<span class="badge bg-danger">-${discount}%</span>` : ''}
                    </div>
                    
                    <div class="d-grid gap-2">
                        <button class="btn btn-primary add-to-cart-btn" data-product-id="${product._id}">
                            <i class="fas fa-cart-plus me-2"></i>
                            Добавить в корзину
                        </button>
                        <a href="${product.url}" target="_blank" class="btn btn-outline-primary">
                            <i class="fas fa-external-link-alt me-2"></i>
                            Перейти к товару
                        </a>
                    </div>
                </div>
            </div>
        `;

        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    toggleFavorite(productId) {
        // Простая реализация избранного через localStorage
        const favorites = JSON.parse(localStorage.getItem('bifo_favorites') || '[]');
        const index = favorites.indexOf(productId);
        
        if (index > -1) {
            favorites.splice(index, 1);
            this.showAlert('Товар удален из избранного', 'info');
        } else {
            favorites.push(productId);
            this.showAlert('Товар добавлен в избранное', 'success');
        }
        
        localStorage.setItem('bifo_favorites', JSON.stringify(favorites));
        
        // Обновляем иконку кнопки
        const button = document.querySelector(`[data-product-id="${productId}"].favorite-btn`);
        if (button) {
            const icon = button.querySelector('i');
            if (index > -1) {
                icon.className = 'fas fa-heart';
                button.classList.remove('btn-danger');
                button.classList.add('btn-outline-secondary');
            } else {
                icon.className = 'fas fa-heart text-danger';
                button.classList.remove('btn-outline-secondary');
                button.classList.add('btn-danger');
            }
        }
    }

    showAlert(message, type = 'info') {
        // Создаем уведомление
        const alertId = 'categoryAlert';
        let alert = document.getElementById(alertId);
        
        if (!alert) {
            alert = document.createElement('div');
            alert.id = alertId;
            alert.className = 'position-fixed top-0 end-0 p-3';
            alert.style.zIndex = '9999';
            document.body.appendChild(alert);
        }

        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        alert.innerHTML = alertHtml;
        
        // Автоматически скрываем через 3 секунды
        setTimeout(() => {
            const alertElement = alert.querySelector('.alert');
            if (alertElement) {
                const bsAlert = new bootstrap.Alert(alertElement);
                bsAlert.close();
            }
        }, 3000);
    }

    updateFavoriteButtons() {
        const favorites = JSON.parse(localStorage.getItem('bifo_favorites') || '[]');
        
        // Обновляем все кнопки избранного на странице
        document.querySelectorAll('.favorite-btn').forEach(button => {
            const productId = button.dataset.productId;
            const icon = button.querySelector('i');
            
            if (favorites.includes(productId)) {
                icon.className = 'fas fa-heart text-danger';
                button.classList.remove('btn-outline-secondary');
                button.classList.add('btn-danger');
            } else {
                icon.className = 'fas fa-heart';
                button.classList.remove('btn-danger');
                button.classList.add('btn-outline-secondary');
            }
        });
    }

    async apiRequest(endpoint, options = {}) {
        const url = `${this.apiBase}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json'
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
            throw error;
        }
    }

    // Initialize enhanced interactions
    initEnhancedInteractions() {
        // Add smooth scrolling to pagination
        document.addEventListener('click', (e) => {
            if (e.target.closest('.pagination .page-link')) {
                e.preventDefault();
                const target = document.getElementById('productsGrid');
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });

        // Add loading states to buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart-btn')) {
                const btn = e.target.closest('.add-to-cart-btn');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Добавляем...';
                btn.disabled = true;
                
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }, 2000);
            }
        });

        // Add hover effects to product cards
        document.addEventListener('mouseenter', (e) => {
            if (e.target.closest('.product-card')) {
                const card = e.target.closest('.product-card');
                card.style.transform = 'translateY(-5px) scale(1.02)';
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            if (e.target.closest('.product-card')) {
                const card = e.target.closest('.product-card');
                card.style.transform = '';
            }
        }, true);

        // Add filter animation
        const filterInputs = document.querySelectorAll('.filters-sidebar input, .filters-sidebar select');
        filterInputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.style.transform = 'scale(1.02)';
            });
            
            input.addEventListener('blur', () => {
                input.parentElement.style.transform = '';
            });
        });

        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close any open modals or dropdowns
                const modals = document.querySelectorAll('.modal.show');
                modals.forEach(modal => {
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    if (modalInstance) {
                        modalInstance.hide();
                    }
                });
            }
        });

        // Add intersection observer for animations
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            // Observe product cards
            document.addEventListener('DOMContentLoaded', () => {
                const cards = document.querySelectorAll('.product-card');
                cards.forEach(card => {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                    observer.observe(card);
                });
            });
        }
    }

    // Enhanced error handling
    showEnhancedError(message, type = 'error') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : 'warning'} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    // Enhanced success feedback
    showEnhancedSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success alert-dismissible fade show position-fixed';
        successDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(successDiv);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 3000);
    }
}

// Initialize the category page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.categoryPage = new CategoryPage();
    
    // Initialize enhanced interactions after a short delay
    setTimeout(() => {
        if (window.categoryPage && window.categoryPage.initEnhancedInteractions) {
            window.categoryPage.initEnhancedInteractions();
        }
    }, 1000);
}); 