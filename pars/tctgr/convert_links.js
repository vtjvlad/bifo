const fs = require('fs');
const path = require('path');

// Функция для определения раздела по фрагменту ссылки
function determineCategory(fragment) {
    // Убираем начальный слеш
    const cleanFragment = fragment.replace(/^\//, '');
    
    // Маппинг фрагментов к разделам
    const categoryMapping = {
        // Adult раздел
        'analnye-stimulyatory': 'adult',
        'eroticheskaya-odezhda': 'adult',
        'intim': 'adult',
        
        // Auto раздел
        'akkumulyatory': 'auto',
        'aksessuary-dlya-shvejnyh-mashin': 'auto',
        'aksessuary-dlya-zaryadki': 'auto',
        'avto-svet': 'auto',
        'avtoelektronika': 'auto',
        'avtohimiya': 'auto',
        'avtomobilnoe-audio-i-video': 'auto',
        'avtooborudovanie': 'auto',
        'avtotelevizory': 'auto',
        'ochistiteli-kolesnyh-diskov': 'auto',
        'shiny-i-diski': 'auto',
        'sistemy-kontrolya-davleniya-v-shinah': 'auto',
        'tehpomosch': 'auto',
        'moto': 'auto',
        
        // AV раздел (аудио/видео)
        'audio': 'av',
        'domashnie-kinoteatry': 'av',
        'fotoapparaty-obektivy': 'av',
        'opticheskie-nakopiteli': 'av',
        'projectors': 'av',
        'televizionnye-antenny': 'av',
        'televizory-proektory': 'av',
        'tv-tyunery': 'av',
        'videokamery-i-videooborudovanie': 'av',
        
        // BT раздел (бытовая техника)
        'bytovaya-himiyapoint-hoztovary': 'bt',
        'bytovye-medicinskie-pribory': 'bt',
        'gazovye-ulichnye-obogrevateli': 'bt',
        'klimaticheskaya-tehnika': 'bt',
        'krupnaya-bytovaya-tehnika': 'bt',
        'melkaya-tehnika-dlya-kuhni': 'bt',
        'parovarki': 'bt',
        'personalnyi-dogliad': 'bt',
        'pivovarnipoint-distillyatory': 'bt',
        'populyarno-seychas-bt': 'bt',
        'smart-technika': 'bt',
        'tehnika-dlya-doma': 'bt',
        'vstraivaemaya-tehnika': 'bt',
        'vstroennye-pylesosy': 'bt',
        'vyazalnye-mashiny': 'bt',
        
        // Computer раздел
        'komplektuyuschie-dlya-pk': 'computer',
        'kompyuternaya-periferiya': 'computer',
        'matrichnye-printery': 'computer',
        'nastolnye-pk-monitory': 'computer',
        'noutbuki-pk': 'computer',
        'powerline-adaptery': 'computer',
        'print-servery': 'computer',
        'printery-mfu-plottery': 'computer',
        'setevoe-oborudovanie': 'computer',
        
        // Dacha_sad раздел
        'dachnoe-elektropitanie': 'dacha_sad',
        'kompostery': 'dacha_sad',
        'lampy-dlya-vyraschivaniya-rastenij': 'dacha_sad',
        'lejki': 'dacha_sad',
        'populyarno-seychas-dacha-sad': 'dacha_sad',
        'ruchnoj-sadovyj-instrument': 'dacha_sad',
        'sadovaya-mebelpoint-interer': 'dacha_sad',
        'sadovaya-tehnika': 'dacha_sad',
        'sadovodstvo-fermerstvo': 'dacha_sad',
        'vetro-solnechnye-kontrollery': 'dacha_sad',
        'vetrogeneratory': 'dacha_sad',
        'vodosnabzheniepoint-polivpoint-kanalizaciya': 'dacha_sad',
        'zernodrobilki': 'dacha_sad',
        
        // Deti раздел
        'detskaya-mebel': 'deti',
        'detskie-igrushki': 'deti',
        'detskij-transport': 'deti',
        'dlya-malyshej': 'deti',
        'dlya-sporta': 'deti',
        'koliasky': 'deti',
        'kolyaski-i-avtokresla': 'deti',
        'konstruktory-lego': 'deti',
        
        // Dom раздел
        'bytovaya-himiyapoint-hoztovary': 'dom',
        'domashnij-tekstil': 'dom',
        'interer': 'dom',
        'internet-i-televidenie': 'dom',
        'mebel': 'dom',
        'novogodnie-tovary': 'dom',
        'osveschenie-electrica': 'dom',
        'otopleniepoint-vodonagrevateli': 'dom',
        'parfyumeriya': 'dom',
        'posuda': 'dom',
        'produkty-napitki-alkogol': 'dom',
        'sumki-i-aksessuary': 'dom',
        'tovary-dlya-krasoty-i-personalnogo-uhoda': 'dom',
        'tovary-dlya-shkoly': 'dom',
        'tovary-medicinskogo-naznacheniya': 'dom',
        'uhod-i-reabilitaciya': 'dom',
        'uhod-za-telom': 'dom',
        'umnyj--dom': 'dom',
        
        // Fashion раздел
        'dlya-sporta': 'fashion',
        'sumki-i-aksessuary': 'fashion',
        
        // Krasota раздел
        'bytovye-medicinskie-pribory': 'krasota',
        'kontaktnye-linzypoint-ochki': 'krasota',
        'kislorodnye-koncentratory': 'krasota',
        'parfyumeriya': 'krasota',
        'personalnyi-dogliad': 'krasota',
        'rastvorypoint-kaplipoint-aksessuary-dlya-linz': 'krasota',
        'tovary-dlya-krasoty-i-personalnogo-uhoda': 'krasota',
        'tovary-medicinskogo-naznacheniya': 'krasota',
        'uhod-i-reabilitaciya': 'krasota',
        'uhod-za-telom': 'krasota',
        
        // Mobile раздел
        'aksessuary-dlya-zaryadki': 'mobile',
        'chokhly-ta-zakhysni-plivky': 'mobile',
        'dopolnitelnoe-oborudovanie-i-aksessuary': 'mobile',
        'zaryadka-i-sinhronizaciya': 'mobile',
        
        // Sport раздел
        'dlya-sporta': 'sport',
        
        // Tools раздел
        'kalibratory': 'tools',
        
        // Zootovary раздел
        'zernodrobilki': 'zootovary'
    };
    
    return categoryMapping[cleanFragment] || 'dom'; // По умолчанию 'dom'
}

// Функция для преобразования фрагментов в полные ссылки
function convertFragmentsToFullLinks(fragments) {
    const baseUrl = 'https://hotline.ua/ua/';
    const fullLinks = [];
    
    fragments.forEach(fragment => {
        if (fragment.trim()) {
            const category = determineCategory(fragment);
            const cleanFragment = fragment.replace(/^\//, '');
            const fullLink = baseUrl + category + '/' + cleanFragment;
            fullLinks.push(fullLink);
        }
    });
    
    return fullLinks;
}

// Основная функция
function main() {
    try {
        // Читаем файл с фрагментами
        const fragmentsPath = path.join(__dirname, 'categories.txt');
        const fragmentsContent = fs.readFileSync(fragmentsPath, 'utf8');
        
        // Разбиваем на строки и убираем пустые
        const fragments = fragmentsContent.split('\n').filter(line => line.trim());
        
        // Преобразуем в полные ссылки
        const fullLinks = convertFragmentsToFullLinks(fragments);
        
        // Сохраняем результат в тот же файл
        const outputContent = fullLinks.join('\n');
        fs.writeFileSync(fragmentsPath, outputContent, 'utf8');
        
        console.log(`Преобразовано ${fullLinks.length} ссылок`);
        console.log(`Результат сохранен в файл: ${fragmentsPath}`);
        
        // Показываем первые несколько примеров
        console.log('\nПримеры преобразованных ссылок:');
        fullLinks.slice(0, 10).forEach((link, index) => {
            console.log(`${index + 1}. ${link}`);
        });
        
    } catch (error) {
        console.error('Ошибка:', error.message);
    }
}

// Запускаем скрипт
if (require.main === module) {
    main();
}

module.exports = {
    determineCategory,
    convertFragmentsToFullLinks
}; 