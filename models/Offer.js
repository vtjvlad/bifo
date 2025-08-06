const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'UAH'
    },
    url: {
        type: String,
        trim: true
    },
    available: {
        type: Boolean,
        default: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Индексы для быстрого поиска
offerSchema.index({ productId: 1, storeId: 1 });
offerSchema.index({ price: 1 });
offerSchema.index({ available: 1 });
offerSchema.index({ lastUpdated: 1 });

// Составной индекс для уникальности предложения
offerSchema.index({ productId: 1, storeId: 1 }, { unique: true });

module.exports = mongoose.model('Offer', offerSchema); 