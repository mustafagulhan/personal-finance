import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography
} from '@mui/material';
import { AttachFile as AttachFileIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const TransactionForm = ({ open, handleClose, onTransactionAdded, editingTransaction = null }) => {
  const { token } = useAuth();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    type: 'expense',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        type: editingTransaction.type,
        category: editingTransaction.category,
        amount: editingTransaction.amount,
        description: editingTransaction.description,
        date: new Date(editingTransaction.date).toISOString().split('T')[0]
      });
      // Düzenlenen işlemin eklerini yükle
      if (editingTransaction.attachments) {
        setAttachments(editingTransaction.attachments);
      }
    } else {
      setFormData({
        type: 'expense',
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setAttachments([]);
    }
  }, [editingTransaction]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Tür değiştiğinde kategoriyi sıfırla
      ...(name === 'type' ? { category: '' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        attachments: attachments.map(att => att._id)
      };

      let response;
      if (editingTransaction) {
        response = await axios.put(
          `http://localhost:5000/api/transactions/${editingTransaction._id}`,
          data,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        onTransactionAdded(response.data, 'update');
      } else {
        response = await axios.post(
          'http://localhost:5000/api/transactions',
          data,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        onTransactionAdded(response.data, 'add');
      }
      handleClose();
    } catch (error) {
      console.error('Transaction save error:', error);
      setError(error.response?.data?.message || 'İşlem kaydedilirken bir hata oluştu');
    }
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Dosya boyutu 5MB\'dan küçük olmalıdır');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post(
          'http://localhost:5000/api/documents/upload',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        setAttachments(prev => [...prev, response.data]);
        setError(null);
      } catch (error) {
        console.error('File upload error:', error);
        setError(error.response?.data?.message || 'Dosya yüklenirken bir hata oluştu');
      }
    }
    // Input'u temizle
    event.target.value = '';
  };

  const handleRemoveAttachment = async (attachmentId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/documents/${attachmentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setAttachments(prev => prev.filter(att => att._id !== attachmentId));
    } catch (error) {
      console.error('Remove attachment error:', error);
      setError('Dosya silinirken bir hata oluştu');
    }
  };

  const categories = {
    income: [
      { value: 'Maaş', label: 'Maaş' },
      { value: 'Ek Gelir', label: 'Ek Gelir' },
      { value: 'Yatırım', label: 'Yatırım' }
    ],
    expense: [
      { value: 'Alışveriş', label: 'Alışveriş' },
      { value: 'Fatura', label: 'Fatura' },
      { value: 'Kira', label: 'Kira' },
      { value: 'Diğer', label: 'Diğer' }
    ]
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingTransaction ? 'İşlemi Düzenle' : 'Yeni İşlem'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>İşlem Türü</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <MenuItem value="income">Gelir</MenuItem>
                <MenuItem value="expense">Gider</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Kategori</InputLabel>
              <Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {categories[formData.type].map(cat => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              name="amount"
              label="Tutar"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              required
              inputProps={{ min: 0, step: "0.01" }}
            />

            <TextField
              name="description"
              label="Açıklama"
              value={formData.description}
              onChange={handleChange}
              required
            />

            <TextField
              name="date"
              label="Tarih"
              type="date"
              value={formData.date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
            />

            {/* Dosya Ekleme Bölümü */}
            <Box sx={{ mt: 2 }}>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="attachment-input"
              />
              <label htmlFor="attachment-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<AttachFileIcon />}
                  fullWidth
                >
                  Belge Ekle
                </Button>
              </label>
            </Box>

            {/* Eklenen Dosyalar Listesi */}
            {attachments.length > 0 && (
              <List>
                {attachments.map((attachment) => (
                  <ListItem key={attachment._id}>
                    <ListItemText
                      primary={attachment.title}
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {attachment.fileType}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveAttachment(attachment._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>İptal</Button>
          <Button type="submit" variant="contained">
            {editingTransaction ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TransactionForm; 