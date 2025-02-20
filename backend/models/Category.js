const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  isCustom: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Varsayılan kategorileri oluşturmak için static metod
categorySchema.statics.createDefaultCategories = async function() {
  const defaultCategories = {
    income: ['Maaş', 'Kira Geliri', 'Yatırım Geliri', 'Diğer'],
    expense: ['Market', 'Kira', 'Fatura', 'Ulaşım', 'Sağlık', 'Eğitim', 'Diğer']
  };

  for (const type in defaultCategories) {
    for (const name of defaultCategories[type]) {
      await this.findOneAndUpdate(
        { name, type },
        { name, type, isCustom: false },
        { upsert: true }
      );
    }
  }
};

// Aynı isimde kategori oluşturulmasını engelleyelim
categorySchema.index({ name: 1, type: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);

// Varsayılan kategorileri oluşturan fonksiyon
const seedDefaultCategories = async () => {
  const defaultCategories = {
    expense: [
      'Gıda',
      'Ulaşım',
      'Kira',
      'Faturalar',
      'Alışveriş',
      'Sağlık',
      'Eğitim',
      'Eğlence',
      'Diğer'
    ],
    income: [
      'Maaş',
      'Ek Gelir',
      'Yatırım',
      'Hediye',
      'Diğer'
    ]
  };

  try {
    const count = await Category.countDocuments();
    
    if (count === 0) {
      const categories = [];

      for (const type in defaultCategories) {
        for (const name of defaultCategories[type]) {
          categories.push({
            name,
            type,
            isCustom: false
          });
        }
      }

      await Category.insertMany(categories);
      console.log('Varsayılan kategoriler oluşturuldu');
    }
  } catch (error) {
    console.error('Kategori oluşturma hatası:', error);
  }
};

module.exports = {
  Category,
  seedDefaultCategories
}; 