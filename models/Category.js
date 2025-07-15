const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 0,
        enum: [0, 1] // 0 - main category, 1 - subcategory
    },
    parent: {
        type: String, // slug of parent category
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    image: {
        type: String
    },
    metaTitle: {
        type: String,
        trim: true
    },
    metaDescription: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ sortOrder: 1 });

// Virtual for full path
categorySchema.virtual('fullPath').get(function() {
    if (this.level === 0) {
        return this.slug;
    }
    return `${this.parent}/${this.slug}`;
});

// Method to get subcategories
categorySchema.methods.getSubcategories = function() {
    return this.model('Category').find({ parent: this.slug, level: 1 });
};

// Method to get parent category
categorySchema.methods.getParent = function() {
    if (this.level === 0) return null;
    return this.model('Category').findOne({ slug: this.parent, level: 0 });
};

// Static method to get main categories
categorySchema.statics.getMainCategories = function() {
    return this.find({ level: 0, isActive: true }).sort('sortOrder');
};

// Static method to get subcategories by parent slug
categorySchema.statics.getSubcategoriesByParent = function(parentSlug) {
    return this.find({ parent: parentSlug, level: 1, isActive: true }).sort('sortOrder');
};

// Static method to get category tree
categorySchema.statics.getCategoryTree = function() {
    return this.aggregate([
        { $match: { isActive: true } },
        { $sort: { level: 1, sortOrder: 1 } },
        {
            $group: {
                _id: '$level',
                categories: { $push: '$$ROOT' }
            }
        }
    ]);
};

module.exports = mongoose.model('Category', categorySchema); 