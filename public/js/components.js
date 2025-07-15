// Компоненты для отображения данных
class Components {
  // Создание карточки товара
  static createProductCard(product) {
    const hasOldPrice = product.initPrice && product.initPrice > product.currentPrice;
    const discount = hasOldPrice ? Math.round(((product.initPrice - product.currentPrice) / product.initPrice) * 100) : 0;
    
    const imageUrl = product.imageLinks && product.imageLinks.length > 0 
      ? product.imageLinks[0].original || product.imageLinks[0].thumbnail || '/images/no-image.svg'
      : '/images/no-image.svg';

    const specs = product.techShortSpecifications 
      ? product.techShortSpecifications.slice(0, 3).join(', ')
      : '';

    return `
      <div class="product-card" data-product-id="${product.id}">
        <div class="product-image">
          <img src="${imageUrl}" alt="${Utils.escapeHtml(product.title)}" 
               onerror="this.src='/images/no-image.svg'">
          
          ${product.isNew ? '<div class="product-badge new">Новинка</div>' : ''}
          ${product.isPromo ? '<div class="product-badge promo">Акция</div>' : ''}
          
          <div class="product-actions">
            <button class="product-action-btn" title="В избранное" onclick="Components.toggleFavorite(${product.id})">
              <i class="fas fa-heart"></i>
            </button>
            <button class="product-action-btn" title="Сравнить" onclick="Components.toggleCompare(${product.id})">
              <i class="fas fa-balance-scale"></i>
            </button>
          </div>
        </div>
        
        <div class="product-content">
          ${product.vendor ? `<div class="product-vendor">${Utils.escapeHtml(product.vendor.title)}</div>` : ''}
          
          <h3 class="product-title">
            <a href="/product/${product.id}">${Utils.escapeHtml(product.title)}</a>
          </h3>
          
          ${specs ? `
            <div class="product-specs">
              <div class="product-specs-list">${Utils.escapeHtml(Utils.truncateText(specs, 100))}</div>
            </div>
          ` : ''}
          
          <div class="product-pricing">
            <div class="product-price">
              <span class="product-price-current">${Utils.formatPrice(product.currentPrice)}</span>
              ${hasOldPrice ? `
                <span class="product-price-old">${Utils.formatPrice(product.initPrice)}</span>
                <span class="product-price-discount">-${discount}%</span>
              ` : ''}
            </div>
            
            <div class="product-offers">
              <span class="product-offers-count">
                <strong>${product.offerCount || 1}</strong> ${Components.pluralize(product.offerCount || 1, 'предложение', 'предложения', 'предложений')}
              </span>
              
              ${product.reviewsCount > 0 ? `
                <div class="product-rating">
                  <span class="product-stars">★★★★☆</span>
                  <span class="product-reviews-count">(${product.reviewsCount})</span>
                </div>
              ` : ''}
            </div>
          </div>
          
          <div class="product-footer">
            <button class="product-btn product-btn-primary" onclick="window.location.href='/product/${product.id}'">
              Подробнее
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Создание карточки категории
  static createCategoryCard(category, count = null) {
    const icon = Utils.getCategoryIcon(category.group);
    
    return `
      <a href="/catalog?category=${encodeURIComponent(category.slug)}" class="category-card">
        <div class="category-card-icon">
          <i class="${icon}"></i>
        </div>
        <h3 class="category-card-title">${Utils.escapeHtml(category.name)}</h3>
        ${count ? `<div class="category-card-count">${count} товаров</div>` : ''}
      </a>
    `;
  }

  // Создание группы категорий для dropdown
  static createCategoryGroup(groupName, categories) {
    const icon = Utils.getCategoryIcon(groupName);
    
    return `
      <div class="category-group">
        <h3 class="category-group-title">
          <i class="${icon}"></i>
          ${Utils.escapeHtml(groupName)}
        </h3>
        <ul class="category-list">
          ${categories.map(category => `
            <li>
              <a href="/catalog?category=${encodeURIComponent(category.slug)}">
                ${Utils.escapeHtml(category.name)}
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  // Создание пагинации
  static createPagination(currentPage, totalPages, baseUrl = '') {
    if (totalPages <= 1) return '';

    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    let html = '<div class="pagination">';

    // Предыдущая страница
    if (currentPage > 1) {
      html += `<a href="${baseUrl}?page=${currentPage - 1}" class="pagination-btn">
        <i class="fas fa-chevron-left"></i>
      </a>`;
    }

    // Первая страница
    if (startPage > 1) {
      html += `<a href="${baseUrl}?page=1" class="pagination-btn">1</a>`;
      if (startPage > 2) {
        html += '<span class="pagination-btn">...</span>';
      }
    }

    // Страницы
    for (let i = startPage; i <= endPage; i++) {
      html += `<a href="${baseUrl}?page=${i}" class="pagination-btn ${i === currentPage ? 'active' : ''}">${i}</a>`;
    }

    // Последняя страница
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        html += '<span class="pagination-btn">...</span>';
      }
      html += `<a href="${baseUrl}?page=${totalPages}" class="pagination-btn">${totalPages}</a>`;
    }

    // Следующая страница
    if (currentPage < totalPages) {
      html += `<a href="${baseUrl}?page=${currentPage + 1}" class="pagination-btn">
        <i class="fas fa-chevron-right"></i>
      </a>`;
    }

    html += '</div>';
    return html;
  }

  // Создание скелетона товара
  static createProductSkeleton() {
    return `
      <div class="product-card">
        <div class="product-image skeleton"></div>
        <div class="product-content">
          <div class="skeleton-text small"></div>
          <div class="skeleton-text large"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text small"></div>
        </div>
      </div>
    `;
  }

  // Создание фильтров
  static createFilters(vendors = [], priceRange = { min: 0, max: 100000 }) {
    return `
      <div class="filters">
        <h3 class="filters-title">Фильтры</h3>
        <div class="filters-grid">
          <div class="filter-group">
            <label class="filter-label">Поиск</label>
            <input type="text" class="filter-input" id="searchFilter" placeholder="Поиск товаров...">
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Цена от</label>
            <input type="number" class="filter-input" id="minPriceFilter" placeholder="от" min="${priceRange.min}" max="${priceRange.max}">
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Цена до</label>
            <input type="number" class="filter-input" id="maxPriceFilter" placeholder="до" min="${priceRange.min}" max="${priceRange.max}">
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Производитель</label>
            <select class="filter-select" id="vendorFilter">
              <option value="">Все производители</option>
              ${vendors.map(vendor => `<option value="${Utils.escapeHtml(vendor)}">${Utils.escapeHtml(vendor)}</option>`).join('')}
            </select>
          </div>
        </div>
        
        <div class="filter-actions">
          <button class="filter-btn filter-btn-apply" onclick="Components.applyFilters()">Применить</button>
          <button class="filter-btn filter-btn-reset" onclick="Components.resetFilters()">Сбросить</button>
        </div>
      </div>
    `;
  }

  // Создание сортировки
  static createSorting() {
    return `
      <div class="sorting">
        <label class="sorting-label">Сортировать по:</label>
        <select class="sorting-select" id="sortSelect" onchange="Components.applySorting()">
          <option value="newest">Новинки</option>
          <option value="price_asc">Цена по возрастанию</option>
          <option value="price_desc">Цена по убыванию</option>
          <option value="popular">Популярности</option>
        </select>
      </div>
    `;
  }

  // Применение фильтров
  static applyFilters() {
    const search = document.getElementById('searchFilter')?.value || '';
    const minPrice = document.getElementById('minPriceFilter')?.value || '';
    const maxPrice = document.getElementById('maxPriceFilter')?.value || '';
    const vendor = document.getElementById('vendorFilter')?.value || '';
    
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (vendor) params.set('vendor', vendor);
    
    const url = new URL(window.location);
    url.search = params.toString();
    window.location.href = url.toString();
  }

  // Сброс фильтров
  static resetFilters() {
    const url = new URL(window.location);
    url.search = '';
    window.location.href = url.toString();
  }

  // Применение сортировки
  static applySorting() {
    const sort = document.getElementById('sortSelect')?.value || 'newest';
    Utils.setUrlParam('sort', sort);
    window.location.reload();
  }

  // Переключение избранного
  static toggleFavorite(productId) {
    const favorites = Utils.loadFromStorage('favorites', []);
    const index = favorites.indexOf(productId);
    
    if (index > -1) {
      favorites.splice(index, 1);
      Utils.showNotification('Товар удален из избранного', 'info');
    } else {
      favorites.push(productId);
      Utils.showNotification('Товар добавлен в избранное', 'success');
    }
    
    Utils.saveToStorage('favorites', favorites);
    Components.updateFavoritesBadge();
  }

  // Переключение сравнения
  static toggleCompare(productId) {
    const compare = Utils.loadFromStorage('compare', []);
    const index = compare.indexOf(productId);
    
    if (index > -1) {
      compare.splice(index, 1);
      Utils.showNotification('Товар удален из сравнения', 'info');
    } else {
      if (compare.length >= 4) {
        Utils.showNotification('Можно сравнивать не более 4 товаров', 'warning');
        return;
      }
      compare.push(productId);
      Utils.showNotification('Товар добавлен к сравнению', 'success');
    }
    
    Utils.saveToStorage('compare', compare);
    Components.updateCompareBadge();
  }

  // Обновление счетчика избранного
  static updateFavoritesBadge() {
    const favorites = Utils.loadFromStorage('favorites', []);
    const badge = document.getElementById('favoritesBadge');
    if (badge) {
      badge.textContent = favorites.length;
      badge.style.display = favorites.length > 0 ? 'block' : 'none';
    }
  }

  // Обновление счетчика сравнения
  static updateCompareBadge() {
    const compare = Utils.loadFromStorage('compare', []);
    const badge = document.getElementById('compareBadge');
    if (badge) {
      badge.textContent = compare.length;
      badge.style.display = compare.length > 0 ? 'block' : 'none';
    }
  }

  // Функция склонения
  static pluralize(count, one, two, five) {
    const cases = [2, 0, 1, 1, 1, 2];
    return [one, two, five][(count % 100 > 4 && count % 100 < 20) ? 2 : cases[Math.min(count % 10, 5)]];
  }

  // Инициализация компонентов
  static init() {
    Components.updateFavoritesBadge();
    Components.updateCompareBadge();
  }

  // Создание карточки бренда
  static createBrandCard(brand) {
    return `
      <div class="brand-card" onclick="window.location.href='/catalog?vendor=${encodeURIComponent(brand)}'">
        <div class="brand-logo">
          ${brand.charAt(0).toUpperCase()}
        </div>
        <div class="brand-name">${Utils.escapeHtml(brand)}</div>
        <div class="brand-count">Товары бренда</div>
      </div>
    `;
  }
}

// Инициализируем компоненты при загрузке
document.addEventListener('DOMContentLoaded', () => {
  Components.init();
});

// Экспортируем Components глобально
window.Components = Components; 