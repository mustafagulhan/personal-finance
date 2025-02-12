import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

function Estimations() {
  const { token } = useAuth();
  const [estimations, setEstimations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [selectedType, setSelectedType] = useState('income');
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [formData, setFormData] = useState({
    description: '',
    estimated: '',
    actual: ''
  });
  const [editingId, setEditingId] = useState(null);

  const fetchEstimations = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/estimations?type=${selectedType}&month=${selectedMonth}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setEstimations(response.data);
      setError(null);
    } catch (error) {
      console.error('Estimations fetch error:', error);
      setError('Tahminler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchEstimations();
    }
  }, [token, selectedType, selectedMonth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/estimations/${editingId}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      } else {
        await axios.post(
          'http://localhost:5000/api/estimations',
          {
            ...formData,
            type: selectedType,
            month: selectedMonth
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }
      setOpenForm(false);
      setFormData({ description: '', estimated: '', actual: '' });
      setEditingId(null);
      fetchEstimations();
    } catch (error) {
      console.error('Save estimation error:', error);
      setError('Tahmin kaydedilirken bir hata oluştu');
    }
  };

  const handleEdit = (estimation) => {
    setFormData({
      description: estimation.description,
      estimated: estimation.estimated,
      actual: estimation.actual
    });
    setEditingId(estimation._id);
    setOpenForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/estimations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEstimations();
    } catch (error) {
      console.error('Delete estimation error:', error);
      setError('Tahmin silinirken bir hata oluştu');
    }
  };

  const calculateTotal = (field) => {
    return estimations.reduce((sum, est) => sum + (est[field] || 0), 0);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" className="page-title">
        {selectedType === 'income' ? 'Tahmini Gelirler' : 'Tahmini Giderler'}
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Tabs
          value={selectedType}
          onChange={(e, newValue) => setSelectedType(newValue)}
        >
          <Tab value="income" label="Gelirler" />
          <Tab value="expense" label="Giderler" />
        </Tabs>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          label="Ay Seçin"
          InputLabelProps={{ shrink: true }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setFormData({ description: '', estimated: '', actual: '' });
            setEditingId(null);
            setOpenForm(true);
          }}
        >
          Yeni Ekle
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Açıklama</TableCell>
              <TableCell align="right">Tahmini</TableCell>
              <TableCell align="right">Gerçek</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {estimations.map((estimation) => (
              <TableRow key={estimation._id}>
                <TableCell>{estimation.description}</TableCell>
                <TableCell align="right">₺{estimation.estimated.toFixed(2)}</TableCell>
                <TableCell align="right">₺{estimation.actual.toFixed(2)}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(estimation)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(estimation._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell><strong>Toplam</strong></TableCell>
              <TableCell align="right"><strong>₺{calculateTotal('estimated').toFixed(2)}</strong></TableCell>
              <TableCell align="right"><strong>₺{calculateTotal('actual').toFixed(2)}</strong></TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openForm} onClose={() => setOpenForm(false)}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingId ? 'Tahmini Düzenle' : 'Yeni Tahmin'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Açıklama"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
              <TextField
                label="Tahmini Tutar"
                type="number"
                value={formData.estimated}
                onChange={(e) => setFormData({ ...formData, estimated: e.target.value })}
                required
                inputProps={{ step: "0.01" }}
              />
              <TextField
                label="Gerçek Tutar"
                type="number"
                value={formData.actual}
                onChange={(e) => setFormData({ ...formData, actual: e.target.value })}
                inputProps={{ step: "0.01" }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenForm(false)}>İptal</Button>
            <Button type="submit" variant="contained">
              {editingId ? 'Güncelle' : 'Ekle'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

export default Estimations; 