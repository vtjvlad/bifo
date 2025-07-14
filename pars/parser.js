const axios = require('axios');
const fs = require('fs').promises;
const cliProgress = require('cli-progress');
const { XTOKEN, XREQUESTID } = require('./tt')();


class HotlineParser {
    constructor() {
        this.baseUrl = 'https://hotline.ua/svc/frontend-api/graphql';
        this.baseHeaders = {
            'accept': '*/*',
            'content-type': 'application/json',
            'x-language': 'uk',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };
        this.progressBar = null;
        this.startTime = null;
        this.logBuffer = [];
        this.progressActive = false;
        this.requestStats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            lastErrorTime: null,
            consecutiveErrors: 0
        };
        this.currentCategory = null;
        this.currentTokens = {
            'x-token': null,
            'x-request-id': null
        };
        
        // Создаем папки для сохранения файлов (асинхронно)
        this.ensureDirectories().catch(error => {
            console.error('Ошибка при создании папок:', error.message);
        });
    }

    generateRequestId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // Создание необходимых папок
    async ensureDirectories() {
        try {
            await fs.mkdir('JSON', { recursive: true });
            await fs.mkdir('CSV', { recursive: true });
            this.log('📁 Папки JSON и CSV созданы/проверены');
        } catch (error) {
            this.log(`❌ Ошибка при создании папок: ${error.message}`);
        }
    }

    // Извлекаем путь категории из URL
    extractPathFromUrl(url) {
        try {
            const urlObj = new URL(url);
            // Убираем начальный и конечный слеш
            let path = urlObj.pathname.replace(/^\/+|\/+$/g, '');
            // Разбиваем путь на части и берем только последний фрагмент
            const pathParts = path.split('/');
            const lastFragment = pathParts[pathParts.length - 1];
            return lastFragment;
        } catch (error) {
            this.log(`❌ Ошибка при извлечении пути из URL: ${url}`);
            throw error;
        }
    }

    // Получаем заголовки для конкретной категории
    getHeadersForCategory(categoryUrl) {
        return {
            ...this.baseHeaders,
            'x-referer': categoryUrl,
            'x-token': this.currentTokens['x-token'],
            'x-request-id': this.currentTokens['x-request-id']
        };
    }

    // Получение токенов для конкретной категории
    async getTokensForCategory(categoryUrl) {
        try {
            this.log(`🔑 Получение токенов для категории: ${this.extractPathFromUrl(categoryUrl)}`);
            
            // Используем puppeteer для получения токенов
            const puppeteer = require('puppeteer');
            
            const browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            });

            const page = await browser.newPage();
            
            // Устанавливаем User-Agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await page.setViewport({ width: 1920, height: 1080 });

            // Перехватываем сетевые запросы
            await page.setRequestInterception(true);
            
            const requests = [];
            page.on('request', request => {
                requests.push({
                    url: request.url(),
                    headers: request.headers(),
                    method: request.method()
                });
                request.continue();
            });

            // Переходим на страницу категории
            await page.goto(categoryUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            // Ждем загрузки всех ресурсов
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Ищем GraphQL запросы с токенами
            const graphqlRequests = requests.filter(req => 
                req.url.includes('graphql') || 
                req.url.includes('api') ||
                req.headers['x-token'] ||
                req.headers['x-request-id']
            );

            let tokens = {
                'x-token': null,
                'x-request-id': null
            };

            // Ищем токены в заголовках запросов
            for (const req of graphqlRequests) {
                if (req.headers['x-token']) {
                    tokens['x-token'] = req.headers['x-token'];
                }
                if (req.headers['x-request-id']) {
                    tokens['x-request-id'] = req.headers['x-request-id'];
                }
            }

            // Если токены не найдены, ищем в JavaScript коде
            if (!tokens['x-token'] || !tokens['x-request-id']) {
                const pageContent = await page.content();
                
                const xTokenMatch = pageContent.match(/x-token["\s]*:["\s]*["']([^"']+)["']/i);
                if (xTokenMatch) {
                    tokens['x-token'] = xTokenMatch[1];
                }

                const xRequestIdMatch = pageContent.match(/x-request-id["\s]*:["\s]*["']([^"']+)["']/i);
                if (xRequestIdMatch) {
                    tokens['x-request-id'] = xRequestIdMatch[1];
                }
            }

            // Генерируем x-request-id если не найден
            if (!tokens['x-request-id']) {
                tokens['x-request-id'] = this.generateRequestId();
            }

            await browser.close();

            if (tokens['x-token'] && tokens['x-request-id']) {
                this.currentTokens = tokens;
                this.log(`✅ Токены получены: x-token=${tokens['x-token'].substring(0, 10)}..., x-request-id=${tokens['x-request-id'].substring(0, 10)}...`);
                return tokens;
            } else {
                throw new Error('Не удалось получить токены для категории');
            }

        } catch (error) {
            this.log(`❌ Ошибка при получении токенов: ${error.message}`);
            
            // Используем дефолтные токены как fallback
            this.currentTokens = {
                'x-token': XTOKEN,
                'x-request-id': XREQUESTID
            };
            
            this.log(`🔄 Используем дефолтные токены как fallback`);
            return this.currentTokens;
        }
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

    async getProducts(page = 1, itemsPerPage = 48, categoryUrl = null) {
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
                        offers(first: 1000) {
                            totalCount
                            edges {
                            node {
                                _id
                                condition
                                conditionId
                                conversionUrl
                                descriptionFull
                                descriptionShort
                                firmId
                                firmLogo
                                firmTitle
                                firmExtraInfo
                                guaranteeTerm
                                guaranteeTermName
                                guaranteeType
                                hasBid
                                historyId
                                payment
                                price
                                reviewsNegativeNumber
                                reviewsPositiveNumber
                                bid
                                shipping
                                delivery {
                                deliveryMethods
                                hasFreeDelivery
                                isSameCity
                                name
                                countryCodeFirm
                                __typename
                                }
                                sortPlace
                                __typename
                            }
                            __typename
                            }
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

        // Определяем путь категории
        let path = "mobilnye-telefony-i-smartfony"; // по умолчанию
        let headers = this.baseHeaders;
        
        if (categoryUrl) {
            path = this.extractPathFromUrl(categoryUrl);
            headers = this.getHeadersForCategory(categoryUrl);
            this.currentCategory = path;
        }

        const variables = {
            path: path,
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
                headers: headers
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

            // Обновляем статистику успешного запроса
            this.updateRequestStats(true);
            return response.data;
        } catch (error) {
            // Обновляем статистику неудачного запроса
            this.updateRequestStats(false);
            
            this.log('❌ Ошибка при получении данных: ' + error.message);
            if (error.response) {
                this.log('Статус ответа: ' + error.response.status);
                this.log('Заголовки ответа: ' + JSON.stringify(error.response.headers));
                this.log('Данные ответа: ' + JSON.stringify(error.response.data));
            }
            throw error;
        }
    }

    async getAllProducts(saveProgressively = true, saveInterval = 25, batchSize = 25, categoryUrl = null) {
        let allProducts = [];
        let currentPage = 1;
        let totalPages = 1;

        try {
            const categoryName = categoryUrl ? this.extractPathFromUrl(categoryUrl) : 'телефоны';
            this.log(`🚀 Начинаем парсинг товаров категории: ${categoryName}`);
            
            // Устанавливаем токены (если не установлены)
            if (!this.currentTokens['x-token'] || !this.currentTokens['x-request-id']) {
                if (categoryUrl) {
                    await this.getTokensForCategory(categoryUrl);
                } else {
                    // Используем дефолтные токены для обратной совместимости
                    this.currentTokens = {
                        'x-token': XTOKEN,
                        'x-request-id': XREQUESTID
                    };
                }
            }
            
            // Получаем первую страницу для определения общего количества страниц
            const firstPageData = await this.getProducts(currentPage, 48, categoryUrl);
            // totalPages = firstPageData.data.byPathSectionQueryProducts.paginationInfo.lastPage;
            function getTotalPages(firstPageData) {
                return firstPageData.data.byPathSectionQueryProducts.paginationInfo.itemsPerPage / 48;
            }

            totalPages = getTotalPages(firstPageData);
            this.log(`📄 Всего страниц: ${totalPages}`);
            this.log(`📦 Всего товаров: ${firstPageData.data.byPathSectionQueryProducts.paginationInfo.itemsPerPage}`);
            this.log(`⚡ Размер батча: ${batchSize} страниц`);

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

            // Обрабатываем остальные страницы батчами
            for (let startPage = 2; startPage <= totalPages; startPage += batchSize) {
                const endPage = Math.min(startPage + batchSize - 1, totalPages);
                const pagesInBatch = endPage - startPage + 1;
                
                this.log(`🔄 Обрабатываем батч страниц ${startPage}-${endPage}...`);
                
                // Создаем массив промисов для параллельного выполнения
                const batchPromises = [];
                for (let page = startPage; page <= endPage; page++) {
                    batchPromises.push(this.getProducts(page, 48, categoryUrl));
                }
                
                // Выполняем все запросы в батче параллельно
                const batchResults = await Promise.allSettled(batchPromises);
                
                // Обрабатываем результаты батча
                let batchProducts = [];
                let successfulPages = 0;
                
                batchResults.forEach((result, index) => {
                    const page = startPage + index;
                    
                    if (result.status === 'fulfilled') {
                        const pageProducts = result.value.data.byPathSectionQueryProducts.collection;
                        batchProducts = batchProducts.concat(pageProducts);
                        productsCount += pageProducts.length;
                        successfulPages++;
                        this.log(`✅ Страница ${page}: получено ${pageProducts.length} товаров`);
                    } else {
                        this.log(`❌ Ошибка на странице ${page}: ${result.reason.message}`);
                    }
                });
                
                // Добавляем все товары из батча
                allProducts = allProducts.concat(batchProducts);
                
                // Обновляем прогресс-бар
                this.updateProgress(endPage, productsCount);
                
                // Сохраняем данные постепенно
                if (saveProgressively && batchProducts.length > 0) {
                    await this.saveToFileProgressive(batchProducts);
                }
                
                // Периодически выводим накопленные логи
                this.flushLogs();
                
                // Адаптивная задержка между батчами
                if (endPage < totalPages) {
                    const adaptiveDelay = this.getAdaptiveDelay();
                    this.log(`⏱️ Задержка между батчами: ${adaptiveDelay}мс`);
                    await this.delay(adaptiveDelay);
                }
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
            
            // Выводим статистику запросов
            const successRate = (this.requestStats.successfulRequests / this.requestStats.totalRequests * 100).toFixed(1);
            this.log(`📊 Статистика запросов:`);
            this.log(`   Всего запросов: ${this.requestStats.totalRequests}`);
            this.log(`   Успешных: ${this.requestStats.successfulRequests}`);
            this.log(`   Неудачных: ${this.requestStats.failedRequests}`);
            this.log(`   Процент успеха: ${successRate}%`);
            
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

    async saveToFileProgressive(products, filename = '../JSON/hotline-products.json') {
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

    async saveToFile(products, filename = 'JSON/hotline-products.json') {
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

    async saveToCSV(products, filename = 'CSV/hotline-products.csv') {
        try {
            // Добавляем BOM для корректного отображения кириллицы в Excel
            const BOM = '\uFEFF';
            
            // Определяем заголовки в зависимости от наличия дополнительных полей
            const hasCategoryField = products.length > 0 && products[0].category;
            const csvHeader = BOM + (hasCategoryField ? 
                'ID,Название,Производитель,Категория,URL категории,Минимальная цена,Максимальная цена,Количество предложений,URL,Изображения,Характеристики\n' :
                'ID,Название,Производитель,Категория,Минимальная цена,Максимальная цена,Количество предложений,URL,Изображения,Характеристики\n'
            );
            
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
                
                const baseRow = [
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
                ];
                
                // Добавляем дополнительные поля если они есть
                if (hasCategoryField) {
                    baseRow.splice(4, 0, `"${cleanText(product.category)}"`, `"${cleanText(product.categoryUrl)}"`);
                }
                
                return baseRow.join(',');
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

    // Адаптивная задержка в зависимости от статистики запросов
    getAdaptiveDelay() {
        const baseDelay = 500; // базовая задержка между батчами
        
        // Если есть последовательные ошибки, увеличиваем задержку
        if (this.requestStats.consecutiveErrors > 0) {
            const multiplier = Math.min(this.requestStats.consecutiveErrors * 2, 10);
            return baseDelay * multiplier;
        }
        
        // Если успешность запросов высокая, уменьшаем задержку
        if (this.requestStats.totalRequests > 10) {
            const successRate = this.requestStats.successfulRequests / this.requestStats.totalRequests;
            if (successRate > 0.95) {
                return Math.max(baseDelay * 0.5, 200); // минимум 200мс
            }
        }
        
        return baseDelay;
    }

    // Обновление статистики запросов
    updateRequestStats(success) {
        this.requestStats.totalRequests++;
        
        if (success) {
            this.requestStats.successfulRequests++;
            this.requestStats.consecutiveErrors = 0;
        } else {
            this.requestStats.failedRequests++;
            this.requestStats.consecutiveErrors++;
            this.requestStats.lastErrorTime = Date.now();
        }
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

    // Метод для настройки оптимального размера батча
    getOptimalBatchSize() {
        // Можно настроить в зависимости от производительности сервера
        // и ограничений API
        return 25;
    }

    // Чтение категорий из файла
    async loadCategoriesFromFile(filename = './tctgr/categories.txt') {
        try {
            const content = await fs.readFile(filename, 'utf8');
            const categories = content
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0 && !line.startsWith('#'))
                .filter(line => line.includes('hotline.ua'));
            
            this.log(`📁 Загружено ${categories.length} категорий из файла ${filename}`);
            return categories;
        } catch (error) {
            this.log(`❌ Ошибка при чтении файла категорий: ${error.message}`);
            throw error;
        }
    }

    // Парсинг всех категорий
    async parseAllCategories(categories, saveProgressively = true, batchSize = 15, autoGetTokens = true) {
        const allResults = {};
        let totalProducts = 0;
        
        this.log(`🔄 Начинаем парсинг ${categories.length} категорий...`);
        
        for (let i = 0; i < categories.length; i++) {
            const categoryUrl = categories[i];
            const categoryName = this.extractPathFromUrl(categoryUrl);
            
            this.log(`\n📦 [${i + 1}/${categories.length}] Обрабатываем категорию: ${categoryName}`);
            
            try {
                // Сбрасываем статистику для каждой категории
                this.requestStats = {
                    totalRequests: 0,
                    successfulRequests: 0,
                    failedRequests: 0,
                    lastErrorTime: null,
                    consecutiveErrors: 0
                };
                
                // Получаем актуальные токены для текущей категории (если включено)
                if (autoGetTokens) {
                    await this.getTokensForCategory(categoryUrl);
                }
                
                const products = await this.getAllProducts(
                    saveProgressively, 
                    25, 
                    batchSize, 
                    categoryUrl
                );
                
                allResults[categoryName] = {
                    url: categoryUrl,
                    products: products,
                    count: products.length
                };
                
                totalProducts += products.length;
                
                this.log(`✅ Категория ${categoryName}: получено ${products.length} товаров`);
                
                // Сохраняем отдельный файл для каждой категории
                const filename = `JSON/hotline-${categoryName.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
                await this.saveToFile(products, filename);
                
                // Сохраняем CSV файл для каждой категории
                const csvFilename = `CSV/hotline-${categoryName.replace(/[^a-zA-Z0-9]/g, '-')}.csv`;
                await this.saveToCSV(products, csvFilename);
                
                // Небольшая пауза между категориями
                if (i < categories.length - 1) {
                    this.log('⏱️ Пауза между категориями...');
                    await this.delay(2000);
                }
                
            } catch (error) {
                this.log(`❌ Ошибка при парсинге категории ${categoryName}: ${error.message}`);
                allResults[categoryName] = {
                    url: categoryUrl,
                    products: [],
                    count: 0,
                    error: error.message
                };
            }
        }
        
        this.log(`\n🎉 Парсинг завершен! Всего товаров: ${totalProducts}`);
        
        // Сохраняем общий отчет
        const report = {
            totalCategories: categories.length,
            totalProducts: totalProducts,
            categories: allResults,
            timestamp: new Date().toISOString()
        };
        
        await this.saveToFile(report, 'JSON/hotline-all-categories-report.json');
        this.log('📊 Отчет сохранен в JSON/hotline-all-categories-report.json');
        
        // Создаем общий CSV файл со всеми товарами
        this.log('📊 Создание общего CSV файла...');
        const allProducts = [];
        Object.keys(allResults).forEach(categoryName => {
            const result = allResults[categoryName];
            if (result.products && result.products.length > 0) {
                // Добавляем информацию о категории к каждому товару
                const productsWithCategory = result.products.map(product => ({
                    ...product,
                    category: categoryName,
                    categoryUrl: result.url
                }));
                allProducts.push(...productsWithCategory);
            }
        });
        
        if (allProducts.length > 0) {
            await this.saveToCSV(allProducts, 'CSV/hotline-all-categories.csv');
            this.log(`📊 Общий CSV файл создан: CSV/hotline-all-categories.csv (${allProducts.length} товаров)`);
        }
        
        return allResults;
    }

    // Метод для тестирования производительности с разными размерами батчей
    async testBatchPerformance(maxBatchSize = 25) {
        this.log('🧪 Тестируем производительность с разными размерами батчей...');
        
        const results = [];
        
        for (let batchSize = 1; batchSize <= maxBatchSize; batchSize++) {
            this.log(`\n📊 Тестируем батч размером ${batchSize}...`);
            
            const startTime = Date.now();
            
            try {
                // Тестируем на первых 3 страницах
                const testProducts = await this.getAllProducts(false, 1, batchSize);
                const endTime = Date.now();
                const duration = (endTime - startTime) / 1000;
                
                results.push({
                    batchSize,
                    duration,
                    productsCount: testProducts.length,
                    speed: testProducts.length / duration
                });
                
                this.log(`✅ Батч ${batchSize}: ${duration.toFixed(2)}с, ${testProducts.length} товаров, ${(testProducts.length / duration).toFixed(1)} товаров/с`);
                
            } catch (error) {
                this.log(`❌ Ошибка с батчем ${batchSize}: ${error.message}`);
                break; // Прерываем тест при ошибке
            }
        }
        
        // Находим оптимальный размер батча
        const optimal = results.reduce((best, current) => 
            current.speed > best.speed ? current : best
        );
        
        this.log(`\n🏆 Оптимальный размер батча: ${optimal.batchSize} (${optimal.speed.toFixed(1)} товаров/с)`);
        
        return {
            results,
            optimal
        };
    }
}

// Основная функция для запуска парсера
async function main() {
    const parser = new HotlineParser();
    
    // Настройки парсинга
    const TEST_PERFORMANCE = false; // Установите true для тестирования производительности
    const BATCH_SIZE = 15; // Размер батча для параллельной обработки
    const PARSE_ALL_CATEGORIES = true; // Установите true для парсинга всех категорий из файла
    const SINGLE_CATEGORY_URL = 'https://hotline.ua/mobile/mobilnye-telefony-i-smartfony/'; // URL для парсинга одной категории
    const AUTO_GET_TOKENS = true; // Автоматическое получение токенов для каждой категории
    
    try {
        if (TEST_PERFORMANCE) {
            // Тестируем производительность с разными размерами батчей
            await parser.testBatchPerformance(15);
            return;
        }
        
        if (PARSE_ALL_CATEGORIES) {
            // Парсим все категории из файла
            parser.log('📁 Загружаем категории из файла...');
            const categories = await parser.loadCategoriesFromFile('categories.txt');
            
            if (categories.length === 0) {
                parser.log('❌ Не найдено категорий для парсинга');
                return;
            }
            
            // Парсим все категории
            const allResults = await parser.parseAllCategories(categories, true, BATCH_SIZE, AUTO_GET_TOKENS);
            
            // Выводим итоговую статистику
            parser.log('\n📊 Итоговая статистика:');
            Object.keys(allResults).forEach(categoryName => {
                const result = allResults[categoryName];
                if (result.error) {
                    parser.log(`❌ ${categoryName}: ошибка - ${result.error}`);
                } else {
                    parser.log(`✅ ${categoryName}: ${result.count} товаров`);
                }
            });
            
        } else {
            // Парсим одну категорию
            this.log('📦 Парсим одну категорию...');
            const products = await parser.getAllProducts(true, 25, BATCH_SIZE, SINGLE_CATEGORY_URL);
            
            // Сохраняем в CSV
            const categoryName = parser.extractPathFromUrl(SINGLE_CATEGORY_URL);
            const csvFilename = `CSV/hotline-${categoryName.replace(/[^a-zA-Z0-9]/g, '-')}.csv`;
            await parser.saveToCSV(products, csvFilename);
            
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
        }
        
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