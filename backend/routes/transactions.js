const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Document = require('../models/Document');
const upload = require('../middleware/upload');

// Tüm işlemleri getir
router.get('/', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id })
      .populate('attachments')
      .sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'İşlemler alınırken bir hata oluştu' });
  }
});

// Tekil işlem getir
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('attachments');
    
    if (!transaction) {
      return res.status(404).json({ message: 'İşlem bulunamadı' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'İşlem alınırken bir hata oluştu' });
  }
});

// İşlem oluştur
router.post('/', auth, async (req, res) => {
  try {
    const { type, amount, category, description = '', date, attachments } = req.body;

    const transaction = new Transaction({
      userId: req.user.id,
      type,
      amount: parseFloat(amount),
      category,
      description,
      date: new Date(date),
      attachments: attachments || []
    });

    await transaction.save();
    
    // Ekleri ile birlikte işlemi getir
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('attachments');

    res.status(201).json(populatedTransaction);
  } catch (error) {
    console.error('Transaction create error:', error);
    res.status(500).json({ 
      message: 'İşlem oluşturulurken bir hata oluştu',
      error: error.message 
    });
  }
});

// İşlem güncelle
router.put('/:id', auth, async (req, res) => {
  try {
    const { type, amount, category, description, date, attachments } = req.body;
    
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { type, amount, category, description, date, attachments },
      { new: true }
    ).populate('attachments');

    if (!transaction) {
      return res.status(404).json({ message: 'İşlem bulunamadı' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'İşlem güncellenirken bir hata oluştu' });
  }
});

// İşlem sil
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'İşlem bulunamadı' });
    }
    
    res.json({ message: 'İşlem başarıyla silindi' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'İşlem silinirken hata oluştu' });
  }
});

module.exports = router; 