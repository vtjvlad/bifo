// Product Page JavaScript
class ProductPage {
    constructor() {
        this.apiBase = '/api';
        this.productId = this.getProductIdFromURL();
        this.currentProduct = null;
        this.currentImageIndex = 0;
        this.images = [];
        
        // Не инициализируем автоматически - это будет сделано из HTML
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
        // Get product ID from the current page URL path
        const pathSegments = window.location.pathname.split('/');
        const productId = pathSegments[2]; // Get the ID after '/product/'
        
        console.log('🔍 Debug - Path segments:', pathSegments);
        console.log('🔍 Debug - Product ID from path:', productId);
        
        if (!productId) {
            // Fallback to query parameter for backward compatibility
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('id');
            console.log('🔍 Debug - Product ID from query:', id);
            return id;
        }
        
        return productId;
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

    validateProductData(product) {
        console.log('🔍 Debug - Validating product data:', product);
        
        // Проверяем обязательные поля
        const requiredFields = ['_id', 'title'];
        for (const field of requiredFields) {
            if (!product[field]) {
                console.error(`❌ Missing required field: ${field}`);
                return null;
            }
        }
        
        // Добавляем значения по умолчанию для отсутствующих полей
        const validatedProduct = {
            ...product,
            currentPrice: product.currentPrice || 0,
            initPrice: product.initPrice || product.currentPrice || 0,
            title: product.title || 'Без названия',
            vendor: product.vendor || { name: 'Не указан', title: 'Не указан' },
            section: product.section || { productCategoryName: 'Не указана' },
            url: product.url || '#',
            imageLinks: product.imageLinks || [],
            images: product.images || [],
            offerCount: product.offerCount || 0,
            imagesCount: product.imagesCount || 0,
            viewsCount: product.viewsCount || 0,
            reviewsCount: product.reviewsCount || 0,
            rating: product.rating || 0,
            isPromo: product.isPromo || false,
            isNew: product.isNew || false,
            madeInUkraine: product.madeInUkraine || false,
            techShortSpecifications: product.techShortSpecifications || [],
            techShortSpecificationsList: product.techShortSpecificationsList || [],
            productValues: product.productValues || [],
            fullDescription: product.fullDescription || '',
            description: product.description || ''
        };
        
        console.log('✅ Product data validated successfully');
        return validatedProduct;
    }

    async loadProduct() {
        if (!this.productId) {
            console.log('❌ No product ID found');
            this.showEmptyState('ID товара не найден');
            return;
        }

        console.log('🔍 Debug - Loading product with ID:', this.productId);
        this.showLoading();

        try {
            const apiEndpoint = `/products/${this.productId}`;
            console.log('🔍 Debug - Using ID endpoint:', apiEndpoint);
            
            const response = await this.apiRequest(apiEndpoint);
            console.log('🔍 Debug - API response:', response);
            
            if (response.success && response.data) {
                // Валидируем данные товара
                const validatedProduct = this.validateProductData(response.data);
                if (validatedProduct) {
                    this.currentProduct = validatedProduct;
                    await this.renderProduct();
                    this.loadSimilarProducts();
                } else {
                    console.log('❌ Product data validation failed');
                    this.showEmptyState('Данные товара некорректны');
                }
            } else {
                console.log('❌ API returned no data or error:', response);
                const errorMessage = response.error || 'Товар не найден';
                this.showEmptyState(errorMessage);
            }
        } catch (error) {
            console.error('❌ Error loading product:', error);
            let errorMessage = 'Ошибка загрузки товара';
            
            if (error.message.includes('404')) {
                errorMessage = 'Товар не найден';
            } else if (error.message.includes('500')) {
                errorMessage = 'Ошибка сервера';
            } else if (error.message.includes('network')) {
                errorMessage = 'Ошибка сети';
            }
            
            this.showEmptyState(errorMessage);
        }
    }

    async renderProduct() {
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
        await this.loadSpecifications(product);

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
        console.log('🔍 Debug - Loading images for product:', product.title);
        
        this.images = this.getProductImages(product);
        console.log('🔍 Debug - Found images:', this.images.length);
        
        if (this.images.length > 0) {
            // Set main image
            this.changeMainImage(0);
            
            // Create thumbnails
            this.createThumbnails();
            
            console.log('✅ Images loaded successfully');
        } else {
            console.log('⚠️ No images found, using placeholder');
            // Set placeholder image
            const mainImage = document.getElementById('mainImage');
            if (mainImage) {
                mainImage.src = 'https://via.placeholder.com/400x400?text=Нет+изображения';
                mainImage.alt = 'Изображение недоступно';
            }
            
            // Clear thumbnails
            const thumbnailContainer = document.getElementById('thumbnailImages');
            if (thumbnailContainer) {
                thumbnailContainer.innerHTML = '';
            }
        }
    }

    getProductImages(product) {
        const images = [];
        
        console.log('🔍 Debug - Getting images from product data');
        
        // Проверяем imageLinks (новый формат)
        if (product.imageLinks && Array.isArray(product.imageLinks)) {
            console.log('🔍 Debug - Processing imageLinks:', product.imageLinks.length);
            product.imageLinks.forEach((imageLink, index) => {
                if (typeof imageLink === 'object' && imageLink !== null) {
                    // Priority: big > basic > thumb > small
                    if (imageLink.big && imageLink.big.trim()) {
                        images.push(imageLink.big);
                        console.log(`✅ Added image ${index + 1}: big`);
                    } else if (imageLink.basic && imageLink.basic.trim()) {
                        images.push(imageLink.basic);
                        console.log(`✅ Added image ${index + 1}: basic`);
                    } else if (imageLink.thumb && imageLink.thumb.trim()) {
                        images.push(imageLink.thumb);
                        console.log(`✅ Added image ${index + 1}: thumb`);
                    } else if (imageLink.small && imageLink.small.trim()) {
                        images.push(imageLink.small);
                        console.log(`✅ Added image ${index + 1}: small`);
                    }
                }
            });
        }
        
        // Проверяем images (старый формат)
        if (product.images && Array.isArray(product.images)) {
            console.log('🔍 Debug - Processing images:', product.images.length);
            product.images.forEach((image, index) => {
                if (typeof image === 'string' && image.trim()) {
                    images.push(image);
                    console.log(`✅ Added image ${index + 1}: string`);
                } else if (typeof image === 'object' && image !== null) {
                    // Priority: big > basic > thumb > small
                    if (image.big && image.big.trim()) {
                        images.push(image.big);
                        console.log(`✅ Added image ${index + 1}: big`);
                    } else if (image.basic && image.basic.trim()) {
                        images.push(image.basic);
                        console.log(`✅ Added image ${index + 1}: basic`);
                    } else if (image.thumb && image.thumb.trim()) {
                        images.push(image.thumb);
                        console.log(`✅ Added image ${index + 1}: thumb`);
                    } else if (image.small && image.small.trim()) {
                        images.push(image.small);
                        console.log(`✅ Added image ${index + 1}: small`);
                    }
                }
            });
        }
        
        // Удаляем дубликаты
        const uniqueImages = [...new Set(images)];
        console.log(`🔍 Debug - Total unique images found: ${uniqueImages.length}`);
        
        return uniqueImages;
    }

    changeMainImage(index) {
        if (index >= 0 && index < this.images.length) {
            this.currentImageIndex = index;
            const mainImage = document.getElementById('mainImage');
            if (mainImage) {
                mainImage.src = this.images[index];
                mainImage.alt = `Изображение ${index + 1}`;
                
                // Добавляем обработчик ошибок загрузки изображения
                mainImage.onerror = () => {
                    console.log(`⚠️ Failed to load main image ${index + 1}:`, this.images[index]);
                    mainImage.src = 'https://via.placeholder.com/400x400?text=Ошибка+загрузки';
                    mainImage.alt = 'Ошибка загрузки изображения';
                };
            }
            
            // Update thumbnails
            document.querySelectorAll('.thumbnail-item').forEach((item, i) => {
                item.classList.toggle('active', i === index);
            });
            
            console.log(`✅ Changed main image to index ${index}`);
        }
    }

    createThumbnails() {
        const container = document.getElementById('thumbnailImages');
        if (!container) {
            console.log('❌ thumbnailImages container not found');
            return;
        }
        
        container.innerHTML = '';
        
        this.images.forEach((image, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = `thumbnail-item ${index === 0 ? 'active' : ''}`;
            thumbnail.dataset.index = index;
            
            const img = document.createElement('img');
            img.src = image;
            img.alt = `Изображение ${index + 1}`;
            
            // Добавляем обработчик ошибок загрузки изображения
            img.onerror = () => {
                console.log(`⚠️ Failed to load thumbnail image ${index + 1}:`, image);
                img.src = 'https://via.placeholder.com/100x100?text=Ошибка';
                img.alt = 'Ошибка загрузки';
            };
            
            thumbnail.appendChild(img);
            container.appendChild(thumbnail);
        });
        
        console.log(`✅ Created ${this.images.length} thumbnails`);
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

    async loadSpecifications(product) {
        const container = document.getElementById('specificationsContent');
        if (!container) {
            console.log('❌ specificationsContent container not found');
            return;
        }
        
        console.log('🔍 Debug - Loading specifications for product:', product._id);
        
        // Показываем загрузку
        container.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Загрузка характеристик...</div>';
        
        try {
            // Загружаем подробные характеристики с сервера
            const response = await this.apiRequest(`/products/${product._id}/specifications`);
            console.log('🔍 Debug - Specifications API response:', response);
            
            if (response.success && response.data) {
                this.renderSpecifications(response.data);
                console.log('✅ Specifications loaded successfully');
            } else {
                console.log('⚠️ Specifications API failed, using fallback');
                // Fallback к старым данным
                this.renderLegacySpecifications(product);
            }
        } catch (error) {
            console.error('❌ Error loading specifications:', error);
            // Fallback к старым данным
            this.renderLegacySpecifications(product);
        }
    }

    renderSpecifications(data) {
        const container = document.getElementById('specificationsContent');
        if (!container) return;
        
        let html = '';
        // Используем новый массив ordered, который сохраняет исходный порядок
        let allSpecs = [];
        if (data.specifications.ordered && Array.isArray(data.specifications.ordered)) {
            allSpecs = data.specifications.ordered;
        } else {
            // Fallback к старой логике для обратной совместимости
            if (data.specifications.basic && Array.isArray(data.specifications.basic)) {
                allSpecs = allSpecs.concat(data.specifications.basic);
            }
            if (data.specifications.technical && Array.isArray(data.specifications.technical)) {
                allSpecs = allSpecs.concat(data.specifications.technical);
            }
            if (data.specifications.detailed && Array.isArray(data.specifications.detailed)) {
                allSpecs = allSpecs.concat(data.specifications.detailed);
            }
        }
        
        // ВРЕМЕННО: выводим массив для отладки
        console.log('allSpecs for debug:', allSpecs);

        if (allSpecs.length > 0) {
            html += '<div class="specifications-section mb-4">';
            let sectionOpen = false;
            allSpecs.forEach((spec, idx) => {
                if (spec.isHeader) {
                    // Закрываем предыдущую секцию, если была
                    if (sectionOpen) {
                        html += '</div>';
                    }
                    // Открываем новую секцию
                    html += `<div class=\"spec-section\">`;
                    html += `<div class=\"spec-section-title fw-bold border-bottom pb-2 mb-3 mt-4\"><i class=\"fas fa-list-alt me-2\"></i>${spec.title}</div>`;
                    sectionOpen = true;
                } else if (spec.title && spec.value) {
                    if (!sectionOpen) {
                        html += '<div class=\"spec-section\">';
                        sectionOpen = true;
                    }
                    html += `
                        <div class=\"spec-item d-flex align-items-center mb-2\">
                            <strong class=\"me-2\">${spec.title}
                                ${spec.help ? `<span class=\"ms-1\"><i class=\"fas fa-question-circle text-primary\" data-bs-toggle=\"tooltip\" data-bs-placement=\"top\" title=\"${spec.help.replace(/\"/g, '&quot;')}\"></i></span>` : ''}
                            :</strong> <span>${spec.value}</span>
                        </div>
                    `;
                }
            });
            if (sectionOpen) {
                html += '</div>';
            }
            html += '</div>';
        }

        // Fallback к старым данным если новых нет
        if (!html && (data.techShortSpecifications || data.techShortSpecificationsList)) {
            html = this.renderLegacySpecificationsHTML(data);
        }
        
        if (!html) {
            html = '<p class="text-muted">Характеристики не указаны</p>';
        }
        
        container.innerHTML = html;
        // Инициализация Bootstrap Tooltip для всех иконок вопроса
        const tooltipTriggerList = [].slice.call(container.querySelectorAll('[data-bs-toggle=\'tooltip\']'));
        tooltipTriggerList.forEach(function (tooltipTriggerEl) {
            new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    renderLegacySpecifications(product) {
        const container = document.getElementById('specificationsContent');
        if (!container) return;
        
        container.innerHTML = this.renderLegacySpecificationsHTML(product);
    }

    renderLegacySpecificationsHTML(data) {
        let html = '';
        
        // Проверяем techShortSpecificationsList (новый формат)
        if (data.techShortSpecificationsList && Array.isArray(data.techShortSpecificationsList) && data.techShortSpecificationsList.length > 0) {
            html = '<div class="row">';
            
            data.techShortSpecificationsList.forEach(spec => {
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
        else if (data.techShortSpecifications && Array.isArray(data.techShortSpecifications) && data.techShortSpecifications.length > 0) {
            html = '<div class="row">';
            
            data.techShortSpecifications.forEach(spec => {
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
        else if (data.specifications && Object.keys(data.specifications).length > 0) {
            html = '<div class="row">';
            
            Object.entries(data.specifications).forEach(([key, value]) => {
                html += `
                    <div class="col-md-6 mb-3">
                        <div class="spec-item">
                            <strong>${key}:</strong> ${value}
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        return html || '<p class="text-muted">Характеристики не указаны</p>';
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
        if (!this.currentProduct) {
            console.log('❌ No current product for similar products');
            return;
        }

        console.log('🔍 Debug - Loading similar products for:', this.currentProduct._id);

        try {
            const response = await this.apiRequest(`/products/${this.currentProduct._id}/similar`);
            console.log('🔍 Debug - Similar products response:', response);
            
            if (response.success && response.data && response.data.length > 0) {
                this.renderSimilarProducts(response.data);
                console.log(`✅ Loaded ${response.data.length} similar products`);
            } else {
                console.log('⚠️ No similar products found');
                const container = document.getElementById('similarProducts');
                if (container) {
                    container.innerHTML = `
                        <div class="col-12">
                            <div class="text-center py-4">
                                <i class="fas fa-info-circle text-muted mb-2"></i>
                                <p class="text-muted">Похожие товары не найдены</p>
                            </div>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('❌ Error loading similar products:', error);
            const container = document.getElementById('similarProducts');
            if (container) {
                container.innerHTML = `
                    <div class="col-12">
                        <div class="text-center py-4">
                            <i class="fas fa-exclamation-triangle text-warning mb-2"></i>
                            <p class="text-muted">Ошибка загрузки похожих товаров</p>
                            <button class="btn btn-outline-secondary btn-sm" onclick="window.productPage.loadSimilarProducts()">
                                <i class="fas fa-redo me-1"></i>Повторить
                            </button>
                        </div>
                    </div>
                `;
            }
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

    showEmptyState(message = 'Товар не найден') {
        const container = document.querySelector('.product-container');
        if (container) {
            container.innerHTML = `
                <div class="product-empty text-center py-5">
                    <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                    <h3>${message}</h3>
                    <p class="text-muted">
                        ${message === 'Товар не найден' ? 'Запрашиваемый товар не существует или был удален' : 
                          message === 'ID товара не найден' ? 'Не удалось определить ID товара из URL' :
                          message === 'Данные товара некорректны' ? 'Полученные данные товара содержат ошибки' :
                          'Произошла ошибка при загрузке товара'}
                    </p>
                    <div class="mt-4">
                        <a href="/catalog.html" class="btn btn-primary me-2">
                            <i class="fas fa-arrow-left me-2"></i>
                            Вернуться к каталогу
                        </a>
                        <button class="btn btn-outline-secondary" onclick="window.location.reload()">
                            <i class="fas fa-redo me-2"></i>
                            Обновить страницу
                        </button>
                    </div>
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
        
        console.log('🔍 Debug - API Request:', url);
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            console.log('🔍 Debug - API Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText || 'Unknown error'}`);
            }
            
            const data = await response.json();
            console.log('🔍 Debug - API Response data:', data);
            return data;
        } catch (error) {
            console.error('❌ API Request failed:', error);
            throw error;
        }
    }
}

// Initialize the product page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productPage = new ProductPage();
}); 