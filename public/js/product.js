// Product Page JavaScript
class ProductPage {
    constructor() {
        this.apiBase = '/api';
        this.productId = this.getProductIdFromURL();
        this.currentProduct = null;
        this.currentImageIndex = 0;
        this.images = [];
        
        this.init();
    }

    async init() {
        // Wait for components to load
        await this.waitForComponents();
        
        this.setupEventListeners();
        this.updateBreadcrumb();
        this.loadProduct();
    }

    async waitForComponents() {
        return new Promise((resolve) => {
            // Ждем загрузки компонентов или таймаут
            const checkComponents = () => {
                const headerComponent = document.querySelector('[data-component="header"]');
                const footerComponent = document.querySelector('[data-component="footer"]');
                
                // Если компоненты загружены или прошло достаточно времени, продолжаем
                if ((headerComponent && headerComponent.innerHTML.trim() !== '') || 
                    (footerComponent && footerComponent.innerHTML.trim() !== '') ||
                    document.readyState === 'complete') {
                    resolve();
                } else {
                    setTimeout(checkComponents, 100);
                }
            };
            
            // Начинаем проверку через 100мс
            setTimeout(checkComponents, 100);
            
            // Максимальное время ожидания - 3 секунды
            setTimeout(() => {
                resolve();
            }, 3000);
        });
    }

    getProductIdFromURL() {
        // Get product URL from the current page URL path
        const pathSegments = window.location.pathname.split('/');
        const productUrl = pathSegments.slice(2).join('/'); // Remove '/product/' prefix
        
        console.log('🔍 Debug - Path segments:', pathSegments);
        console.log('🔍 Debug - Product URL from path:', productUrl);
        
        if (!productUrl) {
            // Fallback to query parameter for backward compatibility
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('id');
            console.log('🔍 Debug - Product ID from query:', id);
            return id;
        }
        
        return productUrl;
    }

    setupEventListeners() {
        // Add to cart button
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                this.addToCart();
            });
        }

        // Favorite button
        const favoriteBtn = document.getElementById('favoriteBtn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => {
                this.toggleFavorite();
            });
        }

        // Zoom button
        const zoomBtn = document.getElementById('zoomBtn');
        if (zoomBtn) {
            zoomBtn.addEventListener('click', () => {
                this.showImageZoom();
            });
        }

        // Thumbnail clicks (delegated)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.thumbnail-item')) {
                const index = parseInt(e.target.closest('.thumbnail-item').dataset.index);
                this.changeMainImage(index);
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.previousImage();
            } else if (e.key === 'ArrowRight') {
                this.nextImage();
            } else if (e.key === 'Escape') {
                this.closeImageZoom();
            }
        });
    }

    updateBreadcrumb() {
        const breadcrumb = document.getElementById('breadcrumb');
        if (!breadcrumb || !this.productId) return;

        // Update category link when product is loaded
        // This will be called after product data is loaded
    }

    async loadProduct() {
        if (!this.productId) {
            console.log('❌ No product ID found');
            this.showEmptyState();
            return;
        }

        console.log('🔍 Debug - Loading product with ID/URL:', this.productId);
        this.showLoading();

        try {
            let response;
            let apiEndpoint;
            
            // Check if productId looks like a URL (contains slashes or is not a MongoDB ObjectId)
            if (this.productId.includes('/') || this.productId.length > 24) {
                // It's a URL, use the URL endpoint
                const decodedUrl = decodeURIComponent(this.productId);
                apiEndpoint = `/products/url/${encodeURIComponent(decodedUrl)}`;
                console.log('🔍 Debug - Using URL endpoint:', apiEndpoint);
            } else {
                // It's an ID, use the ID endpoint
                apiEndpoint = `/products/${this.productId}`;
                console.log('🔍 Debug - Using ID endpoint:', apiEndpoint);
            }
            
            response = await this.apiRequest(apiEndpoint);
            console.log('🔍 Debug - API response:', response);
            
            if (response.success && response.data) {
                this.currentProduct = response.data;
                this.renderProduct();
                this.loadSimilarProducts();
            } else {
                console.log('❌ API returned no data or error');
                this.showEmptyState();
            }
        } catch (error) {
            console.error('❌ Error loading product:', error);
            this.showEmptyState();
        }
    }

    renderProduct() {
        if (!this.currentProduct) return;

        const product = this.currentProduct;

        // Update page title and meta
        document.title = `${product.title} - BIFO`;
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', 
                `Купить ${product.title} - ${product.currentPrice.toLocaleString()} грн. Интернет-магазин BIFO`);
        }

        // Update breadcrumb
        this.updateBreadcrumbWithProduct(product);

        // Update main content with null checks
        const productTitle = document.getElementById('productTitle');
        if (productTitle) productTitle.textContent = product.title;
        
        const productVendor = document.getElementById('productVendor');
        if (productVendor) productVendor.textContent = this.getVendorName(product);
        
        const currentPrice = document.getElementById('currentPrice');
        if (currentPrice) currentPrice.textContent = product.currentPrice.toLocaleString();
        
        // Handle original price and discount
        if (product.initPrice && product.initPrice > product.currentPrice) {
            const discount = Math.round(((product.initPrice - product.currentPrice) / product.initPrice) * 100);
            
            const originalPrice = document.getElementById('originalPrice');
            if (originalPrice) originalPrice.textContent = product.initPrice.toLocaleString();
            
            const discountPercent = document.getElementById('discountPercent');
            if (discountPercent) discountPercent.textContent = discount;
            
            const originalPriceContainer = document.getElementById('originalPriceContainer');
            if (originalPriceContainer) originalPriceContainer.style.display = 'flex';
            
            const discountBadge = document.getElementById('discountBadge');
            if (discountBadge) discountBadge.style.display = 'block';
        }

        // Update stats
        const offersCount = document.getElementById('offersCount');
        if (offersCount) offersCount.textContent = product.offerCount || 0;
        
        const imagesCount = document.getElementById('imagesCount');
        if (imagesCount) imagesCount.textContent = product.imagesCount || 0;
        
        const viewsCount = document.getElementById('viewsCount');
        if (viewsCount) viewsCount.textContent = product.viewsCount || 0;
        
        const reviewsCount = document.getElementById('reviewsCount');
        if (reviewsCount) reviewsCount.textContent = product.reviewsCount || 0;

        // Update rating
        this.updateRating(product.rating || 0);

        // Update external link
        const externalLink = document.getElementById('externalLink');
        if (externalLink) externalLink.href = product.url;

        // Load images
        this.loadImages(product);

        // Load specifications
        this.loadSpecifications(product);

        // Load description
        this.loadDescription(product);

        // Update favorite button state
        this.updateFavoriteButton();

        // Hide loading
        this.hideLoading();
    }

    updateBreadcrumbWithProduct(product) {
        const categoryLink = document.getElementById('categoryLink');
        if (categoryLink && product.category) {
            categoryLink.textContent = product.category.name || 'Категория';
            categoryLink.href = `/category.html?category=${product.category.slug}`;
        }
    }

    updateRating(rating) {
        const stars = document.querySelectorAll('.rating-stars i');
        const ratingValue = document.getElementById('ratingValue');
        
        if (ratingValue) {
            ratingValue.textContent = rating.toFixed(1);
        }
        
        stars.forEach((star, index) => {
            if (index < Math.floor(rating)) {
                star.className = 'fas fa-star text-warning';
            } else if (index < Math.ceil(rating) && rating % 1 > 0) {
                star.className = 'fas fa-star-half-alt text-warning';
            } else {
                star.className = 'far fa-star text-warning';
            }
        });
    }

    loadImages(product) {
        this.images = this.getProductImages(product);
        
        if (this.images.length > 0) {
            // Set main image
            this.changeMainImage(0);
            
            // Create thumbnails
            this.createThumbnails();
        } else {
            // Set placeholder image
            const mainImage = document.getElementById('mainImage');
            if (mainImage) {
                mainImage.src = 'https://via.placeholder.com/400x400?text=Нет+изображения';
            }
        }
    }

    getProductImages(product) {
        const images = [];
        
        // Проверяем imageLinks (новый формат)
        if (product.imageLinks && Array.isArray(product.imageLinks)) {
            product.imageLinks.forEach(imageLink => {
                if (typeof imageLink === 'object' && imageLink !== null) {
                    // Priority: big > basic > thumb > small
                    if (imageLink.big) images.push(imageLink.big);
                    else if (imageLink.basic) images.push(imageLink.basic);
                    else if (imageLink.thumb) images.push(imageLink.thumb);
                    else if (imageLink.small) images.push(imageLink.small);
                }
            });
        }
        
        // Проверяем images (старый формат)
        if (product.images && Array.isArray(product.images)) {
            product.images.forEach(image => {
                if (typeof image === 'string') {
                    images.push(image);
                } else if (typeof image === 'object' && image !== null) {
                    // Priority: big > basic > thumb > small
                    if (image.big) images.push(image.big);
                    else if (image.basic) images.push(image.basic);
                    else if (image.thumb) images.push(image.thumb);
                    else if (image.small) images.push(image.small);
                }
            });
        }
        
        return images;
    }

    changeMainImage(index) {
        if (index >= 0 && index < this.images.length) {
            this.currentImageIndex = index;
            const mainImage = document.getElementById('mainImage');
            if (mainImage) {
                mainImage.src = this.images[index];
            }
            
            // Update thumbnails
            document.querySelectorAll('.thumbnail-item').forEach((item, i) => {
                item.classList.toggle('active', i === index);
            });
        }
    }

    createThumbnails() {
        const container = document.getElementById('thumbnailImages');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.images.forEach((image, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = `thumbnail-item ${index === 0 ? 'active' : ''}`;
            thumbnail.dataset.index = index;
            
            thumbnail.innerHTML = `<img src="${image}" alt="Изображение ${index + 1}">`;
            container.appendChild(thumbnail);
        });
    }

    previousImage() {
        const newIndex = this.currentImageIndex > 0 ? this.currentImageIndex - 1 : this.images.length - 1;
        this.changeMainImage(newIndex);
    }

    nextImage() {
        const newIndex = this.currentImageIndex < this.images.length - 1 ? this.currentImageIndex + 1 : 0;
        this.changeMainImage(newIndex);
    }

    showImageZoom() {
        if (this.images.length > 0) {
            document.getElementById('zoomedImage').src = this.images[this.currentImageIndex];
            const modal = new bootstrap.Modal(document.getElementById('imageZoomModal'));
            modal.show();
        }
    }

    closeImageZoom() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('imageZoomModal'));
        if (modal) {
            modal.hide();
        }
    }

    loadSpecifications(product) {
        const container = document.getElementById('specificationsContent');
        if (!container) return;
        
        let html = '';
        
        // Проверяем techShortSpecificationsList (новый формат)
        if (product.techShortSpecificationsList && Array.isArray(product.techShortSpecificationsList) && product.techShortSpecificationsList.length > 0) {
            html = '<div class="row">';
            
            product.techShortSpecificationsList.forEach(spec => {
                if (spec.key && spec.value) {
                    html += `
                        <div class="col-md-6 mb-3">
                            <div class="spec-item">
                                <strong>${spec.key}:</strong> ${spec.value}
                            </div>
                        </div>
                    `;
                } else if (spec.value) {
                    html += `
                        <div class="col-md-6 mb-3">
                            <div class="spec-item">
                                ${spec.value}
                            </div>
                        </div>
                    `;
                }
            });
            
            html += '</div>';
        }
        // Проверяем techShortSpecifications (старый формат)
        else if (product.techShortSpecifications && Array.isArray(product.techShortSpecifications) && product.techShortSpecifications.length > 0) {
            html = '<div class="row">';
            
            product.techShortSpecifications.forEach(spec => {
                html += `
                    <div class="col-md-6 mb-3">
                        <div class="spec-item">
                            ${spec}
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        // Проверяем specifications (еще один формат)
        else if (product.specifications && Object.keys(product.specifications).length > 0) {
            html = '<div class="row">';
            
            Object.entries(product.specifications).forEach(([key, value]) => {
                html += `
                    <div class="col-md-6 mb-3">
                        <div class="col-md-6 mb-3">
                            <div class="spec-item">
                                <strong>${key}:</strong> ${value}
                            </div>
                        </div>
                    `;
            });
            
            html += '</div>';
        } else {
            html = '<p class="text-muted">Характеристики не указаны</p>';
        }
        
        container.innerHTML = html;
    }

    loadDescription(product) {
        const container = document.getElementById('descriptionContent');
        if (!container) return;
        
        let html = '';
        
        if (product.description) {
            html = `<p>${product.description}</p>`;
        } else {
            // Если нет описания, создаем базовое описание из данных товара
            html = `
                <div class="product-description">
                    <h5>${product.title}</h5>
                    ${product.vendor && product.vendor.title ? `<p><strong>Производитель:</strong> ${product.vendor.title}</p>` : ''}
                    ${product.section && product.section.productCategoryName ? `<p><strong>Категория:</strong> ${product.section.productCategoryName}</p>` : ''}
                    ${product.techShortSpecifications && product.techShortSpecifications.length > 0 ? 
                        `<p><strong>Основные характеристики:</strong></p><ul>${product.techShortSpecifications.map(spec => `<li>${spec}</li>`).join('')}</ul>` : ''}
                </div>
            `;
        }
        
        container.innerHTML = html;
    }

    async loadSimilarProducts() {
        if (!this.currentProduct) return;

        try {
            const response = await this.apiRequest(`/products/${this.productId}/similar`);
            
            if (response.success && response.data.length > 0) {
                this.renderSimilarProducts(response.data);
            } else {
                document.getElementById('similarProducts').innerHTML = 
                    '<div class="col-12"><p class="text-muted text-center">Похожие товары не найдены</p></div>';
            }
        } catch (error) {
            console.error('Error loading similar products:', error);
            document.getElementById('similarProducts').innerHTML = 
                '<div class="col-12"><p class="text-muted text-center">Ошибка загрузки похожих товаров</p></div>';
        }
    }

    renderSimilarProducts(products) {
        const container = document.getElementById('similarProducts');
        if (!container) {
            console.log('❌ similarProducts container not found');
            return;
        }
        
        const html = products.map(product => `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="product-card h-100">
                    <div class="product-image-container">
                        <img src="${this.getProductImage(product)}" 
                             alt="${product.title}" 
                             class="product-image"
                             onerror="this.src='https://via.placeholder.com/300x200?text=Ошибка+загрузки'">
                        ${this.getDiscountBadge(product)}
                    </div>
                    <div class="product-info">
                        <h6 class="product-title">${product.title}</h6>
                        <div class="product-vendor">
                            <i class="fas fa-industry me-1"></i>
                            ${this.getVendorName(product)}
                        </div>
                        <div class="product-price">
                            <span class="product-price-current">${product.currentPrice.toLocaleString()} грн.</span>
                            ${product.initPrice && product.initPrice > product.currentPrice ? 
                                `<span class="product-original-price">${product.initPrice.toLocaleString()} грн.</span>` : ''}
                        </div>
                        <div class="product-actions">
                            <button class="btn btn-primary add-to-cart-btn" data-product-id="${product._id}">
                                <i class="fas fa-cart-plus me-2"></i>
                                В корзину
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
        
        // Add event listeners for similar products
        container.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart-btn')) {
                const productId = e.target.closest('.add-to-cart-btn').dataset.productId;
                if (window.app && window.app.addToCart) {
                    window.app.addToCart(productId);
                }
            }
        });
    }

    getProductImage(product) {
        if (product.images && product.images.length > 0) {
            const firstImage = product.images[0];
            
            if (typeof firstImage === 'string') {
                return firstImage;
            }
            
            if (typeof firstImage === 'object' && firstImage !== null) {
                if (firstImage.big) return firstImage.big;
                if (firstImage.basic) return firstImage.basic;
                if (firstImage.thumb) return firstImage.thumb;
                if (firstImage.small) return firstImage.small;
            }
        }
        
        return 'https://via.placeholder.com/300x200?text=Нет+изображения';
    }

    getVendorName(product) {
        if (product.vendor && product.vendor.name) {
            return product.vendor.name;
        }
        
        if (product.vendorName) {
            return product.vendorName;
        }
        
        return 'Не указан';
    }

    getDiscountBadge(product) {
        if (product.initPrice && product.initPrice > product.currentPrice) {
            const discount = Math.round(((product.initPrice - product.currentPrice) / product.initPrice) * 100);
            return `<span class="badge bg-danger position-absolute top-0 start-0 m-2">-${discount}%</span>`;
        }
        return '';
    }

    addToCart() {
        if (!this.currentProduct) return;
        
        if (window.app && window.app.addToCart) {
            window.app.addToCart(this.currentProduct._id);
            this.showSuccess('Товар добавлен в корзину!');
        }
    }

    toggleFavorite() {
        if (!this.currentProduct) return;
        
        if (window.app && window.app.toggleFavorite) {
            window.app.toggleFavorite(this.currentProduct._id);
            this.updateFavoriteButton();
        }
    }

    updateFavoriteButton() {
        const btn = document.getElementById('favoriteBtn');
        if (!btn) {
            console.log('❌ favoriteBtn element not found');
            return;
        }
        
        const icon = btn.querySelector('i');
        if (!icon) {
            console.log('❌ favorite button icon not found');
            return;
        }
        
        if (window.app && window.app.isFavorite && this.currentProduct) {
            const isFavorite = window.app.isFavorite(this.currentProduct._id);
            
            if (isFavorite) {
                icon.className = 'fas fa-heart me-2';
                btn.classList.add('btn-danger');
                btn.classList.remove('btn-outline-secondary');
            } else {
                icon.className = 'far fa-heart me-2';
                btn.classList.remove('btn-danger');
                btn.classList.add('btn-outline-secondary');
            }
        }
    }

    showLoading() {
        // Не перезаписываем контент, просто показываем спиннер поверх
        const container = document.querySelector('.product-container');
        if (container) {
            // Создаем спиннер загрузки
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'productLoading';
            loadingDiv.className = 'product-loading position-absolute w-100 h-100 d-flex align-items-center justify-content-center';
            loadingDiv.style.cssText = 'top: 0; left: 0; background: rgba(255,255,255,0.9); z-index: 1000;';
            loadingDiv.innerHTML = `
                <div class="text-center">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Загрузка...</span>
                    </div>
                    <p class="mt-3">Загружаем информацию о товаре...</p>
                </div>
            `;
            
            // Добавляем спиннер в контейнер
            container.style.position = 'relative';
            container.appendChild(loadingDiv);
        }
    }

    hideLoading() {
        // Удаляем спиннер загрузки
        const loadingDiv = document.getElementById('productLoading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    showEmptyState() {
        const container = document.querySelector('.product-container');
        if (container) {
            container.innerHTML = `
                <div class="product-empty text-center py-5">
                    <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                    <h3>Товар не найден</h3>
                    <p class="text-muted">Запрашиваемый товар не существует или был удален</p>
                    <a href="/catalog.html" class="btn btn-primary">
                        <i class="fas fa-arrow-left me-2"></i>
                        Вернуться к каталогу
                    </a>
                </div>
            `;
        }
    }

    showSuccess(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed';
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 3000);
    }

    async apiRequest(endpoint, options = {}) {
        const url = `${this.apiBase}${endpoint}`;
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }
}

// Initialize the product page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productPage = new ProductPage();
}); 