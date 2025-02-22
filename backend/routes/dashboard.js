const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Note = require('../models/Note');
const Vault = require('../models/Vault');

router.get('/', auth, async (req, res) => {
  try {
    // Bu ay için tarih aralığı
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const currentMonthEnd = new Date();
    currentMonthEnd.setHours(23, 59, 59, 999);

    // Geçen ay için tarih aralığı
    const lastMonthStart = new Date(currentMonthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const lastMonthEnd = new Date(currentMonthStart);
    lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);

    // Bu ay ve geçen ay için işlemleri al
    const [currentMonthTransactions, lastMonthTransactions, vault] = await Promise.all([
      Transaction.find({
        userId: req.user.id,
        date: { $gte: currentMonthStart, $lte: currentMonthEnd },
        isVaultTransaction: false // Sadece ana işlemleri al
      }),
      Transaction.find({
        userId: req.user.id,
        date: { $gte: lastMonthStart, $lte: lastMonthEnd },
        isVaultTransaction: false // Sadece ana işlemleri al
      }),
      Vault.findOne({ userId: req.user.id })
    ]);

    // Toplam gelir ve giderleri hesapla
    const calculateTotals = (transactions) => transactions.reduce(
      (acc, curr) => {
        if (curr.type === 'income') acc.income += curr.amount;
        if (curr.type === 'expense') acc.expense += curr.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );

    const currentMonth = calculateTotals(currentMonthTransactions);
    const lastMonth = calculateTotals(lastMonthTransactions);

    // Yüzde değişimlerini hesapla
    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Net bakiyeyi hesapla
    const netBalance = currentMonthTransactions.reduce((acc, curr) => {
      if (curr.type === 'income') return acc + curr.amount;
      if (curr.type === 'expense') return acc - curr.amount;
      return acc;
    }, 0);

    // Son işlemleri al
    const recentTransactions = await Transaction.find({ 
      userId: req.user.id,
      isVaultTransaction: false // Sadece ana işlemleri al
    })
      .sort({ date: -1, createdAt: -1 })
      .limit(5);

    // Son notları al
    const recentNotes = await Note.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(3);

    res.json({
      summary: {
        currentMonth: {
          income: currentMonth.income,
          expense: currentMonth.expense,
          netBalance: netBalance
        },
        percentageChanges: {
          income: calculatePercentageChange(currentMonth.income, lastMonth.income),
          expense: calculatePercentageChange(currentMonth.expense, lastMonth.expense)
        },
        vaultBalance: vault ? vault.balance : 0
      },
      recentTransactions,
      recentNotes
    });

  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    res.status(500).json({ message: 'Dashboard verileri alınırken bir hata oluştu' });
  }
});

router.post('/notes', auth, async (req, res) => {
  try {
    const { title, content, isReminder, reminderDate } = req.body;

    const note = new Note({
      user: req.user.id,
      title,
      content,
      isReminder: isReminder || false,
      reminderDate: reminderDate || null
    });

    await note.save();
    res.status(201).json(note);
  } catch (error) {
    console.error('Dashboard note create error:', error);
    res.status(500).json({ message: 'Not oluşturulurken bir hata oluştu' });
  }
});

module.exports = router; 