import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Box,
  Alert,
  IconButton,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const NoteForm = ({ open, onClose, onNoteSaved, note = null }) => {
  const { token } = useAuth();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isReminder: false,
    reminderDate: '',
  });

  // Form sıfırlama fonksiyonu
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      isReminder: false,
      reminderDate: '',
    });
    setError('');
  };

  // Form kapatma işleyicisi
  const handleClose = () => {
    console.log('Form kapatılıyor...'); // Debug için
    setFormData({
      title: '',
      content: '',
      isReminder: false,
      reminderDate: '',
    });
    setError('');
    if (onClose) {
      onClose();
    }
  };

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title || '',
        content: note.content || '',
        isReminder: note.isReminder || false,
        reminderDate: note.reminderDate ? new Date(note.reminderDate).toISOString().split('T')[0] : '',
      });
    } else {
      resetForm();
    }
  }, [note]);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'isReminder' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      setError('Başlık ve içerik alanları zorunludur');
      return;
    }

    if (formData.isReminder && !formData.reminderDate) {
      setError('Hatırlatıcı için tarih seçmelisiniz');
      return;
    }

    try {
      let response;
      if (note) {
        // Düzenleme işlemi
        response = await axios.put(
          `http://localhost:5000/api/notes/${note._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Yeni not ekleme işlemi
        response = await axios.post(
          'http://localhost:5000/api/notes',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      onNoteSaved(response.data);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Note save error:', error);
      setError('Not kaydedilirken bir hata oluştu');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {note ? 'Notu Düzenle' : 'Yeni Not'}
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="title"
              label="Başlık"
              value={formData.title}
              onChange={handleChange}
              fullWidth
              required
            />

            <TextField
              name="content"
              label="İçerik"
              value={formData.content}
              onChange={handleChange}
              multiline
              rows={4}
              fullWidth
              required
            />

            <FormControlLabel
              control={
                <Switch
                  name="isReminder"
                  checked={formData.isReminder}
                  onChange={handleChange}
                />
              }
              label="Hatırlatıcı"
            />

            {formData.isReminder && (
              <TextField
                name="reminderDate"
                label="Hatırlatma Tarihi"
                type="date"
                value={formData.reminderDate}
                onChange={handleChange}
                fullWidth
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>İptal</Button>
          <Button type="submit" variant="contained">
            {note ? 'Güncelle' : 'Kaydet'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default NoteForm; 