const puppeteer = require('puppeteer');

async function main() {
    const browser = await puppeteer.launch({
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
            '--disable-features=VizDisplayCompositor',
            // '--proxy=http://pfucslqf:ukpzonddbg51@38.154.227.167:5868'
        ]
        
    });
    const page = await browser.newPage();
    await page.goto('https://httpbin.org/ip');
    const content = await page.content();
    console.log(content);
}

main();