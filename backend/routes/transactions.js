const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');

// Tüm işlemleri getir
router.get('/', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id })
      .populate({
        path: 'attachments',
        select: '_id title filePath fileType fileSize'
      })
      .sort({ date: -1 });
    
    console.log('Transactions with attachments:', transactions); // Debug için
    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'İşlemler alınırken bir hata oluştu' });
  }
});

// Yeni işlem ekle
router.post('/', auth, async (req, res) => {
  try {
    const { type, amount, category, description, date, attachments } = req.body;

    const newTransaction = new Transaction({
      userId: req.user.id,
      type,
      amount,
      category,
      description,
      date: date || new Date(),
      attachments: attachments || []
    });

    const savedTransaction = await newTransaction.save();
    
    // İşlem detaylarını attachments ile birlikte getir
    const populatedTransaction = await Transaction.findById(savedTransaction._id)
      .populate({
        path: 'attachments',
        select: '_id title filePath fileType fileSize'
      });

    res.status(201).json(populatedTransaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'İşlem oluşturulurken bir hata oluştu' });
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
    ).populate({
      path: 'attachments',
      select: '_id title filePath fileType fileSize'
    });

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