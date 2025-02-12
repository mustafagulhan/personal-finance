const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
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
    required: true
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

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; 