const fs = require('fs');

// Читаем JSON файл
const rawData = fs.readFileSync('test.json', 'utf8');
const products = JSON.parse(rawData);

// Функция для деструктуризации и преобразования продукта
function transformProduct(product) {
  const {
    id,
    title,
    date,
    vendor: { title: vendorTitle },
    section: { productCategoryName, _id: sectionId },
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
    imageLinks,
    minPrice,
    maxPrice,
    salesCount,
    isNew,
    colorsProduct,
    offerCount,
    madeInUkraine,
    userSubscribed
  } = product;

  // Преобразуем технические характеристики в более удобный формат
  const techSpecs = techShortSpecificationsList.reduce((acc, spec) => {
    if (spec.key) {
      acc[spec.key] = spec.value;
    } else {
      acc.general = acc.general ? [...acc.general, spec.value] : [spec.value];
    }
    return acc;
  }, {});

  // Обрабатываем изображения
  const images = imageLinks.map((img, index) => ({
    id: index + 1,
    thumbnail: img.thumb,
    basic: img.basic,
    small: img.small,
    large: img.big
  }));

  // Обрабатываем цвета продукта
  const colors = colorsProduct.map(color => ({
    id: color.id,
    name: color.colorName,
    alias: color.alias,
    image: color.pathImg,
    path: color.path
  }));

  // Создаем преобразованный объект
  return {
    productInfo: {
      id,
      title,
      releaseDate: date,
      vendor: vendorTitle,
      category: {
        id: sectionId,
        name: productCategoryName
      },
      line: {
        name: lineName,
        path: linePathNew
      },
      url
    },
    marketing: {
      isPromo,
      isOfficial: toOfficial,
      isNew: Boolean(isNew),
      madeInUkraine,
      userSubscribed
    },
    media: {
      imagesCount,
      videosCount,
      images,
      colors
    },
    specifications: {
      raw: techShortSpecifications,
      structured: techSpecs
    },
    engagement: {
      reviewsCount,
      questionsCount,
      salesCount
    },
    pricing: {
      minPrice,
      maxPrice,
      offerCount,
      priceRange: maxPrice - minPrice
    }
  };
}

// Преобразуем все продукты
const transformedProducts = products.map(transformProduct);

// Создаем итоговый объект с метаданными
const result = {
  metadata: {
    totalProducts: transformedProducts.length,
    processedAt: new Date().toISOString(),
    sourceFile: 'test.json'
  },
  products: transformedProducts
};

// Сохраняем результат в новый файл
fs.writeFileSync('transformed_products.json', JSON.stringify(result, null, 2));

// Выводим статистику
console.log('Преобразование завершено!');
console.log(`Обработано продуктов: ${result.metadata.totalProducts}`);
console.log('Результат сохранен в файл: transformed_products.json');

// Пример вывода первого продукта в консоль
console.log('\nПример преобразованного продукта:');
console.log(JSON.stringify(transformedProducts[0], null, 2)); 