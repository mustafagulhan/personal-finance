const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Vault = require('../models/Vault');
require('dotenv').config();

async function resetVaultTransactions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await Transaction.deleteMany({ isVaultTransaction: true });
    await Vault.updateMany({}, { $set: { balance: 0 } });
    console.log('Kasa işlemleri ve bakiyeler sıfırlandı');
    mongoose.disconnect();
  } catch (error) {
    console.error('Hata:', error);
  }
}

resetVaultTransactions(); 