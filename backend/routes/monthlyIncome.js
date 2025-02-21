const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MonthlyIncome = require('../models/MonthlyIncome');

// Belirli bir ayın gelirlerini getir
router.get('/', auth, async (req, res) => {
  try {
    const { month = new Date().toISOString() } = req.query;
    const startDate = new Date(month);
    startDate.setDate(1); // Ayın başı
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1); // Sonraki ayın başı

    const monthlyIncomes = await MonthlyIncome.find({
      userId: req.user.id,
      month: {
        $gte: startDate,
        $lt: endDate
      }
    }).sort({ createdAt: -1 });

    // Toplam tutarları hesapla
    const totals = monthlyIncomes.reduce((acc, income) => ({
      estimatedTotal: acc.estimatedTotal + (income.estimatedAmount || 0),
      actualTotal: acc.actualTotal + (income.actualAmount || 0)
    }), { estimatedTotal: 0, actualTotal: 0 });

    res.json({
      incomes: monthlyIncomes,
      summary: totals
    });
  } catch (error) {
    console.error('Get monthly incomes error:', error);
    res.status(500).json({ message: 'Aylık gelirler alınırken bir hata oluştu' });
  }
});

// Yeni aylık gelir ekle
router.post('/', auth, async (req, res) => {
  try {
    const { title, estimatedAmount, actualAmount, description, month } = req.body;

    const monthlyIncome = new MonthlyIncome({
      userId: req.user.id,
      title,
      estimatedAmount: estimatedAmount || 0,
      actualAmount: actualAmount || 0,
      description,
      month: month ? new Date(month) : undefined
    });

    const savedIncome = await monthlyIncome.save();
    res.status(201).json(savedIncome);
  } catch (error) {
    console.error('Create monthly income error:', error);
    res.status(500).json({ message: 'Aylık gelir eklenirken bir hata oluştu' });
  }
});

// Aylık geliri güncelle
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, estimatedAmount, actualAmount, description, month } = req.body;

    const monthlyIncome = await MonthlyIncome.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        title,
        estimatedAmount: estimatedAmount || 0,
        actualAmount: actualAmount || 0,
        description,
        month: month ? new Date(month) : undefined
      },
      { new: true }
    );

    if (!monthlyIncome) {
      return res.status(404).json({ message: 'Aylık gelir bulunamadı' });
    }

    res.json(monthlyIncome);
  } catch (error) {
    console.error('Update monthly income error:', error);
    res.status(500).json({ message: 'Aylık gelir güncellenirken bir hata oluştu' });
  }
});

// Aylık geliri sil
router.delete('/:id', auth, async (req, res) => {
  try {
    const monthlyIncome = await MonthlyIncome.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!monthlyIncome) {
      return res.status(404).json({ message: 'Aylık gelir bulunamadı' });
    }

    res.json({ message: 'Aylık gelir başarıyla silindi' });
  } catch (error) {
    console.error('Delete monthly income error:', error);
    res.status(500).json({ message: 'Aylık gelir silinirken bir hata oluştu' });
  }
});

module.exports = router; 