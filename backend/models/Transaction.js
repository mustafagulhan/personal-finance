const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {  // Şimdilik userId olarak bırakalım
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'vault-in', 'vault-out'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  },
  isVaultTransaction: {
    type: Boolean,
    default: false
  },
  attachments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }]
}, {
  timestamps: true
});

// Yeni kategorileri kaydetmek için bir model metodu ekleyelim
transactionSchema.statics.addNewCategory = async function(type, category) {
  const Category = mongoose.model('Category');
  const existingCategory = await Category.findOne({ name: category, type: type });
  
  if (!existingCategory) {
    await Category.create({ name: category, type: type });
  }
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; 