const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        trim: true
    },
    specs: {
        type: Map,
        of: String
    },
    sku: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    },
    offers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    searchKeywords: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Индексы для быстрого поиска
productSchema.index({ name: 'text', description: 'text', searchKeywords: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ isActive: 1 });

// Виртуальное поле для количества предложений
productSchema.virtual('offersCount').get(function() {
    return this.offers.length;
});

module.exports = mongoose.model('Product', productSchema); 