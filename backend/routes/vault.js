const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Vault = require('../models/Vault');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// Kasa bakiyesini getir
router.get('/', auth, async (req, res) => {
  try {
    // Güncel bakiyeleri hesapla
    const [regularTransactions, vaultTransactions] = await Promise.all([
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
      balance: vaultBalance,
      netBalance: netBalance,
      totalBalance: netBalance + vaultBalance,
      details: {
        vaultIn: vault.totalVaultIn,
        vaultOut: vault.totalVaultOut
      }
    });
  } catch (error) {
    console.error('Vault fetch error:', error);
    res.status(500).json({ message: 'Kasa bilgisi alınamadı' });
  }
});

// Kasaya para ekle/çıkar
router.post('/transfer', auth, async (req, res) => {
  try {
    const { type, amount, description } = req.body;
    const parsedAmount = parseFloat(amount);

    // İlk bakiye kontrolü - tüm işlemleri hesapla
    const [initialRegular, initialVault] = await Promise.all([
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

    const initialRegularData = initialRegular[0] || { totalIncome: 0, totalExpense: 0 };
    const initialVaultData = initialVault[0] || { totalVaultIn: 0, totalVaultOut: 0 };

    const initialNetBalance = (initialRegularData.totalIncome - initialRegularData.totalExpense);
    const initialVaultBalance = (initialVaultData.totalVaultIn - initialVaultData.totalVaultOut);
    const initialTotalBalance = initialNetBalance + initialVaultBalance;

    // Tutar kontrolü
    if (type === 'vault-in' && parsedAmount > initialNetBalance) {
      return res.status(400).json({ 
        message: 'İşlem tutarı net bakiyeden fazla olamaz',
        netBalance: initialNetBalance,
        vaultBalance: initialVaultBalance,
        totalBalance: initialTotalBalance
      });
    }

    // Kasa çıkışı için bakiye kontrolü
    if (type === 'vault-out' && parsedAmount > initialVaultBalance) {
      return res.status(400).json({ 
        message: 'Kasada yeterli bakiye yok',
        netBalance: initialNetBalance,
        vaultBalance: initialVaultBalance,
        totalBalance: initialTotalBalance
      });
    }

    // 1. Kasa işlemini kaydet
    const vaultTransaction = new Transaction({
      userId: req.user.id,
      type: type, // vault-in veya vault-out
      amount: parsedAmount,
      description: description || (type === 'vault-in' ? 'Kasaya para eklendi' : 'Kasadan para çekildi'),
      category: 'Kasa',
      isVaultTransaction: true,
      date: new Date()
    });

    // 2. Ana bakiyeyi etkileyen işlemi kaydet
    const mainTransaction = new Transaction({
      userId: req.user.id,
      type: type === 'vault-in' ? 'expense' : 'income', // Kasaya para eklemek gider, çekmek gelir olarak kaydedilir
      amount: parsedAmount,
      description: description || (type === 'vault-in' ? 'Kasaya para eklendi' : 'Kasadan para çekildi'),
      category: 'Kasa',
      isVaultTransaction: false, // Ana işlem olduğu için false olmalı
      date: new Date()
    });

    // İşlemleri kaydet
    await Promise.all([
      vaultTransaction.save(),
      mainTransaction.save()
    ]);

    // Güncel bakiyeleri hesapla
    const [finalRegular, finalVault] = await Promise.all([
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

    const finalRegularData = finalRegular[0] || { totalIncome: 0, totalExpense: 0 };
    const finalVaultData = finalVault[0] || { totalVaultIn: 0, totalVaultOut: 0 };

    const finalNetBalance = finalRegularData.totalIncome - finalRegularData.totalExpense;
    const finalVaultBalance = finalVaultData.totalVaultIn - finalVaultData.totalVaultOut;

    res.json({
      message: 'İşlem başarıyla gerçekleştirildi',
      transactions: {
        vault: vaultTransaction,
        main: mainTransaction
      },
      balances: {
        netBalance: finalNetBalance,
        vaultBalance: finalVaultBalance,
        totalBalance: finalNetBalance + finalVaultBalance
      }
    });

  } catch (error) {
    console.error('Vault transfer error:', error);
    res.status(500).json({ message: 'İşlem sırasında bir hata oluştu' });
  }
});

// Para ekle
router.post('/deposit', auth, async (req, res) => {
  try {
    const { amount } = req.body;

    // Net bakiyeyi hesapla (kasaya eklenen paraları düşmeden)
    const transactions = await Transaction.find({ userId: req.user.id });
    const netBalance = transactions.reduce((acc, curr) => {
      if (curr.type === 'income') return acc + curr.amount;
      if (curr.type === 'expense') return acc - curr.amount;
      return acc;
    }, 0);

    // Yeterli bakiye kontrolü
    if (amount > netBalance) {
      return res.status(400).json({ 
        message: 'Yetersiz bakiye',
        netBalance: netBalance
      });
    }

    // Kasaya para ekle
    const vault = await Vault.findOne({ userId: req.user.id });
    vault.balance += parseFloat(amount);
    await vault.save();

    // Kasa işlemini gider olarak kaydet
    const transaction = new Transaction({
      userId: req.user.id,
      type: 'expense', // gider olarak işaretle
      amount: amount,
      category: 'Kasa',
      description: 'Kasaya para eklendi',
      date: new Date(),
      isVaultTransaction: true
    });
    await transaction.save();

    res.json({ 
      message: 'Para başarıyla eklendi',
      balance: vault.balance,
      transaction: transaction
    });
  } catch (error) {
    console.error('Vault deposit error:', error);
    res.status(500).json({ message: 'Para eklenirken bir hata oluştu' });
  }
});

// Kasa işlemlerini getir
router.get('/transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user.id,
      $or: [
        { type: 'vault-in' },
        { type: 'vault-out' }
      ]
    }).sort({ date: -1 });

    res.json(transactions);
  } catch (error) {
    console.error('Vault transactions fetch error:', error);
    res.status(500).json({ message: 'Kasa işlemleri alınamadı' });
  }
});

// Kasa bakiyesini getir
router.get('/balance', auth, async (req, res) => {
  try {
    // Tüm işlemleri ve kasa işlemlerini ayrı ayrı hesapla
    const [regularTransactions, vaultTransactions] = await Promise.all([
      // Normal gelir-gider işlemleri
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
            $or: [
              { isVaultTransaction: true },
              { category: 'Kasa' }
            ]
          }
        },
        {
          $group: {
            _id: null,
            totalVaultIn: {
              $sum: {
                $cond: [
                  { 
                    $or: [
                      { $eq: ['$type', 'vault-in'] },
                      { $and: [
                        { $eq: ['$type', 'expense'] },
                        { $eq: ['$category', 'Kasa'] }
                      ]}
                    ]
                  },
                  '$amount',
                  0
                ]
              }
            },
            totalVaultOut: {
              $sum: {
                $cond: [
                  { 
                    $or: [
                      { $eq: ['$type', 'vault-out'] },
                      { $and: [
                        { $eq: ['$type', 'income'] },
                        { $eq: ['$category', 'Kasa'] }
                      ]}
                    ]
                  },
                  '$amount',
                  0
                ]
              }
            }
          }
        }
      ])
    ]);

    // Sonuçları işle
    const regular = regularTransactions[0] || { totalIncome: 0, totalExpense: 0 };
    const vault = vaultTransactions[0] || { totalVaultIn: 0, totalVaultOut: 0 };

    // Net bakiyeleri hesapla
    const regularBalance = regular.totalIncome - regular.totalExpense;
    const vaultBalance = vault.totalVaultOut - vault.totalVaultIn;

    // Toplam net bakiye
    const totalBalance = regularBalance + vaultBalance;

    res.json({
      regularBalance,
      vaultBalance,
      totalBalance,
      details: {
        regular: {
          income: regular.totalIncome,
          expense: regular.totalExpense
        },
        vault: {
          in: vault.totalVaultIn,
          out: vault.totalVaultOut
        }
      }
    });

  } catch (error) {
    console.error('Get vault balance error:', error);
    res.status(500).json({ message: 'Kasa bakiyesi alınırken bir hata oluştu' });
  }
});

module.exports = router; 