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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

function MonthlyIncome() {
  const { token } = useAuth();
  const [incomes, setIncomes] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [formData, setFormData] = useState({
    description: '',
    estimatedIncome: '',
    actualIncome: '',
    month: new Date().toISOString().slice(0, 7)
  });

  const fetchIncomes = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/monthly-income?month=${selectedMonth}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setIncomes(response.data);
      setError(null);
    } catch (error) {
      console.error('Monthly incomes fetch error:', error);
      setError('Aylık gelirler alınamadı');
    }
  };

  useEffect(() => {
    if (token) {
      fetchIncomes();
    }
  }, [token, selectedMonth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/monthly-income/${editingId}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      } else {
        await axios.post(
          'http://localhost:5000/api/monthly-income',
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }
      
      setOpenForm(false);
      setFormData({
        description: '',
        estimatedIncome: '',
        actualIncome: '',
        month: selectedMonth
      });
      setEditingId(null);
      fetchIncomes();
    } catch (error) {
      console.error('Save monthly income error:', error);
      setError('Aylık gelir kaydedilemedi');
    }
  };

  const handleEdit = (income) => {
    setFormData({
      description: income.description,
      estimatedIncome: income.estimatedIncome,
      actualIncome: income.actualIncome,
      month: new Date(income.month).toISOString().slice(0, 7)
    });
    setEditingId(income._id);
    setOpenForm(true);
  };

  const calculateTotals = () => {
    return incomes.reduce((acc, income) => ({
      estimated: acc.estimated + income.estimatedIncome,
      actual: acc.actual + income.actualIncome
    }), { estimated: 0, actual: 0 });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" className="page-title">
        Aylık Gelir Takibi
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
            setEditingId(null);
            setFormData({
              description: '',
              estimatedIncome: '',
              actualIncome: '',
              month: selectedMonth
            });
            setOpenForm(true);
          }}
        >
          Yeni Gelir
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Açıklama</TableCell>
              <TableCell align="right">Tahmini Gelir</TableCell>
              <TableCell align="right">Gerçekleşen Gelir</TableCell>
              <TableCell align="right">Fark</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {incomes.map((income) => (
              <TableRow key={income._id}>
                <TableCell>{income.description}</TableCell>
                <TableCell align="right">₺{income.estimatedIncome.toFixed(2)}</TableCell>
                <TableCell align="right">₺{income.actualIncome.toFixed(2)}</TableCell>
                <TableCell 
                  align="right"
                  sx={{ 
                    color: income.actualIncome >= income.estimatedIncome ? 'success.main' : 'error.main'
                  }}
                >
                  ₺{(income.actualIncome - income.estimatedIncome).toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(income)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {/* Toplam Satırı */}
            {incomes.length > 0 && (
              <TableRow>
                <TableCell><strong>TOPLAM</strong></TableCell>
                <TableCell align="right">
                  <strong>₺{calculateTotals().estimated.toFixed(2)}</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>₺{calculateTotals().actual.toFixed(2)}</strong>
                </TableCell>
                <TableCell 
                  align="right"
                  sx={{ 
                    color: calculateTotals().actual >= calculateTotals().estimated 
                      ? 'success.main' 
                      : 'error.main'
                  }}
                >
                  <strong>
                    ₺{(calculateTotals().actual - calculateTotals().estimated).toFixed(2)}
                  </strong>
                </TableCell>
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openForm} onClose={() => setOpenForm(false)}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingId ? 'Gelir Düzenle' : 'Yeni Gelir'}
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
                label="Tahmini Gelir"
                type="number"
                value={formData.estimatedIncome}
                onChange={(e) => setFormData({ ...formData, estimatedIncome: e.target.value })}
                required
                inputProps={{ min: 0, step: "0.01" }}
              />
              <TextField
                label="Gerçekleşen Gelir"
                type="number"
                value={formData.actualIncome}
                onChange={(e) => setFormData({ ...formData, actualIncome: e.target.value })}
                inputProps={{ min: 0, step: "0.01" }}
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

export default MonthlyIncome; 