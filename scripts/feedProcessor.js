const axios = require('axios');
const xml2js = require('xml2js');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Offer = require('../models/Offer');

class FeedProcessor {
    constructor() {
        this.stores = [];
    }

    async init() {
        console.log('🚀 Инициализация обработчика фидов...');
        this.stores = await Store.find({ isActive: true });
        console.log(`📊 Загружено ${this.stores.length} активных магазинов`);
    }

    async processAllFeeds() {
        console.log('🔄 Начинаем обработку всех фидов...');
        
        for (const store of this.stores) {
            try {
                console.log(`📥 Обработка фида магазина: ${store.name}`);
                await this.processFeed(store);
                
                // Обновляем время последнего обновления
                await Store.findByIdAndUpdate(store._id, { 
                    lastUpdated: new Date(),
                    $pull: { errorLog: {} } // Очищаем старые ошибки
                });
                
                console.log(`✅ Фид магазина ${store.name} обработан успешно`);
                
                // Пауза между обработкой фидов
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error(`❌ Ошибка при обработке фида ${store.name}:`, error.message);
                
                // Логируем ошибку
                await Store.findByIdAndUpdate(store._id, {
                    $push: {
                        errorLog: {
                            message: error.message,
                            timestamp: new Date()
                        }
                    }
                });
            }
        }
        
        console.log('✅ Обработка всех фидов завершена');
    }

    async processFeed(store) {
        let feedData;
        
        // Загружаем фид
        if (store.feedUrl.startsWith('http')) {
            feedData = await this.downloadFeed(store.feedUrl);
        } else {
            feedData = await this.readLocalFeed(store.feedUrl);
        }
        
        // Обрабатываем в зависимости от типа
        switch (store.feedType) {
            case 'json':
                await this.processJsonFeed(store, feedData);
                break;
            case 'xml':
                await this.processXmlFeed(store, feedData);
                break;
            case 'csv':
                await this.processCsvFeed(store, feedData);
                break;
            default:
                throw new Error(`Неподдерживаемый тип фида: ${store.feedType}`);
        }
    }

    async downloadFeed(url) {
        try {
            const response = await axios.get(url, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; PriceAggregator/1.0)'
                }
            });
            return response.data;
        } catch (error) {
            throw new Error(`Ошибка загрузки фида: ${error.message}`);
        }
    }

    async readLocalFeed(filePath) {
        try {
            const fullPath = path.join(__dirname, '..', 'feeds', filePath);
            return fs.readFileSync(fullPath, 'utf8');
        } catch (error) {
            throw new Error(`Ошибка чтения локального фида: ${error.message}`);
        }
    }

    async processJsonFeed(store, feedData) {
        let products;
        
        try {
            if (typeof feedData === 'string') {
                products = JSON.parse(feedData);
            } else {
                products = feedData;
            }
            
            // Нормализуем структуру
            if (Array.isArray(products)) {
                await this.processProductsArray(store, products);
            } else if (products.items || products.products || products.offers) {
                const items = products.items || products.products || products.offers;
                await this.processProductsArray(store, items);
            } else {
                throw new Error('Неизвестная структура JSON фида');
            }
            
        } catch (error) {
            throw new Error(`Ошибка обработки JSON фида: ${error.message}`);
        }
    }

    async processXmlFeed(store, feedData) {
        try {
            const parser = new xml2js.Parser({ explicitArray: false });
            const result = await parser.parseStringPromise(feedData);
            
            let products = [];
            
            // Ищем продукты в различных структурах XML
            if (result.rss && result.rss.channel && result.rss.channel.item) {
                products = result.rss.channel.item;
            } else if (result.feed && result.feed.entry) {
                products = result.feed.entry;
            } else if (result.products && result.products.product) {
                products = Array.isArray(result.products.product) ? 
                    result.products.product : [result.products.product];
            } else if (result.offers && result.offers.offer) {
                products = Array.isArray(result.offers.offer) ? 
                    result.offers.offer : [result.offers.offer];
            } else {
                throw new Error('Неизвестная структура XML фида');
            }
            
            await this.processProductsArray(store, products);
            
        } catch (error) {
            throw new Error(`Ошибка обработки XML фида: ${error.message}`);
        }
    }

    async processCsvFeed(store, feedData) {
        return new Promise((resolve, reject) => {
            const products = [];
            
            const stream = require('stream');
            const readable = new stream.Readable();
            readable.push(feedData);
            readable.push(null);
            
            readable
                .pipe(csv())
                .on('data', (row) => {
                    products.push(row);
                })
                .on('end', async () => {
                    try {
                        await this.processProductsArray(store, products);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', (error) => {
                    reject(new Error(`Ошибка обработки CSV фида: ${error.message}`));
                });
        });
    }

    async processProductsArray(store, products) {
        console.log(`📦 Обработка ${products.length} товаров из фида ${store.name}`);
        
        for (const productData of products) {
            try {
                await this.processProduct(store, productData);
            } catch (error) {
                console.error(`Ошибка обработки товара: ${error.message}`);
            }
        }
    }

    async processProduct(store, productData) {
        // Извлекаем данные согласно маппингу
        const mapping = store.feedMapping;
        
        const productInfo = {
            name: this.extractValue(productData, mapping.productName),
            description: this.extractValue(productData, mapping.productDescription),
            category: this.extractValue(productData, mapping.productCategory),
            brand: this.extractValue(productData, mapping.productBrand),
            image: this.extractValue(productData, mapping.productImage),
            sku: this.extractValue(productData, mapping.productSku),
            specs: this.extractSpecs(productData, mapping.productSpecs)
        };
        
        const offerInfo = {
            price: this.extractPrice(productData, mapping.offerPrice),
            currency: this.extractValue(productData, mapping.offerCurrency) || 'UAH',
            url: this.extractValue(productData, mapping.offerUrl),
            available: this.extractAvailability(productData, mapping.offerAvailability)
        };
        
        // Проверяем обязательные поля
        if (!productInfo.name || !offerInfo.price) {
            return; // Пропускаем товары без названия или цены
        }
        
        // Ищем существующий товар по SKU или названию
        let product = null;
        
        if (productInfo.sku) {
            product = await Product.findOne({ sku: productInfo.sku });
        }
        
        if (!product) {
            product = await Product.findOne({ 
                name: { $regex: productInfo.name, $options: 'i' }
            });
        }
        
        // Создаем или обновляем товар
        if (!product) {
            product = new Product({
                ...productInfo,
                searchKeywords: this.generateKeywords(productInfo.name, productInfo.brand)
            });
            await product.save();
            console.log(`➕ Создан новый товар: ${productInfo.name}`);
        } else {
            // Обновляем существующий товар
            Object.assign(product, productInfo);
            await product.save();
        }
        
        // Создаем или обновляем предложение
        const offerData = {
            productId: product._id,
            storeId: store._id,
            price: offerInfo.price,
            currency: offerInfo.currency,
            url: offerInfo.url,
            available: offerInfo.available,
            lastUpdated: new Date()
        };
        
        try {
            await Offer.findOneAndUpdate(
                { productId: product._id, storeId: store._id },
                offerData,
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error(`Ошибка обновления предложения: ${error.message}`);
        }
    }

    extractValue(data, fieldPath) {
        if (!fieldPath) return null;
        
        const fields = fieldPath.split('.');
        let value = data;
        
        for (const field of fields) {
            if (value && typeof value === 'object' && field in value) {
                value = value[field];
            } else {
                return null;
            }
        }
        
        return value ? String(value).trim() : null;
    }

    extractPrice(data, fieldPath) {
        const priceStr = this.extractValue(data, fieldPath);
        if (!priceStr) return null;
        
        // Извлекаем числовое значение цены
        const priceMatch = priceStr.match(/[\d\s.,]+/);
        if (priceMatch) {
            const price = parseFloat(priceMatch[0].replace(/[\s,]/g, ''));
            return isNaN(price) ? null : price;
        }
        
        return null;
    }

    extractAvailability(data, fieldPath) {
        const availabilityStr = this.extractValue(data, fieldPath);
        if (!availabilityStr) return true;
        
        const availableKeywords = ['true', '1', 'yes', 'available', 'в наличии', 'есть'];
        const unavailableKeywords = ['false', '0', 'no', 'unavailable', 'нет в наличии', 'отсутствует'];
        
        const lowerStr = availabilityStr.toLowerCase();
        
        if (availableKeywords.some(keyword => lowerStr.includes(keyword))) {
            return true;
        }
        
        if (unavailableKeywords.some(keyword => lowerStr.includes(keyword))) {
            return false;
        }
        
        return true; // По умолчанию считаем доступным
    }

    extractSpecs(data, fieldPath) {
        const specsStr = this.extractValue(data, fieldPath);
        if (!specsStr) return new Map();
        
        const specs = new Map();
        
        // Пытаемся распарсить спецификации
        try {
            if (specsStr.startsWith('{') || specsStr.startsWith('[')) {
                const parsed = JSON.parse(specsStr);
                if (typeof parsed === 'object') {
                    Object.entries(parsed).forEach(([key, value]) => {
                        specs.set(key, String(value));
                    });
                }
            } else {
                // Простой парсинг "ключ: значение"
                const lines = specsStr.split('\n');
                lines.forEach(line => {
                    const colonIndex = line.indexOf(':');
                    if (colonIndex > 0) {
                        const key = line.substring(0, colonIndex).trim();
                        const value = line.substring(colonIndex + 1).trim();
                        if (key && value) {
                            specs.set(key, value);
                        }
                    }
                });
            }
        } catch (error) {
            console.warn('Не удалось распарсить спецификации:', error.message);
        }
        
        return specs;
    }

    generateKeywords(name, brand) {
        const keywords = [];
        
        if (name) {
            keywords.push(...name.toLowerCase().split(/\s+/));
        }
        
        if (brand) {
            keywords.push(brand.toLowerCase());
        }
        
        return [...new Set(keywords)].filter(keyword => keyword.length > 2);
    }

    async run() {
        try {
            await this.init();
            await this.processAllFeeds();
        } catch (error) {
            console.error('❌ Критическая ошибка при обработке фидов:', error);
        }
    }
}

// Запуск обработчика фидов
if (require.main === module) {
    const processor = new FeedProcessor();
    processor.run().then(() => {
        console.log('🏁 Обработка фидов завершена');
        process.exit(0);
    }).catch(error => {
        console.error('💥 Критическая ошибка:', error);
        process.exit(1);
    });
}

module.exports = FeedProcessor; 