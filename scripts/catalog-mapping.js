const mongoose = require('mongoose');
const Product = require('../models/Product');
const Catalog = require('../models/Catalog');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Mapping of existing sections to catalog names
const sectionToCatalogMapping = {
    'Электроника': 'electronics',
    'Смартфоны': 'electronics',
    'Телефоны': 'electronics',
    'Компьютеры': 'electronics',
    'Ноутбуки': 'electronics',
    'Планшеты': 'electronics',
    'Аксессуары': 'electronics',
    
    'Одежда': 'clothing',
    'Мужская одежда': 'clothing',
    'Женская одежда': 'clothing',
    'Детская одежда': 'clothing',
    'Обувь': 'clothing',
    'Сумки': 'clothing',
    
    'Спорт': 'sport',
    'Спортивные товары': 'sport',
    'Фитнес': 'sport',
    'Тренажеры': 'sport',
    
    'Дом': 'home',
    'Домашние товары': 'home',
    'Мебель': 'home',
    'Декор': 'home',
    'Кухня': 'home',
    
    'Авто': 'auto',
    'Автотовары': 'auto',
    'Автозапчасти': 'auto',
    'Автоаксессуары': 'auto',
    
    'Красота': 'beauty',
    'Косметика': 'beauty',
    'Парфюмерия': 'beauty',
    'Уход за кожей': 'beauty',
    
    'Здоровье': 'health',
    'Медицинские товары': 'health',
    'Лекарства': 'health',
    'Витамины': 'health',
    
    'Дети': 'children',
    'Детские товары': 'children',
    'Игрушки': 'children',
    'Детское питание': 'children',
    
    'Сад': 'garden',
    'Садовые товары': 'garden',
    'Растения': 'garden',
    'Инструменты': 'garden',
    
    'Инструменты': 'tools',
    'Строительные инструменты': 'tools',
    'Ручные инструменты': 'tools',
    'Электроинструменты': 'tools',
    
    'Книги': 'books',
    'Литература': 'books',
    'Учебники': 'books',
    
    'Музыка': 'music',
    'Музыкальные инструменты': 'music',
    'Аудио': 'music',
    
    'Игры': 'games',
    'Видеоигры': 'games',
    'Настольные игры': 'games',
    
    'Военное снаряжение': 'military',
    'Тактическое снаряжение': 'military',
    'Защитное снаряжение': 'military',
    
    'Интимные товары': 'adult',
    'Секс-игрушки': 'adult',
    'Интимная косметика': 'adult'
};

async function analyzeProductSections() {
    try {
        console.log('🔍 Analyzing product sections...');
        
        // Get all unique sections
        const sections = await Product.aggregate([
            { $group: { _id: '$section.name', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        console.log('\n📊 Product sections found:');
        sections.forEach(section => {
            const catalogSlug = sectionToCatalogMapping[section._id] || 'unmapped';
            console.log(`  ${section._id}: ${section.count} products -> ${catalogSlug}`);
        });
        
        return sections;
    } catch (error) {
        console.error('Error analyzing sections:', error);
        return [];
    }
}

async function updateCatalogProductSearchFields() {
    try {
        console.log('\n🔄 Updating catalog product search fields...');
        
        // Get all catalogs
        const catalogs = await Catalog.find({ isActive: true });
        
        for (const catalog of catalogs) {
            let searchFields = [];
            
            // Find sections that map to this catalog
            for (const [sectionName, catalogSlug] of Object.entries(sectionToCatalogMapping)) {
                if (catalogSlug === catalog.slug) {
                    searchFields.push(sectionName);
                }
            }
            
            if (searchFields.length > 0) {
                // Update catalog with search fields
                await Catalog.updateOne(
                    { _id: catalog._id },
                    { 
                        $set: { 
                            productSearchField: searchFields.join('|'),
                            searchQueries: searchFields
                        }
                    }
                );
                
                console.log(`  ✅ Updated ${catalog.name}: ${searchFields.join(', ')}`);
            }
        }
        
        console.log('✅ Catalog search fields updated successfully!');
    } catch (error) {
        console.error('Error updating catalogs:', error);
    }
}

async function getCatalogStats() {
    try {
        console.log('\n📈 Getting catalog statistics...');
        
        const catalogs = await Catalog.find({ level: 0, isActive: true });
        
        for (const catalog of catalogs) {
            const searchField = catalog.productSearchField || catalog.name;
            const count = await Product.countDocuments({ 
                'section.name': { $regex: searchField, $options: 'i' } 
            });
            
            console.log(`  ${catalog.name}: ${count} products`);
        }
    } catch (error) {
        console.error('Error getting stats:', error);
    }
}

async function createMissingCatalogs() {
    try {
        console.log('\n🔧 Creating missing catalogs...');
        
        const existingCatalogs = await Catalog.find({ level: 0 });
        const existingSlugs = existingCatalogs.map(c => c.slug);
        
        const missingCatalogs = [];
        
        for (const [sectionName, catalogSlug] of Object.entries(sectionToCatalogMapping)) {
            if (!existingSlugs.includes(catalogSlug)) {
                missingCatalogs.push({
                    name: sectionName,
                    slug: catalogSlug,
                    description: `Каталог товаров: ${sectionName}`,
                    level: 0,
                    sortOrder: existingCatalogs.length + missingCatalogs.length,
                    isActive: true,
                    productSearchField: sectionName
                });
            }
        }
        
        if (missingCatalogs.length > 0) {
            await Catalog.insertMany(missingCatalogs);
            console.log(`  ✅ Created ${missingCatalogs.length} missing catalogs`);
        } else {
            console.log('  ✅ All catalogs already exist');
        }
    } catch (error) {
        console.error('Error creating catalogs:', error);
    }
}

async function main() {
    try {
        console.log('🚀 Starting catalog mapping analysis...\n');
        
        // Analyze existing sections
        await analyzeProductSections();
        
        // Create missing catalogs
        await createMissingCatalogs();
        
        // Update catalog search fields
        await updateCatalogProductSearchFields();
        
        // Get final statistics
        await getCatalogStats();
        
        console.log('\n✅ Catalog mapping completed successfully!');
        
    } catch (error) {
        console.error('❌ Error in main process:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    analyzeProductSections,
    updateCatalogProductSearchFields,
    getCatalogStats,
    createMissingCatalogs
}; 