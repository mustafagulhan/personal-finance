const mongoose = require('mongoose');
const Vault = require('../models/Vault');
require('dotenv').config();

async function resetVault() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await Vault.updateMany({}, { $set: { balance: 0 } });
    console.log('Kasa bakiyeleri sıfırlandı');
    mongoose.disconnect();
  } catch (error) {
    console.error('Hata:', error);
  }
}

resetVault(); 