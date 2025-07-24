const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    hlSectionId: { type: Number, required: true },
    guide: { 
      title: { type: String },
      url: { type: String },
    },
    title: { type: String, required: true },
    date: { type: String, required: true },
    vendor: { 
      title: { type: String },
      path: { type: String },
    },
    section: { 
      productCategoryName: { type: String },
      _id: { type: Number },
      subCategory: { type: String },
      category: { type: String },
      path: { type: String },
      isAdult: { type: Boolean, default: false },
    },
    isPromo: { type: Boolean, default: false },
    toOfficial: { type: Boolean, default: false },
    promoBid: { type: mongoose.Schema.Types.Mixed, default: null },
    lineName: { type: String },
    linePathNew: { type: String },
    imagesCount: { type: Number, default: 0 },
    videosCount: { type: Number, default: 0 },
    techShortSpecifications: [{ type: String }],
    techShortSpecificationsList: [{
      key: { type: String },
      value: { type: String },
      isNoMargin: { type: Boolean, default: false },
    }],
    sizesProduct: [Object],
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
    fullDescription: { type: String },
    /////////////////////////
    reviewsCount: { type: Number, default: 0 },
    questionsCount: { type: Number, default: 0 },
    url: { type: String, required: true },
    imageLinks: [{
      thumb: { type: String },
      basic: { type: String },
      small: { type: String },
      big: { type: String },
    }],
    videos: [{
      __typename: { type: String },
      edges: [{
        node: {
          __typename: { type: String },
          createdAt: { type: String },
          description: { type: String },
          hash: { type: String },
          isConfirmed: { type: Boolean },
        }
      }]
    }],
    videoInstagramHash: { type: String },
    minPrice: { type: Number, required: true },
    maxPrice: { type: Number, required: true },
    lastHistoryCurrency: { type: String },
    lastHistoryPrice: { type: Number },
    currentPrice: { type: Number, required: true },
    initPrice: { type: Number, required: true },
    salesCount: { type: Number, default: 0 },
    isNew: { type: Number, default: 0 },
    colorsProduct: [{
      id: { type: Number },
      title: { type: String },
      imageId: { type: Number },
      productPath: { type: String },
      sectionId: { type: Number },
      colorsId: { type: Number },
      alias: { type: String },
      colorName: { type: String },
      sizeId: { type: Number },
      sizeName: { type: String },
      sizeChart: { type: String },
      pathImg: { type: String },
      pathImgBig: { type: String },
      pathImgSmall: { type: String },
    }],
    /////////////////////////
    crossSelling: [{
      title: { type: String },
      image: { type: String },
      path: { type: String },
    }],
    /////////////////////////
    similarProducts: {
      products: [{
      id: { type: Number },
      title: { type: String },
      path: { type: String },
      image: { type: String },
      minPrice: { type: Number },
      quantity: { type: Number },
      vendor: { type: String },
      vendorId: { type: Number },
      sectionId: { type: Number },
      popularity: { type: Number },
      isNew: { type: Boolean },
      }],
      filters: [{
        filterValueId: { type: Number },
        filterValueTitle: { type: String },
        filterValueTitleUk: { type: String },
        filterTitle: { type: String },
        filterTitleUk: { type: String },
      }],
      priceRange: {
        from: { type: Number },
        to: { type: Number },
      },
    },
    /////////////////////////
    newProducts: [{
      id: { type: Number },
      title: { type: String },
      path: { type: String },
      image: { type: String },
      minPrice: { type: Number },
      quantity: { type: Number },
      vendor: { type: String },
      vendorId: { type: Number },
      isNew: { type: Boolean },
    }],
    /////////////////////////
    offerCount: { type: Number, default: 0 },
    // singleOffer: { type: mongoose.Schema.Types.Mixed, default: null },
    // offers: [Object],
    offers: [Number],
    madeInUkraine: { type: Boolean, default: false },
    userSubscribed: { type: Boolean, default: false },
    promoRelinkList: [Object],
    __typename: { type: String, default: 'Product' }
  }, {
    timestamps: true, // Добавляет поля createdAt и updatedAt
    collection: 'products' // Указывает имя коллекции в MongoDB
  });
module.exports = mongoose.model('Product', productSchema); 