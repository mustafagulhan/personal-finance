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
    type: editingTransaction?.type || 'expense',
    amount: editingTransaction?.amount || '',
    category: editingTransaction?.category || '',
    description: editingTransaction?.description || '',
    date: editingTransaction?.date ? new Date(editingTransaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  });
  const [attachments, setAttachments] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        type: editingTransaction.type,
        amount: editingTransaction.amount,
        category: editingTransaction.category,
        description: editingTransaction.description || '',
        date: new Date(editingTransaction.date).toISOString().split('T')[0]
      });
      if (editingTransaction.attachments && editingTransaction.attachments.length > 0) {
        setAttachments(editingTransaction.attachments);
      } else {
        setAttachments([]);
      }
    } else {
      setFormData({
        type: 'expense',
        amount: '',
        category: '',
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
          'http://localhost:5000/api/documents',
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
    event.target.value = '';
  };

  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setAttachments([]);
    setSelectedFiles([]);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = {
        ...formData,
        attachments: attachments.map(att => att._id)
      };

      const response = await axios({
        method: editingTransaction ? 'put' : 'post',
        url: `http://localhost:5000/api/transactions${editingTransaction ? `/${editingTransaction._id}` : ''}`,
        data: data,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      onTransactionAdded(response.data, editingTransaction ? 'update' : 'add');
      resetForm();
      handleClose();
    } catch (error) {
      console.error('Save error:', error);
      setError(error.response?.data?.message || 'İşlem kaydedilirken bir hata oluştu');
    }
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
      setSelectedFiles(prev => prev.filter(att => att._id !== attachmentId));
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

  const handleDialogClose = () => {
    resetForm();
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleDialogClose} maxWidth="sm" fullWidth>
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
                <MenuItem value="expense">Gider</MenuItem>
                <MenuItem value="income">Gelir</MenuItem>
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
              label="Tutar"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              required
              inputProps={{ min: 0, step: "0.01" }}
            />

            <TextField
              label="Açıklama"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />

            <TextField
              label="Tarih"
              name="date"
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
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1">
                        {attachment.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {attachment.fileType}
                      </Typography>
                      {attachment.fileType.startsWith('image/') && (
                        <Box sx={{ mt: 1 }}>
                          <img 
                            src={`http://localhost:5000/uploads/${attachment.path.split('\\').pop()}`} 
                            alt={attachment.title}
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '100px',
                              objectFit: 'contain'
                            }}
                          />
                        </Box>
                      )}
                    </Box>
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
          <Button onClick={handleDialogClose}>İptal</Button>
          <Button type="submit" variant="contained">
            {editingTransaction ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TransactionForm; 