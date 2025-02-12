const mongoose = require('mongoose');

const estimationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  estimated: {
    type: Number,
    required: true
  },
  actual: {
    type: Number,
    default: 0
  },
  month: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

const Estimation = mongoose.model('Estimation', estimationSchema);

module.exports = Estimation; 