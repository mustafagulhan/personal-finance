const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const upload = require('../middleware/upload');

// Multer yapılandırması
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Orijinal dosya adını temizle ve benzersiz bir isim oluştur
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const extension = path.extname(cleanFileName);
    cb(null, `${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  console.log('File type:', file.mimetype);
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Geçersiz dosya türü. Sadece JPEG, PNG ve PDF dosyaları yüklenebilir.'), false);
  }
};

const uploadMulter = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
}).single('file');

// Tekli dosya yükleme
router.post('/', auth, uploadMulter, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Dosya yüklenemedi' });
    }

    // Dosya bilgilerini MongoDB'ye kaydet
    const document = new Document({
      userId: req.user.id,
      title: req.file.originalname,
      path: req.file.path,
      fileType: req.file.mimetype,
      size: req.file.size
    });

    await document.save();
    res.status(201).json(document);
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ message: 'Dosya kaydedilemedi', error: error.message });
  }
});

// Çoklu dosya yükleme endpoint'i
router.post('/upload', auth, upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Yüklenecek dosya bulunamadı' });
    }

    const description = req.body.description || '';
    const savedDocuments = [];

    for (const file of req.files) {
      try {
        const document = new Document({
          userId: req.user.id,
          title: file.originalname,
          path: file.filename,
          fileType: file.mimetype,
          fileSize: file.size,
          description: description
        });

        const savedDoc = await document.save();
        savedDocuments.push(savedDoc);
      } catch (err) {
        console.error('Document save error:', err);
        fs.unlink(file.path, (unlinkErr) => {
          if (unlinkErr) console.error('File deletion error:', unlinkErr);
        });
      }
    }

    res.json(savedDocuments);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Dosya yükleme hatası' });
  }
});

// Tüm belgeleri getir
router.get('/', auth, async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Belgeler alınırken bir hata oluştu' });
  }
});

// Dosya silme
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({ message: 'Dosya bulunamadı' });
    }

    // Fiziksel dosyayı sil
    if (fs.existsSync(document.path)) {
      fs.unlinkSync(document.path);
    }

    // Veritabanından sil
    await document.deleteOne();

    res.json({ message: 'Dosya başarıyla silindi' });
  } catch (error) {
    console.error('Document delete error:', error);
    res.status(500).json({ message: 'Dosya silinemedi' });
  }
});

// Dosya indirme endpoint'i
router.get('/:id/download', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({ message: 'Dosya bulunamadı' });
    }

    // Dosyanın var olduğunu kontrol et
    if (!fs.existsSync(document.path)) {
      return res.status(404).json({ message: 'Dosya sistemde bulunamadı' });
    }

    // Content-Type header'ını ayarla
    res.setHeader('Content-Type', document.fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.title)}"`);

    // Dosyayı stream olarak gönder
    const fileStream = fs.createReadStream(document.path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ message: 'Dosya indirilirken bir hata oluştu' });
  }
});

// Dosya görüntüleme endpoint'i
router.get('/:id/view', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({ message: 'Dosya bulunamadı' });
    }

    // Dosya yolunu düzelt
    res.json({
      title: document.title,
      fileType: document.fileType,
      path: document.path
    });
  } catch (error) {
    console.error('View document error:', error);
    res.status(500).json({ message: 'Dosya görüntülenirken bir hata oluştu' });
  }
});

// İşlemle belge ilişkilendir
router.put('/:id/transaction/:transactionId', auth, async (req, res) => {
  try {
    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { transaction: req.params.transactionId },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({ message: 'Belge bulunamadı' });
    }

    res.json(document);
  } catch (error) {
    console.error('Belge güncellenemedi:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Belge indirme
router.get('/download/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({ message: 'Belge bulunamadı' });
    }

    // Dosya yolunu düzgün şekilde oluştur
    const filePath = path.join(__dirname, '..', 'uploads', document.path);

    // Dosyanın var olduğunu kontrol et
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Dosya sistemde bulunamadı' });
    }

    // Content-Type ve Content-Disposition header'larını ayarla
    res.setHeader('Content-Type', document.fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.title)}"`);

    // Dosyayı stream olarak gönder
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Hata durumunda
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      res.status(500).json({ message: 'Dosya okunurken bir hata oluştu' });
    });
  } catch (error) {
    console.error('Document download error:', error);
    res.status(500).json({ message: 'Belge indirilirken bir hata oluştu' });
  }
});

// Hata yakalama middleware'i
router.use((error, req, res, next) => {
  console.error('Documents route error:', error);
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Dosya boyutu 5MB\'dan büyük olamaz' });
    }
    return res.status(400).json({ message: 'Dosya yükleme hatası' });
  }
  res.status(500).json({ message: 'Bir hata oluştu', error: error.message });
});

module.exports = router; 