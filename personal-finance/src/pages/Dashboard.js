import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import {
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AccountBalance as BalanceIcon,
  AccountBalanceWallet
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    recentTransactions: [],
    summary: { totalIncome: 0, totalExpense: 0 }
  });
  const [vault, setVault] = useState({ balance: 0 });

  const { token } = useAuth();

  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Dashboard data:', response.data);
        setDashboardData(response.data);
        setError(null);
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        setError('Veriler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  // Kasa bakiyesini getir
  useEffect(() => {
    const fetchVaultBalance = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/vault', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVault(response.data);
      } catch (error) {
        console.error('Vault fetch error:', error);
      }
    };

    if (token) {
      fetchVaultBalance();
    }
  }, [token]);

  // Son işlemleri gösterme fonksiyonu
  const renderTransactionRow = (transaction) => {
    const isIncome = transaction.type === 'income';
    
    return (
      <Box
        key={transaction._id}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          '&:not(:last-child)': {
            borderBottom: 1,
            borderColor: 'divider'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              bgcolor: isIncome ? 'success.light' : 'error.light',
              borderRadius: '50%',
              p: 1,
              mr: 2
            }}
          >
            {isIncome ? <IncomeIcon /> : <ExpenseIcon />}
          </Box>
          <Box>
            <Typography variant="subtitle1">
              {transaction.description}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {transaction.category}
            </Typography>
          </Box>
        </Box>
        <Typography
          variant="subtitle1"
          sx={{
            color: isIncome ? 'success.main' : 'error.main',
            fontWeight: 'bold'
          }}
        >
          {isIncome ? '+' : '-'}₺{transaction.amount.toFixed(2)}
        </Typography>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4, p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" className="page-title">
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Genel Bakış */}
        <Grid item xs={12}>
          <Typography variant="h5" className="section-title">
            Genel Bakış
          </Typography>
          <Grid container spacing={3}>
            {/* Gelir Kartı */}
            <Grid item xs={12} md={3}>
              <Card 
                sx={{ 
                  height: '100%',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #1b5e20 30%, #2e7d32 90%)'
                    : 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
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
                  <IncomeIcon sx={{ fontSize: 150 }} />
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
                      <IncomeIcon />
                    </Box>
                    <Typography variant="h6">
                      Toplam Gelir
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ mb: 1 }}>
                    ₺{dashboardData.summary.totalIncome.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Tüm zamanlar
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Gider Kartı */}
            <Grid item xs={12} md={3}>
              <Card 
                sx={{ 
                  height: '100%',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #c62828 30%, #d32f2f 90%)'
                    : 'linear-gradient(45deg, #f44336 30%, #ef5350 90%)',
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
                  <ExpenseIcon sx={{ fontSize: 150 }} />
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
                      <ExpenseIcon />
                    </Box>
                    <Typography variant="h6">
                      Toplam Gider
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ mb: 1 }}>
                    ₺{dashboardData.summary.totalExpense.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Tüm zamanlar
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Net Bakiye Kartı */}
            <Grid item xs={12} md={3}>
              <Card 
                sx={{ 
                  height: '100%',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)'
                    : 'linear-gradient(45deg, #2196f3 30%, #42a5f5 90%)',
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
                  <BalanceIcon sx={{ fontSize: 150 }} />
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
                      <BalanceIcon />
                    </Box>
                    <Typography variant="h6">
                      Net Bakiye
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ mb: 1 }}>
                    ₺{(dashboardData.summary.totalIncome - dashboardData.summary.totalExpense).toFixed(2)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Güncel durum
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Kasa Kartı */}
            <Grid item xs={12} md={3}>
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
                    Mevcut kasa
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Son İşlemler */}
        <Grid item xs={12}>
          <Typography variant="h5" className="section-title" sx={{ mt: 4 }}>
            Son İşlemler
          </Typography>
          <Card>
            <CardContent>
              {dashboardData.recentTransactions.length > 0 ? (
                <Box>
                  {dashboardData.recentTransactions.map(renderTransactionRow)}
                </Box>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Henüz işlem bulunmuyor
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard; 