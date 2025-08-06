const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    feedUrl: {
        type: String,
        required: true,
        trim: true
    },
    feedType: {
        type: String,
        enum: ['xml', 'json', 'csv'],
        required: true
    },
    logo: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    feedMapping: {
        // Настраиваемая маппинг-конфигурация для каждого магазина
        productName: String,
        productDescription: String,
        productCategory: String,
        productBrand: String,
        productImage: String,
        productSku: String,
        productSpecs: String,
        offerPrice: String,
        offerCurrency: String,
        offerUrl: String,
        offerAvailability: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastUpdated: {
        type: Date,
        default: null
    },
    updateInterval: {
        type: Number,
        default: 3600000 // 1 час в миллисекундах
    },
    errorLog: [{
        message: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Индексы для быстрого поиска
storeSchema.index({ name: 1 });
storeSchema.index({ isActive: 1 });
storeSchema.index({ lastUpdated: 1 });

module.exports = mongoose.model('Store', storeSchema); 