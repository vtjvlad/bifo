const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        },
        total: {
            type: Number,
            required: true
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending'
    },
    subtotal: {
        type: Number,
        required: true
    },
    tax: {
        type: Number,
        default: 0
    },
    shipping: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },
    shippingAddress: {
        firstName: String,
        lastName: String,
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        phone: String
    },
    billingAddress: {
        firstName: String,
        lastName: String,
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'cash', 'bank_transfer', 'crypto'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    trackingNumber: String,
    notes: String,
    estimatedDelivery: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancelReason: String
}, {
    timestamps: true
});

// Calculate totals before saving
orderSchema.pre('save', function(next) {
    if (this.isModified('items')) {
        this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
        this.total = this.subtotal + this.tax + this.shipping - this.discount;
    }
    next();
});

// Generate order number
orderSchema.pre('save', function(next) {
    if (this.isNew) {
        this.orderNumber = 'BIFO-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema); 