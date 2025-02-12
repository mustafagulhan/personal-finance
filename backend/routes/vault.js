const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Vault = require('../models/Vault');
const Transaction = require('../models/Transaction');

// Kasa bakiyesini getir
router.get('/', auth, async (req, res) => {
  try {
    let vault = await Vault.findOne({ userId: req.user.id });
    if (!vault) {
      vault = await Vault.create({ userId: req.user.id });
    }
    res.json(vault);
  } catch (error) {
    res.status(500).json({ message: 'Kasa bilgisi alınamadı' });
  }
});

// Kasaya para ekle/çıkar
router.post('/transfer', auth, async (req, res) => {
  try {
    const { amount, type, description } = req.body;
    const numericAmount = parseFloat(amount);
    
    let vault = await Vault.findOne({ userId: req.user.id });
    if (!vault) {
      vault = await Vault.create({ userId: req.user.id });
    }

    // Kasa çıkışı için bakiye kontrolü
    if (type === 'vault-out' && vault.balance < numericAmount) {
      return res.status(400).json({ message: 'Yetersiz kasa bakiyesi' });
    }

    // Kasa bakiyesini güncelle
    vault.balance = type === 'vault-in' 
      ? vault.balance + numericAmount 
      : vault.balance - numericAmount;
    
    await vault.save();

    // Kasa işlemini kaydet
    const transaction = new Transaction({
      userId: req.user.id,
      type: type === 'vault-in' ? 'expense' : 'income', // Kasaya para eklemek gider, çekmek gelir
      amount: numericAmount,
      category: 'Kasa',
      description: description || (type === 'vault-in' ? 'Kasaya para eklendi' : 'Kasadan para çekildi'),
      date: new Date(),
      isVaultTransaction: true
    });

    await transaction.save();

    // Net bakiyeyi hesapla
    const transactions = await Transaction.find({ userId: req.user.id });
    const netBalance = transactions.reduce((acc, curr) => {
      if (curr.type === 'income') return acc + curr.amount;
      if (curr.type === 'expense') return acc - curr.amount;
      return acc;
    }, 0);

    res.json({ 
      vault,
      transaction,
      netBalance
    });
  } catch (error) {
    console.error('Vault transfer error:', error);
    res.status(500).json({ message: 'Kasa işlemi başarısız' });
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

module.exports = router; 