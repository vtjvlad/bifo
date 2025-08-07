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
        this.availableFilters = []; // Добавляем для хранения доступных фильтров
        
        // Get category parameters from URL
        this.categoryParams = this.getCategoryParamsFromURL();
        
        // Не инициализируем автоматически - это будет сделано из HTML
    }

    async init() {
        // Wait for components to load
        await this.waitForComponents();
        
        this.setupEventListeners();
        this.updateBreadcrumb();
        this.loadCategoryInfo();
        this.loadProducts(); // Сначала загружаем товары, потом фильтры по их section._id
        
        // Initialize enhanced interactions after a short delay
        setTimeout(() => {
            this.initEnhancedInteractions();
        }, 1000);
    }

    async waitForComponents() {
        return new Promise((resolve) => {
            const checkComponents = () => {
                const headerComponent = document.querySelector('[data-component="header"]');
                const megaMenuComponent = document.querySelector('[data-component="mega-menu"]');
                
                // Если компоненты загружены или прошло достаточно времени, продолжаем
                if ((headerComponent && headerComponent.innerHTML.trim() !== '') || 
                    (megaMenuComponent && megaMenuComponent.innerHTML.trim() !== '') ||
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
        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.applyFilters();
            });
        }

        // Sort events
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.currentPage = 1;
                this.loadProducts();
            });
        }

        // View mode events
        const gridViewBtn = document.getElementById('gridView');
        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', () => {
                this.setViewMode('grid');
            });
        }

        const listViewBtn = document.getElementById('listView');
        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => {
                this.setViewMode('list');
            });
        }

        // Enter key in price inputs
        const minPriceInput = document.getElementById('minPrice');
        if (minPriceInput) {
            minPriceInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.applyFilters();
            });
        }

        const maxPriceInput = document.getElementById('maxPrice');
        if (maxPriceInput) {
            maxPriceInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.applyFilters();
            });
        }

        // Reset filters button
        const resetFiltersBtn = document.getElementById('resetFilters');
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => {
                this.resetAllFilters();
            });
        }

        // Quick view events
        document.addEventListener('click', (e) => {
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
                document.title = `${category.name} - Купи слона`;
                
                // Update meta description
                const metaDescription = document.querySelector('meta[name="description"]');
                if (metaDescription) {
                    metaDescription.setAttribute('content', `Товары в категории ${category.name} - интернет-магазин Купи слона`);
                }
            }
        } catch (error) {
            console.error('Error loading category info:', error);
            // Fallback to URL parameter
            document.getElementById('categoryTitle').textContent = this.capitalizeFirst(this.categoryParams.categorySlug);
        }
    }

    async loadFilters(sectionId) {
        if (!sectionId) {
            console.log('No sectionId provided for filters');
            return;
        }

        try {
            console.log('🔍 Loading filters for sectionId:', sectionId);
            
            // Загружаем фильтры по sectionId
            const response = await this.apiRequest(`/filters/section/${sectionId}`);
            
            if (response.success && response.data.length > 0) {
                this.availableFilters = response.data;
                console.log(`✅ Found ${response.data.length} filters for section ${sectionId}`);
                console.log('🔍 Filter types:', response.data.map(f => ({ title: f.title, type: f.type })));
                this.renderFilters();
            } else {
                console.log(`No filters found for section ${sectionId}`);
                this.showNoFiltersMessage();
            }
        } catch (error) {
            console.error('Error loading filters:', error);
            this.showNoFiltersMessage();
        }
    }

    showNoFiltersMessage() {
        const dynamicFiltersContainer = document.getElementById('dynamicFiltersContainer');
        if (dynamicFiltersContainer) {
            dynamicFiltersContainer.innerHTML = `
                <div class="text-center text-muted">
                    <small><i class="fas fa-info-circle me-2"></i>Фильтры для данной категории не настроены</small>
                </div>
            `;
        }
    }

    renderFilters() {
        const dynamicFiltersContainer = document.getElementById('dynamicFiltersContainer');
        if (!dynamicFiltersContainer) return;

        // Создаем HTML для динамических фильтров
        let filtersHTML = '';
        
        this.availableFilters.forEach(filter => {
            filtersHTML += this.renderSingleFilter(filter);
        });

        // Добавляем тестовый аккордион фильтр для демонстрации
        if (this.availableFilters.length === 0) {
            console.log('🧪 Adding test accordion filter for demonstration');
            const testFilter = {
                _id: 'test_accordion_filter',
                title: 'Тестовый аккордион',
                type: 'checkbox',
                description: 'Это тестовый фильтр для демонстрации аккордионов',
                values: [
                    { _id: 'val1', title: 'Значение 1', productsCount: 5 },
                    { _id: 'val2', title: 'Значение 2', productsCount: 3 },
                    { _id: 'val3', title: 'Значение 3', productsCount: 7 },
                    { _id: 'val4', title: 'Значение 4', productsCount: 2 },
                    { _id: 'val5', title: 'Значение 5', productsCount: 4 }
                ]
            };
            filtersHTML += this.renderSingleFilter(testFilter);
        }

        // Вставляем динамические фильтры в контейнер
        dynamicFiltersContainer.innerHTML = filtersHTML;

        // Добавляем обработчики событий для новых фильтров
        this.attachFilterListeners();
        
        // Показываем кнопку сброса, если есть фильтры
        if (this.availableFilters.length > 0 || filtersHTML) {
            const resetButton = document.getElementById('resetFilters');
            if (resetButton) {
                resetButton.style.display = 'block';
            }
        }
    }

    renderSingleFilter(filter) {
        let filterHTML = '';

        console.log('🔍 Rendering filter:', filter.title, 'Type:', filter.type);

        switch (filter.type) {
            case 'checkbox':
                console.log('✅ Rendering checkbox filter (accordion)');
                filterHTML = this.renderCheckboxFilter(filter);
                break;
            case 'range':
                console.log('✅ Rendering range filter');
                filterHTML = this.renderRangeFilter(filter);
                break;
            case 'select':
                console.log('✅ Rendering select filter (legacy)');
                filterHTML = this.renderSelectFilter(filter);
                break;
            default:
                console.log('⚠️ Unknown filter type, using checkbox as default');
                filterHTML = this.renderCheckboxFilter(filter);
        }

        return filterHTML;
    }

    renderCheckboxFilter(filter) {
        const values = filter.values || [];
        const topValues = filter.topValues || [];
        const displayValues = topValues.length > 0 ? topValues : values.slice(0, 10);

        return `
            <div class="mb-4 dynamic-filter" data-filter-id="${filter._id}">
                <div class="accordion" id="accordion_${filter._id}">
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="heading_${filter._id}">
                            <button class="accordion-button collapsed" 
                                    type="button" 
                                    data-bs-toggle="collapse" 
                                    data-bs-target="#collapse_${filter._id}" 
                                    aria-expanded="false" 
                                    aria-controls="collapse_${filter._id}">
                                <i class="fas fa-chevron-down me-2"></i>
                                ${filter.title}
                                ${filter.description ? `<small class="text-muted ms-2">${filter.description}</small>` : ''}
                            </button>
                        </h2>
                        <div id="collapse_${filter._id}" 
                             class="accordion-collapse collapse" 
                             aria-labelledby="heading_${filter._id}" 
                             data-bs-parent="#accordion_${filter._id}">
                            <div class="accordion-body">
                                <div class="filter-values">
                                    ${displayValues.map(value => `
                                        <div class="form-check">
                                            <input class="form-check-input filter-checkbox" 
                                                   type="checkbox" 
                                                   id="filter_${filter._id}_${value._id}"
                                                   data-filter-id="${filter._id}"
                                                   data-value-id="${value._id}"
                                                   value="${value._id}">
                                            <label class="form-check-label" for="filter_${filter._id}_${value._id}">
                                                ${value.title}
                                                ${value.productsCount > 0 ? `<span class="text-muted">(${value.productsCount})</span>` : ''}
                                            </label>
                                        </div>
                                    `).join('')}
                                    ${values.length > displayValues.length ? `
                                        <button class="btn btn-link btn-sm p-0 show-more-values" 
                                                data-filter-id="${filter._id}">
                                            Показать еще (${values.length - displayValues.length})
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderRangeFilter(filter) {
        return `
            <div class="mb-4 dynamic-filter" data-filter-id="${filter._id}">
                <h6>${filter.title}</h6>
                ${filter.description ? `<small class="text-muted">${filter.description}</small>` : ''}
                <div class="row g-2">
                    <div class="col-6">
                        <input type="number" 
                               class="form-control form-control-sm filter-range-min" 
                               data-filter-id="${filter._id}"
                               placeholder="От" 
                               min="0">
                    </div>
                    <div class="col-6">
                        <input type="number" 
                               class="form-control form-control-sm filter-range-max" 
                               data-filter-id="${filter._id}"
                               placeholder="До" 
                               min="0">
                    </div>
                </div>
            </div>
        `;
    }

    renderSelectFilter(filter) {
        const values = filter.values || [];
        const topValues = filter.topValues || [];
        const displayValues = topValues.length > 0 ? topValues : values.slice(0, 10);

        return `
            <div class="mb-4 dynamic-filter" data-filter-id="${filter._id}">
                <div class="accordion" id="accordion_${filter._id}">
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="heading_${filter._id}">
                            <button class="accordion-button collapsed" 
                                    type="button" 
                                    data-bs-toggle="collapse" 
                                    data-bs-target="#collapse_${filter._id}" 
                                    aria-expanded="false" 
                                    aria-controls="collapse_${filter._id}">
                                <i class="fas fa-chevron-down me-2"></i>
                                ${filter.title}
                                ${filter.description ? `<small class="text-muted ms-2">${filter.description}</small>` : ''}
                            </button>
                        </h2>
                        <div id="collapse_${filter._id}" 
                             class="accordion-collapse collapse" 
                             aria-labelledby="heading_${filter._id}" 
                             data-bs-parent="#accordion_${filter._id}">
                            <div class="accordion-body">
                                <div class="filter-values">
                                    ${displayValues.map(value => `
                                        <div class="form-check">
                                            <input class="form-check-input filter-checkbox" 
                                                   type="checkbox" 
                                                   id="filter_${filter._id}_${value._id}"
                                                   data-filter-id="${filter._id}"
                                                   data-value-id="${value._id}"
                                                   value="${value._id}">
                                            <label class="form-check-label" for="filter_${filter._id}_${value._id}">
                                                ${value.title}
                                                ${value.productsCount > 0 ? `<span class="text-muted">(${value.productsCount})</span>` : ''}
                                            </label>
                                        </div>
                                    `).join('')}
                                    ${values.length > displayValues.length ? `
                                        <button class="btn btn-link btn-sm p-0 show-more-values" 
                                                data-filter-id="${filter._id}">
                                            Показать еще (${values.length - displayValues.length})
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachFilterListeners() {
        // Обработчики для чекбоксов (включая те, что в аккордионах)
        document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.handleFilterChange();
            });
        });

        // Обработчики для диапазонов
        document.querySelectorAll('.filter-range-min, .filter-range-max').forEach(input => {
            input.addEventListener('change', () => {
                this.handleFilterChange();
            });
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleFilterChange();
            });
        });

        // Удаляем обработчики для селектов, так как их больше нет
        // document.querySelectorAll('.filter-select').forEach(select => {
        //     select.addEventListener('change', () => {
        //         this.handleFilterChange();
        //     });
        // });

        // Обработчики для кнопок "Показать еще"
        document.querySelectorAll('.show-more-values').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.showMoreFilterValues(button.dataset.filterId);
            });
        });

        // Добавляем обработчики для аккордионов
        document.querySelectorAll('.accordion-button').forEach(button => {
            button.addEventListener('click', () => {
                // Добавляем анимацию иконки
                const icon = button.querySelector('i');
                if (icon) {
                    if (button.classList.contains('collapsed')) {
                        icon.className = 'fas fa-chevron-up me-2';
                    } else {
                        icon.className = 'fas fa-chevron-down me-2';
                    }
                }
            });
        });
    }

    handleFilterChange() {
        // Собираем все активные фильтры
        const dynamicFilters = {};

        // Чекбоксы (включая те, что теперь в аккордионах)
        document.querySelectorAll('.filter-checkbox:checked').forEach(checkbox => {
            const filterId = checkbox.dataset.filterId;
            const valueId = checkbox.dataset.valueId;
            
            if (!dynamicFilters[filterId]) {
                dynamicFilters[filterId] = [];
            }
            dynamicFilters[filterId].push(valueId);
        });

        // Диапазоны
        document.querySelectorAll('.dynamic-filter').forEach(filterEl => {
            const filterId = filterEl.dataset.filterId;
            const minInput = filterEl.querySelector('.filter-range-min');
            const maxInput = filterEl.querySelector('.filter-range-max');
            
            if (minInput && maxInput) {
                const minValue = minInput.value;
                const maxValue = maxInput.value;
                
                if (minValue || maxValue) {
                    dynamicFilters[filterId] = {
                        min: minValue || null,
                        max: maxValue || null
                    };
                }
            }
        });

        // Удаляем обработку селектов, так как теперь все фильтры используют чекбоксы
        // Селекты больше не используются

        // Обновляем текущие фильтры (оставляем базовые фильтры как есть)
        this.currentFilters = {
            ...this.getBasicFilters(),
            ...dynamicFilters
        };

        this.currentPage = 1;
        this.loadProducts();
    }

    getBasicFilters() {
        const basicFilters = {};
        
        const minPriceInput = document.getElementById('minPrice');
        const maxPriceInput = document.getElementById('maxPrice');
        const promoFilterInput = document.getElementById('promoFilter');
        
        const minPrice = minPriceInput ? minPriceInput.value : '';
        const maxPrice = maxPriceInput ? maxPriceInput.value : '';
        const isPromo = promoFilterInput ? promoFilterInput.checked : false;

        if (minPrice) basicFilters.minPrice = minPrice;
        if (maxPrice) basicFilters.maxPrice = maxPrice;
        if (isPromo) basicFilters.isPromo = 'true';

        return basicFilters;
    }

    showMoreFilterValues(filterId) {
        const filter = this.availableFilters.find(f => f._id === filterId);
        if (!filter) return;

        const filterElement = document.querySelector(`[data-filter-id="${filterId}"]`);
        const valuesContainer = filterElement.querySelector('.filter-values');
        const showMoreBtn = filterElement.querySelector('.show-more-values');

        // Показываем все значения
        const allValues = filter.values || [];
        const currentlyShown = filterElement.querySelectorAll('.form-check').length;

        const additionalValues = allValues.slice(currentlyShown);
        additionalValues.forEach(value => {
            const checkboxHTML = `
                <div class="form-check">
                    <input class="form-check-input filter-checkbox" 
                           type="checkbox" 
                           id="filter_${filter._id}_${value._id}"
                           data-filter-id="${filter._id}"
                           data-value-id="${value._id}"
                           value="${value._id}">
                    <label class="form-check-label" for="filter_${filter._id}_${value._id}">
                        ${value.title}
                        ${value.productsCount > 0 ? `<span class="text-muted">(${value.productsCount})</span>` : ''}
                    </label>
                </div>
            `;
            showMoreBtn.insertAdjacentHTML('beforebegin', checkboxHTML);
        });

        // Удаляем кнопку "Показать еще"
        showMoreBtn.remove();

        // Добавляем обработчики для новых чекбоксов
        this.attachFilterListeners();
    }

    resetAllFilters() {
        // Сбрасываем базовые фильтры
        const minPriceInput = document.getElementById('minPrice');
        const maxPriceInput = document.getElementById('maxPrice');
        const promoFilterInput = document.getElementById('promoFilter');
        const sortSelect = document.getElementById('sortSelect');

        if (minPriceInput) minPriceInput.value = '';
        if (maxPriceInput) maxPriceInput.value = '';
        if (promoFilterInput) promoFilterInput.checked = false;
        if (sortSelect) sortSelect.value = 'createdAt:desc';

        // Сбрасываем динамические фильтры (включая те, что в аккордионах)
        document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });

        document.querySelectorAll('.filter-range-min, .filter-range-max').forEach(input => {
            input.value = '';
        });

        // Удаляем сброс селектов, так как их больше нет
        // document.querySelectorAll('.filter-select').forEach(select => {
        //     select.selectedIndex = 0;
        // });

        // Обновляем состояние
        this.currentFilters = {};
        this.currentSort = 'createdAt:desc';
        this.currentPage = 1;
        
        // Перезагружаем товары
        this.loadProducts();
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
                
                // Загружаем фильтры по sectionId первого товара (только если фильтры еще не загружены)
                if (response.data.length > 0 && this.availableFilters.length === 0) {
                    const firstProduct = response.data[0];
                    const sectionId = firstProduct.section?.id || firstProduct.section?._id;
                    
                    if (sectionId) {
                        console.log('🔍 Loading filters based on first product section:', sectionId);
                        console.log('🔍 First product section structure:', firstProduct.section);
                        this.loadFilters(sectionId);
                    } else {
                        console.log('❌ No section ID found in first product:', firstProduct.section);
                    }
                }
            } else {
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showEmptyState();
        }
    }

    applyFilters() {
        // Используем тот же метод, что и для динамических фильтров
        this.handleFilterChange();
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
        const loadingSpinner = document.getElementById('loadingSpinner');
        const productsGrid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');
        const pagination = document.getElementById('pagination');
        
        if (loadingSpinner) loadingSpinner.style.display = 'block';
        if (productsGrid) productsGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        if (pagination) pagination.style.display = 'none';
    }

    showEmptyState() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        const productsGrid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');
        const pagination = document.getElementById('pagination');
        
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (productsGrid) productsGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        if (pagination) pagination.style.display = 'none';
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
                            <a href="/product/${product._id}" class="text-decoration-none text-dark">
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
                            <a href="/product/${product._id}" class="text-decoration-none text-dark">
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
        const favorites = JSON.parse(localStorage.getItem('kupislona_favorites') || '[]');
        const index = favorites.indexOf(productId);
        
        if (index > -1) {
            favorites.splice(index, 1);
            this.showAlert('Товар удален из избранного', 'info');
        } else {
            favorites.push(productId);
            this.showAlert('Товар добавлен в избранное', 'success');
        }
        
        localStorage.setItem('kupislona_favorites', JSON.stringify(favorites));
        
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
        const favorites = JSON.parse(localStorage.getItem('kupislona_favorites') || '[]');
        
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