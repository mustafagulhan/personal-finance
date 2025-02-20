const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
  constructor() {
    // Fontları tanımla
    this.fonts = {
      regular: path.join(__dirname, '../fonts/Roboto-Regular.ttf'),
      bold: path.join(__dirname, '../fonts/Roboto-Bold.ttf'),
      medium: path.join(__dirname, '../fonts/Roboto-Medium.ttf')
    };
  }

  async generateReport(data, filters) {
    const fileName = `report-${Date.now()}.pdf`;
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filePath = path.join(tempDir, fileName);

    return new Promise((resolve, reject) => {
      try {
        // PDF oluştur ve fontları kaydet
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: 'Kişisel Muhasebe Raporu',
            Author: 'Kişisel Muhasebe Sistemi'
          }
        });

        // Fontları register et
        doc.registerFont('Roboto', this.fonts.regular);
        doc.registerFont('Roboto-Bold', this.fonts.bold);
        doc.registerFont('Roboto-Medium', this.fonts.medium);

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Başlık ve Tarih
        doc
          .font('Roboto-Bold')
          .fontSize(24)
          .fillColor('#2196F3')
          .text('Kişisel Muhasebe Raporu', { align: 'center' })
          .fontSize(12)
          .fillColor('#666666')
          .text(new Date().toLocaleDateString('tr-TR'), { align: 'center' })
          .moveDown(2);

        // Filtreler Bölümü
        doc
          .font('Roboto-Bold')
          .fontSize(14)
          .fillColor('#333333')
          .text('Rapor Filtreleri', { underline: true })
          .moveDown(0.5)
          .font('Roboto')
          .fontSize(11)
          .fillColor('#666666')
          .text(`Tarih Aralığı: ${new Date(filters.startDate).toLocaleDateString('tr-TR')} - ${new Date(filters.endDate).toLocaleDateString('tr-TR')}`)
          .text(`Seçili İşlem Türleri: ${this.formatTransactionTypes(filters.types)}`)
          .moveDown(2);

        // Özet Bölümü
        this.generateSummary(doc, data.summary);
        doc.moveDown(2);

        // İşlemler Tablosu
        this.generateTransactionTable(doc, data.transactions);

        // Altbilgi
        doc
          .font('Roboto')
          .fontSize(8)
          .fillColor('#999999')
          .text(
            'Bu rapor Kişisel Muhasebe Sistemi tarafından otomatik olarak oluşturulmuştur.',
            50,
            doc.page.height - 50,
            { align: 'center' }
          );

        doc.end();

        stream.on('finish', () => resolve(fileName));
        stream.on('error', (error) => reject(error));
      } catch (error) {
        reject(error);
      }
    });
  }

  generateSummary(doc, summary) {
    const boxTop = doc.y;
    doc
      .rect(50, boxTop, 500, 100)
      .fillAndStroke('#f5f5f5', '#e0e0e0');

    doc
      .font('Roboto-Bold')
      .fontSize(14)
      .fillColor('#333333')
      .text('Finansal Özet', 70, boxTop + 20);

    const summaryData = [
      { label: 'Toplam Gelir:', value: `₺${summary.totalIncome.toFixed(2)}`, color: '#4CAF50' },
      { label: 'Toplam Gider:', value: `₺${summary.totalExpense.toFixed(2)}`, color: '#f44336' },
      { label: 'Net Bakiye:', value: `₺${(summary.totalIncome - summary.totalExpense).toFixed(2)}`, color: '#2196F3' }
    ];

    let yPosition = boxTop + 45;
    summaryData.forEach(item => {
      doc
        .font('Roboto-Bold')
        .fontSize(11)
        .fillColor('#666666')
        .text(item.label, 70, yPosition)
        .font('Roboto')
        .fillColor(item.color)
        .text(item.value, 200, yPosition);
      
      yPosition += 20;
    });

    doc.y = boxTop + 120;
  }

  generateTransactionTable(doc, transactions) {
    doc
      .font('Roboto-Bold')
      .fontSize(14)
      .fillColor('#333333')
      .text('İşlem Detayları', { underline: true })
      .moveDown();

    const headers = ['Tarih', 'İşlem Türü', 'Kategori', 'Açıklama', 'Tutar'];
    const columnWidths = [80, 100, 100, 150, 70];
    let startX = 50;
    let startY = doc.y;

    doc
      .rect(50, startY, 500, 20)
      .fill('#2196F3');

    headers.forEach((header, i) => {
      doc
        .font('Roboto-Bold')
        .fontSize(10)
        .fillColor('#FFFFFF')
        .text(header, startX, startY + 5, {
          width: columnWidths[i],
          align: i === headers.length - 1 ? 'right' : 'left'
        });
      startX += columnWidths[i];
    });

    startY += 25;
    let color = '#FFFFFF';

    transactions.forEach((item, index) => {
      color = index % 2 === 0 ? '#FFFFFF' : '#F5F5F5';
      doc
        .rect(50, startY - 5, 500, 20)
        .fill(color);

      startX = 50;
      doc.fillColor('#333333');

      [
        new Date(item.date).toLocaleDateString('tr-TR'),
        this.getTransactionType(item.type),
        item.category || '',
        item.description || '',
        `₺${item.amount.toFixed(2)}`
      ].forEach((text, i) => {
        doc
          .font('Roboto')
          .fontSize(10)
          .text(text, startX, startY, {
            width: columnWidths[i],
            align: i === 4 ? 'right' : 'left'
          });
        startX += columnWidths[i];
      });

      startY += 20;

      if (startY > 700) {
        doc.addPage();
        startY = 50;
        this.addTableHeader(doc, headers, columnWidths);
        startY += 25;
      }
    });
  }

  addTableHeader(doc, headers, columnWidths) {
    let startX = 50;
    doc
      .rect(50, doc.y, 500, 20)
      .fill('#2196F3');

    headers.forEach((header, i) => {
      doc
        .font('Roboto-Bold')
        .fontSize(10)
        .fillColor('#FFFFFF')
        .text(header, startX, doc.y + 5, {
          width: columnWidths[i],
          align: i === headers.length - 1 ? 'right' : 'left'
        });
      startX += columnWidths[i];
    });
  }

  formatTransactionTypes(types) {
    return types.map(type => this.getTransactionType(type)).join(', ');
  }

  getTransactionType(type) {
    const types = {
      'income': 'Gelir',
      'expense': 'Gider',
      'vault-in': 'Kasa Giriş',
      'vault-out': 'Kasa Çıkış'
    };
    return types[type] || type;
  }
}

module.exports = new PDFService(); 