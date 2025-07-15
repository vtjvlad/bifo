// Утилиты
class Utils {
  // Форматирование цены
  static formatPrice(price) {
    if (typeof price !== 'number' || isNaN(price)) {
      return '0 ₴';
    }
    
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  // Форматирование больших чисел
  static formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) {
      return '0';
    }

    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    
    return num.toString();
  }

  // Создание slug из строки
  static createSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Дебаунс функции
  static debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }

  // Throttle функции
  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Экранирование HTML
  static escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  // Получение значения из URL параметров
  static getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  // Установка URL параметра
  static setUrlParam(param, value) {
    const url = new URL(window.location);
    if (value) {
      url.searchParams.set(param, value);
    } else {
      url.searchParams.delete(param);
    }
    window.history.replaceState({}, '', url);
  }

  // Получение всех URL параметров
  static getUrlParams() {
    const params = {};
    const urlParams = new URLSearchParams(window.location.search);
    for (const [key, value] of urlParams) {
      params[key] = value;
    }
    return params;
  }

  // Сохранение в localStorage
  static saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  // Загрузка из localStorage
  static loadFromStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return defaultValue;
    }
  }

  // Удаление из localStorage
  static removeFromStorage(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  // Анимация счетчика
  static animateCounter(element, target, duration = 2000) {
    const start = parseInt(element.textContent) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = Utils.formatNumber(target);
        clearInterval(timer);
      } else {
        element.textContent = Utils.formatNumber(Math.floor(current));
      }
    }, 16);
  }

  // Проверка видимости элемента
  static isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // Плавный скролл к элементу
  static scrollToElement(element, offset = 0) {
    const elementPosition = element.offsetTop - offset;
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    });
  }

  // Показ уведомления
  static showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Показываем уведомление
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    // Скрываем уведомление
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, duration);
  }

  // Копирование в буфер обмена
  static async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      Utils.showNotification('Скопировано в буфер обмена', 'success');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Utils.showNotification('Ошибка копирования', 'error');
    }
  }

  // Получение иконки для категории
  static getCategoryIcon(groupName) {
    const icons = {
      'Товары для взрослых': 'fas fa-user-secret',
      'Автотовары': 'fas fa-car',
      'Аудио и видео': 'fas fa-volume-up',
      'Бытовая техника': 'fas fa-blender',
      'Компьютеры и ноутбуки': 'fas fa-laptop',
      'Дача и сад': 'fas fa-seedling',
      'Детские товары': 'fas fa-baby',
      'Дом и быт': 'fas fa-home',
      'Мода и стиль': 'fas fa-tshirt',
      'Красота и здоровье': 'fas fa-heart',
      'Военные товары': 'fas fa-shield-alt',
      'Мобильные телефоны': 'fas fa-mobile-alt',
      'Музыкальные инструменты': 'fas fa-music',
      'Бытовая химия': 'fas fa-spray-can',
      'Ремонт и строительство': 'fas fa-hammer',
      'Спорт и отдых': 'fas fa-futbol',
      'Инструменты': 'fas fa-wrench',
      'Зоотовары': 'fas fa-paw'
    };

    return icons[groupName] || 'fas fa-folder';
  }

  // Валидация email
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Валидация телефона
  static isValidPhone(phone) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  // Обрезка текста
  static truncateText(text, maxLength, suffix = '...') {
    if (text.length <= maxLength) {
      return text;
    }
    
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  // Генерация случайного ID
  static generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  // Проверка поддержки WebP
  static supportsWebP() {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }
}

// Экспортируем Utils глобально
window.Utils = Utils; 