const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Debt = require('../models/Debt');
const Document = require('../models/Document');
const upload = require('../middleware/upload');

// Tüm borçları getir
router.get('/', auth, async (req, res) => {
  try {
    const debts = await Debt.find({ userId: req.user.id })
      .populate('attachments')
      .sort({ dueDate: 1 });
    
    res.json(debts);
  } catch (error) {
    console.error('Debts fetch error:', error);
    res.status(500).json({ message: 'Borçlar alınırken bir hata oluştu' });
  }
});

// Yeni borç ekle
router.post('/', auth, upload.array('files'), async (req, res) => {
  try {
    const { title, amount, description, dueDate, category } = req.body;
    
    // Dosyaları kaydet
    const attachments = [];
    if (req.files) {
      for (const file of req.files) {
        const document = new Document({
          userId: req.user.id,
          title: file.originalname,
          path: file.path,
          fileType: file.mimetype,
          fileSize: file.size
        });
        await document.save();
        attachments.push(document._id);
      }
    }

    const debt = new Debt({
      userId: req.user.id,
      title,
      amount: parseFloat(amount),
      description,
      dueDate,
      category,
      attachments
    });

    await debt.save();
    res.status(201).json(debt);
  } catch (error) {
    console.error('Debt create error:', error);
    res.status(500).json({ message: 'Borç eklenirken bir hata oluştu' });
  }
});

// Borç güncelle
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, amount, description, dueDate, category } = req.body;

    const debt = await Debt.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        title,
        amount: parseFloat(amount),
        description,
        dueDate,
        category
      },
      { new: true }
    ).populate('attachments');

    if (!debt) {
      return res.status(404).json({ message: 'Borç bulunamadı' });
    }

    res.json(debt);
  } catch (error) {
    console.error('Debt update error:', error);
    res.status(500).json({ message: 'Borç güncellenirken bir hata oluştu' });
  }
});

// Borç öde
router.patch('/:id/pay', auth, async (req, res) => {
  try {
    const debt = await Debt.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        status: 'paid',
        paymentDate: new Date()
      },
      { new: true }
    ).populate('attachments');

    if (!debt) {
      return res.status(404).json({ message: 'Borç bulunamadı' });
    }

    res.json(debt);
  } catch (error) {
    console.error('Debt payment error:', error);
    res.status(500).json({ message: 'Borç ödenirken bir hata oluştu' });
  }
});

// Borç sil
router.delete('/:id', auth, async (req, res) => {
  try {
    const debt = await Debt.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!debt) {
      return res.status(404).json({ message: 'Borç bulunamadı' });
    }

    res.json({ message: 'Borç başarıyla silindi' });
  } catch (error) {
    console.error('Debt delete error:', error);
    res.status(500).json({ message: 'Borç silinirken bir hata oluştu' });
  }
});

module.exports = router; 