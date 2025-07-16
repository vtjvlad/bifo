const mongoose = require('mongoose');

const catalogSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
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
        enum: [0, 1, 2] // 0 - main catalog, 1 - group, 2 - category
    },
    parent: {
        type: String, // slug of parent catalog/group
        default: null
    },
    catalogSlug: {
        type: String, // main catalog slug (for categories)
        default: null
    },
    groupSlug: {
        type: String, // group slug (for categories)
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
    },
    // For cross-catalog references
    referenceTo: {
        catalogSlug: String, // original catalog slug
        categorySlug: String // original category slug
    },
    // For duplicate categories (additional search queries)
    searchQueries: [{
        type: String,
        trim: true
    }],
    isGroup: {
        type: Boolean,
        default: false
    },
    isReference: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
catalogSchema.index({ slug: 1 });
catalogSchema.index({ level: 1 });
catalogSchema.index({ parent: 1 });
catalogSchema.index({ catalogSlug: 1 });
catalogSchema.index({ groupSlug: 1 });
catalogSchema.index({ sortOrder: 1 });
catalogSchema.index({ isGroup: 1 });
catalogSchema.index({ isReference: 1 });
// Compound index for unique categories within groups
catalogSchema.index({ slug: 1, groupSlug: 1, catalogSlug: 1 }, { unique: true });

// Virtual for full path
catalogSchema.virtual('fullPath').get(function() {
    if (this.level === 0) {
        return this.slug;
    } else if (this.level === 1) {
        return `${this.parent}/${this.slug}`;
    } else {
        return `${this.catalogSlug}/${this.groupSlug}/${this.slug}`;
    }
});

// Method to get groups in catalog
catalogSchema.methods.getGroups = function() {
    return this.model('Catalog').find({ 
        catalogSlug: this.slug, 
        level: 1, 
        isGroup: true,
        isActive: true 
    }).sort('sortOrder');
};

// Method to get categories in group
catalogSchema.methods.getCategories = function() {
    return this.model('Catalog').find({ 
        groupSlug: this.slug, 
        level: 2,
        isActive: true 
    }).sort('sortOrder');
};

// Method to get parent catalog
catalogSchema.methods.getParent = function() {
    if (this.level === 0) return null;
    if (this.level === 1) {
        return this.model('Catalog').findOne({ slug: this.parent, level: 0 });
    } else {
        return this.model('Catalog').findOne({ slug: this.groupSlug, level: 1 });
    }
};

// Static method to get main catalogs
catalogSchema.statics.getMainCatalogs = function() {
    return this.find({ level: 0, isActive: true }).sort('sortOrder');
};

// Static method to get groups by catalog slug
catalogSchema.statics.getGroupsByCatalog = function(catalogSlug) {
    return this.find({ 
        catalogSlug: catalogSlug, 
        level: 1, 
        isGroup: true,
        isActive: true 
    }).sort('sortOrder');
};

// Static method to get categories by group slug
catalogSchema.statics.getCategoriesByGroup = function(groupSlug) {
    return this.find({ 
        groupSlug: groupSlug, 
        level: 2,
        isActive: true 
    }).sort('sortOrder');
};

// Static method to get catalog tree
catalogSchema.statics.getCatalogTree = function() {
    return this.aggregate([
        { $match: { isActive: true } },
        { $sort: { level: 1, sortOrder: 1 } },
        {
            $group: {
                _id: '$level',
                catalogs: { $push: '$$ROOT' }
            }
        }
    ]);
};

// Static method to get references by catalog
catalogSchema.statics.getReferencesByCatalog = function(catalogSlug) {
    return this.find({ 
        catalogSlug: catalogSlug, 
        isReference: true,
        isActive: true 
    }).sort('sortOrder');
};

module.exports = mongoose.model('Catalog', catalogSchema); 