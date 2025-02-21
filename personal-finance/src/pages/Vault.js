import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Grid,
  Divider,
  useTheme,
  Stack,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AccountBalanceWallet,
  History as HistoryIcon,
  AccountBalance
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import PageTitle from '../components/PageTitle';

const Vault = () => {
  const { token } = useAuth();
  const [vault, setVault] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'vault-in',
    amount: '',
    description: ''
  });
  const [formBalance, setFormBalance] = useState({
    netBalance: 0,
    vaultBalance: 0,
    totalBalance: 0
  });

  const fetchVaultData = async () => {
    try {
      const [summaryResponse, transactionsResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/transactions/summary', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/vault/transactions', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setVault({
        vaultBalance: summaryResponse.data.vaultBalance,
        regularBalance: summaryResponse.data.netBalance,
        totalBalance: summaryResponse.data.totalBalance,
        netBalance: summaryResponse.data.netBalance
      });
      setTransactions(transactionsResponse.data);
      setError(null);
    } catch (error) {
      console.error('Vault fetch error:', error);
      setError('Kasa bilgisi alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      // Kasa işlemleri için özel endpoint'i kullan
      const response = await axios.get('http://localhost:5000/api/vault/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error('Transactions fetch error:', error);
      setError('İşlemler alınamadı');
    }
  };

  const fetchBalances = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/transactions/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFormBalance({
        netBalance: response.data.netBalance,
        vaultBalance: response.data.vaultBalance,
        totalBalance: response.data.totalBalance
      });
    } catch (error) {
      console.error('Balance fetch error:', error);
    }
  };

  useEffect(() => {
    if (token) {
      Promise.all([
        fetchVaultData(),
        fetchTransactions(),
        fetchBalances()
      ]);
    }
  }, [token]);

  const handleTransfer = async (formData) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/vault/transfer',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // İşlem başarılı olduktan sonra:
      // 1. Bakiyeyi güncelle
      await fetchVaultData();
      // 2. İşlemleri güncelle
      await fetchTransactions();
      // 3. Modal'ı kapat
      setOpenForm(false);
      // 4. Hata mesajını temizle
      setError(null);

    } catch (error) {
      console.error('Transfer error:', error);
      setError(error.response?.data?.message || 'İşlem sırasında bir hata oluştu');
    }
  };

  const handleOpenDialog = () => {
    fetchBalances();
    setOpenForm(true);
  };

  const handleCloseDialog = () => {
    setOpenForm(false);
    setFormData({
      type: 'vault-in',
      amount: '',
      description: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/vault/transfer', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // İşlem başarılı olduğunda
      setOpenForm(false);
      setFormData({ type: 'vault-in', amount: '', description: '' });
      
      // Tüm verileri yenile
      await Promise.all([
        fetchVaultData(),
        fetchTransactions(),
        fetchBalances()
      ]);

    } catch (error) {
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('İşlem sırasında bir hata oluştu');
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <PageTitle title="Kasa" />
      </Box>

      <Card 
        sx={{ 
          mb: 4,
          background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
          color: 'white',
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
          borderRadius: 2
        }}
      >
        <CardContent sx={{ py: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 3,
            opacity: 0.9
          }}>
            <AccountBalance sx={{ 
              mr: 2, 
              fontSize: 40,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              p: 1
            }} />
            <Typography variant="h5" sx={{ fontWeight: 500 }}>
              Kasa Bakiyesi
            </Typography>
          </Box>
          <Typography variant="h2" component="div" sx={{ 
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
          }}>
            ₺{vault?.vaultBalance?.toFixed(2) || '0.00'}
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        mb: 4
      }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          İşlem Ekle
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <HistoryIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">
              İşlem Geçmişi
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tarih</TableCell>
                  <TableCell>İşlem Türü</TableCell>
                  <TableCell>Açıklama</TableCell>
                  <TableCell align="right">Tutar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow 
                    key={transaction._id}
                    sx={{ 
                      '&:hover': { 
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <TableCell>
                      {new Date(transaction.date).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {transaction.type === 'vault-in' ? (
                          <IncomeIcon sx={{ color: 'success.main', mr: 1 }} />
                        ) : (
                          <ExpenseIcon sx={{ color: 'error.main', mr: 1 }} />
                        )}
                        {transaction.type === 'vault-in' ? 'Para Ekle' : 'Para Çek'}
                      </Box>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        color: transaction.type === 'vault-in' 
                          ? 'success.main' 
                          : 'error.main',
                        fontWeight: 'bold'
                      }}
                    >
                      {transaction.type === 'vault-in' ? '+' : '-'}
                      ₺{transaction.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog 
        open={openForm} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          Kasa İşlemi
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>İşlem Türü</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <MenuItem value="vault-in">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IncomeIcon sx={{ mr: 1, color: 'success.main' }} />
                      Para Ekle
                    </Box>
                  </MenuItem>
                  <MenuItem value="vault-out">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ExpenseIcon sx={{ mr: 1, color: 'error.main' }} />
                      Para Çek
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Tutar"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                inputProps={{ min: 0, step: "0.01" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₺</InputAdornment>
                  ),
                }}
                error={
                  (formData.type === 'vault-out' && parseFloat(formData.amount) > vault?.vaultBalance) ||
                  (formData.type === 'vault-in' && parseFloat(formData.amount) > vault?.netBalance)
                }
                helperText={
                  formData.type === 'vault-out' && parseFloat(formData.amount) > vault?.vaultBalance
                    ? 'Kasada yeterli bakiye yok'
                    : formData.type === 'vault-in' && parseFloat(formData.amount) > vault?.netBalance
                    ? 'Eklenecek tutar net bakiyeden fazla olamaz'
                    : ' '
                }
              />

              <TextField
                label="Açıklama"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
                placeholder="İşlem açıklaması (isteğe bağlı)"
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ 
            px: 3, 
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}>
            <Button onClick={handleCloseDialog}>İptal</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={
                !formData.amount || 
                parseFloat(formData.amount) <= 0 || 
                (formData.type === 'vault-out' && parseFloat(formData.amount) > vault?.vaultBalance) ||
                (formData.type === 'vault-in' && parseFloat(formData.amount) > vault?.netBalance)
              }
            >
              İşlemi Gerçekleştir
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Vault; 