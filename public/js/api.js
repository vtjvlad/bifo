// API модуль для работы с сервером
class API {
  constructor() {
    this.baseURL = '';
  }

  // Базовый метод для выполнения запросов
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, mergedOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Получение товаров
  async getProducts(params = {}) {
    const searchParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/api/products${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  // Получение конкретного товара
  async getProduct(id) {
    return this.request(`/api/products/${id}`);
  }

  // Получение категорий
  async getCategories() {
    return this.request('/api/categories');
  }

  // Получение категорий группы
  async getCategoriesByGroup(group) {
    return this.request(`/api/categories/${encodeURIComponent(group)}`);
  }

  // Поиск категорий
  async searchCategories(query) {
    return this.request(`/api/categories/search/${encodeURIComponent(query)}`);
  }

  // Получение производителей
  async getVendors() {
    return this.request('/api/vendors');
  }

  // Получение ценового диапазона
  async getPriceRange() {
    return this.request('/api/price-range');
  }

  // Проверка здоровья API
  async checkHealth() {
    return this.request('/api/health');
  }
}

// Создаем глобальный экземпляр API
window.api = new API(); 