const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true 
  },
  group: { 
    type: String, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  order: { 
    type: Number, 
    default: 0 
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'categories'
});

// Создаем индексы для быстрого поиска
categorySchema.index({ group: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ name: 'text' });

module.exports = mongoose.model('Category', categorySchema); 