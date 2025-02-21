const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const pdfService = require('../services/pdf.service');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

router.get('/', auth, async (req, res) => {
  try {
    const { range = 'month' } = req.query;

    // Tarih aralığını belirle
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (range === 'month') {
      startDate.setDate(1); // Ayın başı
    } else if (range === 'year') {
      startDate.setMonth(0, 1); // Yılın başı
    }

    // Toplam gelir ve giderleri hesapla
    const [incomeResult, expenseResult] = await Promise.all([
      Transaction.aggregate([
      {
        $match: {
            userId: new mongoose.Types.ObjectId(req.user.id),
            type: 'income',
            date: { $gte: startDate },
            isVaultTransaction: { $ne: true }
        }
      },
      {
        $group: {
          _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),
      Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(req.user.id),
            type: 'expense',
            date: { $gte: startDate },
            isVaultTransaction: { $ne: true }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ])
    ]);

    // Kategori bazlı gelir ve giderleri hesapla
    const [incomeByCategory, expenseByCategory] = await Promise.all([
      Transaction.aggregate([
      {
        $match: {
            userId: new mongoose.Types.ObjectId(req.user.id),
            type: 'income',
            date: { $gte: startDate },
            isVaultTransaction: { $ne: true }
        }
      },
      {
        $group: {
            _id: '$category',
            total: { $sum: '$amount' }
          }
        },
        { $sort: { total: -1 } }
      ]),
      Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(req.user.id),
            type: 'expense',
            date: { $gte: startDate },
            isVaultTransaction: { $ne: true }
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' }
          }
        },
        { $sort: { total: -1 } }
      ])
    ]);

    const totalIncome = incomeResult[0]?.total || 0;
    const totalExpense = expenseResult[0]?.total || 0;
    const netBalance = totalIncome - totalExpense;

    res.json({
      summary: {
        totalIncome,
        totalExpense,
        netBalance
      },
      incomeByCategory: incomeByCategory.map(item => ({
        category: item._id,
        amount: item.total
      })),
      expenseByCategory: expenseByCategory.map(item => ({
        category: item._id,
        amount: item.total
      }))
    });

  } catch (error) {
    console.error('Reports data fetch error:', error);
    res.status(500).json({ message: 'Rapor verileri alınırken bir hata oluştu' });
  }
});

// PDF raporu oluştur
router.post('/generate-pdf', auth, async (req, res) => {
  try {
    const { startDate, endDate, types } = req.body;

    // Kasa işlemleri seçili değilse, kasa kategorisindeki işlemleri de filtrele
    const query = {
      userId: req.user.id,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      type: { $in: types }
    };

    // Eğer kasa işlemleri seçili değilse
    if (!types.includes('vault-in') && !types.includes('vault-out')) {
      query.$and = [
        { category: { $ne: 'Kasa' } },
        { isVaultTransaction: { $ne: true } }
      ];
    }

    // İşlemleri getir
    const transactions = await Transaction.find(query).sort({ date: -1 });

    // Özet hesapla
    const summary = transactions.reduce((acc, curr) => {
      if (curr.type === 'income' || curr.type === 'vault-out') {
        acc.totalIncome += curr.amount;
      } else if (curr.type === 'expense' || curr.type === 'vault-in') {
        acc.totalExpense += curr.amount;
      }
      return acc;
    }, { totalIncome: 0, totalExpense: 0 });

    // PDF oluştur
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      font: path.join(__dirname, '../fonts/Roboto-Regular.ttf')
    });

    const fileName = `rapor_${new Date().toISOString().split('T')[0]}.pdf`;
    const filePath = path.join(__dirname, '../temp', fileName);

    doc.pipe(fs.createWriteStream(filePath));

    // Başlık
    doc.font(path.join(__dirname, '../fonts/Roboto-Bold.ttf'))
      .fontSize(24)
      .text('Finansal Rapor', { align: 'center' })
      .moveDown();

    // Tarih aralığı
    doc.font(path.join(__dirname, '../fonts/Roboto-Regular.ttf'))
      .fontSize(12)
      .text(`Rapor Dönemi: ${new Date(startDate).toLocaleDateString('tr-TR')} - ${new Date(endDate).toLocaleDateString('tr-TR')}`, { align: 'left' })
      .moveDown();

    // Özet bilgiler
    doc.font(path.join(__dirname, '../fonts/Roboto-Medium.ttf'))
      .fontSize(16)
      .text('Özet Bilgiler')
      .moveDown();

    doc.font(path.join(__dirname, '../fonts/Roboto-Regular.ttf'))
      .fontSize(12)
      .text(`Toplam Gelir: ₺${summary.totalIncome.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`)
      .text(`Toplam Gider: ₺${summary.totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`)
      .text(`Net Bakiye: ₺${(summary.totalIncome - summary.totalExpense).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`)
      .moveDown(2);

    // İşlem listesi
    doc.font(path.join(__dirname, '../fonts/Roboto-Medium.ttf'))
      .fontSize(16)
      .text('İşlem Listesi')
      .moveDown();

    // Tablo başlıkları
    const tableTop = doc.y;
    const colWidths = {
      date: 80,
      type: 70,
      category: 100,
      description: 170,
      amount: 80
    };

    let currentY = tableTop;

    // Başlık satırı
    doc.font(path.join(__dirname, '../fonts/Roboto-Medium.ttf'))
      .fontSize(10);

    doc.text('Tarih', 50, currentY)
      .text('Tür', 50 + colWidths.date, currentY)
      .text('Kategori', 50 + colWidths.date + colWidths.type, currentY)
      .text('Açıklama', 50 + colWidths.date + colWidths.type + colWidths.category, currentY)
      .text('Tutar', 50 + colWidths.date + colWidths.type + colWidths.category + colWidths.description, currentY);

    currentY += 20;

    // Tablo çizgisi
    doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 10;

    // İşlem satırları
    doc.font(path.join(__dirname, '../fonts/Roboto-Regular.ttf'))
      .fontSize(10);

    transactions.forEach(transaction => {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      const type = transaction.type === 'income' ? 'Gelir' :
                   transaction.type === 'expense' ? 'Gider' :
                   transaction.type === 'vault-in' ? 'Kasa Giriş' : 'Kasa Çıkış';

      doc.text(new Date(transaction.date).toLocaleDateString('tr-TR'), 50, currentY)
         .text(type, 50 + colWidths.date, currentY)
         .text(transaction.category, 50 + colWidths.date + colWidths.type, currentY)
         .text(transaction.description || '-', 50 + colWidths.date + colWidths.type + colWidths.category, currentY)
         .text(`₺${transaction.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, 
               50 + colWidths.date + colWidths.type + colWidths.category + colWidths.description, currentY);

      currentY += 20;
    });

    doc.end();

    doc.on('end', () => {
      const stream = fs.createReadStream(filePath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      stream.pipe(res);

      stream.on('end', () => {
        fs.unlink(filePath, err => {
          if (err) console.error('Temp file deletion error:', err);
        });
      });
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'PDF oluşturma hatası' });
  }
});

// PDF raporu indir
router.post('/download', auth, async (req, res) => {
  try {
    const { range = 'month' } = req.body;
    
    // Tarih aralığını belirle
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (range === 'month') {
      startDate.setDate(1);
    } else if (range === 'year') {
      startDate.setMonth(0, 1);
    }

    // İşlemleri getir
    const transactions = await Transaction.find({
      userId: req.user.id,
      date: { $gte: startDate },
      isVaultTransaction: { $ne: true }
    }).sort({ date: -1 });

    // Özet hesapla
    const summary = transactions.reduce((acc, curr) => {
      if (curr.type === 'income') {
        acc.totalIncome += curr.amount;
      } else if (curr.type === 'expense') {
        acc.totalExpense += curr.amount;
      }
      return acc;
    }, { totalIncome: 0, totalExpense: 0 });

    // PDF oluştur
    const doc = new PDFDocument();
    const fileName = `rapor_${new Date().toISOString().split('T')[0]}.pdf`;
    const filePath = path.join(__dirname, '../temp', fileName);

    // PDF'i dosyaya yaz
    doc.pipe(fs.createWriteStream(filePath));

    // PDF içeriğini oluştur
    doc
      .fontSize(20)
      .text('Finansal Rapor', { align: 'center' })
      .moveDown();

    // Rapor dönemi
    doc
      .fontSize(12)
      .text(`Rapor Dönemi: ${range === 'month' ? 'Bu Ay' : 'Bu Yıl'}`, { align: 'left' })
      .moveDown();

    // Özet bilgiler
    doc
      .fontSize(14)
      .text('Özet Bilgiler', { underline: true })
      .moveDown()
      .fontSize(12)
      .text(`Toplam Gelir: ₺${summary.totalIncome.toFixed(2)}`)
      .text(`Toplam Gider: ₺${summary.totalExpense.toFixed(2)}`)
      .text(`Net Bakiye: ₺${(summary.totalIncome - summary.totalExpense).toFixed(2)}`)
      .moveDown();

    // İşlem listesi başlığı
    doc
      .fontSize(14)
      .text('İşlem Listesi', { underline: true })
      .moveDown();

    // Tablo başlıkları
    const tableTop = doc.y;
    doc
      .fontSize(10)
      .text('Tarih', 50, tableTop)
      .text('Tür', 150, tableTop)
      .text('Kategori', 250, tableTop)
      .text('Açıklama', 350, tableTop)
      .text('Tutar', 450, tableTop)
      .moveDown();

    // İşlemleri listele
    let yPosition = doc.y;
    transactions.forEach(transaction => {
      if (yPosition > 700) { // Sayfa sonu kontrolü
        doc.addPage();
        yPosition = 50;
      }

      doc
        .fontSize(10)
        .text(new Date(transaction.date).toLocaleDateString('tr-TR'), 50, yPosition)
        .text(transaction.type === 'income' ? 'Gelir' : 'Gider', 150, yPosition)
        .text(transaction.category, 250, yPosition)
        .text(transaction.description || '-', 350, yPosition)
        .text(`₺${transaction.amount.toFixed(2)}`, 450, yPosition);

      yPosition += 20;
    });

    // PDF'i sonlandır
    doc.end();

    // PDF hazır olduğunda gönder
    doc.on('end', () => {
      const stream = fs.createReadStream(filePath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      stream.pipe(res);

      // Dosyayı gönderildikten sonra sil
      stream.on('end', () => {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Temp file deletion error:', err);
        });
      });
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'PDF oluşturma hatası' });
  }
});

// Aylık/Yıllık gelir-gider verilerini getir
router.get('/chart-data', auth, async (req, res) => {
  try {
    const { range = 'month' } = req.query;
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    let groupBy;
    if (range === 'month') {
      startDate.setDate(1); // Ayın başı
      groupBy = { $dayOfMonth: '$date' };
    } else {
      startDate.setMonth(0, 1); // Yılın başı
      groupBy = { $month: '$date' };
    }

    const [incomeData, expenseData] = await Promise.all([
      Transaction.aggregate([
      {
        $match: {
            userId: new mongoose.Types.ObjectId(req.user.id),
            type: 'income',
            date: { $gte: startDate },
            isVaultTransaction: { $ne: true }
        }
      },
      {
        $group: {
            _id: groupBy,
            total: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(req.user.id),
            type: 'expense',
            date: { $gte: startDate },
            isVaultTransaction: { $ne: true }
          }
        },
        {
          $group: {
            _id: groupBy,
            total: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      incomeData,
      expenseData
    });
  } catch (error) {
    console.error('Chart data fetch error:', error);
    res.status(500).json({ message: 'Grafik verileri alınırken bir hata oluştu' });
  }
});

module.exports = router; 