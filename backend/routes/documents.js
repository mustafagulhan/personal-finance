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