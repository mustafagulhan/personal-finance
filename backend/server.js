require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { seedDefaultCategories } = require('./models/Category');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition', 'Content-Type']
}));
app.use(express.json());

// MongoDB Bağlantısı
connectDB().then(async () => {
  // Bağlantı başarılı olduktan sonra varsayılan kategorileri oluştur
  try {
    await seedDefaultCategories();
    console.log('Kategoriler başarıyla yüklendi');
  } catch (error) {
    console.error('Kategori yükleme hatası:', error);
  }
});

// Temp klasörünü oluştur
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/estimations', require('./routes/estimations'));
app.use('/api/vault', require('./routes/vault'));
app.use('/api/personnel', require('./routes/personnel'));
app.use('/api/monthly-income', require('./routes/monthlyIncome'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/debts', require('./routes/debts'));

// Uploads klasörünü statik olarak sun
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'API çalışıyor' });
});

// Hata ayıklama middleware'i
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Hata yakalama middleware'i
app.use((err, req, res, next) => {
  console.error('Server error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  res.status(500).json({ 
    message: 'Sunucu hatası', 
    error: err.message,
    path: req.path
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
}); 