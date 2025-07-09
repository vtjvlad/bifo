const axios = require('axios');

class DebugHotlineParser {
    constructor() {
        this.baseUrl = 'https://hotline.ua/svc/frontend-api/graphql';
        this.headers = {
            'accept': '*/*',
            'content-type': 'application/json',
            'x-language': 'uk',
            'x-referer': 'https://hotline.ua/mobile-mobilnye-telefony-i-smartfony/samsung-galaxy-a56-5g-8128gb-awesome-graphite-sm-a566bzka/',
            'x-token': 'cdc3e828-1d6c-4e41-a68f-fbd730641f32', // Оригинальный токен из примера
            'x-request-id': '6c5138d8abcf11ebbf7337651cf3de14', // Оригинальный request-id из примера
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };
    }

    async testRequest(productPath = 'samsung-galaxy-s21-fe-5g-6128gb-lavender-sm-g990blvd') {
        try {
            console.log('🔍 Тестируем запрос...');
            console.log('URL:', this.baseUrl);
            console.log('Headers:', JSON.stringify(this.headers, null, 2));
            
            const query = {
                operationName: "getOffers",
                variables: {
                    path: productPath,
                    cityId: 5394
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

            console.log('Query:', JSON.stringify(query, null, 2));
            
            const response = await axios.post(this.baseUrl, query, { headers: this.headers });
            
            console.log('✅ Ответ получен!');
            console.log('Status:', response.status);
            console.log('Headers:', response.headers);
            
            if (response.data) {
                console.log('Data structure:', Object.keys(response.data));
                
                if (response.data.data && response.data.data.byPathQueryProduct) {
                    const product = response.data.data.byPathQueryProduct;
                    console.log('Product ID:', product.id);
                    console.log('Offers count:', product.offers?.totalCount || 0);
                    console.log('Offers edges:', product.offers?.edges?.length || 0);
                    
                    if (product.offers?.edges?.length > 0) {
                        console.log('First offer:', JSON.stringify(product.offers.edges[0].node, null, 2));
                    }
                } else {
                    console.log('❌ Нет данных о продукте в ответе');
                    console.log('Full response:', JSON.stringify(response.data, null, 2));
                }
            }
            
            return response.data;
        } catch (error) {
            console.error('❌ Ошибка запроса:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            return null;
        }
    }
}

async function main() {
    const parser = new DebugHotlineParser();
    
    // Тестируем с разными продуктами
    const testProducts = [
        'samsung-galaxy-s21-fe-5g-6128gb-lavender-sm-g990blvd',
        'apple-iphone-16-pro-256gb-natural-titanium-mynl3',
        'samsung-galaxy-a56-5g-8128gb-awesome-graphite-sm-a566bzka'
    ];
    
    for (const product of testProducts) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Тестируем продукт: ${product}`);
        console.log(`${'='.repeat(60)}`);
        
        await parser.testRequest(product);
        
        // Пауза между запросами
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

if (require.main === module) {
    main().catch(console.error);
} 