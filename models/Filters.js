const mongoose = require('mongoose');

/**
 * Схема для значений фильтра
 * Представляет отдельное значение в фильтре (например: "Apple", "Samsung")
 */
const filterValueSchema = new mongoose.Schema({
    _id: { 
        type: String, 
        required: true,
        validate: {
            validator: function(v) {
                return /^[a-zA-Z0-9_]+_value_\d+$/.test(v);
            },
            message: 'ID значения должен иметь формат: filterId_value_index'
        }
    },
    isNoFollow: { type: Boolean, default: false },
    title: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: [200, 'Название значения не может быть длиннее 200 символов']
    },
    alias: { 
        type: String,
        trim: true,
        maxlength: [100, 'Алиас не может быть длиннее 100 символов']
    },
    description: { 
        type: String,
        trim: true,
        maxlength: [500, 'Описание не может быть длиннее 500 символов']
    },
    weight: { 
        type: Number, 
        default: 0,
        min: [0, 'Вес не может быть отрицательным']
    },
    isPublic: { type: Boolean, default: true },
    productsCount: { 
        type: Number, 
        default: 0,
        min: [0, 'Количество товаров не может быть отрицательным']
    },
    totalProductsCount: { 
        type: Number, 
        default: 0,
        min: [0, 'Общее количество товаров не может быть отрицательным']
    },
    popularity: { 
        type: Number, 
        default: 0,
        min: [0, 'Популярность не может быть отрицательной']
    },
    groupId: { 
        type: String,
        trim: true,
        maxlength: [100, 'ID группы не может быть длиннее 100 символов']
    },
    groupTitle: { 
        type: String,
        trim: true,
        maxlength: [200, 'Название группы не может быть длиннее 200 символов']
    },
    __typename: { type: String, default: 'FilterValue' }
}, { _id: false });

/**
 * Схема для групп значений
 * Группирует связанные значения фильтра
 */
const filterValueGroupSchema = new mongoose.Schema({
    _id: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: [100, 'ID группы не может быть длиннее 100 символов']
    },
    title: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: [200, 'Название группы не может быть длиннее 200 символов']
    },
    values: [filterValueSchema],
    __typename: { type: String, default: 'FilterValueGroup' }
}, { _id: false });

/**
 * Основная схема фильтра
 * Представляет фильтр для определенной характеристики товаров
 */
const filterSchema = new mongoose.Schema({
    _id: { 
        type: String, 
        required: true, 
        unique: true,
        validate: {
            validator: function(v) {
                return /^\d+_[a-zA-Z0-9_]+$/.test(v);
            },
            message: 'ID фильтра должен иметь формат: sectionId_title'
        }
    },
    title: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: [100, 'Название фильтра не может быть длиннее 100 символов'],
        index: true
    },
    description: { 
        type: String,
        trim: true,
        maxlength: [500, 'Описание не может быть длиннее 500 символов']
    },
    type: { 
        type: String, 
        required: true,
        enum: {
            values: ['checkbox', 'range', 'select'],
            message: 'Тип должен быть одним из: checkbox, range, select'
        },
        default: 'checkbox',
        index: true
    },
    weight: { 
        type: Number, 
        default: 0,
        min: [0, 'Вес не может быть отрицательным']
    },
    values: {
        type: [filterValueSchema],
        validate: {
            validator: function(v) {
                if (!Array.isArray(v)) return false;
                // Проверяем уникальность названий значений
                const titles = v.map(val => val.title.toLowerCase());
                return titles.length === new Set(titles).size;
            },
            message: 'Названия значений фильтра должны быть уникальными'
        }
    },
    topValues: [filterValueSchema],
    valueGroups: [filterValueGroupSchema],
    popularity: { 
        type: Number, 
        default: 0,
        min: [0, 'Популярность не может быть отрицательной']
    },
    isPublic: { type: Boolean, default: true },
    isWrappable: { type: Boolean, default: false },
    isExcludable: { type: Boolean, default: false },
    useValuesSearch: { type: Boolean, default: false },
    sectionId: { 
        type: Number, 
        required: true,
        min: [1, 'ID секции должен быть положительным числом'],
        index: true
    },
    categoryUrl: { 
        type: String,
        trim: true,
        maxlength: [200, 'URL категории не может быть длиннее 200 символов'],
        index: true
    },
    categoryName: { 
        type: String,
        trim: true,
        maxlength: [200, 'Название категории не может быть длиннее 200 символов']
    },
    __typename: { type: String, default: 'Filter' }
}, {
    timestamps: true, // Добавляет поля createdAt и updatedAt
    collection: 'filters' // Указывает имя коллекции в MongoDB
});

// Составной индекс для быстрого поиска по секции и типу
filterSchema.index({ sectionId: 1, type: 1 });

// Индекс для поиска по секции и публичности
filterSchema.index({ sectionId: 1, isPublic: 1 });

// Текстовый индекс для поиска
filterSchema.index({ 
    title: 'text', 
    description: 'text',
    'values.title': 'text',
    categoryName: 'text'
});

// Индекс по популярности (для сортировки)
filterSchema.index({ popularity: -1 });

/**
 * Виртуальное поле - количество значений
 */
filterSchema.virtual('valuesCount').get(function() {
    return this.values ? this.values.length : 0;
});

/**
 * Виртуальное поле - общее количество товаров
 */
filterSchema.virtual('totalProducts').get(function() {
    if (!this.values) return 0;
    return this.values.reduce((sum, value) => sum + (value.productsCount || 0), 0);
});

/**
 * Статический метод - поиск фильтров по секции
 */
filterSchema.statics.findBySection = function(sectionId, options = {}) {
    const query = { sectionId };
    
    if (options.publicOnly) {
        query.isPublic = true;
    }
    
    if (options.type) {
        query.type = options.type;
    }

    let result = this.find(query);
    
    if (options.sort) {
        result = result.sort(options.sort);
    } else {
        result = result.sort({ weight: -1, popularity: -1, title: 1 });
    }
    
    if (options.limit) {
        result = result.limit(options.limit);
    }
    
    return result;
};

/**
 * Статический метод - поиск по тексту
 */
filterSchema.statics.searchByText = function(searchText, sectionId = null) {
    const query = { $text: { $search: searchText } };
    
    if (sectionId) {
        query.sectionId = sectionId;
    }
    
    return this.find(query, { score: { $meta: 'textScore' } })
               .sort({ score: { $meta: 'textScore' } });
};

/**
 * Метод экземпляра - добавление значения
 */
filterSchema.methods.addValue = function(valueData) {
    const valueId = `${this._id}_value_${this.values.length}`;
    
    const newValue = {
        _id: valueId,
        title: valueData.title,
        alias: valueData.alias,
        description: valueData.description,
        weight: valueData.weight || 0,
        isPublic: valueData.isPublic !== undefined ? valueData.isPublic : true,
        productsCount: valueData.productsCount || 0,
        totalProductsCount: valueData.totalProductsCount || 0,
        popularity: valueData.popularity || 0,
        groupId: valueData.groupId,
        groupTitle: valueData.groupTitle,
        __typename: 'FilterValue'
    };
    
    this.values.push(newValue);
    return this.save();
};

/**
 * Метод экземпляра - удаление значения
 */
filterSchema.methods.removeValue = function(valueId) {
    this.values = this.values.filter(value => value._id !== valueId);
    return this.save();
};

/**
 * Метод экземпляра - обновление счетчиков товаров
 */
filterSchema.methods.updateProductCounts = function(valueCounts) {
    this.values.forEach(value => {
        if (valueCounts[value.title]) {
            value.productsCount = valueCounts[value.title];
        }
    });
    return this.save();
};

/**
 * Метод экземпляра - получение топ значений
 */
filterSchema.methods.getTopValues = function(limit = 10) {
    return this.values
               .filter(value => value.isPublic)
               .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
               .slice(0, limit);
};

/**
 * Pre-save middleware для автоматического обновления topValues
 */
filterSchema.pre('save', function(next) {
    if (this.isModified('values') || this.isModified('popularity')) {
        this.topValues = this.getTopValues(10);
    }
    next();
});

/**
 * Pre-save middleware для валидации ID
 */
filterSchema.pre('save', function(next) {
    if (this.isNew && this._id) {
        const [sectionIdStr] = this._id.split('_');
        const extractedSectionId = parseInt(sectionIdStr);
        
        if (extractedSectionId !== this.sectionId) {
            return next(new Error('ID фильтра не соответствует sectionId'));
        }
    }
    next();
});

module.exports = mongoose.model('Filter', filterSchema); 