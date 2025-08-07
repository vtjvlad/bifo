// Кастомная JavaScript система для замены Bootstrap

class CustomFramework {
    constructor() {
        this.init();
    }

    init() {
        this.initModals();
        this.initDropdowns();
        this.initTooltips();
        this.initCollapse();
    }

    // Модальные окна
    initModals() {
        // Открытие модальных окон
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-bs-toggle="modal"]')) {
                const target = e.target.getAttribute('data-bs-target');
                const modal = document.querySelector(target);
                if (modal) {
                    this.showModal(modal);
                }
            }
        });

        // Закрытие модальных окон
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-bs-dismiss="modal"]') || 
                e.target.matches('.btn-close')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.hideModal(modal);
                }
            }
        });

        // Закрытие по клику вне модального окна
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal(e.target);
            }
        });

        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    this.hideModal(openModal);
                }
            }
        });
    }

    showModal(modal) {
        modal.classList.add('show');
        modal.style.display = 'block';
        document.body.classList.add('modal-open');
        
        // Добавляем backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1050;
        `;
        document.body.appendChild(backdrop);
        
        // Фокус на модальное окно
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }

    hideModal(modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        
        // Удаляем backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
    }

    // Dropdown меню
    initDropdowns() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-bs-toggle="dropdown"]')) {
                e.preventDefault();
                const dropdown = e.target.nextElementSibling;
                if (dropdown && dropdown.classList.contains('dropdown-menu')) {
                    this.toggleDropdown(dropdown);
                }
            }
        });

        // Закрытие dropdown при клике вне
        document.addEventListener('click', (e) => {
            if (!e.target.matches('[data-bs-toggle="dropdown"]') && 
                !e.target.closest('.dropdown-menu')) {
                const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
                openDropdowns.forEach(dropdown => {
                    dropdown.classList.remove('show');
                });
            }
        });
    }

    toggleDropdown(dropdown) {
        const isOpen = dropdown.classList.contains('show');
        
        // Закрываем все другие dropdown
        document.querySelectorAll('.dropdown-menu.show').forEach(d => {
            if (d !== dropdown) {
                d.classList.remove('show');
            }
        });

        if (isOpen) {
            dropdown.classList.remove('show');
        } else {
            dropdown.classList.add('show');
        }
    }

    // Tooltips
    initTooltips() {
        document.addEventListener('mouseenter', (e) => {
            if (e.target.matches('[data-bs-toggle="tooltip"]')) {
                this.showTooltip(e.target);
            }
        });

        document.addEventListener('mouseleave', (e) => {
            if (e.target.matches('[data-bs-toggle="tooltip"]')) {
                this.hideTooltip(e.target);
            }
        });
    }

    showTooltip(element) {
        const text = element.getAttribute('title') || element.getAttribute('data-bs-title');
        if (!text) return;

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip show';
        tooltip.style.cssText = `
            position: absolute;
            z-index: 1070;
            background-color: #000;
            color: #fff;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.875rem;
            max-width: 200px;
            word-wrap: break-word;
        `;
        tooltip.textContent = text;

        document.body.appendChild(tooltip);

        // Позиционирование
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';

        element._tooltip = tooltip;
    }

    hideTooltip(element) {
        if (element._tooltip) {
            element._tooltip.remove();
            delete element._tooltip;
        }
    }

    // Collapse (сворачивание/разворачивание)
    initCollapse() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-bs-toggle="collapse"]')) {
                e.preventDefault();
                const target = e.target.getAttribute('data-bs-target');
                const collapsible = document.querySelector(target);
                if (collapsible) {
                    this.toggleCollapse(collapsible);
                }
            }
        });
    }

    toggleCollapse(element) {
        const isCollapsed = element.classList.contains('show');
        
        if (isCollapsed) {
            this.collapse(element);
        } else {
            this.expand(element);
        }
    }

    collapse(element) {
        element.style.height = element.scrollHeight + 'px';
        
        setTimeout(() => {
            element.style.height = '0';
            element.style.overflow = 'hidden';
        }, 0);

        setTimeout(() => {
            element.classList.remove('show');
            element.style.height = '';
            element.style.overflow = '';
        }, 300);
    }

    expand(element) {
        element.style.height = '0';
        element.style.overflow = 'hidden';
        element.classList.add('show');

        setTimeout(() => {
            element.style.height = element.scrollHeight + 'px';
        }, 0);

        setTimeout(() => {
            element.style.height = '';
            element.style.overflow = '';
        }, 300);
    }

    // Утилиты
    static showAlert(message, type = 'info', duration = 5000) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            max-width: 500px;
        `;
        
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alert);

        // Автоматическое закрытие
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, duration);

        // Закрытие по клику
        alert.addEventListener('click', (e) => {
            if (e.target.matches('.btn-close')) {
                alert.remove();
            }
        });
    }

    static showSpinner(container) {
        const spinner = document.createElement('div');
        spinner.className = 'text-center';
        spinner.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Загрузка...</span>
            </div>
        `;
        container.appendChild(spinner);
        return spinner;
    }

    static hideSpinner(spinner) {
        if (spinner && spinner.parentNode) {
            spinner.remove();
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.customFramework = new CustomFramework();
});

// Глобальные функции для совместимости с Bootstrap API
window.bootstrap = {
    Modal: class {
        constructor(element) {
            this.element = element;
        }
        
        show() {
            window.customFramework.showModal(this.element);
        }
        
        hide() {
            window.customFramework.hideModal(this.element);
        }
    },
    
    Alert: class {
        static show(message, type = 'info', duration = 5000) {
            CustomFramework.showAlert(message, type, duration);
        }
    }
};