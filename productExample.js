const mongoose = require('mongoose');
const Product = require('./productSchema');

// Пример подключения к MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/your_database_name', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Подключение к MongoDB успешно');
  } catch (error) {
    console.error('Ошибка подключения к MongoDB:', error);
  }
}

// Пример создания нового товара
async function createProduct() {
  try {
    const newProduct = new Product({
      _id: 25775723,
      title: "MacBook Pro 14 M3 Pro",
      date: "2024-09-27",
      vendor: {
        title: "Apple",
        __typename: "Vendor"
      },
      section: {
        _id: 12,
        productCategoryName: "Ноутбуки",
        __typename: "Section"
      },
      isPromo: false,
      toOfficial: false,
      promoBid: null,
      lineName: "MacBook Pro 14",
      linePathNew: "/computer/noutbuki-netbuki/macbook-pro-14/",
      imagesCount: 2,
      videosCount: 1,
      techShortSpecifications: [
        "Ноутбук",
        " Дисплей: 14\"",
        " Liquid Retina XDR",
        "3024x1964",
        " 120 Гц",
        " Процесор: Apple M3 Pro",
        " ОЗП: 18 ГБ",
        " SSD: 512 ГБ",
        " ОС: macOS Sonoma",
        " Вага: 1,61 кг"
      ],
      techShortSpecificationsList: [
        {
          value: "Ноутбук",
          isNoMargin: false
        },
        {
          key: "Дисплей",
          value: "14\"",
          isNoMargin: true
        },
        {
          value: "Liquid Retina XDR",
          isNoMargin: true
        },
        {
          value: "3024x1964",
          isNoMargin: true
        },
        {
          value: "120 Гц",
          isNoMargin: false
        },
        {
          key: "Процесор",
          value: "Apple M3 Pro",
          isNoMargin: false
        },
        {
          key: "ОЗП",
          value: "18 ГБ",
          isNoMargin: false
        },
        {
          key: "SSD",
          value: "512 ГБ",
          isNoMargin: false
        },
        {
          key: "ОС",
          value: "macOS Sonoma",
          isNoMargin: false
        },
        {
          key: "Вага",
          value: "1,61 кг",
          isNoMargin: false
        }
      ],
      reviewsCount: 0,
      questionsCount: 0,
      url: "/computer-noutbuki-netbuki/apple-macbook-pro-14-m3-pro/",
      imageLinks: [
        {
          thumb: "/img/tx/520/5201234560.jpg",
          basic: "/img/tx/520/5201234561.jpg",
          small: "/img/tx/520/520123456_s265.jpg",
          big: "/img/tx/520/5201234565.jpg"
        },
        {
          thumb: "/img/tx/520/5201234570.jpg",
          basic: "/img/tx/520/5201234571.jpg",
          small: "/img/tx/520/520123457_s265.jpg",
          big: "/img/tx/520/5201234575.jpg"
        }
      ],
      minPrice: 85000,
      maxPrice: 95000,
      salesCount: 0,
      isNew: 1,
      colorsProduct: [],
      offerCount: 15,
      singleOffer: null,
      madeInUkraine: false,
      userSubscribed: false,
      __typename: "Product"
    });

    const savedProduct = await newProduct.save();
    console.log('Товар успешно создан:', savedProduct.title);
    return savedProduct;
  } catch (error) {
    console.error('Ошибка создания товара:', error.message);
  }
}

// Пример поиска товаров
async function findProducts() {
  try {
    // Поиск всех товаров Apple
    const appleProducts = await Product.findByVendor('Apple');
    console.log('Товары Apple:', appleProducts.length);

    // Поиск товаров в диапазоне цен
    const affordableProducts = await Product.findByPriceRange(40000, 60000);
    console.log('Товары в диапазоне 40k-60k:', affordableProducts.length);

    // Поиск промо товаров
    const promoProducts = await Product.findPromoProducts();
    console.log('Промо товары:', promoProducts.length);

    // Поиск по тексту в названии
    const laptopProducts = await Product.find({ $text: { $search: "ноутбук" } });
    console.log('Ноутбуки:', laptopProducts.length);

    // Поиск новых товаров
    const newProducts = await Product.find({ isNew: 1 });
    console.log('Новые товары:', newProducts.length);

  } catch (error) {
    console.error('Ошибка поиска товаров:', error.message);
  }
}

// Пример обновления товара
async function updateProduct(productId) {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        $inc: { salesCount: 1 },
        $set: { isPromo: true }
      },
      { new: true }
    );
    console.log('Товар обновлен:', updatedProduct.title);
    return updatedProduct;
  } catch (error) {
    console.error('Ошибка обновления товара:', error.message);
  }
}

// Пример удаления товара
async function deleteProduct(productId) {
  try {
    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (deletedProduct) {
      console.log('Товар удален:', deletedProduct.title);
    } else {
      console.log('Товар не найден');
    }
  } catch (error) {
    console.error('Ошибка удаления товара:', error.message);
  }
}

// Пример использования виртуальных полей и методов
async function demonstrateFeatures() {
  try {
    const product = await Product.findOne({ title: /MacBook/ });
    if (product) {
      console.log('Название:', product.title);
      console.log('Диапазон цен:', product.priceRange);
      console.log('Есть варианты цветов:', product.hasColors);
      console.log('Главное изображение:', product.getMainImage());
      console.log('Средняя цена:', product.getAveragePrice());
    }
  } catch (error) {
    console.error('Ошибка демонстрации функций:', error.message);
  }
}

// Пример агрегации
async function getProductStats() {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: '$vendor.title',
          totalProducts: { $sum: 1 },
          avgMinPrice: { $avg: '$minPrice' },
          avgMaxPrice: { $avg: '$maxPrice' },
          totalOffers: { $sum: '$offerCount' }
        }
      },
      {
        $sort: { totalProducts: -1 }
      }
    ]);
    
    console.log('Статистика по вендорам:', stats);
  } catch (error) {
    console.error('Ошибка агрегации:', error.message);
  }
}

// Основная функция для демонстрации
async function main() {
  await connectToDatabase();
  
  // Создание товара
  const newProduct = await createProduct();
  
  // Поиск товаров
  await findProducts();
  
  // Демонстрация функций
  await demonstrateFeatures();
  
  // Статистика
  await getProductStats();
  
  // Обновление товара (если был создан)
  if (newProduct) {
    await updateProduct(newProduct._id);
  }
  
  // Закрытие соединения
  await mongoose.connection.close();
  console.log('Соединение с MongoDB закрыто');
}

// Экспорт функций для использования в других файлах
module.exports = {
  connectToDatabase,
  createProduct,
  findProducts,
  updateProduct,
  deleteProduct,
  demonstrateFeatures,
  getProductStats
};

// Запуск примера, если файл выполняется напрямую
if (require.main === module) {
  main().catch(console.error);
} 