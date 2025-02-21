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
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import PageTitle from '../components/PageTitle';

const MonthlyIncome = () => {
  const { token } = useAuth();
  const [data, setData] = useState({
    incomes: [],
    summary: {
      estimatedTotal: 0,
      actualTotal: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].slice(0, 7));
  const [formData, setFormData] = useState({
    title: '',
    estimatedAmount: '',
    actualAmount: '',
    description: '',
    month: selectedMonth
  });

  const fetchMonthlyIncomes = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/monthly-income?month=${selectedMonth}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setData(response.data);
      setError(null);
    } catch (error) {
      console.error('Monthly incomes fetch error:', error);
      setError('Aylık gelirler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMonthlyIncomes();
    }
  }, [token, selectedMonth]);

  const handleOpenDialog = (income = null) => {
    if (income) {
      setEditingIncome(income);
      setFormData({
        title: income.title || '',
        estimatedAmount: income.estimatedAmount?.toString() || '',
        actualAmount: income.actualAmount?.toString() || '',
        description: income.description || '',
        month: new Date(income.month).toISOString().split('T')[0].slice(0, 7)
      });
    } else {
      setEditingIncome(null);
      setFormData({
        title: '',
        estimatedAmount: '',
        actualAmount: '',
        description: '',
        month: selectedMonth
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingIncome(null);
    setFormData({
      title: '',
      estimatedAmount: '',
      actualAmount: '',
      description: '',
      month: selectedMonth
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        estimatedAmount: formData.estimatedAmount ? parseFloat(formData.estimatedAmount) : 0,
        actualAmount: formData.actualAmount ? parseFloat(formData.actualAmount) : 0,
        month: new Date(formData.month)
      };

      if (editingIncome) {
        await axios.put(
          `http://localhost:5000/api/monthly-income/${editingIncome._id}`,
          submitData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      } else {
        await axios.post(
          'http://localhost:5000/api/monthly-income',
          submitData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }

      handleCloseDialog();
      fetchMonthlyIncomes();
      setError(null);
    } catch (error) {
      console.error('Monthly income save error:', error);
      setError(error.response?.data?.message || 'Aylık gelir kaydedilirken bir hata oluştu');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/monthly-income/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMonthlyIncomes();
      setError(null);
    } catch (error) {
      console.error('Monthly income delete error:', error);
      setError('Aylık gelir silinirken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <PageTitle title="Aylık Gelirler" />
        <Stack direction="row" spacing={2}>
          <TextField
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            sx={{ width: 200 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Yeni Gelir Ekle
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Toplam Tahmini Gelir: ₺{data.summary.estimatedTotal.toFixed(2)}
        </Typography>
        <Typography variant="h6" gutterBottom>
          Toplam Gerçekleşen Gelir: ₺{data.summary.actualTotal.toFixed(2)}
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Başlık</TableCell>
              <TableCell>Açıklama</TableCell>
              <TableCell align="right">Tahmini Tutar</TableCell>
              <TableCell align="right">Gerçekleşen Tutar</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.incomes.map((income) => (
              <TableRow key={income._id}>
                <TableCell>{income.title}</TableCell>
                <TableCell>{income.description || '-'}</TableCell>
                <TableCell align="right">₺{income.estimatedAmount.toFixed(2)}</TableCell>
                <TableCell align="right">₺{income.actualAmount.toFixed(2)}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenDialog(income)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(income._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingIncome ? 'Aylık Geliri Düzenle' : 'Yeni Aylık Gelir'}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Başlık"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
              <TextField
                label="Tahmini Tutar"
                type="number"
                value={formData.estimatedAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedAmount: e.target.value }))}
                InputProps={{
                  startAdornment: <span>₺</span>
                }}
              />
              <TextField
                label="Gerçekleşen Tutar"
                type="number"
                value={formData.actualAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, actualAmount: e.target.value }))}
                InputProps={{
                  startAdornment: <span>₺</span>
                }}
              />
              <TextField
                type="month"
                label="Ay"
                value={formData.month}
                onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                required
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Açıklama"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>İptal</Button>
            <Button type="submit" variant="contained">
              {editingIncome ? 'Güncelle' : 'Ekle'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default MonthlyIncome; 