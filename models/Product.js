const mongoose = require('mongoose');

// Схема для вендора
const vendorSchema = new mongoose.Schema({
    title: { type: String, required: true },
    __typename: { type: String, default: 'Vendor' }
});

// Схема для секции/категории
const sectionSchema = new mongoose.Schema({
    _id: { type: Number, required: true },
    productCategoryName: { type: String, required: true },
    category: { type: String }, // Например: "bt-elektrochajniki" или "bt-aksessuary-dlya-vytyazhek"
    subCategory: { type: String }, // Подкатегория товара
    __typename: { type: String, default: 'Section' }
});

const productSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
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
    techShortSpecificationsList: [Object],
    reviewsCount: { type: Number, default: 0 },
    questionsCount: { type: Number, default: 0 },
    url: { type: String, required: true },
    imageLinks: [Object],
    minPrice: { type: Number, required: true },
    maxPrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    initPrice: { type: Number, required: true },
    salesCount: { type: Number, default: 0 },
    isNew: { type: Number, default: 0 },
    colorsProduct: [Object],
    offerCount: { type: Number, default: 0 },
    // singleOffer: { type: mongoose.Schema.Types.Mixed, default: null },
    offers: [Object],
    madeInUkraine: { type: Boolean, default: false },
    userSubscribed: { type: Boolean, default: false },
    __typename: { type: String, default: 'Product' }
  }, {
    timestamps: true, // Добавляет поля createdAt и updatedAt
    collection: 'products' // Указывает имя коллекции в MongoDB
  });

// Виртуальные поля для удобного доступа к категориям
productSchema.virtual('catalogName').get(function() {
    if (!this.section.category) return null;
    return this.section.category.split('-')[0]; // Первая часть до дефиса
});

productSchema.virtual('categoryName').get(function() {
    if (!this.section.category) return null;
    const parts = this.section.category.split('-');
    return parts.slice(1).join('-'); // Все части после первого дефиса
});

// Индексы для оптимизации запросов
productSchema.index({ id: 1 });
productSchema.index({ title: 'text' });
productSchema.index({ 'vendor.title': 1 });
productSchema.index({ 'section._id': 1 });
productSchema.index({ 'section.category': 1 });
productSchema.index({ 'section.subCategory': 1 });
productSchema.index({ minPrice: 1, maxPrice: 1 });
productSchema.index({ isPromo: 1 });
productSchema.index({ isNew: 1 });
productSchema.index({ date: 1 });

// Настройка для JSON сериализации
productSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Product', productSchema); 