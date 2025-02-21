const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Note = require('../models/Note');

// Tüm notları getir
router.get('/', auth, async (req, res) => {
  try {
    const notes = await Note.find({ 
      user: req.user.id,
      status: 'active'  // Sadece aktif notları getir
    }).sort({ isPinned: -1, updatedAt: -1 });
    
    res.json(notes);
  } catch (error) {
    console.error('Notes fetch error:', error);
    res.status(500).json({ message: 'Notlar alınırken bir hata oluştu' });
  }
});

// Son notları getir (Dashboard için)
router.get('/recent', auth, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id })
      .sort({ isReminder: -1, reminderDate: 1, createdAt: -1 })
      .limit(3);
    res.json(notes);
  } catch (error) {
    console.error('Recent notes fetch error:', error);
    res.status(500).json({ message: 'Son notlar alınırken bir hata oluştu' });
  }
});

// Arşivlenmiş notları getir
router.get('/archived', auth, async (req, res) => {
  try {
    const notes = await Note.find({ 
      user: req.user.id,
      status: 'archived'
    }).sort({ updatedAt: -1 });
    
    res.json(notes);
  } catch (error) {
    console.error('Archived notes fetch error:', error);
    res.status(500).json({ message: 'Arşivlenmiş notlar alınırken bir hata oluştu' });
  }
});

// Hatırlatıcıları getir
router.get('/reminders', auth, async (req, res) => {
  try {
    const notes = await Note.find({ 
      userId: req.user.id,
      isReminder: true,
      status: 'active',
      reminderDate: { $gte: new Date() }
    }).sort({ reminderDate: 1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Hatırlatıcılar alınamadı' });
  }
});

// Not oluştur
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, isReminder, reminderDate } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Başlık ve içerik zorunludur' });
    }

    const note = new Note({
      user: req.user.id,
      title,
      content,
      isReminder: isReminder || false,
      reminderDate: reminderDate || null
    });

    await note.save();
    res.status(201).json(note);
  } catch (error) {
    console.error('Note create error:', error);
    res.status(500).json({ message: 'Not oluşturulurken bir hata oluştu' });
  }
});

// Not güncelle
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, isReminder, reminderDate, isPinned, status } = req.body;
    
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        title,
        content,
        isReminder,
        reminderDate,
        isPinned,
        status,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ message: 'Not bulunamadı' });
    }

    res.json(note);
  } catch (error) {
    console.error('Note update error:', error);
    res.status(500).json({ message: 'Not güncellenirken bir hata oluştu' });
  }
});

// Not sil
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!note) {
      return res.status(404).json({ message: 'Not bulunamadı' });
    }

    res.json({ message: 'Not başarıyla silindi' });
  } catch (error) {
    console.error('Note delete error:', error);
    res.status(500).json({ message: 'Not silinirken bir hata oluştu' });
  }
});

// Not arşivle/arşivden çıkar
router.patch('/:id/archive', auth, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!note) {
      return res.status(404).json({ message: 'Not bulunamadı' });
    }

    // Status'u tersine çevir
    note.status = note.status === 'active' ? 'archived' : 'active';
    await note.save();

    res.json({
      message: `Not ${note.status === 'archived' ? 'arşivlendi' : 'arşivden çıkarıldı'}`,
      note
    });
  } catch (error) {
    console.error('Note archive error:', error);
    res.status(500).json({ message: 'Not arşivlenirken bir hata oluştu' });
  }
});

// Sabitleme işlemi
router.patch('/:id/pin', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!note) {
      return res.status(404).json({ message: 'Not bulunamadı' });
    }

    note.isPinned = !note.isPinned;
    await note.save();

    res.json(note);
  } catch (error) {
    console.error('Pin error:', error);
    res.status(500).json({ message: 'Sabitleme işlemi başarısız oldu' });
  }
});

// Tekil not getir
router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!note) {
      return res.status(404).json({ message: 'Not bulunamadı' });
    }

    res.json(note);
  } catch (error) {
    console.error('Note fetch error:', error);
    res.status(500).json({ message: 'Not alınırken bir hata oluştu' });
  }
});

module.exports = router; 