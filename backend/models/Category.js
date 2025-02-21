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

// Aynı isimde kategori oluşturulmasını engelleyelim
categorySchema.index({ name: 1, type: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);

// Varsayılan kategorileri oluşturan fonksiyon
const seedDefaultCategories = async () => {
  const defaultCategories = {
    expense: [
      'Kira',
      'Fatura',
      'Market',
      'Yakıt',
      'Sağlık',
      'Personel',
      'Sigorta',
      'Bakım',
      'Yemek',
      'Ulaşım',
      'Kırtasiye',
      'Reklam',
      'Vergi',
      'Kasa',
      'Diğer'
    ],
    income: [
      'Maaş',
      'Satış',
      'Komisyon',
      'Kira Geliri',
      'Faiz',
      'Ek Gelir',
      'Kasa',
      'Diğer'
    ]
  };

  try {
    // Önce tüm kategorileri sil
    await Category.deleteMany({});
    console.log('Eski kategoriler silindi');

    // Yeni kategorileri ekle
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
    console.log('Yeni kategoriler oluşturuldu');
  } catch (error) {
    console.error('Kategori oluşturma hatası:', error);
  }
};

module.exports = {
  Category,
  seedDefaultCategories
}; 