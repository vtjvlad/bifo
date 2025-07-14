const fs = require('fs');

// Читаем оба файла
const rawData1 = fs.readFileSync('./hotline-analnye-shariki.json', 'utf8');

const products = JSON.parse(rawData1);

function destructureNestedObjects(products) {
    const destructuredProducts = products.map(product => {
        // Деструктурируем вложенные объекты
        const {
    _id,
    title,
    date,
    vendor = {},
    section = {},
    isPromo,
    toOfficial,
    lineName,
    linePathNew,
    imagesCount,
    videosCount,
    techShortSpecifications,
    techShortSpecificationsList,
    reviewsCount,
    questionsCount,
    url,
    imageLinks = {},
    minPrice,
    maxPrice,
    salesCount,
    isNew,
    colorsProduct,
    offerCount,
    offers = {},
    madeInUkraine,
    userSubscribed
    } = product;

    const { title: vendorTitle } = vendor;
    const { productCategoryName, _id: sectionId } = section;
    const aurl = url.split('/')[1];
    const subCategory = linePathNew?.split('/')[1] || aurl.split('-')[0];
    const category = url.split('/')[1];
    // Структура offers: { totalCount: Number, edges: [ { node: { id, price }, __typename } ] }
    let fourthPrice = null;
    let fifthPrice = null;

    if (offers && Array.isArray(offers.edges)) {
        totalCount = offers.totalCount ?? null;
        // Собираем массив node-объектов
        const nodes = offers.edges.map(e => e.node).filter(Boolean);
        // Сортируем по цене (price)
        nodes.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
        // Получаем цены на 4-й и 5-й позиции (индексация с 0)
        fourthPrice = nodes[3]?.price ?? null;
        fifthPrice = nodes[4]?.price ?? null;
    }
    const imageLinksArray = imageLinks.map(image => {
        if (image) {
            const { thumb, basic, small, big } = image;
            return {
            thumb: `https://hotline.ua${thumb}`,
            basic: `https://hotline.ua${basic}`,
            small: `https://hotline.ua${small}`,
            big: `https://hotline.ua${big}` };
        }
    });

        return {
            id: _id,
            title,
            date,
            vendor: { title: vendorTitle },
            section: { productCategoryName, _id: sectionId, subCategory, category },
            isPromo,
            toOfficial,
            lineName,
            linePathNew,
            imagesCount,
            videosCount,
            techShortSpecifications,
            techShortSpecificationsList,
            reviewsCount,
            questionsCount,
            url,
            imageLinks: imageLinksArray,
            minPrice,
            maxPrice,
            currentPrice: fourthPrice ?? Math.round((minPrice + maxPrice) / 2),
            initPrice: fifthPrice ?? Math.round((minPrice + maxPrice) / 2),
            // currentPrice: Math.round((minPrice + maxPrice) / 2),
            // initPrice: Math.round((minPrice + maxPrice) / 2),
            salesCount,
            isNew,
            colorsProduct,
            offerCount,
            offers,
            madeInUkraine,
            userSubscribed
        };
    });

    return destructuredProducts;
}

// Выполняем деструктуризацию с учетом второго файла
const processedProducts = destructureNestedObjects(products);

// Сохраняем результат в новый файл
fs.writeFileSync('./test_struct.json', JSON.stringify(processedProducts, null, 2));
console.log('Обработанные данные сохранены в test_struct.json');
