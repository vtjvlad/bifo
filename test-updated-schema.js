const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

// Подключение к MongoDB
async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bifo', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Подключение к MongoDB успешно');
    } catch (error) {
        console.error('❌ Ошибка подключения к MongoDB:', error);
        process.exit(1);
    }
}

// Тест создания продукта с новой схемой
async function testCreateProduct() {
    try {
        console.log('\n🧪 Тестирование создания продукта...');
        
        const testProduct = new Product({
            id: 999999,
            title: "Тестовый продукт",
            date: "2024-01-01",
            vendor: {
                title: "Тестовый производитель",
                __typename: "Vendor"
            },
            section: {
                _id: 999,
                productCategoryName: "Тестовая категория",
                category: "bt-test-category",
                subCategory: "test-subcategory",
                __typename: "Section"
            },
            isPromo: false,
            toOfficial: false,
            promoBid: null,
            lineName: "Тестовая линейка",
            linePathNew: "/test/line/",
            imagesCount: 1,
            videosCount: 0,
            techShortSpecifications: ["Тестовая характеристика"],
            techShortSpecificationsList: [
                { key: "Тест", value: "Значение" }
            ],
            reviewsCount: 0,
            questionsCount: 0,
            url: "/test/product/",
            imageLinks: [
                {
                    thumb: "https://via.placeholder.com/150x150",
                    basic: "https://via.placeholder.com/300x300",
                    small: "https://via.placeholder.com/200x200",
                    big: "https://via.placeholder.com/600x600"
                }
            ],
            minPrice: 1000,
            maxPrice: 1500,
            currentPrice: 1200,
            initPrice: 1500,
            salesCount: 0,
            isNew: 0,
            colorsProduct: [],
            offerCount: 5,
            offers: [],
            madeInUkraine: false,
            userSubscribed: false,
            __typename: "Product"
        });

        const savedProduct = await testProduct.save();
        console.log('✅ Продукт успешно создан:', savedProduct.title);
        console.log('   ID:', savedProduct.id);
        console.log('   MongoDB _id:', savedProduct._id);
        console.log('   Категория:', savedProduct.section.category);
        console.log('   Подкатегория:', savedProduct.section.subCategory);
        console.log('   Виртуальное поле catalogName:', savedProduct.catalogName);
        console.log('   Виртуальное поле categoryName:', savedProduct.categoryName);
        
        return savedProduct;
    } catch (error) {
        console.error('❌ Ошибка создания продукта:', error.message);
        return null;
    }
}

// Тест поиска продукта по ID
async function testFindProduct(productId) {
    try {
        console.log('\n🔍 Тестирование поиска продукта...');
        
        const product = await Product.findOne({ id: productId });
        if (product) {
            console.log('✅ Продукт найден:', product.title);
            console.log('   Цена:', product.currentPrice, 'грн');
            console.log('   Производитель:', product.vendor.title);
            console.log('   Категория:', product.section.productCategoryName);
            console.log('   Каталог:', product.section.category);
            console.log('   Подкатегория:', product.section.subCategory);
            return product;
        } else {
            console.log('❌ Продукт не найден');
            return null;
        }
    } catch (error) {
        console.error('❌ Ошибка поиска продукта:', error.message);
        return null;
    }
}

// Тест поиска по категориям
async function testCategorySearch() {
    try {
        console.log('\n📂 Тестирование поиска по категориям...');
        
        // Поиск по категории
        const categoryProducts = await Product.find({ 
            'section.category': { $regex: 'bt-smartphones', $options: 'i' } 
        }).limit(3);
        
        console.log(`✅ Найдено ${categoryProducts.length} продуктов в категории bt-smartphones:`);
        categoryProducts.forEach(product => {
            console.log(`   - ${product.title} (${product.section.subCategory})`);
        });
        
        // Поиск по подкатегории
        const subCategoryProducts = await Product.find({ 
            'section.subCategory': { $regex: 'iphone', $options: 'i' } 
        }).limit(3);
        
        console.log(`✅ Найдено ${subCategoryProducts.length} продуктов в подкатегории iphone:`);
        subCategoryProducts.forEach(product => {
            console.log(`   - ${product.title} (${product.section.category})`);
        });
        
        return { categoryProducts, subCategoryProducts };
    } catch (error) {
        console.error('❌ Ошибка поиска по категориям:', error.message);
        return null;
    }
}

// Тест агрегации по категориям
async function testCategoryAggregation() {
    try {
        console.log('\n📊 Тестирование агрегации по категориям...');
        
        const stats = await Product.aggregate([
            {
                $group: {
                    _id: {
                        category: '$section.category',
                        subCategory: '$section.subCategory'
                    },
                    count: { $sum: 1 },
                    avgPrice: { $avg: '$currentPrice' }
                }
            },
            {
                $group: {
                    _id: '$_id.category',
                    subCategories: {
                        $push: {
                            subCategory: '$_id.subCategory',
                            count: '$count',
                            avgPrice: '$avgPrice'
                        }
                    },
                    totalCount: { $sum: '$count' }
                }
            },
            { $sort: { totalCount: -1 } }
        ]);
        
        console.log('✅ Статистика по категориям:');
        stats.forEach(stat => {
            console.log(`   ${stat._id}: ${stat.totalCount} товаров`);
            stat.subCategories.forEach(sub => {
                console.log(`     - ${sub.subCategory}: ${sub.count} товаров, средняя цена: ${Math.round(sub.avgPrice)} грн`);
            });
        });
        
        return stats;
    } catch (error) {
        console.error('❌ Ошибка агрегации по категориям:', error.message);
        return null;
    }
}

// Тест обновления продукта
async function testUpdateProduct(productId) {
    try {
        console.log('\n🔄 Тестирование обновления продукта...');
        
        const updatedProduct = await Product.findOneAndUpdate(
            { id: productId },
            { 
                $set: { 
                    currentPrice: 1100,
                    isPromo: true 
                },
                $inc: { salesCount: 1 }
            },
            { new: true }
        );
        
        if (updatedProduct) {
            console.log('✅ Продукт обновлен:', updatedProduct.title);
            console.log('   Новая цена:', updatedProduct.currentPrice, 'грн');
            console.log('   Промо:', updatedProduct.isPromo);
            console.log('   Продажи:', updatedProduct.salesCount);
            return updatedProduct;
        } else {
            console.log('❌ Продукт не найден для обновления');
            return null;
        }
    } catch (error) {
        console.error('❌ Ошибка обновления продукта:', error.message);
        return null;
    }
}

// Тест агрегации
async function testAggregation() {
    try {
        console.log('\n📊 Тестирование агрегации...');
        
        const stats = await Product.aggregate([
            {
                $group: {
                    _id: '$vendor.title',
                    totalProducts: { $sum: 1 },
                    avgPrice: { $avg: '$currentPrice' },
                    totalOffers: { $sum: '$offerCount' }
                }
            },
            { $sort: { totalProducts: -1 } }
        ]);
        
        console.log('✅ Статистика по производителям:');
        stats.forEach(stat => {
            console.log(`   ${stat._id}: ${stat.totalProducts} товаров, средняя цена: ${Math.round(stat.avgPrice)} грн`);
        });
        
        return stats;
    } catch (error) {
        console.error('❌ Ошибка агрегации:', error.message);
        return null;
    }
}

// Тест поиска по тексту
async function testTextSearch() {
    try {
        console.log('\n🔎 Тестирование текстового поиска...');
        
        const products = await Product.find({
            $or: [
                { title: { $regex: 'тест', $options: 'i' } },
                { 'vendor.title': { $regex: 'тест', $options: 'i' } }
            ]
        }).limit(5);
        
        console.log(`✅ Найдено ${products.length} продуктов с "тест":`);
        products.forEach(product => {
            console.log(`   - ${product.title} (${product.vendor.title})`);
        });
        
        return products;
    } catch (error) {
        console.error('❌ Ошибка текстового поиска:', error.message);
        return null;
    }
}

// Очистка тестовых данных
async function cleanupTestData(productId) {
    try {
        console.log('\n🧹 Очистка тестовых данных...');
        
        const deletedProduct = await Product.findOneAndDelete({ id: productId });
        if (deletedProduct) {
            console.log('✅ Тестовый продукт удален:', deletedProduct.title);
        } else {
            console.log('❌ Тестовый продукт не найден для удаления');
        }
    } catch (error) {
        console.error('❌ Ошибка удаления тестового продукта:', error.message);
    }
}

// Основная функция тестирования
async function runTests() {
    try {
        await connectToDatabase();
        
        // Тест создания
        const testProduct = await testCreateProduct();
        if (!testProduct) {
            console.log('❌ Тест создания провален, прерываем выполнение');
            return;
        }
        
        // Тест поиска
        await testFindProduct(testProduct.id);
        
        // Тест поиска по категориям
        await testCategorySearch();

        // Тест агрегации по категориям
        await testCategoryAggregation();
        
        // Тест обновления
        await testUpdateProduct(testProduct.id);
        
        // Тест агрегации
        await testAggregation();
        
        // Тест поиска по категориям
        await testCategorySearch();

        // Тест агрегации по категориям
        await testCategoryAggregation();
        
        // Тест текстового поиска
        await testTextSearch();
        
        // Очистка
        await cleanupTestData(testProduct.id);
        
        console.log('\n🎉 Все тесты завершены успешно!');
        
    } catch (error) {
        console.error('❌ Ошибка в тестах:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Соединение с MongoDB закрыто');
    }
}

// Запуск тестов
if (require.main === module) {
    runTests();
}

module.exports = {
    connectToDatabase,
    testCreateProduct,
    testFindProduct,
    testUpdateProduct,
    testAggregation,
    testTextSearch,
    testCategorySearch,
    testCategoryAggregation,
    cleanupTestData
}; 