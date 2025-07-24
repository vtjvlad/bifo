const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    date: { type: String, required: true },
    vendor: { type: Object, required: true },
    section: { type: Object, required: true },
    isPromo: { type: Boolean, default: false },
    toOfficial: { type: Boolean, default: false },
    promoBid: { type: mongoose.Schema.Types.Mixed, default: null },
    lineName: { type: String },
    linePathNew: { type: String },
    imagesCount: { type: Number, default: 0 },
    videosCount: { type: Number, default: 0 },
    techShortSpecifications: [{ type: String }],
    techShortSpecificationsList: [Object],
    /////////////////////////
    /////////////////////////
    productValues: [{
        __typename: { type: String, required: true },
        edges: [{
            __typename: { type: String, required: true },
            node: {
                __typename: { type: String, required: true },
                h1Text: { type: String },
                help: { type: String },
                isHeader: { type: Boolean, required: true },
                title: { type: String, required: true },
                type: { type: String },
                url: { type: String },
                value: { type: String }
            }
        }]
    }],
    /////////////////////////
    /////////////////////////
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
module.exports = mongoose.model('Product', productSchema); 