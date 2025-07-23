const HotlineParser = require('./hotline-parser');

// Тестируем создание CSV файлов
async function testCSVCreation() {
    const parser = new HotlineParser();
    
    // Создаем тестовые данные
    const testProducts = [
        {
            _id: 'test1',
            title: 'Тестовый товар 1',
            vendor: { title: 'Производитель 1' },
            section: { productCategoryName: 'Тестовая категория' },
            minPrice: 1000,
            maxPrice: 2000,
            offerCount: 5,
            url: 'https://example.com/product1',
            imageLinks: ['https://example.com/image1.jpg'],
            techShortSpecificationsList: ['Характеристика 1', 'Характеристика 2']
        },
        {
            _id: 'test2',
            title: 'Тестовый товар 2',
            vendor: { title: 'Производитель 2' },
            section: { productCategoryName: 'Тестовая категория' },
            minPrice: 3000,
            maxPrice: 4000,
            offerCount: 3,
            url: 'https://example.com/product2',
            imageLinks: ['https://example.com/image2.jpg'],
            techShortSpecificationsList: ['Характеристика 3']
        }
    ];
    
    // Тестируем создание CSV для одной категории
    console.log('🧪 Тестируем создание CSV для одной категории...');
    await parser.saveToCSV(testProducts, 'CSV/test-single-category.csv');
    console.log('✅ CSV файл создан: CSV/test-single-category.csv');
    
    // Тестируем создание CSV с дополнительными полями категории
    console.log('\n🧪 Тестируем создание CSV с полями категории...');
    const productsWithCategory = testProducts.map(product => ({
        ...product,
        category: 'test-category',
        categoryUrl: 'https://hotline.ua/test-category/'
    }));
    
    await parser.saveToCSV(productsWithCategory, 'CSV/test-with-category.csv');
    console.log('✅ CSV файл создан: CSV/test-with-category.csv');
    
    console.log('\n🎉 Тестирование создания CSV файлов завершено!');
    console.log('📁 Проверьте созданные файлы:');
    console.log('   - CSV/test-single-category.csv');
    console.log('   - CSV/test-with-category.csv');
}

testCSVCreation().catch(console.error); 