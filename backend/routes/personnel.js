const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Personnel = require('../models/Personnel');

// Tüm personelleri getir
router.get('/', auth, async (req, res) => {
  try {
    const personnel = await Personnel.find({ userId: req.user.id });
    res.json(personnel);
  } catch (error) {
    res.status(500).json({ message: 'Personel listesi alınamadı' });
  }
});

// Yeni personel ekle
router.post('/', auth, async (req, res) => {
  try {
    const personnel = new Personnel({
      ...req.body,
      userId: req.user.id
    });
    await personnel.save();
    res.status(201).json(personnel);
  } catch (error) {
    res.status(500).json({ message: 'Personel eklenemedi' });
  }
});

// Personel güncelle
router.put('/:id', auth, async (req, res) => {
  try {
    const personnel = await Personnel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    res.json(personnel);
  } catch (error) {
    res.status(500).json({ message: 'Personel güncellenemedi' });
  }
});

// Personel sil
router.delete('/:id', auth, async (req, res) => {
  try {
    await Personnel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    res.json({ message: 'Personel silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Personel silinemedi' });
  }
});

module.exports = router; 