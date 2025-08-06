const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const Store = require('../models/Store');
const Product = require('../models/Product');

class PriceScraper {
    constructor() {
        this.browser = null;
        this.stores = [];
    }

    async init() {
        console.log('🚀 Инициализация парсера цен...');
        this.browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        
        // Загружаем активные магазины
        this.stores = await Store.find({ isActive: true });
        console.log(`📊 Загружено ${this.stores.length} активных магазинов`);
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async scrapeStore(store) {
        console.log(`🔄 Парсинг магазина: ${store.name}`);
        
        try {
            const page = await this.browser.newPage();
            
            // Устанавливаем user-agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            
            // Переходим на страницу магазина
            await page.goto(store.baseUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            // Ждем загрузки контента
            await page.waitForTimeout(2000);

            // Получаем HTML
            const html = await page.content();
            const $ = cheerio.load(html);

            // Парсим товары согласно конфигурации магазина
            const products = await this.parseProducts($, store);
            
            console.log(`✅ Найдено ${products.length} товаров в ${store.name}`);
            
            // Обновляем время последнего парсинга
            await Store.findByIdAndUpdate(store._id, { lastScraped: new Date() });
            
            await page.close();
            return products;
            
        } catch (error) {
            console.error(`❌ Ошибка при парсинге ${store.name}:`, error.message);
            return [];
        }
    }

    async parseProducts($, store) {
        const products = [];
        
        // Используем селекторы из конфигурации магазина
        const productSelector = store.scrapingConfig?.productSelector || '.product-item';
        const titleSelector = store.scrapingConfig?.titleSelector || '.product-title';
        const priceSelector = store.scrapingConfig?.priceSelector || '.product-price';
        const imageSelector = store.scrapingConfig?.imageSelector || '.product-image img';
        
        $(productSelector).each((index, element) => {
            try {
                const $el = $(element);
                
                const title = $el.find(titleSelector).text().trim();
                const priceText = $el.find(priceSelector).text().trim();
                const imageUrl = $el.find(imageSelector).attr('src');
                const productUrl = $el.find('a').attr('href');
                
                if (title && priceText) {
                    const price = this.extractPrice(priceText);
                    
                    if (price > 0) {
                        products.push({
                            name: title,
                            price: price,
                            currency: 'UAH',
                            imageUrl: imageUrl,
                            productUrl: productUrl,
                            storeId: store._id
                        });
                    }
                }
            } catch (error) {
                console.error('Ошибка при парсинге товара:', error.message);
            }
        });
        
        return products;
    }

    extractPrice(priceText) {
        // Извлекаем числовое значение цены из текста
        const priceMatch = priceText.match(/[\d\s]+/);
        if (priceMatch) {
            const price = parseFloat(priceMatch[0].replace(/\s/g, ''));
            return isNaN(price) ? 0 : price;
        }
        return 0;
    }

    async updateProductPrices(scrapedProducts) {
        console.log('💾 Обновление цен товаров...');
        
        for (const scrapedProduct of scrapedProducts) {
            try {
                // Ищем существующий товар по названию и магазину
                let product = await Product.findOne({
                    name: { $regex: scrapedProduct.name, $options: 'i' },
                    'currentPrices.storeId': scrapedProduct.storeId
                });

                if (!product) {
                    // Создаем новый товар
                    product = new Product({
                        name: scrapedProduct.name,
                        category: 'Неизвестно',
                        currentPrices: [{
                            storeId: scrapedProduct.storeId,
                            price: scrapedProduct.price,
                            currency: scrapedProduct.currency,
                            availability: true,
                            url: scrapedProduct.productUrl,
                            lastUpdated: new Date()
                        }],
                        images: scrapedProduct.imageUrl ? [scrapedProduct.imageUrl] : []
                    });
                } else {
                    // Обновляем цену существующего товара
                    const existingPriceIndex = product.currentPrices.findIndex(
                        p => p.storeId.toString() === scrapedProduct.storeId.toString()
                    );

                    if (existingPriceIndex >= 0) {
                        // Обновляем существующую цену
                        const oldPrice = product.currentPrices[existingPriceIndex].price;
                        product.currentPrices[existingPriceIndex] = {
                            storeId: scrapedProduct.storeId,
                            price: scrapedProduct.price,
                            currency: scrapedProduct.currency,
                            availability: true,
                            url: scrapedProduct.productUrl,
                            lastUpdated: new Date()
                        };

                        // Добавляем в историю цен
                        product.priceHistory.push({
                            price: oldPrice,
                            currency: 'UAH',
                            date: new Date(),
                            storeId: scrapedProduct.storeId,
                            availability: true,
                            url: scrapedProduct.productUrl
                        });
                    } else {
                        // Добавляем новую цену
                        product.currentPrices.push({
                            storeId: scrapedProduct.storeId,
                            price: scrapedProduct.price,
                            currency: scrapedProduct.currency,
                            availability: true,
                            url: scrapedProduct.productUrl,
                            lastUpdated: new Date()
                        });
                    }
                }

                await product.save();
                
            } catch (error) {
                console.error('Ошибка при обновлении товара:', error.message);
            }
        }
    }

    async run() {
        try {
            await this.init();
            
            console.log('🔄 Начинаем парсинг всех магазинов...');
            
            for (const store of this.stores) {
                const products = await this.scrapeStore(store);
                if (products.length > 0) {
                    await this.updateProductPrices(products);
                }
                
                // Пауза между магазинами
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
            
            console.log('✅ Парсинг завершен успешно!');
            
        } catch (error) {
            console.error('❌ Ошибка при парсинге:', error);
        } finally {
            await this.close();
        }
    }
}

// Запуск парсера
if (require.main === module) {
    const scraper = new PriceScraper();
    scraper.run().then(() => {
        console.log('🏁 Парсинг завершен');
        process.exit(0);
    }).catch(error => {
        console.error('💥 Критическая ошибка:', error);
        process.exit(1);
    });
}

module.exports = PriceScraper; 