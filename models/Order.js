const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderNumber: {
        type: String,
        unique: true,
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
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
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
        enum: ['card', 'cash', 'bank_transfer'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    notes: {
        type: String
    },
    trackingNumber: {
        type: String
    },
    estimatedDelivery: {
        type: Date
    }
}, {
    timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', function(next) {
    if (this.isNew) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.orderNumber = `BIFO${year}${month}${day}${random}`;
    }
    next();
});

// Indexes
orderSchema.index({ user: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Add pagination plugin
const mongoosePaginate = require('mongoose-paginate-v2');
orderSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Order', orderSchema); 