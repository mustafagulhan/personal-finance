const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authService = require('../services/auth.service');

// Kayıt ol
router.post('/register', async (req, res) => {
  try {
    console.log('Register request body:', req.body); // Debug için
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Register route error:', error);
    res.status(error.message.includes('zaten kayıtlı') ? 400 : 500).json({ 
      message: error.message || 'Kayıt sırasında bir hata oluştu',
      error: error.toString()
    });
  }
});

// Giriş yap
router.post('/login', async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    console.error('Login route error:', error);
    res.status(401).json({ 
      message: error.message || 'Giriş yapılırken bir hata oluştu'
    });
  }
});

// Kullanıcı bilgilerini getir
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token bulunamadı' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json(user);
  } catch (error) {
    console.error('Kullanıcı bilgileri hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 