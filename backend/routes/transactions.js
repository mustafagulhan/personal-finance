const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Category } = require('../models/Category');
const Transaction = require('../models/Transaction');
const Document = require('../models/Document');
const upload = require('../middleware/upload');

// Tüm işlemleri getir
router.get('/', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ 
      userId: req.user.id,
      isVaultTransaction: false 
    })
    .sort({ date: -1, createdAt: -1 })
    .populate('attachments');
    
    res.json(transactions);
  } catch (error) {
    console.error('Transactions fetch error:', error);
    res.status(500).json({ message: 'İşlemler alınamadı' });
  }
});

// Dashboard için son işlemleri getir
router.get('/recent', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .populate('attachments');
    res.json(transactions);
  } catch (error) {
    res.status(500).send('Server Error');
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

// Kategorileri getir
router.get('/categories/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    
    // Varsayılan kategorileri tanımla
    const defaultCategories = {
      income: ['Maaş', 'Ek Gelir', 'Prim', 'Kasa', 'Diğer'],
      expense: ['Kira', 'Fatura', 'Market', 'Yakıt', 'Eğitim', 'Sağlık', 'Kasa', 'Diğer']
    };

    // İşlem türü kontrolü
    if (!defaultCategories[type]) {
      return res.status(400).json({ message: 'Geçersiz işlem türü' });
    }

    // Kullanıcının özel kategorilerini bul
    const userCategories = await Transaction.distinct('category', {
      userId: req.user.id,
      type: type
    });

    // Tüm kategorileri birleştir ve tekrarları kaldır
    const allCategories = Array.from(new Set([
      ...defaultCategories[type],
      ...userCategories
    ]));

    // Kategorileri alfabetik sırala
    const sortedCategories = allCategories.sort((a, b) => {
      if (a === 'Diğer') return 1;
      if (b === 'Diğer') return -1;
      return a.localeCompare(b, 'tr');
    });

    res.json(sortedCategories);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ message: 'Kategoriler alınırken bir hata oluştu' });
  }
});

// İşlem oluştur
router.post('/', auth, async (req, res) => {
  try {
    const { type, amount, category, description, date } = req.body;

    // Tutarı sayıya çevir
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      return res.status(400).json({ message: 'Geçersiz tutar' });
    }

    // Yeni işlem oluştur
    const transaction = new Transaction({
      userId: req.user.id,
      type,
      amount: numericAmount, // Sayı olarak kaydet
      category,
      description,
      date: date || new Date(),
      isVaultTransaction: false
    });

    await transaction.save();

    // Yeni kategoriyi kaydet
    if (category) {
      await Transaction.addNewCategory(type, category);
    }

    res.status(201).json(transaction);
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
    const { type, amount, category, description, date } = req.body;

    // Tutarı sayıya çevir
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      return res.status(400).json({ message: 'Geçersiz tutar' });
    }

    // İşlemi bul ve güncelle
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        type,
        amount: numericAmount,
        category,
        description,
        date: date || new Date()
      },
      { 
        new: true, // Güncellenmiş veriyi dön
        runValidators: true // Validasyonları çalıştır
      }
    ).populate('attachments'); // Ekleri de getir

    if (!transaction) {
      return res.status(404).json({ message: 'İşlem bulunamadı' });
    }

    // Yeni kategoriyi kaydet
    if (category) {
      await Transaction.addNewCategory(type, category);
    }

    res.json(transaction);
  } catch (error) {
    console.error('Transaction update error:', error);
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
    console.error('Transaction delete error:', error);
    res.status(500).json({ message: 'İşlem silinirken bir hata oluştu' });
  }
});

module.exports = router; 