const mongoose = require('mongoose');

const personnelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  salary: {
    type: Number,
    required: true
  },
  insurancePremium: {
    type: Number,
    required: true
  },
  travelAllowance: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Personnel = mongoose.model('Personnel', personnelSchema);

module.exports = Personnel; 