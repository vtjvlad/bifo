const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Import Catalog model
const Catalog = require('../models/Catalog');

// Catalog mapping
const catalogMapping = {
    'computer': { name: 'Компьютеры и электроника', icon: 'fas fa-laptop' },
    'auto': { name: 'Автотовары', icon: 'fas fa-car' },
    'fashion': { name: 'Одежда и мода', icon: 'fas fa-tshirt' },
    'dom': { name: 'Дом и сад', icon: 'fas fa-home' },
    'dacha_sad': { name: 'Дача и сад', icon: 'fas fa-seedling' },
    'deti': { name: 'Детские товары', icon: 'fas fa-baby' },
    'krasota': { name: 'Красота и здоровье', icon: 'fas fa-heartbeat' },
    'pobutova_himiia': { name: 'Бытовая химия', icon: 'fas fa-spray-can' },
    'musical_instruments': { name: 'Музыкальные инструменты', icon: 'fas fa-music' },
    'mobile': { name: 'Мобильные устройства', icon: 'fas fa-mobile-alt' },
    'remont': { name: 'Ремонт и строительство', icon: 'fas fa-tools' },
    'sport': { name: 'Спорт и отдых', icon: 'fas fa-dumbbell' },
    'zootovary': { name: 'Зоотовары', icon: 'fas fa-paw' },
    'tools': { name: 'Инструменты', icon: 'fas fa-wrench' },
    'bt': { name: 'Бытовая техника', icon: 'fas fa-tv' },
    'av': { name: 'Аудио и видео', icon: 'fas fa-headphones' },
    'adult': { name: 'Товары для взрослых', icon: 'fas fa-gift' },
    'military': { name: 'Военное снаряжение', icon: 'fas fa-shield-alt' },
    'power': { name: 'Электроинструменты', icon: 'fas fa-bolt' },
    'constructors-lego': { name: 'Конструкторы и LEGO', icon: 'fas fa-cubes' }
};

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

async function loadCatalogFile(filename) {
    try {
        const filePath = path.join(__dirname, '..', 'catalogs', filename);
        const content = await fs.readFile(filePath, 'utf8');
        return content.split('\n').filter(line => line.trim());
    } catch (error) {
        console.error(`Error reading file ${filename}:`, error);
        return [];
    }
}

// Parse catalog file content
function parseCatalogContent(lines, catalogSlug) {
    const groups = [];
    let currentGroup = null;
    let groupIndex = 0;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Check if it's a group (has multiple underscores)
        if (trimmedLine.includes('____') && trimmedLine.includes('_')) {
            // Extract group name from between underscores
            const groupMatch = trimmedLine.match(/_{3,}\s*([^_]+)\s*_{3,}/);
            if (groupMatch) {
                const groupName = groupMatch[1].trim();
                const groupSlug = groupName.toLowerCase()
                    .replace(/[^a-zа-я0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');

                currentGroup = {
                    name: groupName,
                    slug: groupSlug,
                    catalogSlug: catalogSlug,
                    level: 1,
                    isGroup: true,
                    sortOrder: groupIndex++,
                    categories: []
                };
                groups.push(currentGroup);
            }
        } else if (currentGroup && trimmedLine) {
            // This is a category
            const categorySlug = trimmedLine.trim();
            
            // Check if it's a reference to another catalog
            if (categorySlug.startsWith('/')) {
                const pathParts = categorySlug.slice(1).split('/');
                if (pathParts.length >= 2) {
                    const refCatalog = pathParts[0];
                    const refCategory = pathParts[1];
                    
                    currentGroup.categories.push({
                        slug: `${refCatalog}-${refCategory}`,
                        name: refCategory.split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' '),
                        level: 2,
                        groupSlug: currentGroup.slug,
                        catalogSlug: catalogSlug,
                        isReference: true,
                        referenceTo: {
                            catalogSlug: refCatalog,
                            categorySlug: refCategory
                        },
                        sortOrder: currentGroup.categories.length
                    });
                }
            } else {
                // Regular category
                const name = categorySlug.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
                
                // Create unique slug for duplicate categories
                let uniqueSlug = categorySlug;
                let counter = 1;
                while (currentGroup.categories.some(cat => cat.slug === uniqueSlug)) {
                    uniqueSlug = `${categorySlug}-${counter}`;
                    counter++;
                }
                
                currentGroup.categories.push({
                    slug: uniqueSlug,
                    name: name,
                    level: 2,
                    groupSlug: currentGroup.slug,
                    catalogSlug: catalogSlug,
                    sortOrder: currentGroup.categories.length
                });
            }
        }
    }

    return groups;
}

async function createMainCatalog(slug, data) {
    try {
        const existingCatalog = await Catalog.findOne({ slug });
        if (existingCatalog) {
            console.log(`Catalog ${slug} already exists, skipping...`);
            return existingCatalog;
        }

        const catalog = new Catalog({
            name: data.name,
            slug: slug,
            description: `Каталог товаров: ${data.name}`,
            level: 0,
            sortOrder: Object.keys(catalogMapping).indexOf(slug)
        });

        await catalog.save();
        console.log(`✅ Created main catalog: ${data.name}`);
        return catalog;
    } catch (error) {
        console.error(`Error creating main catalog ${slug}:`, error);
        return null;
    }
}

async function createGroup(groupData) {
    try {
        const existingGroup = await Catalog.findOne({ 
            slug: groupData.slug, 
            catalogSlug: groupData.catalogSlug,
            level: 1 
        });
        
        if (existingGroup) {
            console.log(`Group ${groupData.slug} already exists, skipping...`);
            return existingGroup;
        }

        const group = new Catalog({
            name: groupData.name,
            slug: groupData.slug,
            description: `Группа: ${groupData.name}`,
            level: 1,
            catalogSlug: groupData.catalogSlug,
            isGroup: true,
            sortOrder: groupData.sortOrder
        });

        await group.save();
        console.log(`✅ Created group: ${groupData.name}`);
        return group;
    } catch (error) {
        console.error(`Error creating group ${groupData.slug}:`, error);
        return null;
    }
}

async function createCategory(categoryData) {
    try {
        const existingCategory = await Catalog.findOne({ 
            slug: categoryData.slug, 
            groupSlug: categoryData.groupSlug,
            catalogSlug: categoryData.catalogSlug,
            level: 2 
        });
        
        if (existingCategory) {
            console.log(`Category ${categoryData.slug} already exists, skipping...`);
            return existingCategory;
        }

        const category = new Catalog({
            name: categoryData.name,
            slug: categoryData.slug,
            description: `Категория: ${categoryData.name}`,
            level: 2,
            groupSlug: categoryData.groupSlug,
            catalogSlug: categoryData.catalogSlug,
            isReference: categoryData.isReference || false,
            referenceTo: categoryData.referenceTo || null,
            sortOrder: categoryData.sortOrder
        });

        await category.save();
        console.log(`✅ Created category: ${categoryData.name}`);
        return category;
    } catch (error) {
        console.error(`Error creating category ${categoryData.slug}:`, error);
        return null;
    }
}

async function initCatalogs() {
    console.log('🚀 Starting catalog initialization...');

    // Create main catalogs first
    const mainCatalogs = [];
    for (const [slug, data] of Object.entries(catalogMapping)) {
        const catalog = await createMainCatalog(slug, data);
        if (catalog) {
            mainCatalogs.push(catalog);
        }
    }

    // Process each catalog file
    for (const [slug, data] of Object.entries(catalogMapping)) {
        const filename = `${slug}.txt`;
        const lines = await loadCatalogFile(filename);
        
        console.log(`📁 Processing ${filename}...`);
        
        if (lines.length > 0) {
            const groups = parseCatalogContent(lines, slug);
            console.log(`   Found ${groups.length} groups`);
            
            for (const group of groups) {
                // Create group
                await createGroup(group);
                
                // Create categories in group
                for (const category of group.categories) {
                    await createCategory(category);
                }
                
                console.log(`   Created ${group.categories.length} categories in group "${group.name}"`);
            }
        }
    }

    console.log('✅ Catalog initialization completed!');
}

async function main() {
    await connectDB();
    await initCatalogs();
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { initCatalogs, catalogMapping }; 