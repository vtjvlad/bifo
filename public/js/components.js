/**
 * Component Loader Module
 * Загружает HTML компоненты и вставляет их в DOM
 */
class ComponentLoader {
    constructor() {
        this.components = new Map();
        this.loadedComponents = new Set();
    }

    /**
     * Загружает компонент из файла
     * @param {string} componentName - имя компонента
     * @param {string} selector - селектор для вставки компонента
     * @returns {Promise<string>} HTML содержимое компонента
     */
    async loadComponent(componentName, selector) {
        try {
            // Проверяем, не загружен ли уже компонент
            if (this.components.has(componentName)) {
                return this.insertComponent(componentName, selector);
            }

            // Загружаем компонент с сервера
            const response = await fetch(`/components/${componentName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${componentName}`);
            }

            const html = await response.text();
            this.components.set(componentName, html);

            return this.insertComponent(componentName, selector);
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
            return null;
        }
    }

    /**
     * Вставляет компонент в DOM
     * @param {string} componentName - имя компонента
     * @param {string} selector - селектор для вставки
     * @returns {string} HTML содержимое компонента
     */
    insertComponent(componentName, selector) {
        const html = this.components.get(componentName);
        if (!html) {
            console.error(`Component ${componentName} not found`);
            return null;
        }

        const element = document.querySelector(selector);
        if (element) {
            element.innerHTML = html;
            this.loadedComponents.add(componentName);
            
            // Вызываем событие после загрузки компонента
            this.triggerComponentLoaded(componentName, element);
            
            return html;
        } else {
            console.error(`Element with selector "${selector}" not found`);
            return null;
        }
    }

    /**
     * Загружает все компоненты на странице
     */
    async loadAllComponents() {
        const componentElements = document.querySelectorAll('[data-component]');
        
        for (const element of componentElements) {
            const componentName = element.getAttribute('data-component');
            const selector = `[data-component="${componentName}"]`;
            
            await this.loadComponent(componentName, selector);
        }
    }

    /**
     * Вызывает событие после загрузки компонента
     * @param {string} componentName - имя компонента
     * @param {Element} element - элемент компонента
     */
    triggerComponentLoaded(componentName, element) {
        const event = new CustomEvent('componentLoaded', {
            detail: {
                componentName,
                element
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Получает HTML компонента без вставки в DOM
     * @param {string} componentName - имя компонента
     * @returns {Promise<string>} HTML содержимое компонента
     */
    async getComponentHTML(componentName) {
        if (this.components.has(componentName)) {
            return this.components.get(componentName);
        }

        try {
            const response = await fetch(`/components/${componentName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${componentName}`);
            }

            const html = await response.text();
            this.components.set(componentName, html);
            return html;
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
            return null;
        }
    }

    /**
     * Проверяет, загружен ли компонент
     * @param {string} componentName - имя компонента
     * @returns {boolean}
     */
    isComponentLoaded(componentName) {
        return this.loadedComponents.has(componentName);
    }

    /**
     * Очищает кэш компонентов
     */
    clearCache() {
        this.components.clear();
        this.loadedComponents.clear();
    }
}

// Создаем глобальный экземпляр загрузчика компонентов
window.componentLoader = new ComponentLoader();

// Автоматическая загрузка компонентов при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    window.componentLoader.loadAllComponents();
}); 