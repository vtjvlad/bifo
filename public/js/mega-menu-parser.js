// Mega Menu Parser for BIFO
class MegaMenuParser {
    constructor() {
        this.catalogs = {};
        this.catalogFiles = [
            'tools', 'zootovary', 'military', 'mobile', 'musical_instruments',
            'pobutova_himiia', 'power', 'remont', 'sport', 'computer',
            'constructors-lego', 'dacha_sad', 'deti', 'dom', 'fashion',
            'krasota', 'adult', 'auto', 'av', 'bt'
        ];
    }

    // Parse catalog file content
    parseCatalogContent(content, catalogName) {
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        const groups = [];
        let currentGroup = null;
        let categories = [];

        for (const line of lines) {
            // Check if it's a group header (surrounded by underscores)
            if (line.includes('___________')) {
                // Save previous group if exists
                if (currentGroup && categories.length > 0) {
                    groups.push({
                        name: currentGroup,
                        categories: [...categories]
                    });
                }

                // Extract group name
                const groupMatch = line.match(/_{3,}\s*([^_]+)\s*_{3,}/);
                if (groupMatch) {
                    currentGroup = groupMatch[1].trim();
                    categories = [];
                }
            } else if (line && currentGroup) {
                // Parse category line
                const category = this.parseCategoryLine(line, catalogName);
                if (category) {
                    categories.push(category);
                }
            }
        }

        // Add last group
        if (currentGroup && categories.length > 0) {
            groups.push({
                name: currentGroup,
                categories: [...categories]
            });
        }

        return groups;
    }

    // Parse individual category line
    parseCategoryLine(line, catalogName) {
        const trimmedLine = line.trim();
        if (!trimmedLine) return null;

        // Check if it's a cross-catalog reference
        if (trimmedLine.startsWith('/')) {
            const parts = trimmedLine.split('/').filter(part => part);
            if (parts.length >= 2) {
                return {
                    name: parts[parts.length - 1],
                    displayName: this.formatCategoryName(parts[parts.length - 1]),
                    catalog: parts[0],
                    isCrossReference: true,
                    originalLine: trimmedLine
                };
            }
        }

        // Regular category
        return {
            name: trimmedLine,
            displayName: this.formatCategoryName(trimmedLine),
            catalog: catalogName,
            isCrossReference: false,
            originalLine: trimmedLine
        };
    }

    // Format category name for display
    formatCategoryName(name) {
        return name
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .trim();
    }

    // Load all catalog files
    async loadAllCatalogs() {
        const promises = this.catalogFiles.map(async (catalogName) => {
            try {
                const response = await fetch(`/catalogs/${catalogName}.txt`);
                if (response.ok) {
                    const content = await response.text();
                    const groups = this.parseCatalogContent(content, catalogName);
                    this.catalogs[catalogName] = {
                        name: this.formatCatalogName(catalogName),
                        groups: groups
                    };
                }
            } catch (error) {
                console.error(`Error loading catalog ${catalogName}:`, error);
            }
        });

        await Promise.all(promises);
        return this.catalogs;
    }

    // Format catalog name for display
    formatCatalogName(name) {
        const nameMap = {
            'tools': 'Инструменты',
            'zootovary': 'Товары для животных',
            'military': 'Военное снаряжение',
            'mobile': 'Мобильные устройства',
            'musical_instruments': 'Музыкальные инструменты',
            'pobutova_himiia': 'Бытовая химия',
            'power': 'Электроинструменты',
            'remont': 'Ремонт и стройка',
            'sport': 'Спорт и отдых',
            'computer': 'Компьютеры и техника',
            'constructors-lego': 'Конструкторы и LEGO',
            'dacha_sad': 'Дача и сад',
            'deti': 'Детские товары',
            'dom': 'Дом и быт',
            'fashion': 'Мода и стиль',
            'krasota': 'Красота и здоровье',
            'adult': 'Интимные товары',
            'auto': 'Автотовары',
            'av': 'Аудио и видео',
            'bt': 'Бытовая техника'
        };

        return nameMap[name] || name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // Generate mega menu HTML
    generateMegaMenuHTML() {
        const catalogs = Object.values(this.catalogs);
        let html = '';

        // Group catalogs into columns
        const columns = 4;
        const itemsPerColumn = Math.ceil(catalogs.length / columns);

        for (let i = 0; i < columns; i++) {
            const startIndex = i * itemsPerColumn;
            const endIndex = Math.min(startIndex + itemsPerColumn, catalogs.length);
            const columnCatalogs = catalogs.slice(startIndex, endIndex);

            html += `
                <div class="col-lg-3 col-md-6 col-sm-12">
                    <div class="mega-menu-category">
                        <h6>
                            <i class="fas fa-th-large"></i>
                            Каталог ${i + 1}
                        </h6>
                        <ul>
                            ${columnCatalogs.map(catalog => `
                                <li class="catalog-item">
                                    <a href="#" onclick="megaMenuParser.showCatalogDetails('${catalog.name}')" class="catalog-link">
                                        <i class="fas fa-folder me-2"></i>
                                        ${catalog.name}
                                        <span class="badge bg-primary ms-2">${catalog.groups.length}</span>
                                    </a>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }

        return html;
    }

    // Show catalog details in a modal
    showCatalogDetails(catalogName) {
        const catalog = Object.values(this.catalogs).find(c => c.name === catalogName);
        if (!catalog) return;

        let modalHTML = `
            <div class="modal fade" id="catalogDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-folder me-2"></i>${catalog.name}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                ${catalog.groups.map(group => `
                                    <div class="col-lg-6 col-md-12 mb-4">
                                        <div class="card">
                                            <div class="card-header">
                                                <h6 class="mb-0">
                                                    <i class="fas fa-layer-group me-2"></i>${group.name}
                                                </h6>
                                            </div>
                                            <div class="card-body">
                                                <ul class="list-unstyled">
                                                    ${group.categories.map(category => `
                                                        <li class="mb-2">
                                                            <a href="/catalog.html?category=${encodeURIComponent(category.name)}&catalog=${encodeURIComponent(category.catalog)}" 
                                                               class="text-decoration-none" 
                                                               onclick="megaMenuParser.closeAllModals()">
                                                                <i class="${category.isCrossReference ? 'fas fa-external-link-alt' : 'fas fa-tag'} me-2"></i>
                                                                ${category.displayName}
                                                                ${category.isCrossReference ? 
                                                                    `<small class="text-muted">(${this.formatCatalogName(category.catalog)})</small>` : 
                                                                    ''
                                                                }
                                                            </a>
                                                        </li>
                                                    `).join('')}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('catalogDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('catalogDetailsModal'));
        modal.show();
    }

    // Close all modals
    closeAllModals() {
        // Close catalog details modal
        const catalogModal = bootstrap.Modal.getInstance(document.getElementById('catalogDetailsModal'));
        if (catalogModal) {
            catalogModal.hide();
        }

        // Close mega menu dropdown
        const dropdown = document.querySelector('.catalogs-btn');
        if (dropdown) {
            const dropdownMenu = bootstrap.Dropdown.getInstance(dropdown);
            if (dropdownMenu) {
                dropdownMenu.hide();
            }
        }
    }
}

// Initialize global instance
window.megaMenuParser = new MegaMenuParser(); 