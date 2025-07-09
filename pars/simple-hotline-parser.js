const axios = require('axios');
const fs = require('fs').promises;
const { XTOKEN, XREQUESTID } = require('./tt')();

class HotlineParser {
    constructor() {
        this.baseUrl = 'https://hotline.ua/svc/frontend-api/graphql';
        this.headers = {
            'accept': '*/*',
            'content-type': 'application/json',
            'x-language': 'uk',
            'x-referer': 'https://hotline.ua/mobile-mobilnye-telefony-i-smartfony/apple-iphone-16-pro-256gb-natural-titanium-mynl3/',
            "x-token": `${XTOKEN}`,
            "x-request-id": `${XREQUESTID}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

        };
    }

    // Генерация уникального request-id
    generateRequestId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // Получение предложений для продукта
    async getOffers(productPath, cityId = 5394) {
        try {
            const requestId = this.generateRequestId();
            const headers = { ...this.headers, 'x-request-id': requestId };

            const query = {
                operationName: "getOffers",
                variables: {
                    path: productPath,
                    cityId: cityId
                },
                query: `query getOffers($path: String!, $cityId: Int!) {
                    byPathQueryProduct(path: $path, cityId: $cityId) {
                        id
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
                }`
            };

            console.log(`Отправляем запрос для продукта: ${productPath}`);
            const response = await axios.post(this.baseUrl, query, { headers });
            
            return response.data;
        } catch (error) {
            console.error(`Ошибка при получении предложений для ${productPath}:`, error.message);
            return null;
        }
    }

    // Парсинг предложений
    parseOffers(data) {
        if (!data || !data.data || !data.data.byPathQueryProduct) {
            return [];
        }

        const product = data.data.byPathQueryProduct;
        const offers = product.offers?.edges || [];

        return offers.map(edge => {
            const offer = edge.node;
            return {
                id: offer._id,
                firmTitle: offer.firmTitle,
                price: offer.price,
                condition: offer.condition,
                description: offer.descriptionShort,
                guarantee: offer.guaranteeTermName,
                delivery: offer.delivery?.name || 'Не указано',
                hasFreeDelivery: offer.delivery?.hasFreeDelivery || false,
                conversionUrl: offer.conversionUrl,
                reviews: {
                    positive: offer.reviewsPositiveNumber || 0,
                    negative: offer.reviewsNegativeNumber || 0
                }
            };
        });
    }

    // Сохранение результатов в JSON файл
    async saveToJson(data, filename) {
        try {
            await fs.writeFile(filename, JSON.stringify(data, null, 2), 'utf8');
            console.log(`Результаты сохранены в ${filename}`);
        } catch (error) {
            console.error('Ошибка при сохранении файла:', error.message);
        }
    }

    // Сохранение результатов в CSV файл
    async saveToCsv(offers, filename) {
        try {
            const headers = ['ID', 'Магазин', 'Цена', 'Состояние', 'Описание', 'Гарантия', 'Доставка', 'Бесплатная доставка', 'Положительные отзывы', 'Отрицательные отзывы', 'Ссылка'];
            
            const csvContent = [
                headers.join(','),
                ...offers.map(offer => [
                    offer.id,
                    `"${offer.firmTitle || ''}"`,
                    offer.price || '',
                    `"${offer.condition || ''}"`,
                    `"${(offer.description || '').replace(/"/g, '""')}"`,
                    `"${offer.guarantee || ''}"`,
                    `"${offer.delivery || ''}"`,
                    offer.hasFreeDelivery ? 'Да' : 'Нет',
                    offer.reviews.positive,
                    offer.reviews.negative,
                    `"${offer.conversionUrl || ''}"`
                ].join(','))
            ].join('\n');

            await fs.writeFile(filename, csvContent, 'utf8');
            console.log(`Результаты сохранены в ${filename}`);
        } catch (error) {
            console.error('Ошибка при сохранении CSV файла:', error.message);
        }
    }

    // Основной метод для парсинга продукта
    async parseProduct(productPath, cityId = 5394) {
        console.log(`Начинаем парсинг продукта: ${productPath}`);
        
        const data = await this.getOffers(productPath, cityId);
        if (!data) {
            console.log('Не удалось получить данные');
            return;
        }

        const offers = this.parseOffers(data);
        console.log(`Найдено предложений: ${offers.length}`);

        // Сохраняем результаты
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const baseFilename = `hotline-${productPath.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}`;
        
        await this.saveToJson({ productPath, offers, timestamp }, `${baseFilename}.json`);
        await this.saveToCsv(offers, `${baseFilename}.csv`);

        return offers;
    }
}

// Пример использования
async function main() {
    const parser = new HotlineParser();
    
    // Пример продукта из example2.txt
    const productPath = 'apple-iphone-16-pro-256gb-natural-titanium-mynl3';
    
    try {
        const offers = await parser.parseProduct(productPath);
        
        if (offers && offers.length > 0) {
            console.log('\nПервые 3 предложения:');
            offers.slice(0, 3).forEach((offer, index) => {
                console.log(`${index + 1}. ${offer.firmTitle} - ${offer.price} грн`);
            });
        }
    } catch (error) {
        console.error('Ошибка в main:', error.message);
    }
}

// Экспорт для использования в других модулях
module.exports = HotlineParser;

// Запуск если файл вызван напрямую
if (require.main === module) {
    main();
} 