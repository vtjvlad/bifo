const axios = require('axios');
const fs = require('fs').promises;
const cliProgress = require('cli-progress');
const { XTOKEN, XREQUESTID } = require('./tt')();

// async function getTokens() {
//     const tokensFile = await JSON.parse(fs.readFileSync('./tokens.json', 'utf8'));
    
//     const tokens = JSON.stringify(tokensFile);

//     return tokens

// }

// getTokens();

// console.log(`${tokens}`)

// async function getTokens() {
//     const tokensFile = JSON.parse(fs.readFileSync('./tokens.json', 'utf8'));
//     const tokens = JSON.stringify(tokensFile);
//     return tokens;
// }

// getTokens().then(tokens => {
//     console.log(`${tokens}`);
// });

class HotlineParser {
    constructor() {
        this.baseUrl = 'https://hotline.ua/svc/frontend-api/graphql';
        this.headers = {
            'accept': '*/*',
            'content-type': 'application/json',
            'x-language': 'uk',
            'x-referer': 'https://hotline.ua/mobile/mobilnye-telefony-i-smartfony/',
            "x-token": `${XTOKEN}`,
            "x-request-id": `${XREQUESTID}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };
        this.progressBar = null;
        this.startTime = null;
        this.logBuffer = [];
        this.progressActive = false;
    }

    generateRequestId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    initProgressBar(totalPages) {
        try {
            this.startTime = Date.now();
            this.progressActive = true;
            this.logBuffer = [];
            
            this.progressBar = new cliProgress.SingleBar({
                format: '📊 Парсинг |{bar}| {percentage}% | Страница {value}/{total} | {speed} стр/с | ETA: {eta}s | Товаров: {products}',
                barCompleteChar: '\u2588',
                barIncompleteChar: '\u2591',
                hideCursor: true,
                clearOnComplete: false,
                stopOnComplete: false,
                forceRedraw: true
            }, cliProgress.Presets.rect);
            
            this.progressBar.start(totalPages, 0, {
                speed: '0.0',
                eta: '∞',
                products: '0'
            });
        } catch (error) {
            console.error('Ошибка инициализации прогресс бара:', error.message);
            this.progressActive = false;
        }
    }

    updateProgress(currentPage, productsCount = 0) {
        if (!this.progressBar || !this.progressActive) return;
        
        try {
            const elapsed = (Date.now() - this.startTime) / 1000;
            const speed = currentPage / elapsed;
            const eta = Math.round((this.progressBar.total - currentPage) / speed);
            
            this.progressBar.update(currentPage, {
                speed: speed.toFixed(1),
                eta: isFinite(eta) ? eta : '∞',
                products: productsCount.toString()
            });
        } catch (error) {
            console.error('Ошибка обновления прогресс бара:', error.message);
        }
    }

    stopProgress() {
        if (this.progressBar && this.progressActive) {
            try {
                this.progressBar.stop();
                this.progressActive = false;
                
                // Выводим накопленные логи
                if (this.logBuffer.length > 0) {
                    this.logBuffer.forEach(msg => console.log(msg));
                    this.logBuffer = [];
                }
                
                this.progressBar = null;
            } catch (error) {
                console.error('Ошибка остановки прогресс бара:', error.message);
            }
        }
    }

    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        const formattedMessage = `[${timestamp}] ${message}`;
        
        if (this.progressActive && this.progressBar) {
            // Если прогресс бар активен, добавляем сообщение в буфер
            this.logBuffer.push(formattedMessage);
            
            // Если буфер становится слишком большим, выводим сообщения
            if (this.logBuffer.length > 10) {
                this.flushLogs();
            }
        } else {
            console.log(formattedMessage);
        }
    }

    flushLogs() {
        if (this.logBuffer.length === 0) return;
        
        if (this.progressActive && this.progressBar) {
            try {
                // Временно очищаем строку прогресс бара
                process.stdout.write('\r\x1b[K');
                
                // Выводим все накопленные сообщения
                this.logBuffer.forEach(msg => console.log(msg));
                this.logBuffer = [];
                
                // Принудительно перерисовываем прогресс бар
                this.progressBar.render();
            } catch (error) {
                console.error('Ошибка вывода логов:', error.message);
            }
        } else {
            this.logBuffer.forEach(msg => console.log(msg));
            this.logBuffer = [];
        }
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
                this.log('Ошибки GraphQL: ' + JSON.stringify(response.data.errors));
                throw new Error(`GraphQL ошибки: ${JSON.stringify(response.data.errors)}`);
            }

            if (!response.data.data) {
                this.log('Неожиданная структура ответа: ' + JSON.stringify(response.data, null, 2));
                throw new Error('Отсутствует data в ответе');
            }

            if (!response.data.data.byPathSectionQueryProducts) {
                this.log('Неожиданная структура ответа: ' + JSON.stringify(response.data.data, null, 2));
                throw new Error('Отсутствует byPathSectionQueryProducts в ответе');
            }

            return response.data;
        } catch (error) {
            this.log('❌ Ошибка при получении данных: ' + error.message);
            if (error.response) {
                this.log('Статус ответа: ' + error.response.status);
                this.log('Заголовки ответа: ' + JSON.stringify(error.response.headers));
                this.log('Данные ответа: ' + JSON.stringify(error.response.data));
            }
            throw error;
        }
    }

    async getAllProducts(saveProgressively = true, saveInterval = 5) {
        let allProducts = [];
        let currentPage = 1;
        let totalPages = 1;

        try {
            this.log('🚀 Начинаем парсинг товаров...');
            
            // Получаем первую страницу для определения общего количества страниц
            const firstPageData = await this.getProducts(currentPage);
            // totalPages = firstPageData.data.byPathSectionQueryProducts.paginationInfo.lastPage;
            function getTotalPages(firstPageData) {
                return firstPageData.data.byPathSectionQueryProducts.paginationInfo.itemsPerPage / 48;
            }

            totalPages = getTotalPages(firstPageData);
            this.log(`📄 Всего страниц: ${totalPages}`);
            this.log(`📦 Всего товаров: ${firstPageData.data.byPathSectionQueryProducts.paginationInfo.itemsPerPage}`);

            // Инициализируем прогресс-бар
            this.initProgressBar(totalPages);
            let productsCount = firstPageData.data.byPathSectionQueryProducts.collection.length;
            this.updateProgress(1, productsCount); // Обновляем для первой страницы

            // Добавляем товары с первой страницы
            allProducts = allProducts.concat(firstPageData.data.byPathSectionQueryProducts.collection);
            
            // Сохраняем первую страницу если включено постепенное сохранение
            if (saveProgressively) {
                await this.saveToFileProgressive(firstPageData.data.byPathSectionQueryProducts.collection);
            }

            // Получаем остальные страницы
            for (let page = 2; page <= totalPages; page++) {
                const pageData = await this.getProducts(page);
                const pageProducts = pageData.data.byPathSectionQueryProducts.collection;
                allProducts = allProducts.concat(pageProducts);
                productsCount += pageProducts.length;
                
                // Обновляем прогресс-бар с общим количеством товаров
                this.updateProgress(page, productsCount);
                
                // Сохраняем данные постепенно
                if (saveProgressively && page % saveInterval === 0) {
                    await this.saveToFileProgressive(pageProducts);
                    // Периодически выводим накопленные логи
                    this.flushLogs();
                }
                
                // Небольшая задержка между запросами
                await this.delay(1000);
            }

            // Финальное обновление прогресс-бара
            this.updateProgress(totalPages, productsCount);
            
            // Выводим накопленные логи перед остановкой
            this.flushLogs();
            
            // Останавливаем прогресс-бар
            this.stopProgress();

            // Финальное сохранение всех данных
            if (saveProgressively) {
                this.log('💾 Выполняем финальное сохранение всех данных...');
                await this.saveToFile(allProducts);
            }

            this.log(`✅ Парсинг завершен! Получено ${allProducts.length} товаров`);
            return allProducts;

        } catch (error) {
            // Выводим накопленные логи перед остановкой
            this.flushLogs();
            // Останавливаем прогресс-бар в случае ошибки
            this.stopProgress();
            this.log('❌ Ошибка при парсинге всех товаров: ' + error.message);
            throw error;
        }
    }

    async saveToFileProgressive(products, filename = 'hotline-products.json') {
        try {
            // Если файл существует, читаем его и добавляем новые данные
            let existingProducts = [];
            try {
                const fileContent = await fs.readFile(filename, 'utf8');
                existingProducts = JSON.parse(fileContent);
            } catch (error) {
                // Файл не существует или пустой, начинаем с пустого массива
                this.log('Создаем новый файл для сохранения данных');
            }

            // Добавляем новые продукты
            const allProducts = existingProducts.concat(products);
            
            // Сохраняем обновленный файл
            await fs.writeFile(filename, JSON.stringify(allProducts, null, 2), 'utf8');
            this.log(`✅ Данные сохранены в файл: ${filename} (всего товаров: ${allProducts.length})`);
        } catch (error) {
            this.log('❌ Ошибка при сохранении файла: ' + error.message);
            throw error;
        }
    }

    async saveToFile(products, filename = 'hotline-products.json') {
        try {
            await fs.writeFile(filename, JSON.stringify(products, null, 2), 'utf8');
            this.log(`Данные сохранены в файл: ${filename}`);
        } catch (error) {
            this.log('Ошибка при сохранении файла: ' + error.message);
            throw error;
        }
    }

    // async saveThePagination(paginationInfo, filename = 'hotline-pagination.json') {
    //     try {
    //         await fs.writeFile(filename, JSON.stringify(paginationInfo, null, 2), 'utf8');
    //         console.log(`Данные сохранены в файл: ${filename}`);
    //     } catch (error) {
    //         console.error('Ошибка при сохранении файла:', error.message);
    //         throw error;
    //     }
    // }

    async saveToCSV(products, filename = 'hotline-products.csv') {
        try {
            // Добавляем BOM для корректного отображения кириллицы в Excel
            const BOM = '\uFEFF';
            const csvHeader = BOM + 'ID,Название,Производитель,Категория,Минимальная цена,Максимальная цена,Количество предложений,URL,Изображения,Характеристики\n';
            
            const csvRows = products.map(product => {
                // Очищаем и экранируем данные
                const cleanText = (text) => {
                    if (!text) return '';
                    return text.toString()
                        .replace(/"/g, '""')  // Экранируем кавычки
                        .replace(/\n/g, ' ')  // Заменяем переносы строк
                        .replace(/\r/g, ' ')  // Заменяем возврат каретки
                        .replace(/\t/g, ' ')  // Заменяем табуляцию
                        .trim();
                };

                const specs = product.techShortSpecificationsList && Array.isArray(product.techShortSpecificationsList) ? 
                    cleanText(product.techShortSpecificationsList.join('; ')) : '';
                const images = product.imageLinks && Array.isArray(product.imageLinks) ? 
                    cleanText(product.imageLinks.join('; ')) : 
                    (product.imageLinks ? cleanText(product.imageLinks.toString()) : '');
                
                return [
                    cleanText(product._id),
                    `"${cleanText(product.title)}"`,
                    `"${cleanText(product.vendor?.title)}"`,
                    `"${cleanText(product.section?.productCategoryName)}"`,
                    product.minPrice || '',
                    product.maxPrice || '',
                    product.offerCount || '',
                    `"${cleanText(product.url)}"`,
                    `"${images}"`,
                    `"${specs}"`
                ].join(',');
            });

            const csvContent = csvHeader + csvRows.join('\n');
            await fs.writeFile(filename, csvContent, 'utf8');
            this.log(`Данные сохранены в CSV файл: ${filename}`);
        } catch (error) {
            this.log('Ошибка при сохранении CSV файла: ' + error.message);
            throw error;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Метод для получения информации о конкретном товаре
    async getProductDetails(productId) {
        // Здесь можно добавить логику для получения детальной информации о товаре
        this.log(`Получение деталей товара с ID: ${productId}`);
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
        // Получаем все товары с постепенным сохранением
        // saveProgressively = true - включить постепенное сохранение
        // saveInterval = 5 - сохранять каждые 5 страниц
        const products = await parser.getAllProducts(true, 5);
        
        // Сохраняем в CSV (если нужно)
        await parser.saveToCSV(products);
        
        // Примеры использования дополнительных методов
        parser.log('\n=== Примеры фильтрации ===');
        
        // Фильтр по цене (от 5000 до 50000 грн)
        const filteredByPrice = parser.filterByPrice(products, 5000, 50000);
        parser.log(`Товары в диапазоне 5000-50000 грн: ${filteredByPrice.length}`);
        
        // Поиск по названию
        const searchResults = parser.searchByName(products, 'iPhone');
        parser.log(`Товары с "iPhone" в названии: ${searchResults.length}`);
        
        // Выводим первые 5 товаров для примера
        parser.log('\n=== Первые 5 товаров ===');
        products.slice(0, 5).forEach((product, index) => {
            parser.log(`${index + 1}. ${product.title} - ${product.minPrice} грн`);
        });
        
        // Выводим все накопленные логи
        parser.flushLogs();
        
    } catch (error) {
        parser.log('❌ Ошибка в main: ' + error.message);
        // Выводим все накопленные логи в случае ошибки
        parser.flushLogs();
    }
}

// Запускаем парсер, если файл запущен напрямую
if (require.main === module) {
    main();
}

module.exports = HotlineParser; 