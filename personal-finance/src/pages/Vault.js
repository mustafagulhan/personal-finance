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
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AccountBalanceWallet,
  History as HistoryIcon,
  AccountBalance as BalanceIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

function Vault() {
  const { token } = useAuth();
  const [vault, setVault] = useState({ balance: 0 });
  const [openForm, setOpenForm] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    type: 'vault-in',
    amount: '',
    description: ''
  });
  const [transactions, setTransactions] = useState([]);
  const [netBalance, setNetBalance] = useState(0);
  const theme = useTheme();

  const fetchVaultBalance = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/vault', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVault(response.data);
      setError(null);
    } catch (error) {
      console.error('Vault fetch error:', error);
      setError('Kasa bilgisi alınamadı');
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const vaultTransactions = response.data.filter(t => t.isVaultTransaction);
      setTransactions(vaultTransactions);
    } catch (error) {
      console.error('Transactions fetch error:', error);
      setError('İşlemler alınamadı');
    }
  };

  useEffect(() => {
    if (token) {
      fetchVaultBalance();
      fetchTransactions();
    }
  }, [token]);

  useEffect(() => {
    const fetchNetBalance = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const balance = response.data.reduce((acc, curr) => {
          if (curr.type === 'income') return acc + curr.amount;
          if (curr.type === 'expense') return acc - curr.amount;
          return acc;
        }, 0);

        setNetBalance(balance);
      } catch (error) {
        console.error('Net balance fetch error:', error);
        setError('Net bakiye hesaplanamadı');
      }
    };

    if (token) {
      fetchNetBalance();
    }
  }, [token, transactions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'http://localhost:5000/api/vault/transfer',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Kasa bakiyesini güncelle
      setVault(response.data.vault);
      
      // İşlemi transactions listesine ekle
      setTransactions(prevTransactions => [response.data.transaction, ...prevTransactions]);
      
      // Net bakiyeyi güncelle
      setNetBalance(response.data.netBalance);
      
      // Formu kapat ve temizle
      setOpenForm(false);
      setFormData({
        type: 'vault-in',
        amount: '',
        description: ''
      });
      
    } catch (error) {
      console.error('Transfer error:', error);
      setError(error.response?.data?.message || 'İşlem başarısız');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" className="page-title">
        Kasa Yönetimi
      </Typography>

      <Grid container spacing={3}>
        {/* Özet Kartları */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            {/* Kasa Bakiyesi Kartı */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  height: '100%',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #4a148c 30%, #6a1b9a 90%)'
                    : 'linear-gradient(45deg, #9c27b0 30%, #ab47bc 90%)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -15,
                    right: -15,
                    opacity: 0.1,
                    transform: 'rotate(30deg)'
                  }}
                >
                  <AccountBalanceWallet sx={{ fontSize: 150 }} />
                </Box>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '50%',
                        p: 1,
                        mr: 2,
                      }}
                    >
                      <AccountBalanceWallet />
                    </Box>
                    <Typography variant="h6">
                      Kasa Bakiyesi
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ mb: 1 }}>
                    ₺{vault.balance.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Kasadaki mevcut para
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenForm(true)}
                    sx={{ 
                      mt: 2,
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.3)'
                      }
                    }}
                  >
                    Yeni İşlem
                  </Button>
                  <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
                    Mevcut Net Bakiye: ₺{netBalance.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* İşlem İstatistikleri */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    İşlem İstatistikleri
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box
                          sx={{
                            bgcolor: 'success.light',
                            borderRadius: '50%',
                            p: 1,
                            mr: 2
                          }}
                        >
                          <IncomeIcon sx={{ color: 'success.main' }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Toplam Para Girişi
                          </Typography>
                          <Typography variant="h6">
                            ₺{transactions
                              .filter(t => t.type === 'vault-in')
                              .reduce((sum, t) => sum + t.amount, 0)
                              .toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box
                          sx={{
                            bgcolor: 'error.light',
                            borderRadius: '50%',
                            p: 1,
                            mr: 2
                          }}
                        >
                          <ExpenseIcon sx={{ color: 'error.main' }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Toplam Para Çıkışı
                          </Typography>
                          <Typography variant="h6">
                            ₺{transactions
                              .filter(t => t.type === 'vault-out')
                              .reduce((sum, t) => sum + t.amount, 0)
                              .toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* İşlem Geçmişi */}
        <Grid item xs={12}>
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
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Dialog open={openForm} onClose={() => setOpenForm(false)}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            Kasa İşlemi
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {/* Net Bakiye Kartı */}
              <Card sx={{ 
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)'
                  : 'linear-gradient(45deg, #2196f3 30%, #42a5f5 90%)',
                color: 'white',
                mb: 2
              }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                  <BalanceIcon sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Net Bakiye
                    </Typography>
                    <Typography variant="h4">
                      ₺{netBalance.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Güncel durum
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              <FormControl fullWidth>
                <InputLabel>İşlem Türü</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <MenuItem value="vault-in">Para Ekle</MenuItem>
                  <MenuItem value="vault-out">Para Çek</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Tutar"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                inputProps={{ min: 0, step: "0.01" }}
                error={formData.type === 'vault-in' && parseFloat(formData.amount) > netBalance}
                helperText={
                  formData.type === 'vault-in' && parseFloat(formData.amount) > netBalance 
                    ? 'Tutar net bakiyeden fazla olamaz' 
                    : ''
                }
              />

              <TextField
                label="Açıklama"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenForm(false)}>İptal</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={
                !formData.amount || 
                parseFloat(formData.amount) <= 0 || 
                (formData.type === 'vault-in' && parseFloat(formData.amount) > netBalance)
              }
            >
              İşlemi Gerçekleştir
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

export default Vault; 