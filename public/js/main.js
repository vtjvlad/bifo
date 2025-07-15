// Основной скрипт для главной страницы
class MainPage {
  constructor() {
    this.categoriesLoaded = false;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadInitialData();
  }

  setupEventListeners() {
    // Обработчик поиска
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSearch();
      });
    }

    // Дебаунс для поиска при вводе
    if (searchInput) {
      const debouncedSearch = Utils.debounce(() => {
        this.handleSearchSuggestions();
      }, 300);
      
      searchInput.addEventListener('input', debouncedSearch);
    }

    // Обработчик кнопки категорий
    const categoriesBtn = document.getElementById('categoriesBtn');
    const categoriesDropdown = document.getElementById('categoriesDropdown');
    
    if (categoriesBtn && categoriesDropdown) {
      categoriesBtn.addEventListener('click', () => {
        this.toggleCategoriesDropdown();
      });

      // Закрытие dropdown при клике вне его
      document.addEventListener('click', (e) => {
        if (!categoriesBtn.contains(e.target) && !categoriesDropdown.contains(e.target)) {
          categoriesDropdown.classList.remove('active');
        }
      });
    }

    // Обработчики навигационных ссылок
    const navLinks = document.querySelectorAll('[data-section]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        window.location.href = `/catalog?section=${encodeURIComponent(section)}`;
      });
    });

    // Обработчики кнопок избранного и сравнения
    const compareBtn = document.getElementById('compareBtn');
    const favoritesBtn = document.getElementById('favoritesBtn');

    if (compareBtn) {
      compareBtn.addEventListener('click', () => {
        this.showCompareModal();
      });
    }

    if (favoritesBtn) {
      favoritesBtn.addEventListener('click', () => {
        this.showFavoritesModal();
      });
    }
  }

  async loadInitialData() {
    try {
      // Загружаем данные параллельно
      const [categoriesResult, statsResult] = await Promise.allSettled([
        this.loadCategories(),
        this.loadStats()
      ]);

      if (categoriesResult.status === 'fulfilled') {
        await this.loadPopularCategories();
      }

      if (statsResult.status === 'fulfilled') {
        this.loadFeaturedProducts();
        this.loadPopularBrands();
      }

      // Инициализируем слайдер
      this.initHeroSlider();

    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      Utils.showNotification('Ошибка загрузки данных', 'error');
    }
  }

  async loadCategories() {
    try {
      const categories = await api.getCategories();
      this.renderCategoriesDropdown(categories);
      this.categoriesLoaded = true;
      return categories;
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
      const categoriesGrid = document.getElementById('categoriesGrid');
      if (categoriesGrid) {
        categoriesGrid.innerHTML = '<div class="loading">Ошибка загрузки категорий</div>';
      }
      throw error;
    }
  }

  async loadStats() {
    try {
      // Загружаем статистику параллельно
      const [productsResponse, vendorsResponse] = await Promise.all([
        api.getProducts({ limit: 1 }),
        api.getVendors()
      ]);

      const totalProducts = productsResponse.pagination?.totalItems || 0;
      const totalVendors = vendorsResponse.length || 0;
      const totalCategories = this.categoriesLoaded ? 
        Object.values(await api.getCategories()).flat().length : 0;

      this.animateStats({
        products: totalProducts,
        categories: totalCategories,
        vendors: totalVendors
      });

      return { totalProducts, totalVendors, totalCategories };
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      throw error;
    }
  }

  async loadPopularCategories() {
    try {
      const popularCategoriesContainer = document.getElementById('popularCategories');
      if (!popularCategoriesContainer) return;

      // Показываем популярные категории (первые 8)
      const categories = await api.getCategories();
      const allCategories = Object.values(categories).flat();
      const popularCategories = allCategories.slice(0, 8);

      const html = popularCategories.map(category => 
        Components.createCategoryCard(category)
      ).join('');

      popularCategoriesContainer.innerHTML = html;
    } catch (error) {
      console.error('Ошибка загрузки популярных категорий:', error);
    }
  }

  async loadFeaturedProducts() {
    try {
      const featuredContainer = document.getElementById('featuredProducts');
      if (!featuredContainer) return;

      // Показываем скелетоны
      featuredContainer.innerHTML = Array(8).fill(0)
        .map(() => Components.createProductSkeleton()).join('');

      // Загружаем рекомендуемые товары
      const response = await api.getProducts({ 
        limit: 8, 
        sort: 'popular' 
      });

      const html = response.products.map(product => 
        Components.createProductCard(product)
      ).join('');

      featuredContainer.innerHTML = html;
    } catch (error) {
      console.error('Ошибка загрузки рекомендуемых товаров:', error);
      const featuredContainer = document.getElementById('featuredProducts');
      if (featuredContainer) {
        featuredContainer.innerHTML = '<div class="loading">Ошибка загрузки товаров</div>';
      }
    }
  }

  renderCategoriesDropdown(categories) {
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (!categoriesGrid) return;

    const html = Object.entries(categories)
      .map(([groupName, categoryList]) => 
        Components.createCategoryGroup(groupName, categoryList)
      )
      .join('');

    categoriesGrid.innerHTML = html;
  }

  toggleCategoriesDropdown() {
    const dropdown = document.getElementById('categoriesDropdown');
    if (dropdown) {
      dropdown.classList.toggle('active');
    }
  }

  handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput?.value?.trim();
    
    if (query) {
      window.location.href = `/catalog?search=${encodeURIComponent(query)}`;
    }
  }

  handleSearchSuggestions() {
    // Можно добавить подсказки поиска в будущем
    const searchInput = document.getElementById('searchInput');
    const query = searchInput?.value?.trim();
    
    if (query && query.length >= 3) {
      // Здесь можно реализовать поиск подсказок
      console.log('Поиск подсказок для:', query);
    }
  }

  animateStats(stats) {
    const counters = {
      productsCount: stats.products,
      categoriesCount: stats.categories,
      vendorsCount: stats.vendors
    };

    Object.entries(counters).forEach(([id, target]) => {
      const element = document.getElementById(id);
      if (element && target > 0) {
        Utils.animateCounter(element, target, 2000);
      }
    });
  }

  showCompareModal() {
    const compare = Utils.loadFromStorage('compare', []);
    if (compare.length === 0) {
      Utils.showNotification('Список сравнения пуст', 'info');
      return;
    }

    // Переход на страницу сравнения
    window.location.href = '/compare';
  }

  showFavoritesModal() {
    const favorites = Utils.loadFromStorage('favorites', []);
    if (favorites.length === 0) {
      Utils.showNotification('Список избранного пуст', 'info');
      return;
    }

    // Переход на страницу избранного
    window.location.href = '/favorites';
  }

  async loadPopularBrands() {
    try {
      const brandsContainer = document.getElementById('popularBrands');
      if (!brandsContainer) return;

      // Загружаем производителей
      const vendors = await api.getVendors();
      const popularBrands = vendors.slice(0, 8); // Показываем первые 8

      const html = popularBrands.map(brand => 
        Components.createBrandCard(brand)
      ).join('');

      brandsContainer.innerHTML = html;
    } catch (error) {
      console.error('Ошибка загрузки популярных брендов:', error);
    }
  }

  initHeroSlider() {
    const slider = document.getElementById('heroSlider');
    const slides = slider?.querySelectorAll('.hero-slide');
    const dots = document.getElementById('sliderDots');
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');

    if (!slider || !slides || slides.length <= 1) return;

    let currentSlide = 0;
    const totalSlides = slides.length;

    // Создаем точки
    if (dots) {
      dots.innerHTML = Array(totalSlides).fill(0)
        .map((_, i) => `<div class="slider-dot ${i === 0 ? 'active' : ''}" data-slide="${i}"></div>`)
        .join('');
    }

    const showSlide = (index) => {
      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
      });

      // Обновляем точки
      const dotElements = dots?.querySelectorAll('.slider-dot');
      dotElements?.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });
    };

    const nextSlide = () => {
      currentSlide = (currentSlide + 1) % totalSlides;
      showSlide(currentSlide);
    };

    const prevSlide = () => {
      currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
      showSlide(currentSlide);
    };

    // Обработчики событий
    nextBtn?.addEventListener('click', nextSlide);
    prevBtn?.addEventListener('click', prevSlide);

    // Клик по точкам
    dots?.addEventListener('click', (e) => {
      if (e.target.classList.contains('slider-dot')) {
        currentSlide = parseInt(e.target.dataset.slide);
        showSlide(currentSlide);
      }
    });

    // Автоматическое переключение
    setInterval(nextSlide, 5000);
  }
}

// Инициализация главной страницы
document.addEventListener('DOMContentLoaded', () => {
  new MainPage();
});

// Глобальные функции для совместимости
window.MainPage = MainPage; 