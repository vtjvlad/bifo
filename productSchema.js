const mongoose = require('mongoose');

// Схема для изображений
const imageLinkSchema = new mongoose.Schema({
  thumb: { type: String, required: true },
  basic: { type: String, required: true },
  small: { type: String, required: true },
  big: { type: String, required: true }
});

// Схема для технических характеристик
const techSpecificationSchema = new mongoose.Schema({
  key: { type: String },
  value: { type: String, required: true },
  isNoMargin: { type: Boolean, default: false }
});

// Схема для вариантов цветов товара
const colorProductSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  imageId: { type: Number },
  productPath: { type: String },
  sectionId: { type: Number },
  colorId: { type: Number },
  alias: { type: String },
  colorName: { type: String },
  sizeId: { type: Number },
  sizeName: { type: String },
  sizeChart: { type: String },
  pathImg: { type: String },
  pathImgSmall: { type: String },
  pathImgBig: { type: String },
  path: { type: String }
});

// Схема для вендора
const vendorSchema = new mongoose.Schema({
  title: { type: String, required: true },
  __typename: { type: String, default: 'Vendor' }
});

// Схема для секции/категории
const sectionSchema = new mongoose.Schema({
  _id: { type: Number, required: true },
  productCategoryName: { type: String, required: true },
  __typename: { type: String, default: 'Section' }
});

// Основная схема товара
const productSchema = new mongoose.Schema({
  _id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  date: { type: String, required: true },
  vendor: { type: vendorSchema, required: true },
  section: { type: sectionSchema, required: true },
  isPromo: { type: Boolean, default: false },
  toOfficial: { type: Boolean, default: false },
  promoBid: { type: mongoose.Schema.Types.Mixed, default: null },
  lineName: { type: String },
  linePathNew: { type: String },
  imagesCount: { type: Number, default: 0 },
  videosCount: { type: Number, default: 0 },
  techShortSpecifications: [{ type: String }],
  techShortSpecificationsList: [techSpecificationSchema],
  reviewsCount: { type: Number, default: 0 },
  questionsCount: { type: Number, default: 0 },
  url: { type: String, required: true },
  imageLinks: [imageLinkSchema],
  minPrice: { type: Number, required: true },
  maxPrice: { type: Number, required: true },
  salesCount: { type: Number, default: 0 },
  isNew: { type: Number, default: 0 },
  colorsProduct: [colorProductSchema],
  offerCount: { type: Number, default: 0 },
  singleOffer: { type: mongoose.Schema.Types.Mixed, default: null },
  madeInUkraine: { type: Boolean, default: false },
  userSubscribed: { type: Boolean, default: false },
  __typename: { type: String, default: 'Product' }
}, {
  timestamps: true, // Добавляет поля createdAt и updatedAt
  collection: 'products' // Указывает имя коллекции в MongoDB
});

// Индексы для оптимизации запросов
productSchema.index({ _id: 1 });
productSchema.index({ title: 'text' }); // Текстовый индекс для поиска по названию
productSchema.index({ 'vendor.title': 1 });
productSchema.index({ 'section._id': 1 });
productSchema.index({ minPrice: 1, maxPrice: 1 });
productSchema.index({ isPromo: 1 });
productSchema.index({ isNew: 1 });
productSchema.index({ date: 1 });

// Виртуальные поля
productSchema.virtual('priceRange').get(function() {
  return {
    min: this.minPrice,
    max: this.maxPrice
  };
});

productSchema.virtual('hasColors').get(function() {
  return this.colorsProduct && this.colorsProduct.length > 0;
});

// Методы экземпляра
productSchema.methods.getMainImage = function() {
  return this.imageLinks && this.imageLinks.length > 0 ? this.imageLinks[0] : null;
};

productSchema.methods.getAveragePrice = function() {
  return Math.round((this.minPrice + this.maxPrice) / 2);
};

// Статические методы
productSchema.statics.findByVendor = function(vendorName) {
  return this.find({ 'vendor.title': vendorName });
};

productSchema.statics.findByPriceRange = function(minPrice, maxPrice) {
  return this.find({
    minPrice: { $gte: minPrice },
    maxPrice: { $lte: maxPrice }
  });
};

productSchema.statics.findPromoProducts = function() {
  return this.find({ isPromo: true });
};

// Middleware для валидации
productSchema.pre('save', function(next) {
  // Проверяем, что minPrice не больше maxPrice
  if (this.minPrice > this.maxPrice) {
    return next(new Error('Минимальная цена не может быть больше максимальной'));
  }
  
  // Проверяем, что дата в правильном формате
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(this.date)) {
    return next(new Error('Неверный формат даты. Используйте YYYY-MM-DD'));
  }
  
  next();
});

// Настройка для JSON сериализации
productSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

// Создание и экспорт модели
const Product = mongoose.model('Product', productSchema);

module.exports = Product; 