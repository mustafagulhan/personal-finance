const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Estimation = require('../models/Estimation');

// Tahminleri getir
router.get('/', auth, async (req, res) => {
  try {
    const { type, month } = req.query;
    const startDate = new Date(month);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const estimations = await Estimation.find({
      userId: req.user.id,
      type,
      month: {
        $gte: startDate,
        $lt: endDate
      }
    }).sort({ createdAt: -1 });

    res.json(estimations);
  } catch (error) {
    console.error('Get estimations error:', error);
    res.status(500).json({ message: 'Tahminler alınırken bir hata oluştu' });
  }
});

// Yeni tahmin ekle
router.post('/', auth, async (req, res) => {
  try {
    const { type, description, estimated, month } = req.body;

    const newEstimation = new Estimation({
      userId: req.user.id,
      type,
      description,
      estimated,
      month: new Date(month)
    });

    const savedEstimation = await newEstimation.save();
    res.status(201).json(savedEstimation);
  } catch (error) {
    console.error('Create estimation error:', error);
    res.status(500).json({ message: 'Tahmin oluşturulurken bir hata oluştu' });
  }
});

// Tahmin güncelle
router.put('/:id', auth, async (req, res) => {
  try {
    const { description, estimated, actual } = req.body;
    
    const estimation = await Estimation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { description, estimated, actual },
      { new: true }
    );

    if (!estimation) {
      return res.status(404).json({ message: 'Tahmin bulunamadı' });
    }

    res.json(estimation);
  } catch (error) {
    console.error('Update estimation error:', error);
    res.status(500).json({ message: 'Tahmin güncellenirken bir hata oluştu' });
  }
});

// Tahmin sil
router.delete('/:id', auth, async (req, res) => {
  try {
    const estimation = await Estimation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!estimation) {
      return res.status(404).json({ message: 'Tahmin bulunamadı' });
    }
    
    res.json({ message: 'Tahmin başarıyla silindi' });
  } catch (error) {
    console.error('Delete estimation error:', error);
    res.status(500).json({ message: 'Tahmin silinirken hata oluştu' });
  }
});

module.exports = router; 