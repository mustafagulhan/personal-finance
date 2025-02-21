const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Category } = require('../models/Category');
const Transaction = require('../models/Transaction');
const Document = require('../models/Document');
const upload = require('../middleware/upload');
const mongoose = require('mongoose');

// Tüm bakiyeleri getir (merkezi endpoint)
router.get('/summary', auth, async (req, res) => {
  try {
    const [regularTransactions, vaultTransactions] = await Promise.all([
      // Normal işlemler (kasa hariç)
      Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(req.user.id),
            isVaultTransaction: { $ne: true },
            category: { $ne: 'Kasa' }
          }
        },
        {
          $group: {
            _id: null,
            totalIncome: {
              $sum: {
                $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
              }
            },
            totalExpense: {
              $sum: {
                $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
              }
            }
          }
        }
      ]),
      // Kasa işlemleri
      Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(req.user.id),
            isVaultTransaction: true
          }
        },
        {
          $group: {
            _id: null,
            totalVaultIn: {
              $sum: {
                $cond: [{ $eq: ['$type', 'vault-in'] }, '$amount', 0]
              }
            },
            totalVaultOut: {
              $sum: {
                $cond: [{ $eq: ['$type', 'vault-out'] }, '$amount', 0]
              }
            }
          }
        }
      ])
    ]);

    const regular = regularTransactions[0] || { totalIncome: 0, totalExpense: 0 };
    const vault = vaultTransactions[0] || { totalVaultIn: 0, totalVaultOut: 0 };

    const netBalance = (regular.totalIncome - regular.totalExpense);
    const vaultBalance = (vault.totalVaultIn - vault.totalVaultOut);

    res.json({
      netBalance,
      vaultBalance,
      totalBalance: netBalance + vaultBalance,
      details: {
        income: regular.totalIncome,
        expense: regular.totalExpense,
        vault: {
          in: vault.totalVaultIn,
          out: vault.totalVaultOut
        }
      }
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ message: 'Özet bilgiler alınırken bir hata oluştu' });
  }
});

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

// Son işlemleri getir (Dashboard için)
router.get('/recent', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user.id,
      isVaultTransaction: { $ne: true } // Normal işlemleri getir
    })
    .sort({ date: -1 })
    .limit(5); // Son 5 işlemi getir

    res.json(transactions);
  } catch (error) {
    console.error('Recent transactions fetch error:', error);
    res.status(500).json({ message: 'Son işlemler alınırken bir hata oluştu' });
  }
});

// Kategorileri getir
router.get('/categories/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    
    // Sadece Category modelinden kategorileri al
    const categories = await Category.find({ type }).sort('name');
    const categoryNames = categories.map(cat => cat.name);

    // Diğer kategorisini sona ekle
    const sortedCategories = categoryNames.filter(name => name !== 'Diğer');
    if (categoryNames.includes('Diğer')) {
      sortedCategories.push('Diğer');
    }

    res.json(sortedCategories);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ message: 'Kategoriler alınamadı' });
  }
});

// Tekil işlem getir - EN SONA TAŞIYORUZ
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
router.post('/', auth, (req, res, next) => {
  upload.array('files')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ 
        message: err.message || 'Dosya yükleme hatası'
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { type, amount, category, customCategory, description, date } = req.body;
    
    // Dosyaları kaydet
    const attachments = [];
    if (req.files && req.files.length > 0) {
      console.log('Gelen dosyalar:', req.files);

      for (const file of req.files) {
        try {
          const document = new Document({
            userId: req.user.id,
            title: file.originalname,
            path: file.filename,
            fileType: file.mimetype,
            fileSize: file.size,
            description: `${type === 'income' ? 'Gelir' : 'Gider'} işlemi belgesi: ${description}`
          });
          const savedDoc = await document.save();
          attachments.push(savedDoc._id);
        } catch (err) {
          console.error('Belge kaydetme hatası:', err);
        }
      }
    }

    // Kategori kontrolü
    let finalCategory = category;
    if (category === 'Diğer' && customCategory) {
      finalCategory = customCategory;
      try {
        // Yeni kategoriyi kaydet
        await Category.create({
          name: customCategory,
          type,
          isCustom: true
        });
      } catch (err) {
        // Eğer kategori zaten varsa hata verme
        if (err.code !== 11000) { // duplicate key error değilse tekrar fırlat
          throw err;
        }
      }
    }

    const transaction = new Transaction({
      userId: req.user.id,
      type,
      amount: parseFloat(amount),
      category: finalCategory,
      description,
      date: date || new Date(),
      attachments
    });

    await transaction.save();
    
    // Belgeleri de içeren transaction'ı döndür
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate({
        path: 'attachments',
        select: 'title path fileType fileSize description'
      });

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
router.put('/:id', auth, upload.array('files'), async (req, res) => {
  try {
    const { type, amount, category, customCategory, description, date, existingAttachments } = req.body;

    // Yeni yüklenen dosyaları kaydet
    const attachments = existingAttachments ? 
      (Array.isArray(existingAttachments) ? existingAttachments : [existingAttachments]) : 
      [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const document = new Document({
            userId: req.user.id,
            title: file.originalname,
            path: file.filename,
            fileType: file.mimetype,
            fileSize: file.size,
            description: `${type === 'income' ? 'Gelir' : 'Gider'} işlemi belgesi: ${description}`
          });
          const savedDoc = await document.save();
          attachments.push(savedDoc._id);
        } catch (err) {
          console.error('Belge kaydetme hatası:', err);
        }
      }
    }

    // İşlemi güncelle
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        type,
        amount: parseFloat(amount),
        category: category === 'Diğer' && customCategory ? customCategory : category,
        description,
        date: date || new Date(),
        attachments
      },
      { new: true }
    ).populate('attachments');

    if (!transaction) {
      return res.status(404).json({ message: 'İşlem bulunamadı' });
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