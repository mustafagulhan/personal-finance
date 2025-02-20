const mongoose = require('mongoose');

const vaultSchema = new mongoose.Schema({
  userId: {  // Şimdilik userId olarak bırakalım
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  balance: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Vault', vaultSchema); 