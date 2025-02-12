const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MonthlyIncome = require('../models/MonthlyIncome');

// Aylık gelirleri getir
router.get('/', auth, async (req, res) => {
  try {
    const { month } = req.query;
    const startDate = new Date(month);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const incomes = await MonthlyIncome.find({
      userId: req.user.id,
      month: {
        $gte: startDate,
        $lt: endDate
      }
    }).sort({ month: -1 });

    res.json(incomes);
  } catch (error) {
    res.status(500).json({ message: 'Aylık gelirler alınamadı' });
  }
});

// Yeni aylık gelir ekle
router.post('/', auth, async (req, res) => {
  try {
    const income = new MonthlyIncome({
      ...req.body,
      userId: req.user.id
    });
    await income.save();
    res.status(201).json(income);
  } catch (error) {
    res.status(500).json({ message: 'Aylık gelir eklenemedi' });
  }
});

// Aylık gelir güncelle
router.put('/:id', auth, async (req, res) => {
  try {
    const income = await MonthlyIncome.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    res.json(income);
  } catch (error) {
    res.status(500).json({ message: 'Aylık gelir güncellenemedi' });
  }
});

module.exports = router; 