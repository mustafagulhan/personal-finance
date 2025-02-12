const mongoose = require('mongoose');

const monthlyIncomeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Date,
    required: true
  },
  estimatedIncome: {
    type: Number,
    required: true
  },
  actualIncome: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const MonthlyIncome = mongoose.model('MonthlyIncome', monthlyIncomeSchema);

module.exports = MonthlyIncome; 