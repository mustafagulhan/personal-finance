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
  ListItemSecondaryAction,
  Typography,
  InputAdornment,
  TableRow,
  TableCell,
  Chip
} from '@mui/material';
import { AttachFile as AttachFileIcon, Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';
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
    date: editingTransaction?.date ? new Date(editingTransaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    attachments: editingTransaction?.attachments || [],
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        type: editingTransaction.type,
        amount: editingTransaction.amount.toString(),
        category: editingTransaction.category,
        description: editingTransaction.description || '',
        date: new Date(editingTransaction.date).toISOString().split('T')[0],
        attachments: editingTransaction.attachments || []
      });
    } else {
      setFormData({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        attachments: [],
      });
    }
  }, [editingTransaction]);

  useEffect(() => {
    if (formData.type) {
      const fetchCategories = async () => {
        try {
          const response = await axios.get(
            `http://localhost:5000/api/transactions/categories/${formData.type}`,
            { 
              headers: { 
                Authorization: `Bearer ${token}` 
              } 
            }
          );
          setCategories(response.data);
          setError(null);
        } catch (error) {
          console.error('Categories fetch error:', error);
          setError('Kategoriler yüklenirken bir hata oluştu');
        }
      };

      fetchCategories();
    }
  }, [formData.type, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        type: value,
        category: ''
      }));
    } else if (name === 'amount') {
      const numericValue = value.replace(/[^0-9.]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else if (name === 'category') {
      setFormData(prev => ({
        ...prev,
        category: value
      }));
      setShowCustomCategory(value === 'Diğer');
      if (value !== 'Diğer') {
        setCustomCategory('');
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
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
          'http://localhost:5000/api/documents',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, response.data]
        }));
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
      type: '',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      attachments: []
    });
    setSelectedFiles([]);
    setCustomCategory('');
    setShowCustomCategory(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const dataToSend = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description || '',
        date: formData.date
      };

      let response;
      if (editingTransaction) {
        // Düzenleme işlemi
        response = await axios.put(
          `http://localhost:5000/api/transactions/${editingTransaction._id}`,
          dataToSend,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // Yeni işlem ekleme
        response = await axios.post(
          'http://localhost:5000/api/transactions',
          dataToSend,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      if (response.data) {
        onTransactionAdded(response.data);
        handleClose();
        resetForm();
      }
    } catch (error) {
      console.error('Transaction save error:', error);
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
      setFormData(prev => ({
        ...prev,
        attachments: prev.attachments.filter(att => att._id !== attachmentId)
      }));
    } catch (error) {
      console.error('Remove attachment error:', error);
      setError('Dosya silinirken bir hata oluştu');
    }
  };

  const renderTransactionRow = (transaction) => {
    const isIncome = transaction.type === 'income';
    const amount = parseFloat(transaction.amount);
    
    return (
      <TableRow key={transaction._id}>
        <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
        <TableCell>{transaction.description}</TableCell>
        <TableCell>{transaction.category}</TableCell>
        <TableCell>
          <Chip
            label={isIncome ? "Gelir" : "Gider"}
            size="small"
            sx={{
              backgroundColor: isIncome ? '#10B98115' : '#EF444415',
              color: isIncome ? '#10B981' : '#EF4444',
              fontWeight: 500,
            }}
          />
        </TableCell>
        <TableCell align="right" sx={{ color: isIncome ? '#10B981' : '#EF4444', fontWeight: 500 }}>
          {isIncome ? '+' : '-'}₺{amount.toFixed(2)}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {editingTransaction ? 'İşlemi Düzenle' : 'Yeni İşlem'}
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>İşlem Türü</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                <MenuItem value="income">Gelir</MenuItem>
                <MenuItem value="expense">Gider</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Kategori</InputLabel>
              <Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={!formData.type}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {showCustomCategory && (
              <TextField
                fullWidth
                label="Yeni Kategori"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                required
                margin="dense"
              />
            )}

            <TextField
              name="amount"
              label="Tutar"
              type="text"
              value={formData.amount}
              onChange={handleChange}
              fullWidth
              required
              margin="dense"
              InputProps={{
                startAdornment: <InputAdornment position="start">₺</InputAdornment>,
              }}
            />

            <TextField
              label="Açıklama"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />

            <TextField
              name="date"
              label="Tarih"
              type="date"
              value={formData.date}
              onChange={handleChange}
              fullWidth
              required
              margin="dense"
              InputLabelProps={{
                shrink: true,
              }}
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
            {formData.attachments.length > 0 && (
              <List>
                {formData.attachments.map((attachment) => (
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