// Component Loader
class ComponentLoader {
    constructor() {
        this.components = {};
        this.loadedComponents = new Set();
    }

    async loadComponent(name) {
        if (this.loadedComponents.has(name)) {
            return;
        }

        try {
            const response = await fetch(`/components/${name}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${name}`);
            }

            const html = await response.text();
            this.components[name] = html;
            this.loadedComponents.add(name);
        } catch (error) {
            console.error(`Error loading component ${name}:`, error);
        }
    }

    async loadAllComponents() {
        const componentElements = document.querySelectorAll('[data-component]');
        const componentNames = [...new Set([...componentElements].map(el => el.getAttribute('data-component')))];
        
        await Promise.all(componentNames.map(name => this.loadComponent(name)));
        this.renderComponents();
    }

    renderComponents() {
        const componentElements = document.querySelectorAll('[data-component]');
        
        componentElements.forEach(element => {
            const componentName = element.getAttribute('data-component');
            const componentHtml = this.components[componentName];
            
            if (componentHtml) {
                element.innerHTML = componentHtml;
                this.initializeComponent(element, componentName);
            }
        });
    }

    initializeComponent(element, componentName) {
        switch (componentName) {
            case 'header':
                this.initializeHeader(element);
                break;
            case 'footer':
                this.initializeFooter(element);
                break;
            case 'modals':
                this.initializeModals(element);
                break;
        }
    }

    initializeHeader(element) {
        // Initialize header functionality
        const authLink = element.querySelector('#authLink');
        const logoutBtn = element.querySelector('#logoutBtn');
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.app && window.app.logout) {
                    window.app.logout();
                } else if (window.catalogApp && window.catalogApp.logout) {
                    window.catalogApp.logout();
                }
            });
        }
    }

    initializeFooter(element) {
        // Initialize footer functionality if needed
    }

    initializeModals(element) {
        // Initialize modals functionality
        const loginForm = element.querySelector('#loginForm');
        const registerForm = element.querySelector('#registerForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (window.app && window.app.handleLogin) {
                    window.app.handleLogin();
                } else if (window.catalogApp && window.catalogApp.handleLogin) {
                    window.catalogApp.handleLogin();
                }
            });
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (window.app && window.app.handleRegister) {
                    window.app.handleRegister();
                } else if (window.catalogApp && window.catalogApp.handleRegister) {
                    window.catalogApp.handleRegister();
                }
            });
        }
    }
}

// Initialize component loader when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.componentLoader = new ComponentLoader();
    window.componentLoader.loadAllComponents();
}); 