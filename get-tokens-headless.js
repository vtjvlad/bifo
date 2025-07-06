const puppeteer = require('puppeteer');
const fs = require('fs').promises;

class TokenExtractorHeadless {
    constructor() {
        this.url = 'https://hotline.ua/ua/mobile/mobilnye-telefony-i-smartfony/';
        this.browser = null;
        this.page = null;
    }

    async init() {
        console.log('🚀 Запуск браузера в headless режиме...');
        this.browser = await puppeteer.launch({
            headless: true, // Работаем без GUI
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

        this.page = await this.browser.newPage();
        
        // Устанавливаем User-Agent
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Устанавливаем размер окна
        await this.page.setViewport({ width: 1920, height: 1080 });

        // Перехватываем сетевые запросы
        await this.page.setRequestInterception(true);
        
        const requests = [];
        this.page.on('request', request => {
            requests.push({
                url: request.url(),
                headers: request.headers(),
                method: request.method()
            });
            request.continue();
        });

        console.log('✅ Браузер запущен');
        return requests;
    }

    async extractTokens() {
        try {
            console.log(`📡 Переход на страницу: ${this.url}`);
            
            const requests = await this.init();
            
            // Переходим на страницу
            await this.page.goto(this.url, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            console.log('⏳ Ожидание загрузки страницы...');
            
            // Ждем немного для загрузки всех ресурсов
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Ищем GraphQL запросы
            const graphqlRequests = requests.filter(req => 
                req.url.includes('graphql') || 
                req.url.includes('api') ||
                req.headers['x-token'] ||
                req.headers['x-request-id']
            );

            console.log(`🔍 Найдено ${graphqlRequests.length} потенциальных API запросов`);

            let tokens = {
                'x-token': null,
                'x-request-id': null
            };

            // Ищем токены в заголовках запросов
            for (const req of graphqlRequests) {
                if (req.headers['x-token']) {
                    tokens['x-token'] = req.headers['x-token'];
                    console.log(`✅ Найден x-token: ${req.headers['x-token']}`);
                }
                if (req.headers['x-request-id']) {
                    tokens['x-request-id'] = req.headers['x-request-id'];
                    console.log(`✅ Найден x-request-id: ${req.headers['x-request-id']}`);
                }
            }

            // Если токены не найдены в заголовках, попробуем найти их в JavaScript коде
            if (!tokens['x-token'] || !tokens['x-request-id']) {
                console.log('🔍 Поиск токенов в JavaScript коде...');
                
                const pageContent = await this.page.content();
                
                // Ищем x-token в коде
                const xTokenMatch = pageContent.match(/x-token["\s]*:["\s]*["']([^"']+)["']/i);
                if (xTokenMatch) {
                    tokens['x-token'] = xTokenMatch[1];
                    console.log(`✅ Найден x-token в коде: ${xTokenMatch[1]}`);
                }

                // Ищем x-request-id в коде
                const xRequestIdMatch = pageContent.match(/x-request-id["\s]*:["\s]*["']([^"']+)["']/i);
                if (xRequestIdMatch) {
                    tokens['x-request-id'] = xRequestIdMatch[1];
                    console.log(`✅ Найден x-request-id в коде: ${xRequestIdMatch[1]}`);
                }
            }

            // Если токены все еще не найдены, попробуем выполнить JavaScript для их получения
            if (!tokens['x-token'] || !tokens['x-request-id']) {
                console.log('🔍 Выполнение JavaScript для поиска токенов...');
                
                const jsTokens = await this.page.evaluate(() => {
                    const tokens = {
                        'x-token': null,
                        'x-request-id': null
                    };

                    // Ищем в localStorage
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.toLowerCase().includes('token')) {
                            tokens['x-token'] = localStorage.getItem(key);
                            break;
                        }
                    }

                    // Ищем в sessionStorage
                    for (let i = 0; i < sessionStorage.length; i++) {
                        const key = sessionStorage.key(i);
                        if (key && key.toLowerCase().includes('token')) {
                            tokens['x-token'] = sessionStorage.getItem(key);
                            break;
                        }
                    }

                    // Ищем в глобальных переменных
                    if (window.token) tokens['x-token'] = window.token;
                    if (window.xToken) tokens['x-token'] = window.xToken;
                    if (window.requestId) tokens['x-request-id'] = window.requestId;
                    if (window.xRequestId) tokens['x-request-id'] = window.xRequestId;

                    return tokens;
                });

                if (jsTokens['x-token']) {
                    tokens['x-token'] = jsTokens['x-token'];
                    console.log(`✅ Найден x-token через JavaScript: ${jsTokens['x-token']}`);
                }
                if (jsTokens['x-request-id']) {
                    tokens['x-request-id'] = jsTokens['x-request-id'];
                    console.log(`✅ Найден x-request-id через JavaScript: ${jsTokens['x-request-id']}`);
                }
            }

            // Генерируем x-request-id если не найден
            if (!tokens['x-request-id']) {
                tokens['x-request-id'] = this.generateRequestId();
                console.log(`🔄 Сгенерирован новый x-request-id: ${tokens['x-request-id']}`);
            }

            return tokens;

        } catch (error) {
            console.error('❌ Ошибка при извлечении токенов:', error.message);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
                console.log('🔒 Браузер закрыт');
            }
        }
    }

    // Метод для генерации x-request-id (пример)
    generateRequestId() {
        return `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    }

    async saveTokens(tokens, filename = 'tokens.json') {
        try {
            await fs.writeFile(filename, JSON.stringify(tokens, null, 2), 'utf8');
            console.log(`💾 Токены сохранены в файл: ${filename}`);
        } catch (error) {
            console.error('❌ Ошибка при сохранении токенов:', error.message);
            throw error;
        }
    }

    async updateHotlineParser(tokens) {
        try {
            console.log('📝 Обновление hotline-parser.js...');
            
            const parserContent = await fs.readFile('hotline-parser.js', 'utf8');
            
            // Обновляем x-token
            let updatedContent = parserContent.replace(
                /'x-token':\s*'[^']*'/,
                `'x-token': '${tokens['x-token'] || '55779a23-508b-4e66-a2e1-6a19e34a48d7'}`
            );
            
            // Обновляем x-request-id
            updatedContent = updatedContent.replace(
                /'x-request-id':\s*this\.generateRequestId\(\)/,
                `'x-request-id': '${tokens['x-request-id'] || this.generateRequestId()}'`
            );
            
            await fs.writeFile('hotline-parser.js', updatedContent, 'utf8');
            console.log('✅ hotline-parser.js обновлен');
            
        } catch (error) {
            console.error('❌ Ошибка при обновлении hotline-parser.js:', error.message);
            throw error;
        }
    }
}

async function main() {
    const extractor = new TokenExtractorHeadless();
    
    try {
        console.log('🎯 Начинаем извлечение токенов (headless режим)...');
        
        const tokens = await extractor.extractTokens();
        
        console.log('\n📊 РЕЗУЛЬТАТЫ:');
        console.log('='.repeat(50));
        console.log(`🔑 x-token: ${tokens['x-token'] || 'НЕ НАЙДЕН'}`);
        console.log(`🆔 x-request-id: ${tokens['x-request-id'] || 'НЕ НАЙДЕН'}`);
        console.log('='.repeat(50));
        
        // Сохраняем токены в файл
        await extractor.saveTokens(tokens);
        
        // Обновляем hotline-parser.js
        await extractor.updateHotlineParser(tokens);
        
        console.log('\n🎉 Извлечение токенов завершено успешно!');
        
    } catch (error) {
        console.error('💥 Критическая ошибка:', error.message);
        process.exit(1);
    }
}

// Запускаем скрипт
if (require.main === module) {
    main();
}

module.exports = TokenExtractorHeadless;