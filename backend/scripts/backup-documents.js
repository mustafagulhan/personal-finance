const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Document = require('../models/Document');
require('dotenv').config();

async function backupDocuments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Tüm dökümanları getir
    const documents = await Document.find({});
    
    // Yedekleme klasörü oluştur
    const backupDir = path.join(process.cwd(), 'backups', new Date().toISOString().split('T')[0]);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Her dosyayı yedekle
    for (const doc of documents) {
      if (fs.existsSync(doc.path)) {
        const fileName = path.basename(doc.path);
        const backupPath = path.join(backupDir, fileName);
        fs.copyFileSync(doc.path, backupPath);
      }
    }

    console.log(`Yedekleme tamamlandı: ${backupDir}`);
    mongoose.disconnect();
  } catch (error) {
    console.error('Yedekleme hatası:', error);
  }
}

backupDocuments(); 