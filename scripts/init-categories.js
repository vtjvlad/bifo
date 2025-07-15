const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Import Category model
const Category = require('../models/Category');

// Category mapping
const categoryMapping = {
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
    'military': { name: 'Военное снаряжение', icon: 'fas fa-shield-alt' }
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

async function loadCategoryFile(filename) {
    try {
        const filePath = path.join(__dirname, '..', 'categories', filename);
        const content = await fs.readFile(filePath, 'utf8');
        return content.split('\n').filter(line => line.trim());
    } catch (error) {
        console.error(`Error reading file ${filename}:`, error);
        return [];
    }
}

async function createMainCategory(slug, data) {
    try {
        const existingCategory = await Category.findOne({ slug });
        if (existingCategory) {
            console.log(`Category ${slug} already exists, skipping...`);
            return existingCategory;
        }

        const category = new Category({
            name: data.name,
            slug: slug,
            description: `Категория товаров: ${data.name}`,
            level: 0,
            sortOrder: Object.keys(categoryMapping).indexOf(slug)
        });

        await category.save();
        console.log(`✅ Created main category: ${data.name}`);
        return category;
    } catch (error) {
        console.error(`Error creating main category ${slug}:`, error);
        return null;
    }
}

async function createSubcategory(slug, name, parentSlug) {
    try {
        const existingCategory = await Category.findOne({ slug });
        if (existingCategory) {
            console.log(`Subcategory ${slug} already exists, skipping...`);
            return existingCategory;
        }

        const category = new Category({
            name: name,
            slug: slug,
            description: `Подкатегория: ${name}`,
            level: 1,
            parent: parentSlug,
            sortOrder: 0
        });

        await category.save();
        console.log(`✅ Created subcategory: ${name}`);
        return category;
    } catch (error) {
        console.error(`Error creating subcategory ${slug}:`, error);
        return null;
    }
}

async function initCategories() {
    console.log('🚀 Starting category initialization...');

    // Create main categories first
    const mainCategories = [];
    for (const [slug, data] of Object.entries(categoryMapping)) {
        const category = await createMainCategory(slug, data);
        if (category) {
            mainCategories.push(category);
        }
    }

    // Create subcategories
    for (const [slug, data] of Object.entries(categoryMapping)) {
        const filename = `${slug}.txt`;
        const subcategories = await loadCategoryFile(filename);
        
        console.log(`📁 Processing ${filename} with ${subcategories.length} subcategories...`);
        
        for (const subcategorySlug of subcategories) {
            if (subcategorySlug.trim()) {
                // Convert slug to readable name
                const name = subcategorySlug
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                
                await createSubcategory(subcategorySlug, name, slug);
            }
        }
    }

    console.log('✅ Category initialization completed!');
}

async function main() {
    await connectDB();
    await initCategories();
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { initCategories, categoryMapping }; 