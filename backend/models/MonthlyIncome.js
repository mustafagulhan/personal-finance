const mongoose = require('mongoose');

const monthlyIncomeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  estimatedAmount: {
    type: Number,
    default: 0
  },
  actualAmount: {
    type: Number,
    default: 0
  },
  description: {
    type: String
  },
  month: {
    type: Date,
    required: true,
    default: () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MonthlyIncome', monthlyIncomeSchema); 