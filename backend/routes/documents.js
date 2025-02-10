const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Document = require('../models/Document');

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

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
}).single('file');

// Dosya yükleme endpoint'i
router.post('/upload', auth, (req, res) => {
  upload(req, res, async function(err) {
    if (err) {
      console.error('Multer error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'Dosya boyutu 5MB\'dan büyük olamaz' });
        }
        return res.status(400).json({ message: 'Dosya yükleme hatası' });
      }
      return res.status(400).json({ message: err.message });
    }

    try {
      // Dosya kontrolü
      if (!req.file) {
        return res.status(400).json({ message: 'Dosya yüklenmedi' });
      }

      // Önceki aynı isimli dosyayı kontrol et ve sil
      const existingDoc = await Document.findOne({
        userId: req.user.id,
        title: req.file.originalname
      });

      if (existingDoc) {
        // Eski dosyayı fiziksel olarak sil
        if (fs.existsSync(existingDoc.filePath)) {
          fs.unlinkSync(existingDoc.filePath);
        }
        // Veritabanından sil
        await existingDoc.deleteOne();
      }

      // Yeni belgeyi kaydet
      const document = new Document({
        userId: req.user.id,
        title: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      });

      const savedDoc = await document.save();
      console.log('Document saved:', savedDoc);

      res.status(201).json({
        _id: savedDoc._id,
        title: savedDoc.title,
        filePath: savedDoc.filePath,
        fileType: savedDoc.fileType,
        fileSize: savedDoc.fileSize,
        createdAt: savedDoc.createdAt
      });
    } catch (error) {
      console.error('Save document error:', error);
      // Hata durumunda yüklenen dosyayı temizle
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: 'Dosya kaydedilemedi' });
    }
  });
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

// Belge sil
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({ message: 'Belge bulunamadı' });
    }

    // Dosyayı fiziksel olarak sil
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await document.deleteOne();
    res.json({ message: 'Belge başarıyla silindi' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Belge silinirken bir hata oluştu' });
  }
});

// Belge indir
router.get('/:id/download', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({ message: 'Belge bulunamadı' });
    }

    res.download(document.filePath, document.originalName);
  } catch (error) {
    console.error('Belge indirilemedi:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Belge görüntüle
router.get('/:id/view', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({ message: 'Belge bulunamadı' });
    }

    // Dosya yolunu düzelt ve kontrol et
    const filePath = path.resolve(document.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Dosya bulunamadı' });
    }

    // Dosyayı oku
    const fileData = fs.readFileSync(filePath);
    
    // Base64'e çevir
    const base64Data = fileData.toString('base64');

    // Dosya türüne göre Content-Type belirle
    const contentType = {
      'application/pdf': 'application/pdf',
      'image/jpeg': 'image/jpeg',
      'image/png': 'image/png'
    }[document.fileType];

    if (!contentType) {
      return res.status(400).json({ message: 'Desteklenmeyen dosya türü' });
    }

    // Base64 ve dosya bilgilerini gönder
    res.json({
      data: `data:${contentType};base64,${base64Data}`,
      title: document.title,
      type: document.fileType
    });

  } catch (error) {
    console.error('View document error:', error);
    res.status(500).json({ message: 'Belge görüntülenirken bir hata oluştu' });
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