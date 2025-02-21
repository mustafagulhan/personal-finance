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
  Chip,
  ListItemText
} from '@mui/material';
import { AttachFile as AttachFileIcon, Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const TransactionForm = ({ open, handleClose, onTransactionAdded, onTransactionUpdated, editingTransaction }) => {
  const { token } = useAuth();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [attachments, setAttachments] = useState([]);
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
        date: new Date(editingTransaction.date).toISOString().split('T')[0]
      });
      setAttachments(editingTransaction.attachments || []);
    } else {
      resetForm();
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

  const handleFileSelect = (event) => {
    try {
      if (event.target.files && event.target.files.length > 0) {
        const files = Array.from(event.target.files);
        
        const validFiles = files.filter(file => {
          if (file.size > 5 * 1024 * 1024) {
            setError('Bazı dosyalar 5MB\'dan büyük olduğu için eklenmedi');
            return false;
          }
          return true;
        });

        setSelectedFiles(prevFiles => [...prevFiles, ...validFiles]);
      }
    } catch (error) {
      console.error('File selection error:', error);
      setError('Dosya seçiminde bir hata oluştu');
    } finally {
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleFileRemove = (index) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setCustomCategory('');
    setSelectedFiles([]);
    setAttachments([]);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('type', formData.type);
      formDataToSend.append('amount', parseFloat(formData.amount));
      formDataToSend.append('category', formData.category === 'Diğer' ? customCategory : formData.category);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('date', formData.date);

      if (editingTransaction && attachments.length > 0) {
        attachments.forEach(attachment => {
          formDataToSend.append('existingAttachments[]', attachment._id);
        });
      }

      if (selectedFiles && selectedFiles.length > 0) {
        selectedFiles.forEach(file => {
          formDataToSend.append('files', file);
        });
      }

      let response;
      if (editingTransaction) {
        response = await axios.put(
          `http://localhost:5000/api/transactions/${editingTransaction._id}`,
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (onTransactionUpdated) {
          onTransactionUpdated(response.data);
        }
      } else {
        response = await axios.post(
          'http://localhost:5000/api/transactions',
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (onTransactionAdded) {
          onTransactionAdded(response.data);
        }
      }

      handleClose();
      resetForm();
    } catch (error) {
      console.error('Transaction save error:', error);
      setError('İşlem kaydedilirken bir hata oluştu');
    }
  };

  const handleRemoveAttachment = async (attachmentId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/documents/${attachmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttachments(prevAttachments => prevAttachments.filter(att => att._id !== attachmentId));
    } catch (error) {
      console.error('Remove attachment error:', error);
      setError('Belge silinirken bir hata oluştu');
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

            <Box sx={{ mt: 2 }}>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="file-input"
              />
              <label htmlFor="file-input">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<AttachFileIcon />}
                  sx={{ mb: 1 }}
                >
                  Belge Ekle
                </Button>
              </label>
            </Box>

            {((selectedFiles && selectedFiles.length > 0) || (attachments && attachments.length > 0)) && (
              <List>
                {selectedFiles.map((file, index) => (
                  <ListItem key={`new-${index}`}>
                    <ListItemText 
                      primary={file.name}
                      secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleFileRemove(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {attachments.map((attachment) => (
                  <ListItem key={`existing-${attachment._id}`}>
                    <ListItemText 
                      primary={attachment.title}
                      secondary={attachment.fileType}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleRemoveAttachment(attachment._id)}>
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