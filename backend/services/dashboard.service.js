const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

const getDashboardData = async (userId) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Tüm işlemleri getir
    const transactions = await Transaction.find({ userId: userObjectId });

    // Normal işlemlerin toplamını hesapla (kasa işlemleri dahil)
    const summary = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'income') {
        acc.totalIncome += transaction.amount;
      } else if (transaction.type === 'expense') {
        acc.totalExpense += transaction.amount;
      }
      return acc;
    }, {
      totalIncome: 0,
      totalExpense: 0
    });

    // Son 5 işlemi getir (kasa işlemleri dahil)
    const recentTransactions = await Transaction.find({ 
      userId: userObjectId,
    })
      .sort({ date: -1 })
      .limit(5);

    return {
      summary,
      recentTransactions
    };
  } catch (error) {
    console.error('Dashboard service error:', error);
    throw error;
  }
};

module.exports = {
  getDashboardData
}; 