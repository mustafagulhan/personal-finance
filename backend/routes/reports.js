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
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Tarih aralığını belirle
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        startDate.setHours(0, 0, 0, 0);
        break;
      default: // month
        startDate.setMonth(endDate.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
    }
    endDate.setHours(23, 59, 59, 999);

    // Tüm işlemleri al
    const transactions = await Transaction.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Özet hesapla
    const summary = transactions.reduce((acc, curr) => {
      if (curr.type === 'income') {
        acc.totalIncome += curr.amount;
      } else if (curr.type === 'expense') {
        acc.totalExpense += curr.amount;
      }
      return acc;
    }, { totalIncome: 0, totalExpense: 0 });

    summary.netBalance = summary.totalIncome - summary.totalExpense;

    // Önceki dönem karşılaştırması
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(startDate);
    
    switch (range) {
      case 'year':
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
        previousEndDate.setFullYear(previousEndDate.getFullYear() - 1);
        break;
      case 'quarter':
        previousStartDate.setMonth(previousStartDate.getMonth() - 3);
        previousEndDate.setMonth(previousEndDate.getMonth() - 3);
        break;
      default:
        previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        previousEndDate.setMonth(previousEndDate.getMonth() - 1);
    }

    const previousPeriodTransactions = await Transaction.find({
      userId,
      date: { $gte: previousStartDate, $lte: previousEndDate }
    });

    const previousSummary = previousPeriodTransactions.reduce((acc, curr) => {
      if (curr.type === 'income') {
        acc.totalIncome += curr.amount;
      } else if (curr.type === 'expense') {
        acc.totalExpense += curr.amount;
      }
      return acc;
    }, { totalIncome: 0, totalExpense: 0 });

    // Yüzde değişimini hesapla
    summary.percentageChange = {
      income: previousSummary.totalIncome ? 
        ((summary.totalIncome - previousSummary.totalIncome) / previousSummary.totalIncome * 100).toFixed(1) : 0,
      expense: previousSummary.totalExpense ? 
        ((summary.totalExpense - previousSummary.totalExpense) / previousSummary.totalExpense * 100).toFixed(1) : 0
    };

    // Aylık verileri hazırla
    const monthlyData = [];

    // Seçilen aralığa göre ayları belirle
    let currentDate = new Date(startDate);
    const endDateCopy = new Date(endDate);

    // Sadece tam ayları al
    switch (range) {
      case 'year':
        // Son 12 ay
        for (let i = 11; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

          const monthTransactions = transactions.filter(t => {
            const transDate = new Date(t.date);
            return transDate >= monthStart && transDate <= monthEnd;
          });

          monthlyData.push({
            month: date.toLocaleString('tr-TR', { month: 'short' }),
            income: monthTransactions
              .filter(t => t.type === 'income')
              .reduce((sum, t) => sum + t.amount, 0),
            expense: monthTransactions
              .filter(t => t.type === 'expense')
              .reduce((sum, t) => sum + t.amount, 0)
          });
        }
        break;

      case 'quarter':
        // Son 3 ay
        for (let i = 2; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

          const monthTransactions = transactions.filter(t => {
            const transDate = new Date(t.date);
            return transDate >= monthStart && transDate <= monthEnd;
          });

          monthlyData.push({
            month: date.toLocaleString('tr-TR', { month: 'short' }),
            income: monthTransactions
              .filter(t => t.type === 'income')
              .reduce((sum, t) => sum + t.amount, 0),
            expense: monthTransactions
              .filter(t => t.type === 'expense')
              .reduce((sum, t) => sum + t.amount, 0)
          });
        }
        break;

      default: // month - Bu ay
        const thisMonth = new Date();
        const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
        const monthEnd = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0, 23, 59, 59, 999);

        const monthTransactions = transactions.filter(t => {
          const transDate = new Date(t.date);
          return transDate >= monthStart && transDate <= monthEnd;
        });

        monthlyData.push({
          month: thisMonth.toLocaleString('tr-TR', { month: 'short' }),
          income: monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0),
          expense: monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0)
        });
    }

    // Kategori dağılımını hesapla
    const categoryData = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate },
          type: 'expense' // Sadece giderleri al
        }
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' }
        }
      },
      {
        $match: {
          amount: { $gt: 0 } // Sıfırdan büyük olanları filtrele
        }
      },
      {
        $sort: { 
          amount: -1 // Tutara göre azalan sıralama
        }
      },
      {
        $project: {
          category: '$_id',
          amount: 1,
          _id: 0
        }
      }
    ]);

    // Ekstra filtreleme ve kontrol
    const filteredCategoryData = categoryData
      .filter(item => item.amount > 0) // Son bir kontrol
      .map(item => ({
        ...item,
        amount: Math.abs(item.amount) // Tutarların pozitif olduğundan emin ol
      }));

    // Günlük bakiye değişimi
    const dailyBalances = [];
    const previousBalanceTransactions = await Transaction.find({
      userId,
      date: { $lt: startDate }
    }).sort({ date: 1 });

    let runningBalance = previousBalanceTransactions.reduce((balance, t) => {
      return balance + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);

    // Her gün için veri oluştur
    let currentDay = new Date(startDate);
    while (currentDay <= endDate) {
      const dayTransactions = transactions.filter(t => {
        const transDate = new Date(t.date);
        return transDate.toDateString() === currentDay.toDateString();
      });

      // O günün işlemlerini ekle
      dayTransactions.forEach(t => {
        runningBalance += t.type === 'income' ? t.amount : -t.amount;
      });

      // Her gün için veri ekle (işlem olmasa bile)
      dailyBalances.push({
        date: currentDay.toLocaleDateString('tr-TR'),
        balance: runningBalance
      });

      currentDay.setDate(currentDay.getDate() + 1);
    }

    // En yüksek giderler ve gelirler
    const topExpenses = transactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const topIncomes = transactions
      .filter(t => t.type === 'income')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    res.json({
      summary,
      monthlyData,
      categoryData: filteredCategoryData,
      dailyBalances,
      topExpenses,
      topIncomes
    });

  } catch (error) {
    console.error('Reports fetch error:', error);
    res.status(500).json({ message: 'Rapor verileri alınırken bir hata oluştu' });
  }
});

// PDF raporu oluştur
router.post('/generate-pdf', auth, async (req, res) => {
  try {
    const { startDate, endDate, types = ['income', 'expense', 'vault-in', 'vault-out'] } = req.body;

    // İşlemleri getir
    const transactions = await Transaction.find({
      userId: req.user.id,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      type: { $in: types }
    }).sort({ date: 1 });

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
    const fileName = await pdfService.generateReport(
      { transactions, summary },
      { startDate, endDate, types }
    );

    // temp klasörünün varlığını kontrol et
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    res.json({
      message: 'PDF raporu oluşturuldu',
      fileName,
      downloadUrl: `http://localhost:5000/api/reports/download/${fileName}`
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ 
      message: 'Rapor oluşturulurken bir hata oluştu',
      error: error.message 
    });
  }
});

// PDF raporu indir
router.post('/download', auth, async (req, res) => {
  try {
    const { range = 'month' } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Tarih aralığını belirle
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
    }
    endDate.setHours(23, 59, 59, 999);

    // İşlemleri getir
    const transactions = await Transaction.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Özet hesapla
    const summary = transactions.reduce((acc, curr) => {
      if (curr.type === 'income') {
        acc.totalIncome += curr.amount;
      } else if (curr.type === 'expense') {
        acc.totalExpense += curr.amount;
      }
      return acc;
    }, { totalIncome: 0, totalExpense: 0 });

    summary.netBalance = summary.totalIncome - summary.totalExpense;

    // PDF oluştur
    const doc = new PDFDocument();
    const fileName = `report-${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '../temp', fileName);

    // temp klasörünü kontrol et
    if (!fs.existsSync(path.join(__dirname, '../temp'))) {
      fs.mkdirSync(path.join(__dirname, '../temp'), { recursive: true });
    }

    // PDF'i oluştur
    doc.pipe(fs.createWriteStream(filePath));

    // PDF içeriğini hazırla
    doc
      .fontSize(20)
      .text('Finansal Rapor', { align: 'center' })
      .moveDown();

    doc
      .fontSize(12)
      .text(`Rapor Tarihi: ${new Date().toLocaleDateString()}`)
      .text(`Dönem: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`)
      .moveDown();

    // Özet bilgiler
    doc
      .fontSize(16)
      .text('Özet', { underline: true })
      .moveDown()
      .fontSize(12)
      .text(`Toplam Gelir: ₺${summary.totalIncome.toLocaleString()}`)
      .text(`Toplam Gider: ₺${summary.totalExpense.toLocaleString()}`)
      .text(`Net Bakiye: ₺${summary.netBalance.toLocaleString()}`)
      .moveDown();

    // İşlem listesi
    doc
      .fontSize(16)
      .text('İşlem Listesi', { underline: true })
      .moveDown();

    // Tablo başlıkları
    const tableTop = doc.y;
    doc
      .fontSize(10)
      .text('Tarih', 50, tableTop)
      .text('Açıklama', 150, tableTop)
      .text('Kategori', 300, tableTop)
      .text('Tür', 400, tableTop)
      .text('Tutar', 480, tableTop)
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
        .text(new Date(transaction.date).toLocaleDateString(), 50, yPosition)
        .text(transaction.description || '', 150, yPosition)
        .text(transaction.category, 300, yPosition)
        .text(transaction.type === 'income' ? 'Gelir' : 'Gider', 400, yPosition)
        .text(`₺${transaction.amount.toLocaleString()}`, 480, yPosition);

      yPosition += 20;
    });

    // PDF'i sonlandır
    doc.end();

    // PDF'i gönder
    res.download(filePath, 'rapor.pdf', (err) => {
      if (err) {
        console.error('PDF download error:', err);
        return res.status(500).json({ message: 'PDF indirme hatası' });
      }
      // Dosyayı sil
      fs.unlink(filePath, (err) => {
        if (err) console.error('Temp file deletion error:', err);
      });
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'PDF oluşturma hatası' });
  }
});

module.exports = router; 