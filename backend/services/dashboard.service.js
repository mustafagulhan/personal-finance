const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

const getDashboardData = async (userId) => {
  try {
    // MongoDB ObjectId'ye çevir
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Son 5 işlem
    const recentTransactions = await Transaction.find({ userId: userObjectId })
      .sort({ date: -1 })
      .limit(5);

    // Toplam gelir ve gider
    const summary = await Transaction.aggregate([
      { $match: { userId: userObjectId } },
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

    return {
      recentTransactions,
      summary: summary[0] || { totalIncome: 0, totalExpense: 0 }
    };
  } catch (error) {
    console.error('Dashboard service error:', error);
    throw error;
  }
};

module.exports = {
  getDashboardData
}; 