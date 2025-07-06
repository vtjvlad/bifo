const axios = require('axios');
const fs = require('fs').promises;

class HotlineParser {
    constructor() {
        this.baseUrl = 'https://hotline.ua/svc/frontend-api/graphql';
        this.headers = {
            'accept': '*/*',
            'content-type': 'application/json',
            'x-language': 'uk',
            'x-referer': 'https://hotline.ua/mobile/mobilnye-telefony-i-smartfony/',
            'x-token': 'fd8455c2-b7b6-4067-8bfd-18053279630c',
            'x-request-id': '77904f1f0ed647ddcea7fb19b27d99cb',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };
    }

    generateRequestId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    async getProducts(page = 1, itemsPerPage = 48) {
        const query = `
            query getCatalogProducts($path: String!, $cityId: Int, $sort: String, $showFirst: String, $phrase: String, $itemsPerPage: Int, $page: Int, $filters: [Int], $excludedFilters: [Int], $priceMin: Int, $priceMax: Int) {
                byPathSectionQueryProducts(path: $path, cityId: $cityId, sort: $sort, showFirst: $showFirst, phrase: $phrase, itemsPerPage: $itemsPerPage, page: $page, filters: $filters, excludedFilters: $excludedFilters, priceMin: $priceMin, priceMax: $priceMax) {
                    collection {
                        _id
                        title
                        date
                        vendor {
                            title
                            __typename
                        }
                        section {
                            _id
                            productCategoryName
                            __typename
                        }
                        isPromo
                        toOfficial
                        promoBid
                        lineName
                        linePathNew
                        imagesCount
                        videosCount
                        techShortSpecifications
                        techShortSpecificationsList
                        reviewsCount
                        questionsCount
                        url
                        imageLinks
                        minPrice
                        maxPrice
                        salesCount
                        isNew
                        colorsProduct
                        offerCount
                        singleOffer {
                            _id
                            conversionUrl
                            firmId
                            firmTitle
                            price
                            firmExtraInfo
                            delivery {
                                deliveryMethods
                                hasFreeDelivery
                                isSameCity
                                name
                                __typename
                            }
                            __typename
                        }
                        madeInUkraine
                        userSubscribed
                        __typename
                    }
                    paginationInfo {
                        lastPage
                        totalCount
                        itemsPerPage
                        __typename
                    }
                    __typename
                }
            }
        `;

        const variables = {
            path: "mobilnye-telefony-i-smartfony",
            cityId: 5394,
            page: page,
            sort: "popularity",
            itemsPerPage: itemsPerPage,
            filters: [],
            excludedFilters: []
        };

        try {
            console.log(`📡 Отправка запроса на страницу ${page}...`);
            
            const response = await axios.post(this.baseUrl, {
                operationName: "getCatalogProducts",
                variables: variables,
                query: query
            }, {
                headers: this.headers
            });

            // Проверяем структуру ответа
            if (!response.data) {
                throw new Error('Пустой ответ от сервера');
            }

            if (response.data.errors) {
                console.error('Ошибки GraphQL:', response.data.errors);
                throw new Error(`GraphQL ошибки: ${JSON.stringify(response.data.errors)}`);
            }

            if (!response.data.data) {
                console.error('Неожиданная структура ответа:', JSON.stringify(response.data, null, 2));
                throw new Error('Отсутствует data в ответе');
            }

            if (!response.data.data.byPathSectionQueryProducts) {
                console.error('Неожиданная структура ответа:', JSON.stringify(response.data.data, null, 2));
                throw new Error('Отсутствует byPathSectionQueryProducts в ответе');
            }

            console.log(`✅ Успешно получены данные для страницы ${page}`);
            return response.data;
        } catch (error) {
            console.error('❌ Ошибка при получении данных:', error.message);
            if (error.response) {
                console.error('Статус ответа:', error.response.status);
                console.error('Заголовки ответа:', error.response.headers);
                console.error('Данные ответа:', error.response.data);
            }
            throw error;
        }
    }

    async getAllProducts() {
        let allProducts = [];
        let currentPage = 1;
        let totalPages = 1;

        try {
            console.log('Начинаем парсинг товаров...');
            
            // Получаем первую страницу для определения общего количества страниц
            const firstPageData = await this.getProducts(currentPage);
            totalPages = firstPageData.data.byPathSectionQueryProducts.paginationInfo.lastPage;
            
            console.log(`Всего страниц: ${totalPages}`);
            console.log(`Всего товаров: ${firstPageData.data.byPathSectionQueryProducts.paginationInfo.totalCount}`);

            // Добавляем товары с первой страницы
            allProducts = allProducts.concat(firstPageData.data.byPathSectionQueryProducts.collection);

            // Получаем остальные страницы
            for (let page = 2; page <= totalPages; page++) {
                console.log(`Парсинг страницы ${page}/${totalPages}...`);
                
                const pageData = await this.getProducts(page);
                allProducts = allProducts.concat(pageData.data.byPathSectionQueryProducts.collection);
                
                // Небольшая задержка между запросами
                await this.delay(1000);
            }

            console.log(`Парсинг завершен! Получено ${allProducts.length} товаров`);
            return allProducts;

        } catch (error) {
            console.error('Ошибка при парсинге всех товаров:', error.message);
            throw error;
        }
    }

    async saveToFile(products, filename = 'hotline-products.json') {
        try {
            await fs.writeFile(filename, JSON.stringify(products, null, 2), 'utf8');
            console.log(`Данные сохранены в файл: ${filename}`);
        } catch (error) {
            console.error('Ошибка при сохранении файла:', error.message);
            throw error;
        }
    }

    async saveToCSV(products, filename = 'hotline-products.csv') {
        try {
            const csvHeader = 'ID,Название,Производитель,Категория,Минимальная цена,Максимальная цена,Количество предложений,URL,Изображения,Характеристики\n';
            
            const csvRows = products.map(product => {
                const specs = product.techShortSpecificationsList ? 
                    product.techShortSpecificationsList.join('; ') : '';
                const images = product.imageLinks ? 
                    product.imageLinks.join('; ') : '';
                
                return [
                    product._id,
                    `"${product.title.replace(/"/g, '""')}"`,
                    `"${product.vendor?.title || ''}"`,
                    `"${product.section?.productCategoryName || ''}"`,
                    product.minPrice || '',
                    product.maxPrice || '',
                    product.offerCount || '',
                    `"${product.url || ''}"`,
                    `"${images}"`,
                    `"${specs}"`
                ].join(',');
            });

            const csvContent = csvHeader + csvRows.join('\n');
            await fs.writeFile(filename, csvContent, 'utf8');
            console.log(`Данные сохранены в CSV файл: ${filename}`);
        } catch (error) {
            console.error('Ошибка при сохранении CSV файла:', error.message);
            throw error;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Метод для получения информации о конкретном товаре
    async getProductDetails(productId) {
        // Здесь можно добавить логику для получения детальной информации о товаре
        console.log(`Получение деталей товара с ID: ${productId}`);
    }

    // Метод для фильтрации товаров по цене
    filterByPrice(products, minPrice, maxPrice) {
        return products.filter(product => {
            const price = product.minPrice || product.maxPrice;
            return price >= minPrice && price <= maxPrice;
        });
    }

    // Метод для поиска товаров по названию
    searchByName(products, searchTerm) {
        const term = searchTerm.toLowerCase();
        return products.filter(product => 
            product.title.toLowerCase().includes(term)
        );
    }
}

// Основная функция для запуска парсера
async function main() {
    const parser = new HotlineParser();
    
    try {
        // Получаем все товары
        const products = await parser.getAllProducts();
        
        // Сохраняем в JSON
        await parser.saveToFile(products);
        
        // Сохраняем в CSV
        await parser.saveToCSV(products);
        
        // Примеры использования дополнительных методов
        console.log('\n=== Примеры фильтрации ===');
        
        // Фильтр по цене (от 5000 до 50000 грн)
        const filteredByPrice = parser.filterByPrice(products, 5000, 50000);
        console.log(`Товары в диапазоне 5000-50000 грн: ${filteredByPrice.length}`);
        
        // Поиск по названию
        const searchResults = parser.searchByName(products, 'iPhone');
        console.log(`Товары с "iPhone" в названии: ${searchResults.length}`);
        
        // Выводим первые 5 товаров для примера
        console.log('\n=== Первые 5 товаров ===');
        products.slice(0, 5).forEach((product, index) => {
            console.log(`${index + 1}. ${product.title} - ${product.minPrice} грн`);
        });
        
    } catch (error) {
        console.error('Ошибка в main:', error.message);
    }
}

// Запускаем парсер, если файл запущен напрямую
if (require.main === module) {
    main();
}

module.exports = HotlineParser; 