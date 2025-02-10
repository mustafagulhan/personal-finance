const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

router.get('/', auth, async (req, res) => {
  try {
    const { range = 'month' } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Tarih aralığını belirle
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default: // month
        startDate.setMonth(startDate.getMonth() - 1);
    }

    // Toplam gelir ve gider
    const summary = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate }
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
    ]);

    // Aylık veriler
    const monthlyData = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
            }
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $toString: '$_id.month' }
            ]
          },
          income: 1,
          expense: 1
        }
      },
      { $sort: { month: 1 } }
    ]);

    // Kategori dağılımı
    const categoryData = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          amount: 1
        }
      }
    ]);

    res.json({
      summary: summary[0] || { totalIncome: 0, totalExpense: 0 },
      monthlyData,
      categoryData
    });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ message: 'Rapor verileri alınırken bir hata oluştu' });
  }
});

module.exports = router; 