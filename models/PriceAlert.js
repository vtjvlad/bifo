const mongoose = require('mongoose');

const priceAlertSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    targetPrice: {
        type: Number,
        required: true
    },
    condition: {
        type: String,
        enum: ['below', 'above', 'change'],
        default: 'below'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastTriggered: {
        type: Date,
        default: null
    },
    notificationMethod: {
        type: String,
        enum: ['email', 'push', 'both'],
        default: 'email'
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        default: null // null означает все магазины
    }
}, {
    timestamps: true
});

// Индексы для быстрого поиска
priceAlertSchema.index({ userId: 1, productId: 1 });
priceAlertSchema.index({ isActive: 1 });
priceAlertSchema.index({ targetPrice: 1 });

module.exports = mongoose.model('PriceAlert', priceAlertSchema); 